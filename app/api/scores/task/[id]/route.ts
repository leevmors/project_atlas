import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { requireAdmin, clampScore } from '@/lib/auth';

interface TaskScoreRow {
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

    const taskName = body.taskName != null ? String(body.taskName).trim() : undefined;
    const accuracy = body.accuracy != null ? clampScore(body.accuracy) : undefined;
    const quality = body.quality != null ? clampScore(body.quality) : undefined;
    const speed = body.speed != null ? clampScore(body.speed) : undefined;
    const tools = body.tools != null ? clampScore(body.tools) : undefined;

    const result = await pool.query<TaskScoreRow>(
      `UPDATE task_scores
       SET task_name = COALESCE($1, task_name),
           accuracy  = COALESCE($2, accuracy),
           quality   = COALESCE($3, quality),
           speed     = COALESCE($4, speed),
           tools     = COALESCE($5, tools)
       WHERE id = $6
       RETURNING id, team_id, task_name, accuracy, quality, speed, tools, scored_at, scored_by`,
      [taskName ?? null, accuracy ?? null, quality ?? null, speed ?? null, tools ?? null, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Score not found' }, { status: 404 });
    }
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
    console.error('PUT /api/scores/task/[id] error:', err);
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
    await pool.query('DELETE FROM task_scores WHERE id = $1', [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/scores/task/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
