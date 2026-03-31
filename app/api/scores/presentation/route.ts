import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAdmin, clampScore } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { teamId, scoredBy } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    const score = clampScore(body.score);

    const result = await pool.query(
      `INSERT INTO presentation_scores (team_id, score, scored_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (team_id) DO UPDATE SET score = $2, scored_by = $3, scored_at = NOW()
       RETURNING id, team_id, score, scored_at, scored_by`,
      [teamId, score, scoredBy || 'admin']
    );

    const s = result.rows[0];
    return NextResponse.json({
      score: {
        id: String(s.id),
        teamId: String(s.team_id),
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
