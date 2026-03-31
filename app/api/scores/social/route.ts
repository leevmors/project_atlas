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

    const {
      teamId,
      weekNumber,
      contentQuality,
      postingFrequency,
      likes,
      views,
      followers,
      comments,
      scoredBy,
    } = await req.json();

    const result = await pool.query(
      `INSERT INTO social_media_scores
         (team_id, week_number, content_quality, posting_frequency, likes, views, followers, comments, scored_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, team_id, week_number, content_quality, posting_frequency, likes, views, followers, comments, scored_at, scored_by`,
      [
        teamId,
        weekNumber,
        contentQuality,
        postingFrequency,
        likes,
        views,
        followers,
        comments,
        scoredBy,
      ]
    );

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
    console.error('POST /api/scores/social error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
