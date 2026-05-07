import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

const noCache = { 'Cache-Control': 'no-store' };

interface TeamRow {
  team_id: string;
  company_name: string;
  group_number: string | null;
  best_score: number;
  best_kills: number;
  best_time: number;
  best_level: number;
  runs: number;
  last_run: string | null;
}

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CAMPUS_SURVIVOR_ADMIN_PASSWORD || 'mrasylbirules';
  return req.headers.get('x-campus-survivor-admin-password') === expected;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json(
        { error: 'Invalid Campus Survivor admin password.', code: 'invalid_admin_password' },
        { status: 401, headers: noCache }
      );
    }

    const res = await pool.query<TeamRow>(`
      SELECT
        t.id AS team_id,
        t.company_name,
        t.group_number,
        COALESCE(MAX(s.score), 0)::int AS best_score,
        COALESCE(MAX(s.kills), 0)::int AS best_kills,
        COALESCE(MAX(s.time_survived), 0)::int AS best_time,
        COALESCE(MAX(s.level_reached), 1)::int AS best_level,
        COUNT(s.id)::int AS runs,
        MAX(s.submitted_at) AS last_run
      FROM teams t
      LEFT JOIN campus_survivor_scores s ON s.team_id = t.id
      GROUP BY t.id, t.company_name, t.group_number
      ORDER BY t.company_name ASC
    `);

    return NextResponse.json(
      {
        teams: res.rows.map((row) => ({
          team_id: String(row.team_id),
          company_name: row.company_name,
          group_number: row.group_number,
          best_score: Number(row.best_score ?? 0),
          best_kills: Number(row.best_kills ?? 0),
          best_time: Number(row.best_time ?? 0),
          best_level: Number(row.best_level ?? 1),
          runs: Number(row.runs ?? 0),
          last_run: row.last_run,
        })),
      },
      { headers: noCache }
    );
  } catch (err) {
    console.error('GET /api/games/campus-survivor/admin/teams error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'internal_error' },
      { status: 500, headers: noCache }
    );
  }
}
