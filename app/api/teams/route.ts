import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';

interface TeamRow {
  id: number;
  company_name: string;
  instagram: string | null;
  threads: string | null;
  group_number: string | null;
  email: string;
  members: { name: string; role: string }[];
  member_count: string;
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

async function getAdminSession(req: NextRequest): Promise<boolean> {
  try {
    const sessionId = req.cookies.get('atlas_sid')?.value;
    if (!sessionId) return false;
    const res = await pool.query<SessionRow>(
      `SELECT user_type FROM sessions WHERE id = $1 AND expires_at > NOW()`,
      [sessionId]
    );
    return res.rows[0]?.user_type === 'admin';
  } catch {
    return false;
  }
}

function buildTeamsWithScores(
  teams: TeamRow[],
  taskScores: TaskRow[],
  socialScores: SocialRow[],
  presentationScores: PresentationRow[],
  isAdmin: boolean
) {
  return teams
    .map((team) => {
      const teamIdStr = String(team.id);
      const memberCount = parseInt(team.member_count, 10) || 0;

      const ts = taskScores
        .filter((s) => String(s.team_id) === teamIdStr)
        .map((s) => ({
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

      const ss = socialScores
        .filter((s) => String(s.team_id) === teamIdStr)
        .map((s) => ({
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

      const ps = presentationScores.find((s) => String(s.team_id) === teamIdStr);

      const totalTaskPoints = ts.reduce(
        (sum, s) => sum + s.accuracy + s.quality + s.speed + s.tools,
        0
      );
      const totalSocialPoints = ss.reduce(
        (sum, s) =>
          sum + s.contentQuality + s.postingFrequency + s.likes + s.views + s.followers + s.comments,
        0
      );
      const totalPresentationPoints = ps?.score ?? 0;

      const base = {
        id: teamIdStr,
        companyName: team.company_name,
        instagram: team.instagram ?? undefined,
        threads: team.threads ?? undefined,
        groupNumber: team.group_number ?? undefined,
        members: team.members,
        memberCount,
        taskScores: ts,
        socialScores: ss,
        presentationScore: ps
          ? {
              id: String(ps.id),
              teamId: teamIdStr,
              score: ps.score,
              scoredAt: ps.scored_at,
              scoredBy: ps.scored_by,
            }
          : undefined,
        totalTaskPoints,
        totalSocialPoints,
        totalPresentationPoints,
        grandTotal: totalTaskPoints + totalSocialPoints + totalPresentationPoints,
      };

      if (isAdmin) {
        return { ...base, email: team.email };
      }
      return base;
    })
    .sort((a, b) => b.grandTotal - a.grandTotal);
}

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await getAdminSession(req);

    const selectCols = isAdmin
      ? `id, company_name, instagram, threads, group_number, email, members,
         jsonb_array_length(members) AS member_count, created_at`
      : `id, company_name, instagram, threads, group_number, members,
         jsonb_array_length(members) AS member_count, created_at`;

    const [teamsRes, taskRes, socialRes, presentRes] = await Promise.all([
      pool.query<TeamRow>(
        `SELECT ${selectCols} FROM teams ORDER BY created_at`
      ),
      pool.query<TaskRow>(
        `SELECT id, team_id, task_name, accuracy, quality, speed, tools, scored_at, scored_by
         FROM task_scores ORDER BY scored_at`
      ),
      pool.query<SocialRow>(
        `SELECT id, team_id, week_number, content_quality, posting_frequency, likes, views, followers, comments, scored_at, scored_by
         FROM social_media_scores ORDER BY scored_at`
      ),
      pool.query<PresentationRow>(
        `SELECT id, team_id, score, scored_at, scored_by FROM presentation_scores`
      ),
    ]);

    const teams = buildTeamsWithScores(
      teamsRes.rows,
      taskRes.rows,
      socialRes.rows,
      presentRes.rows,
      isAdmin
    );

    return NextResponse.json({ teams });
  } catch (err) {
    console.error('GET /api/teams error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { companyName, password, instagram, threads, groupNumber, email, members } = await req.json();

    if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
      return NextResponse.json({ error: 'companyName is required' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'password must be at least 6 characters' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ error: 'At least one team member is required' }, { status: 400 });
    }
    const validMembers = members.every(
      (m: unknown) =>
        m !== null &&
        typeof m === 'object' &&
        typeof (m as Record<string, unknown>).name === 'string' &&
        (m as Record<string, unknown>).name !== ''
    );
    if (!validMembers) {
      return NextResponse.json({ error: 'Each member must have a name' }, { status: 400 });
    }

    const existing = await pool.query(
      'SELECT id FROM teams WHERE LOWER(company_name) = LOWER($1)',
      [companyName]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'A team with this company name already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    interface NewTeamRow {
      id: number;
      company_name: string;
      instagram: string | null;
      threads: string | null;
      group_number: string | null;
      email: string;
      members: { name: string; role: string }[];
      created_at: string;
    }

    const result = await pool.query<NewTeamRow>(
      `INSERT INTO teams (company_name, password_hash, instagram, threads, group_number, email, members)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, company_name, instagram, threads, group_number, email, members, created_at`,
      [companyName, passwordHash, instagram ?? null, threads ?? null, groupNumber ?? null, email, JSON.stringify(members)]
    );

    const row = result.rows[0];
    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/teams error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
