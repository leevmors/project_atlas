import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface TeamRow {
  id: number;
  company_name: string;
  instagram: string | null;
  threads: string | null;
  group_number: string | null;
  email: string;
  members: { name: string; role: string }[];
  created_at: string;
}

interface TaskRow {
  id: number;
  team_id: number;
  task_name: string;
  accuracy: number;
  quality: number;
  speed: number;
  tools: number;
  scored_at: string;
  scored_by: string;
}

interface SocialRow {
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

interface PresentationRow {
  id: number;
  team_id: number;
  score: number;
  scored_at: string;
  scored_by: string;
}

interface SessionRow {
  user_type: string;
  user_id: string;
}

async function getSession(req: NextRequest): Promise<SessionRow | null> {
  const sessionId = req.cookies.get('atlas_sid')?.value;
  if (!sessionId) return null;
  const res = await pool.query<SessionRow>(
    `SELECT user_type, user_id FROM sessions WHERE id = $1 AND expires_at > NOW()`,
    [sessionId]
  );
  return res.rows[0] ?? null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user_type !== 'admin' && session.user_id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [teamRes, taskRes, socialRes, presentRes, gameBonusRes] = await Promise.all([
      pool.query<TeamRow>(
        `SELECT id, company_name, instagram, threads, group_number, email, members, created_at
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
        `SELECT id, team_id, score, scored_at, scored_by FROM presentation_scores WHERE team_id = $1`,
        [id]
      ),
      pool.query<{ game_bonus: string }>(
        `SELECT COALESCE(SUM(bonus_awarded), 0) as game_bonus FROM game_attempts WHERE team_id = $1 AND bonus_awarded > 0`,
        [id]
      ),
    ]);

    if (teamRes.rows.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const team = teamRes.rows[0];
    const teamIdStr = String(team.id);

    const taskScores = taskRes.rows.map((s) => ({
      id: String(s.id),
      teamId: teamIdStr,
      taskName: s.task_name,
      accuracy: s.accuracy,
      quality: s.quality,
      speed: s.speed,
      tools: s.tools,
      scoredAt: s.scored_at,
      scoredBy: s.scored_by,
    }));

    const socialScores = socialRes.rows.map((s) => ({
      id: String(s.id),
      teamId: teamIdStr,
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
          id: String(ps.id),
          teamId: teamIdStr,
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
        sum + s.contentQuality + s.postingFrequency + s.likes + s.views + s.followers + s.comments,
      0
    );
    const totalPresentationPoints = ps?.score ?? 0;
    const totalGamePoints = parseInt(gameBonusRes.rows[0]?.game_bonus ?? '0', 10) || 0;

    return NextResponse.json({
      team: {
        id: teamIdStr,
        companyName: team.company_name,
        instagram: team.instagram ?? undefined,
        threads: team.threads ?? undefined,
        groupNumber: team.group_number ?? undefined,
        email: team.email,
        members: team.members,
        createdAt: team.created_at,
        taskScores,
        socialScores,
        presentationScore,
        totalTaskPoints,
        totalSocialPoints,
        totalPresentationPoints,
        totalGamePoints,
        grandTotal: totalTaskPoints + totalSocialPoints + totalPresentationPoints + totalGamePoints,
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
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user_type !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await pool.query('DELETE FROM task_scores WHERE team_id = $1', [id]);
    await pool.query('DELETE FROM social_media_scores WHERE team_id = $1', [id]);
    await pool.query('DELETE FROM presentation_scores WHERE team_id = $1', [id]);
    await pool.query('DELETE FROM sessions WHERE user_id = $1 AND user_type = $2', [id, 'team']);
    await pool.query('DELETE FROM teams WHERE id = $1', [id]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/teams/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user_type !== 'admin' && session.user_id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { instagram, threads, groupNumber, members } = body;

    if (members !== undefined) {
      if (!Array.isArray(members) || members.length === 0) {
        return NextResponse.json({ error: 'At least one member required' }, { status: 400 });
      }
      const valid = members.every(
        (m: unknown) =>
          m !== null &&
          typeof m === 'object' &&
          typeof (m as Record<string, unknown>).name === 'string' &&
          (m as Record<string, unknown>).name !== ''
      );
      if (!valid) {
        return NextResponse.json({ error: 'Each member must have a name' }, { status: 400 });
      }
    }

    if (groupNumber !== undefined && groupNumber !== null) {
      if (typeof groupNumber !== 'string' || groupNumber.length > 20) {
        return NextResponse.json({ error: 'Invalid group number' }, { status: 400 });
      }
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (instagram !== undefined) {
      setClauses.push(`instagram = $${paramIndex++}`);
      values.push(instagram || null);
    }
    if (threads !== undefined) {
      setClauses.push(`threads = $${paramIndex++}`);
      values.push(threads || null);
    }
    if (groupNumber !== undefined) {
      setClauses.push(`group_number = $${paramIndex++}`);
      values.push(groupNumber || null);
    }
    if (members !== undefined) {
      setClauses.push(`members = $${paramIndex++}`);
      values.push(JSON.stringify(members));
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const result = await pool.query<TeamRow>(
      `UPDATE teams SET ${setClauses.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, company_name, instagram, threads, group_number, email, members, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      team: {
        id: String(row.id),
        companyName: row.company_name,
        instagram: row.instagram ?? undefined,
        threads: row.threads ?? undefined,
        groupNumber: row.group_number ?? undefined,
        email: row.email,
        members: row.members,
        memberCount: Array.isArray(row.members) ? row.members.length : 0,
        createdAt: row.created_at,
      },
    });
  } catch (err) {
    console.error('PUT /api/teams/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
