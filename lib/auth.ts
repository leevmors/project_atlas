import { NextRequest } from 'next/server';
import { pool } from './db';

export async function requireAdmin(req: NextRequest): Promise<boolean> {
  const sessionId = req.cookies.get('atlas_sid')?.value;
  if (!sessionId) return false;
  const res = await pool.query(
    `SELECT user_type FROM sessions WHERE id = $1 AND expires_at > NOW()`,
    [sessionId]
  );
  return res.rows[0]?.user_type === 'admin';
}

export async function getSession(
  req: NextRequest
): Promise<{ user_type: string; user_id: string } | null> {
  const sessionId = req.cookies.get('atlas_sid')?.value;
  if (!sessionId) return null;
  const res = await pool.query<{ user_type: string; user_id: string }>(
    `SELECT user_type, user_id FROM sessions WHERE id = $1 AND expires_at > NOW()`,
    [sessionId]
  );
  return res.rows[0] ?? null;
}

export function clampScore(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(10, Math.max(0, Math.round(n)));
}
