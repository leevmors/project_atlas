import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

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
}

interface AttemptRow {
  game_id: number;
  team_id: number;
  current_level: number;
  final_answer_attempts: number;
  is_locked_out: boolean;
  bonus_awarded: number;
  wordle_locked_until: string | null;
}

async function getTeamSession(req: NextRequest): Promise<SessionRow | null> {
  const sessionId = req.cookies.get('atlas_sid')?.value;
  if (!sessionId) return null;
  const res = await pool.query<SessionRow>(
    `SELECT user_type, user_id FROM sessions WHERE id = $1 AND expires_at > NOW()`,
    [sessionId]
  );
  const session = res.rows[0] ?? null;
  if (session?.user_type !== 'team') return null;
  return session;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getTeamSession(req);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gameRes = await pool.query<GameRow>(
      `SELECT g.id, g.name, g.status, g.bonus_points, g.winner_team_id,
              t.company_name as winner_team_name, g.completed_at
       FROM games g LEFT JOIN teams t ON t.id = g.winner_team_id
       WHERE g.id = $1`,
      [id]
    );

    if (gameRes.rows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const gameRow = gameRes.rows[0];

    // Ensure attempt row exists
    await pool.query(
      `INSERT INTO game_attempts (game_id, team_id) VALUES ($1, $2) ON CONFLICT (game_id, team_id) DO NOTHING`,
      [id, session.user_id]
    );

    const attemptRes = await pool.query<AttemptRow>(
      `SELECT game_id, team_id, current_level, final_answer_attempts, is_locked_out, bonus_awarded, wordle_locked_until
       FROM game_attempts WHERE game_id = $1 AND team_id = $2`,
      [id, session.user_id]
    );

    const attempt = attemptRes.rows[0];

    return NextResponse.json({
      game: {
        id: String(gameRow.id),
        name: gameRow.name,
        status: gameRow.status,
        bonusPoints: gameRow.bonus_points,
        winnerTeamId: gameRow.winner_team_id ? String(gameRow.winner_team_id) : undefined,
        winnerTeamName: gameRow.winner_team_name ?? undefined,
        completedAt: gameRow.completed_at ?? undefined,
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
    const session = await getTeamSession(req);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentLevel } = await req.json();

    if (typeof currentLevel !== 'number' || currentLevel < 1 || currentLevel > 5) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
    }

    // Ensure row exists then update with GREATEST to prevent regression
    await pool.query(
      `INSERT INTO game_attempts (game_id, team_id, current_level) VALUES ($1, $2, $3)
       ON CONFLICT (game_id, team_id) DO UPDATE SET current_level = GREATEST(game_attempts.current_level, $3)`,
      [id, session.user_id, currentLevel]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/games/[id]/progress error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
