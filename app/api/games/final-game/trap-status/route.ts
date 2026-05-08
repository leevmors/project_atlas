import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface SessionRow {
  user_type: string;
  user_id: string;
}

async function getTeamId(req: NextRequest): Promise<string | null> {
  const sessionId = req.cookies.get('atlas_sid')?.value;
  if (!sessionId) return null;
  try {
    const res = await pool.query<SessionRow>(
      `SELECT user_type, user_id FROM sessions WHERE id = $1 AND expires_at > NOW()`,
      [sessionId]
    );
    const row = res.rows[0];
    if (!row || row.user_type !== 'team') return null;
    return row.user_id;
  } catch {
    return null;
  }
}

const noCache = { 'Cache-Control': 'no-store' };

export async function GET(req: NextRequest) {
  const teamId = await getTeamId(req);
  if (!teamId) {
    return NextResponse.json({ trapPassed: false }, { headers: noCache });
  }
  try {
    const res = await pool.query(
      `SELECT 1 FROM final_game_state WHERE team_id = $1`,
      [teamId]
    );
    return NextResponse.json({ trapPassed: res.rowCount! > 0 }, { headers: noCache });
  } catch {
    return NextResponse.json({ trapPassed: false }, { headers: noCache });
  }
}

export async function POST(req: NextRequest) {
  const teamId = await getTeamId(req);
  if (!teamId) {
    return NextResponse.json({ ok: false }, { status: 401, headers: noCache });
  }
  try {
    await pool.query(
      `INSERT INTO final_game_state (team_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [teamId]
    );
    return NextResponse.json({ ok: true }, { headers: noCache });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500, headers: noCache });
  }
}
