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
    const { taskName, accuracy, quality, speed, tools } = await req.json();
    const result = await pool.query(
      `UPDATE task_scores
       SET task_name = COALESCE($1, task_name),
           accuracy = COALESCE($2, accuracy),
           quality = COALESCE($3, quality),
           speed = COALESCE($4, speed),
           tools = COALESCE($5, tools)
       WHERE id = $6
       RETURNING id, team_id, task_name, accuracy, quality, speed, tools, scored_at, scored_by`,
      [taskName, accuracy, quality, speed, tools, params.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Score not found' }, { status: 404 });
    }
    const s = result.rows[0];
    return NextResponse.json({
      score: {
        id: s.id,
        teamId: s.team_id,
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await pool.query('DELETE FROM task_scores WHERE id = $1', [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/scores/task/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
