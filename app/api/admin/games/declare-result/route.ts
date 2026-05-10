import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

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

// POST /api/admin/games/declare-result
// Admin-only. Handles two actions:
//   "campus_survivor_split" — awards split bonus to 4lex + neverlang, closes game
//   "final_game_close"      — closes Final Game with no winner, no bonus
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || session.user_type !== 'admin') {
    return NextResponse.json({ error: 'Admin only.' }, { status: 401, headers: noCache });
  }

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400, headers: noCache });
  }

  const { action } = body;
  if (action !== 'campus_survivor_split' && action !== 'final_game_close') {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400, headers: noCache });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (action === 'campus_survivor_split') {
      // Find Campus Survivor game row
      const gameRes = await client.query<{
        id: number; status: string; bonus_points: number; winner_team_id: string | null;
      }>(
        `SELECT id, status, bonus_points, winner_team_id FROM games WHERE name = 'CAMPUS SURVIVOR' FOR UPDATE`
      );
      if (gameRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Campus Survivor game not found.' }, { status: 404, headers: noCache });
      }
      const game = gameRes.rows[0];
      if (game.status === 'completed') {
        await client.query('ROLLBACK');
        return NextResponse.json({ ok: true, alreadyResolved: true }, { headers: noCache });
      }

      // Find 4lex and neverlang teams (case-insensitive)
      const teamsRes = await client.query<{ id: string; company_name: string }>(
        `SELECT id, company_name FROM teams WHERE LOWER(company_name) IN ('4lex', 'neverlang')`
      );
      if (teamsRes.rows.length < 2) {
        await client.query('ROLLBACK');
        const found = teamsRes.rows.map(r => r.company_name).join(', ') || 'none';
        return NextResponse.json(
          { error: `Could not find both teams. Found: ${found}` },
          { status: 404, headers: noCache }
        );
      }

      const splitBonus = Math.floor(game.bonus_points / 2); // 50 pts each

      for (const team of teamsRes.rows) {
        await client.query(
          `INSERT INTO game_attempts (game_id, team_id, bonus_awarded, completed_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (game_id, team_id)
           DO UPDATE SET bonus_awarded = EXCLUDED.bonus_awarded, completed_at = NOW()`,
          [game.id, team.id, splitBonus]
        );
      }

      // Mark game completed — winner_team_id is NULL since it's a split
      await client.query(
        `UPDATE games SET status = 'completed', winner_team_id = NULL, completed_at = NOW() WHERE id = $1`,
        [game.id]
      );

      await client.query('COMMIT');
      return NextResponse.json(
        {
          ok: true,
          winners: teamsRes.rows.map(r => r.company_name),
          bonus_each: splitBonus,
        },
        { headers: noCache }
      );
    }

    if (action === 'final_game_close') {
      // Find the Final Game row
      const gameRes = await client.query<{
        id: number; status: string;
      }>(
        `SELECT id, status FROM games WHERE name = 'THE FINAL GAME (DEADMAN''S CHOICE)' FOR UPDATE`
      );
      if (gameRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Final Game not found.' }, { status: 404, headers: noCache });
      }
      const game = gameRes.rows[0];
      if (game.status === 'completed') {
        await client.query('ROLLBACK');
        return NextResponse.json({ ok: true, alreadyResolved: true }, { headers: noCache });
      }

      await client.query(
        `UPDATE games SET status = 'completed', winner_team_id = NULL, completed_at = NOW() WHERE id = $1`,
        [game.id]
      );

      await client.query('COMMIT');
      return NextResponse.json({ ok: true, closed: true, noWinner: true }, { headers: noCache });
    }

    await client.query('ROLLBACK');
    return NextResponse.json({ error: 'Unhandled action.' }, { status: 400, headers: noCache });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/admin/games/declare-result error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500, headers: noCache });
  } finally {
    client.release();
  }
}
