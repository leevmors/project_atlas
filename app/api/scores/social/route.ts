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

    const weekNumber = Math.max(1, Math.min(52, Math.round(Number(body.weekNumber) || 1)));
    const contentQuality = clampScore(body.contentQuality);
    const postingFrequency = clampScore(body.postingFrequency);
    const likes = clampScore(body.likes);
    const views = clampScore(body.views);
    const followers = clampScore(body.followers);
    const comments = clampScore(body.comments);

    const result = await pool.query(
      `INSERT INTO social_media_scores
         (team_id, week_number, content_quality, posting_frequency, likes, views, followers, comments, scored_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, team_id, week_number, content_quality, posting_frequency, likes, views, followers, comments, scored_at, scored_by`,
      [teamId, weekNumber, contentQuality, postingFrequency, likes, views, followers, comments, scoredBy || 'admin']
    );

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
    console.error('POST /api/scores/social error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
