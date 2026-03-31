import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface PresentationScoreRow {
  id: string;
  team_id: string;
  score: number;
  scored_at: string;
  scored_by: string;
}

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

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await context.params;
    const { score } = await req.json();
    const result = await pool.query<PresentationScoreRow>(
      `UPDATE presentation_scores
       SET score = COALESCE($1, score), scored_at = NOW()
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
        id: s.id,
        teamId: s.team_id,
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
