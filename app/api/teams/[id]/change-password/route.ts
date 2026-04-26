import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';

interface SessionRow {
  id: string;
  user_type: string;
  user_id: string;
}

interface TeamPasswordRow {
  password_hash: string;
}

async function getSession(req: NextRequest): Promise<SessionRow | null> {
  const sessionId = req.cookies.get('atlas_sid')?.value;
  if (!sessionId) return null;
  const res = await pool.query<SessionRow>(
    `SELECT id, user_type, user_id FROM sessions WHERE id = $1 AND expires_at > NOW()`,
    [sessionId]
  );
  return res.rows[0] ?? null;
}

const noCache = { 'Cache-Control': 'no-store' };

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getSession(req);

    // Authorization: must be a team session for THIS team
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noCache });
    }
    if (session.user_type !== 'team' || session.user_id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: noCache });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: noCache });
    }

    const { currentPassword, newPassword } = body as {
      currentPassword?: unknown;
      newPassword?: unknown;
    };

    if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400, headers: noCache });
    }
    if (typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'New password is required' }, { status: 400, headers: noCache });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400, headers: noCache });
    }
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400, headers: noCache });
    }

    // Load current hash
    const teamRes = await pool.query<TeamPasswordRow>(
      `SELECT password_hash FROM teams WHERE id = $1`,
      [id]
    );
    if (teamRes.rows.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404, headers: noCache });
    }

    // Verify current password
    const ok = await bcrypt.compare(currentPassword, teamRes.rows[0].password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401, headers: noCache });
    }

    // Hash new password (cost 12, matching app/api/auth/login/route.ts)
    const newHash = await bcrypt.hash(newPassword, 12);

    // Update password and invalidate other sessions atomically
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE teams SET password_hash = $1 WHERE id = $2`,
        [newHash, id]
      );
      // Keep the current session, drop everyone else's for this team
      await client.query(
        `DELETE FROM sessions WHERE user_id = $1 AND id != $2`,
        [id, session.id]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json({ ok: true }, { headers: noCache });
  } catch (err) {
    console.error('POST /api/teams/[id]/change-password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: noCache });
  }
}
