import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// May 10, 2026 18:00 GMT+5 = May 10, 2026 13:00 UTC
const DEADLINE_MS = new Date('2026-05-10T13:00:00Z').getTime();

const noCache = { 'Cache-Control': 'no-store' };

interface LeaderRow {
  team_id: string;
  company_name: string;
  best_score: number;
  best_kills: number;
  best_time: number;
  best_level: number;
  runs: number;
  last_run: string;
}

// Returns each registered team's best run sorted by score DESC.
// After the deadline the list is final — that's the winner.
export async function GET() {
  try {
    const res = await pool.query<LeaderRow>(`
      SELECT
        t.id           AS team_id,
        t.company_name,
        COALESCE(MAX(s.score), 0)         AS best_score,
        COALESCE(MAX(s.kills), 0)         AS best_kills,
        COALESCE(MAX(s.time_survived), 0) AS best_time,
        COALESCE(MAX(s.level_reached), 0) AS best_level,
        COUNT(s.id)::int                  AS runs,
        MAX(s.submitted_at)               AS last_run
      FROM teams t
      LEFT JOIN campus_survivor_scores s ON s.team_id = t.id
      GROUP BY t.id, t.company_name
      HAVING COUNT(s.id) > 0
      ORDER BY best_score DESC, best_time DESC, last_run ASC
    `);

    const now = Date.now();
    const closed = now > DEADLINE_MS;
    const msRemaining = Math.max(0, DEADLINE_MS - now);

    return NextResponse.json(
      {
        leaderboard: res.rows,
        deadline_iso: '2026-05-10T13:00:00Z',
        ms_remaining: msRemaining,
        closed,
      },
      { headers: noCache }
    );
  } catch (err) {
    console.error('GET /api/games/campus-survivor/leaderboard error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: noCache }
    );
  }
}
