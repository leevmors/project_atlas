import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAdmin, clampScore } from '@/lib/auth';

interface PresentationScoreRow {
  id: number;
  team_id: number;
  score: number;
  scored_at: string;
  scored_by: string;
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await context.params;
    const body = await req.json();

    if (body.score == null) {
      return NextResponse.json({ error: 'score is required' }, { status: 400 });
    }
    const score = clampScore(body.score);

    const result = await pool.query<PresentationScoreRow>(
      `UPDATE presentation_scores
       SET score = $1, scored_at = NOW()
       WHERE id = $2
       RETURNING id, team_id, score, scored_at, scored_by`,
      [score, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Score not found' }, { status: 404 });
    }
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
    console.error('PUT /api/scores/presentation/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await context.params;
    await pool.query('DELETE FROM presentation_scores WHERE id = $1', [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/scores/presentation/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
