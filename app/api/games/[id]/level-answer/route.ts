import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { GAME_LEVEL_CONFIG } from '@/lib/game-answers';

interface SessionRow {
  user_type: string;
  user_id: string;
}

async function getSession(req: NextRequest): Promise<SessionRow | null> {
  const sessionId = req.cookies.get('atlas_sid')?.value;
  if (!sessionId) return null;
  const res = await pool.query<SessionRow>(
    `SELECT user_type, user_id FROM sessions WHERE id = $1 AND expires_at > NOW()`,
    [sessionId]
  );
  return res.rows[0] ?? null;
}

const noCache = { 'Cache-Control': 'no-store' };

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noCache });
    }

    const { level, answer, round } = await req.json();

    if (!answer || typeof answer !== 'string' || typeof level !== 'number') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: noCache });
    }

    // Load game info
    const gameRes = await pool.query<{ name: string; status: string }>(
      `SELECT name, status FROM games WHERE id = $1`,
      [id]
    );
    if (gameRes.rows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404, headers: noCache });
    }

    const game = gameRes.rows[0];

    if (game.status !== 'live') {
      return NextResponse.json({ error: 'Game is not active' }, { status: 400, headers: noCache });
    }

    // Look up level config
    const gameConfig = GAME_LEVEL_CONFIG[game.name];
    if (!gameConfig) {
      return NextResponse.json({ error: 'Game config not found' }, { status: 500, headers: noCache });
    }

    const levelConfig = gameConfig[level];
    if (!levelConfig) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400, headers: noCache });
    }

    if (levelConfig.type !== 'text-answer' && levelConfig.type !== 'multi-round') {
      return NextResponse.json({ error: 'This level does not accept text answers' }, { status: 400, headers: noCache });
    }

    // Admin dry-run: check answer without persisting
    if (session.user_type === 'admin') {
      let isCorrect = false;
      if (levelConfig.type === 'multi-round' && levelConfig.rounds && typeof round === 'number') {
        const r = levelConfig.rounds[round];
        isCorrect = r ? answer.trim().toUpperCase() === r.answer.toUpperCase() : false;
      } else if (levelConfig.answer) {
        // Special case for 9.81 — exact string match
        isCorrect = levelConfig.answer === '9.81'
          ? answer.trim() === levelConfig.answer
          : answer.trim().toUpperCase() === levelConfig.answer.toUpperCase();
      }
      return NextResponse.json({
        correct: isCorrect,
        clue: isCorrect ? (levelConfig.clue ?? undefined) : undefined,
      }, { headers: noCache });
    }

    // Team flow: enforce level order and cooldowns
    // Ensure attempt row exists
    await pool.query(
      `INSERT INTO game_attempts (game_id, team_id) VALUES ($1, $2) ON CONFLICT (game_id, team_id) DO NOTHING`,
      [id, session.user_id]
    );

    const attemptRes = await pool.query<{
      current_level: number;
      level_cooldown_until: string | null;
      level_sub_round: number;
    }>(
      `SELECT current_level, level_cooldown_until, level_sub_round FROM game_attempts WHERE game_id = $1 AND team_id = $2`,
      [id, session.user_id]
    );

    const attempt = attemptRes.rows[0];

    // Enforce: team must be on this level
    if (attempt.current_level !== level) {
      return NextResponse.json(
        { error: 'You are not on this level', correct: false },
        { status: 400, headers: noCache }
      );
    }

    // Enforce cooldown
    if (attempt.level_cooldown_until) {
      const cooldownEnd = new Date(attempt.level_cooldown_until).getTime();
      if (Date.now() < cooldownEnd) {
        return NextResponse.json({
          correct: false,
          cooldownUntil: attempt.level_cooldown_until,
        }, { headers: noCache });
      }
    }

    // Check answer
    let isCorrect = false;
    let cooldownSeconds = levelConfig.cooldownSeconds;

    if (levelConfig.type === 'multi-round' && levelConfig.rounds && typeof round === 'number') {
      // Validate round matches server state
      if (round !== attempt.level_sub_round) {
        return NextResponse.json(
          { error: 'Invalid round', correct: false },
          { status: 400, headers: noCache }
        );
      }
      const roundConfig = levelConfig.rounds[round];
      if (!roundConfig) {
        return NextResponse.json({ error: 'Invalid round' }, { status: 400, headers: noCache });
      }
      isCorrect = answer.trim().toUpperCase() === roundConfig.answer.toUpperCase();
      cooldownSeconds = roundConfig.cooldownSeconds;

      if (isCorrect) {
        if (round < levelConfig.rounds.length - 1) {
          // Advance to next round within the same level
          await pool.query(
            `UPDATE game_attempts SET level_sub_round = $1, level_cooldown_until = NULL WHERE game_id = $2 AND team_id = $3`,
            [round + 1, id, session.user_id]
          );
          return NextResponse.json({
            correct: true,
            nextRound: round + 1,
          }, { headers: noCache });
        }
        // Final round correct — advance level
        await pool.query(
          `UPDATE game_attempts SET current_level = GREATEST(current_level, $1), level_sub_round = 0, level_cooldown_until = NULL WHERE game_id = $2 AND team_id = $3`,
          [level + 1, id, session.user_id]
        );
        return NextResponse.json({
          correct: true,
          clue: levelConfig.clue ?? undefined,
        }, { headers: noCache });
      }
    } else if (levelConfig.answer) {
      // Single text answer — special case for exact match (e.g., 9.81)
      isCorrect = levelConfig.answer === '9.81'
        ? answer.trim() === levelConfig.answer
        : answer.trim().toUpperCase() === levelConfig.answer.toUpperCase();
    }

    if (isCorrect) {
      // Advance level
      await pool.query(
        `UPDATE game_attempts SET current_level = GREATEST(current_level, $1), level_cooldown_until = NULL WHERE game_id = $2 AND team_id = $3`,
        [level + 1, id, session.user_id]
      );
      return NextResponse.json({
        correct: true,
        clue: levelConfig.clue ?? undefined,
      }, { headers: noCache });
    }

    // Wrong answer — set cooldown
    const cooldownUntil = new Date(Date.now() + cooldownSeconds * 1000).toISOString();
    await pool.query(
      `UPDATE game_attempts SET level_cooldown_until = $1 WHERE game_id = $2 AND team_id = $3`,
      [cooldownUntil, id, session.user_id]
    );

    return NextResponse.json({
      correct: false,
      cooldownUntil,
    }, { headers: noCache });
  } catch (err) {
    console.error('POST /api/games/[id]/level-answer error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
