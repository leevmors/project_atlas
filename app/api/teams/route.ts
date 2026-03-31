import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';

function buildTeamsWithScores(teams: any[], taskScores: any[], socialScores: any[], presentationScores: any[]) {
  return teams
    .map((team) => {
      const ts = taskScores
        .filter((s) => s.team_id === team.id)
        .map((s) => ({
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

      const ss = socialScores
        .filter((s) => s.team_id === team.id)
        .map((s) => ({
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

      const ps = presentationScores.find((s) => s.team_id === team.id);

      const totalTaskPoints = ts.reduce(
        (sum, s) => sum + s.accuracy + s.quality + s.speed + s.tools,
        0
      );
      const totalSocialPoints = ss.reduce(
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

      return {
        id: team.id,
        companyName: team.company_name,
        password: '',
        instagram: team.instagram || undefined,
        threads: team.threads || undefined,
        email: team.email,
        members: team.members,
        createdAt: team.created_at,
        taskScores: ts,
        socialScores: ss,
        presentationScore: ps
          ? {
              id: ps.id,
              teamId: ps.team_id,
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
    })
    .sort((a, b) => b.grandTotal - a.grandTotal);
}

export async function GET() {
  try {
    const [teamsRes, taskRes, socialRes, presentRes] = await Promise.all([
      pool.query(
        `SELECT id, company_name, instagram, threads, email, members, created_at
         FROM teams ORDER BY created_at`
      ),
      pool.query(
        `SELECT id, team_id, task_name, accuracy, quality, speed, tools, scored_at, scored_by
         FROM task_scores ORDER BY scored_at`
      ),
      pool.query(
        `SELECT id, team_id, week_number, content_quality, posting_frequency, likes, views, followers, comments, scored_at, scored_by
         FROM social_media_scores ORDER BY scored_at`
      ),
      pool.query(
        `SELECT id, team_id, score, scored_at, scored_by FROM presentation_scores`
      ),
    ]);

    const teams = buildTeamsWithScores(
      teamsRes.rows,
      taskRes.rows,
      socialRes.rows,
      presentRes.rows
    );

    return NextResponse.json({ teams });
  } catch (err) {
    console.error('GET /api/teams error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { companyName, password, instagram, threads, email, members } =
      await req.json();

    if (!companyName || !password || !email || !members) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    const result = await pool.query(
      `INSERT INTO teams (company_name, password_hash, instagram, threads, email, members)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, company_name, instagram, threads, email, members, created_at`,
      [
        companyName,
        passwordHash,
        instagram || null,
        threads || null,
        email,
        JSON.stringify(members),
      ]
    );

    const row = result.rows[0];
    const team = {
      id: row.id,
      companyName: row.company_name,
      password: '',
      instagram: row.instagram || undefined,
      threads: row.threads || undefined,
      email: row.email,
      members: row.members,
      createdAt: row.created_at,
    };

    return NextResponse.json({ team }, { status: 201 });
  } catch (err) {
    console.error('POST /api/teams error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
