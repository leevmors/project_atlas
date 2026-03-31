import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface TeamRow {
  id: string;
  company_name: string;
  instagram: string | null;
  threads: string | null;
  email: string;
  members: { name: string; role: string }[];
  created_at: string;
}

interface TaskRow {
  id: string;
  team_id: string;
  task_name: string;
  accuracy: number;
  quality: number;
  speed: number;
  tools: number;
  scored_at: string;
  scored_by: string;
}

interface SocialRow {
  id: string;
  team_id: string;
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

interface PresentationRow {
  id: string;
  team_id: string;
  score: number;
  scored_at: string;
  scored_by: string;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const [teamRes, taskRes, socialRes, presentRes] = await Promise.all([
      pool.query<TeamRow>(
        `SELECT id, company_name, instagram, threads, email, members, created_at
         FROM teams WHERE id = $1`,
        [id]
      ),
      pool.query<TaskRow>(
        `SELECT id, team_id, task_name, accuracy, quality, speed, tools, scored_at, scored_by
         FROM task_scores WHERE team_id = $1 ORDER BY scored_at`,
        [id]
      ),
      pool.query<SocialRow>(
        `SELECT id, team_id, week_number, content_quality, posting_frequency, likes, views, followers, comments, scored_at, scored_by
         FROM social_media_scores WHERE team_id = $1 ORDER BY scored_at`,
        [id]
      ),
      pool.query<PresentationRow>(
        `SELECT id, team_id, score, scored_at, scored_by
         FROM presentation_scores WHERE team_id = $1`,
        [id]
      ),
    ]);

    if (teamRes.rows.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const team = teamRes.rows[0];
    const taskScores = taskRes.rows.map((s) => ({
      id: s.id,
      teamId: s.team_id,
      taskName: s.task_name,
      accuracy: s.accuracy,
      quality: s.quality,
      speed: s.speed,
      tools: s.tools,
      scoredAt: s.scored_at,
      scoredBy: s.scored_by,
    }));

    const socialScores = socialRes.rows.map((s) => ({
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
    }));

    const ps = presentRes.rows[0];
    const presentationScore = ps
      ? {
          id: ps.id,
          teamId: ps.team_id,
          score: ps.score,
          scoredAt: ps.scored_at,
          scoredBy: ps.scored_by,
        }
      : undefined;

    const totalTaskPoints = taskScores.reduce(
      (sum, s) => sum + s.accuracy + s.quality + s.speed + s.tools,
      0
    );
    const totalSocialPoints = socialScores.reduce(
      (sum, s) =>
        sum +
        s.contentQuality +
        s.postingFrequency +
        s.likes +
        s.views +
        s.followers +
        s.comments,
      0
    );
    const totalPresentationPoints = ps?.score || 0;

    return NextResponse.json({
      team: {
        id: team.id,
        companyName: team.company_name,
        password: '',
        instagram: team.instagram || undefined,
        threads: team.threads || undefined,
        email: team.email,
        members: team.members,
        createdAt: team.created_at,
        taskScores,
        socialScores,
        presentationScore,
        totalTaskPoints,
        totalSocialPoints,
        totalPresentationPoints,
        grandTotal: totalTaskPoints + totalSocialPoints + totalPresentationPoints,
      },
    });
  } catch (err) {
    console.error('GET /api/teams/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const sessionId = req.cookies.get('atlas_sid')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionRes = await pool.query(
      `SELECT user_type FROM sessions WHERE id = $1 AND expires_at > NOW()`,
      [sessionId]
    );
    if (sessionRes.rows.length === 0 || sessionRes.rows[0].user_type !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await pool.query('DELETE FROM task_scores WHERE team_id = $1', [id]);
    await pool.query('DELETE FROM social_media_scores WHERE team_id = $1', [id]);
    await pool.query('DELETE FROM presentation_scores WHERE team_id = $1', [id]);
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM teams WHERE id = $1', [id]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/teams/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
