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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { weekNumber, contentQuality, postingFrequency, likes, views, followers, comments } =
      await req.json();
    const result = await pool.query(
      `UPDATE social_media_scores
       SET week_number = COALESCE($1, week_number),
           content_quality = COALESCE($2, content_quality),
           posting_frequency = COALESCE($3, posting_frequency),
           likes = COALESCE($4, likes),
           views = COALESCE($5, views),
           followers = COALESCE($6, followers),
           comments = COALESCE($7, comments)
       WHERE id = $8
       RETURNING id, team_id, week_number, content_quality, posting_frequency, likes, views, followers, comments, scored_at, scored_by`,
      [weekNumber, contentQuality, postingFrequency, likes, views, followers, comments, params.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Score not found' }, { status: 404 });
    }
    const s = result.rows[0];
    return NextResponse.json({
      score: {
        id: s.id,
        teamId: s.team_id,
        weekNumber: s.week_number,
        contentQuality: s.content_quality,
        postingFrequency: s.posting_frequency,
        likes: s.likes,
        views: s.views,
        followers: s.followers,
        comments: s.comments,
        scoredAt: s.scored_at,
        scoredBy: s.scored_by,
      },
    });
  } catch (err) {
    console.error('PUT /api/scores/social/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await pool.query('DELETE FROM social_media_scores WHERE id = $1', [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/scores/social/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
