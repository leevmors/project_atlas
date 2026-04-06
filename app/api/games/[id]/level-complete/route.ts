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

    const { level } = await req.json();

    if (typeof level !== 'number') {
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
    const gameConfig = GAME_LEVEL_CONFIG[game.name];
    const levelConfig = gameConfig?.[level];

    if (!levelConfig || levelConfig.type !== 'puzzle-complete') {
      return NextResponse.json({ error: 'Invalid level for this endpoint' }, { status: 400, headers: noCache });
    }

    // Admin dry-run: return clue without persisting
    if (session.user_type === 'admin') {
      return NextResponse.json({
        ok: true,
        clue: levelConfig.clue ?? undefined,
      }, { headers: noCache });
    }

    // Team flow: enforce level order
    await pool.query(
      `INSERT INTO game_attempts (game_id, team_id) VALUES ($1, $2) ON CONFLICT (game_id, team_id) DO NOTHING`,
      [id, session.user_id]
    );

    const attemptRes = await pool.query<{ current_level: number }>(
      `SELECT current_level FROM game_attempts WHERE game_id = $1 AND team_id = $2`,
      [id, session.user_id]
    );

    const attempt = attemptRes.rows[0];

    if (attempt.current_level !== level) {
      return NextResponse.json(
        { error: 'You are not on this level' },
        { status: 400, headers: noCache }
      );
    }

    // Advance level
    await pool.query(
      `UPDATE game_attempts SET current_level = GREATEST(current_level, $1), level_cooldown_until = NULL WHERE game_id = $2 AND team_id = $3`,
      [level + 1, id, session.user_id]
    );

    return NextResponse.json({
      ok: true,
      clue: levelConfig.clue ?? undefined,
    }, { headers: noCache });
  } catch (err) {
    console.error('POST /api/games/[id]/level-complete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
