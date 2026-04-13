import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getEarnedClues } from '@/lib/game-answers';

interface SessionRow {
  user_type: string;
  user_id: string;
}

interface GameRow {
  id: number;
  name: string;
  status: string;
  bonus_points: number;
  winner_team_id: number | null;
  winner_team_name: string | null;
  completed_at: string | null;
  created_at: string | null;
}

interface AttemptRow {
  game_id: number;
  team_id: number;
  current_level: number;
  final_answer_attempts: number;
  is_locked_out: boolean;
  bonus_awarded: number;
  wordle_locked_until: string | null;
  level_cooldown_until: string | null;
  level_sub_round: number;
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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gameRes = await pool.query<GameRow>(
      `SELECT g.id, g.name, g.status, g.bonus_points, g.winner_team_id,
              t.company_name as winner_team_name, g.completed_at, g.created_at
       FROM games g LEFT JOIN teams t ON t.id = g.winner_team_id
       WHERE g.id = $1`,
      [id]
    );

    if (gameRes.rows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const gameRow = gameRes.rows[0];

    // Admin preview — return game info without creating an attempt
    if (session.user_type === 'admin') {
      return NextResponse.json({
        game: {
          id: String(gameRow.id),
          name: gameRow.name,
          status: gameRow.status,
          bonusPoints: gameRow.bonus_points,
          winnerTeamId: gameRow.winner_team_id ? String(gameRow.winner_team_id) : undefined,
          winnerTeamName: gameRow.winner_team_name ?? undefined,
          completedAt: gameRow.completed_at ?? undefined,
        createdAt: gameRow.created_at ?? undefined,
        },
        progress: null,
      });
    }

    // Ensure attempt row exists
    await pool.query(
      `INSERT INTO game_attempts (game_id, team_id) VALUES ($1, $2) ON CONFLICT (game_id, team_id) DO NOTHING`,
      [id, session.user_id]
    );

    const attemptRes = await pool.query<AttemptRow>(
      `SELECT game_id, team_id, current_level, final_answer_attempts, is_locked_out, bonus_awarded, wordle_locked_until, level_cooldown_until, level_sub_round
       FROM game_attempts WHERE game_id = $1 AND team_id = $2`,
      [id, session.user_id]
    );

    const attempt = attemptRes.rows[0];
    const earnedClues = attempt
      ? getEarnedClues(gameRow.name, attempt.current_level)
      : [];

    return NextResponse.json({
      game: {
        id: String(gameRow.id),
        name: gameRow.name,
        status: gameRow.status,
        bonusPoints: gameRow.bonus_points,
        winnerTeamId: gameRow.winner_team_id ? String(gameRow.winner_team_id) : undefined,
        winnerTeamName: gameRow.winner_team_name ?? undefined,
        completedAt: gameRow.completed_at ?? undefined,
        createdAt: gameRow.created_at ?? undefined,
      },
      progress: attempt
        ? {
            gameId: String(attempt.game_id),
            teamId: String(attempt.team_id),
            currentLevel: attempt.current_level,
            finalAnswerAttempts: attempt.final_answer_attempts,
            isLockedOut: attempt.is_locked_out,
            bonusAwarded: attempt.bonus_awarded,
            wordleLockedUntil: attempt.wordle_locked_until ?? undefined,
            levelCooldownUntil: attempt.level_cooldown_until ?? undefined,
            levelSubRound: attempt.level_sub_round,
            earnedClues,
          }
        : null,
    });
  } catch (err) {
    console.error('GET /api/games/[id]/progress error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin-only: direct level setting for skip/preview functionality
    // Teams must use /level-answer or /level-complete endpoints instead
    if (session.user_type !== 'admin') {
      return NextResponse.json({ error: 'Use level-answer or level-complete endpoints' }, { status: 403 });
    }

    const { currentLevel } = await req.json();

    if (typeof currentLevel !== 'number' || currentLevel < 1 || currentLevel > 6) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/games/[id]/progress error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
