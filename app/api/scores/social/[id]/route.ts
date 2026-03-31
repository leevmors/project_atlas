import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAdmin, clampScore } from '@/lib/auth';

interface SocialScoreRow {
  id: number;
  team_id: number;
  week_number: number;
  content_quality: number;
  posting_frequency: number;
  likes: number;
  views: number;
  followers: number;
  comments: number;
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

    const weekNumber = body.weekNumber != null
      ? Math.max(1, Math.min(52, Math.round(Number(body.weekNumber) || 1)))
      : undefined;
    const contentQuality = body.contentQuality != null ? clampScore(body.contentQuality) : undefined;
    const postingFrequency = body.postingFrequency != null ? clampScore(body.postingFrequency) : undefined;
    const likes = body.likes != null ? clampScore(body.likes) : undefined;
    const views = body.views != null ? clampScore(body.views) : undefined;
    const followers = body.followers != null ? clampScore(body.followers) : undefined;
    const comments = body.comments != null ? clampScore(body.comments) : undefined;

    const result = await pool.query<SocialScoreRow>(
      `UPDATE social_media_scores
       SET week_number        = COALESCE($1, week_number),
           content_quality    = COALESCE($2, content_quality),
           posting_frequency  = COALESCE($3, posting_frequency),
           likes              = COALESCE($4, likes),
           views              = COALESCE($5, views),
           followers          = COALESCE($6, followers),
           comments           = COALESCE($7, comments)
       WHERE id = $8
       RETURNING id, team_id, week_number, content_quality, posting_frequency, likes, views, followers, comments, scored_at, scored_by`,
      [weekNumber ?? null, contentQuality ?? null, postingFrequency ?? null,
       likes ?? null, views ?? null, followers ?? null, comments ?? null, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Score not found' }, { status: 404 });
    }
    const s = result.rows[0];
    return NextResponse.json({
      score: {
        id: String(s.id),
        teamId: String(s.team_id),
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

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await context.params;
    await pool.query('DELETE FROM social_media_scores WHERE id = $1', [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/scores/social/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
