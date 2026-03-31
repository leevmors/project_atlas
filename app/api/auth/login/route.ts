import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const SESSION_HOURS = 24;

async function ensureAdminExists(): Promise<boolean> {
  const res = await pool.query('SELECT id FROM admins LIMIT 1');
  if (res.rows.length > 0) return true;

  const username = process.env.ADMIN_USERNAME || 'leev';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    'INSERT INTO admins (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING',
    [username, hash]
  );
  return true;
}

interface AdminRow {
  id: number;
  username: string;
  password_hash: string;
}

interface TeamRow {
  id: number;
  company_name: string;
  password_hash: string;
}

export async function POST(req: NextRequest) {
  try {
    const { type, identifier, password } = await req.json();

    if (!type || !identifier || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let session: { type: string; id: string; name: string } | null = null;

    if (type === 'admin') {
      const seeded = await ensureAdminExists();
      if (!seeded) {
        return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
      }
      const res = await pool.query<AdminRow>(
        'SELECT id, username, password_hash FROM admins WHERE username = $1',
        [identifier]
      );
      if (res.rows.length > 0) {
        const admin = res.rows[0];
        const ok = await bcrypt.compare(password, admin.password_hash);
        if (ok) {
          session = { type: 'admin', id: `admin-${admin.id}`, name: admin.username };
        }
      }
    } else {
      const res = await pool.query<TeamRow>(
        'SELECT id, company_name, password_hash FROM teams WHERE LOWER(company_name) = LOWER($1)',
        [identifier]
      );
      if (res.rows.length > 0) {
        const team = res.rows[0];
        const ok = await bcrypt.compare(password, team.password_hash);
        if (ok) {
          session = { type: 'team', id: String(team.id), name: team.company_name };
        }
      }
    }

    if (!session) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO sessions (id, user_type, user_id, user_name, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, session.type, session.id, session.name, expiresAt]
    );

    const response = NextResponse.json({ session });
    response.cookies.set('atlas_sid', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
