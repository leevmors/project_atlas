import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAdmin, clampScore } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { teamId, taskName, scoredBy } = body;

    if (!teamId || !taskName || typeof taskName !== 'string' || !taskName.trim()) {
      return NextResponse.json({ error: 'teamId and taskName are required' }, { status: 400 });
    }

    const accuracy = clampScore(body.accuracy);
    const quality = clampScore(body.quality);
    const speed = clampScore(body.speed);
    const tools = clampScore(body.tools);

    const result = await pool.query(
      `INSERT INTO task_scores (team_id, task_name, accuracy, quality, speed, tools, scored_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, team_id, task_name, accuracy, quality, speed, tools, scored_at, scored_by`,
      [teamId, taskName.trim(), accuracy, quality, speed, tools, scoredBy || 'admin']
    );

    const s = result.rows[0];
    return NextResponse.json({
      score: {
        id: String(s.id),
        teamId: String(s.team_id),
        taskName: s.task_name,
        accuracy: s.accuracy,
        quality: s.quality,
        speed: s.speed,
        tools: s.tools,
        scoredAt: s.scored_at,
        scoredBy: s.scored_by,
      },
    });
  } catch (err) {
    console.error('POST /api/scores/task error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
