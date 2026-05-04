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

// POST a completed run. Body: { score, kills, time_survived, level_reached }.
// Only registered team accounts count toward the leaderboard.
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.user_type !== 'team') {
      return NextResponse.json(
        { error: 'Only registered teams can submit scores.' },
        { status: 401, headers: noCache }
      );
    }

    if (Date.now() > DEADLINE_MS) {
      return NextResponse.json(
        { error: 'The Campus Survivor leaderboard has closed.', closed: true },
        { status: 410, headers: noCache }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid body' },
        { status: 400, headers: noCache }
      );
    }

    const score = Math.max(0, Math.min(99_999_999, Math.floor(Number(body.score) || 0)));
    const kills = Math.max(0, Math.min(999_999, Math.floor(Number(body.kills) || 0)));
    const timeSurvived = Math.max(0, Math.min(86_400, Math.floor(Number(body.time_survived) || 0)));
    const levelReached = Math.max(1, Math.min(999, Math.floor(Number(body.level_reached) || 1)));

    await pool.query(
      `INSERT INTO campus_survivor_scores (team_id, score, kills, time_survived, level_reached)
       VALUES ($1, $2, $3, $4, $5)`,
      [session.user_id, score, kills, timeSurvived, levelReached]
    );

    return NextResponse.json({ ok: true }, { headers: noCache });
  } catch (err) {
    console.error('POST /api/games/campus-survivor/score error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: noCache }
    );
  }
}
