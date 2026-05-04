import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// May 10, 2026 18:00 GMT+5 = May 10, 2026 13:00 UTC
const DEADLINE_MS = new Date('2026-05-10T13:00:00Z').getTime();

interface SessionRow {
  user_type: string;
  user_id: string;
}

async function getSession(req: NextRequest): Promise<SessionRow | null> {
  const sessionId = req.cookies.get('atlas_sid')?.value;
  if (!sessionId) return null;
  try {
    const res = await pool.query<SessionRow>(
      `SELECT user_type, user_id FROM sessions WHERE id = $1 AND expires_at > NOW()`,
      [sessionId]
    );
    return res.rows[0] ?? null;
  } catch {
    return null;
  }
}

const noCache = { 'Cache-Control': 'no-store' };

// One-shot finalizer for Campus Survivor. Admin-only, idempotent:
// after the deadline passes, picks the top-scoring team and:
//   - awards the bonus_points to that team via game_attempts
//   - sets games.status = 'completed' and winner_team_id
// Re-running after a winner is set is a no-op.
export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const session = await getSession(req);
    if (!session || session.user_type !== 'admin') {
      return NextResponse.json(
        { error: 'Admin only.' },
        { status: 401, headers: noCache }
      );
    }

    if (Date.now() < DEADLINE_MS) {
      return NextResponse.json(
        { error: 'Deadline has not passed yet.', deadline: '2026-05-10T13:00:00Z' },
        { status: 400, headers: noCache }
      );
    }

    await client.query('BEGIN');

    const gameRes = await client.query<{
      id: number;
      status: string;
      bonus_points: number;
      winner_team_id: string | null;
    }>(
      `SELECT id, status, bonus_points, winner_team_id
         FROM games
        WHERE name = 'CAMPUS SURVIVOR'
        FOR UPDATE`
    );

    if (gameRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Campus Survivor game record missing.' },
        { status: 404, headers: noCache }
      );
    }

    const game = gameRes.rows[0];

    if (game.winner_team_id) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        {
          ok: true,
          alreadyResolved: true,
          winner_team_id: game.winner_team_id,
        },
        { headers: noCache }
      );
    }

    const winnerRes = await client.query<{
      team_id: string;
      best_score: number;
      best_time: number;
    }>(`
      SELECT team_id,
             MAX(score) AS best_score,
             MAX(time_survived) AS best_time
        FROM campus_survivor_scores
       GROUP BY team_id
       ORDER BY best_score DESC, best_time DESC
       LIMIT 1
    `);

    if (winnerRes.rows.length === 0) {
      // No submissions at all — close the game with no winner.
      await client.query(
        `UPDATE games SET status = 'completed', completed_at = NOW() WHERE id = $1`,
        [game.id]
      );
      await client.query('COMMIT');
      return NextResponse.json(
        { ok: true, winner_team_id: null, reason: 'No scores submitted before deadline.' },
        { headers: noCache }
      );
    }

    const winner = winnerRes.rows[0];

    await client.query(
      `INSERT INTO game_attempts (game_id, team_id, bonus_awarded, completed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (game_id, team_id)
       DO UPDATE SET bonus_awarded = EXCLUDED.bonus_awarded, completed_at = NOW()`,
      [game.id, winner.team_id, game.bonus_points]
    );

    await client.query(
      `UPDATE games
          SET status = 'completed',
              winner_team_id = $1,
              completed_at = NOW()
        WHERE id = $2`,
      [winner.team_id, game.id]
    );

    await client.query('COMMIT');

    return NextResponse.json(
      {
        ok: true,
        winner_team_id: winner.team_id,
        winning_score: winner.best_score,
        bonus_awarded: game.bonus_points,
      },
      { headers: noCache }
    );
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/games/campus-survivor/resolve error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: noCache }
    );
  } finally {
    client.release();
  }
}
