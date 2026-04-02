import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface SessionRow {
  user_type: string;
  user_id: string;
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

    await pool.query(
      `INSERT INTO game_attempts (game_id, team_id, wordle_locked_until)
       VALUES ($1, $2, NOW() + interval '30 minutes')
       ON CONFLICT (game_id, team_id) DO UPDATE SET wordle_locked_until = NOW() + interval '30 minutes'`,
      [id, session.user_id]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/games/[id]/wordle-lock error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
