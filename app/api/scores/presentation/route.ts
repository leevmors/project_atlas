import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

async function requireAdmin(req: NextRequest) {
  const sessionId = req.cookies.get('atlas_sid')?.value;
  if (!sessionId) return null;
  const res = await pool.query(
    `SELECT user_type FROM sessions WHERE id = $1 AND expires_at > NOW()`,
    [sessionId]
  );
  if (res.rows.length === 0 || res.rows[0].user_type !== 'admin') return null;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { teamId, score, scoredBy } = await req.json();

    const result = await pool.query(
      `INSERT INTO presentation_scores (team_id, score, scored_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (team_id) DO UPDATE SET score = $2, scored_by = $3, scored_at = NOW()
       RETURNING id, team_id, score, scored_at, scored_by`,
      [teamId, score, scoredBy]
    );

    const s = result.rows[0];
    return NextResponse.json({
      score: {
        id: s.id,
        teamId: s.team_id,
        score: s.score,
        scoredAt: s.scored_at,
        scoredBy: s.scored_by,
      },
    });
  } catch (err) {
    console.error('POST /api/scores/presentation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
