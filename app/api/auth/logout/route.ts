import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get('atlas_sid')?.value;
  if (sessionId) {
    await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]).catch(() => {});
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set('atlas_sid', '', { expires: new Date(0), path: '/' });
  return response;
}
