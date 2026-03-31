import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get('atlas_sid')?.value;
  if (!sessionId) {
    return NextResponse.json({ session: null });
  }

  try {
    const result = await pool.query(
      `SELECT user_type, user_id, user_name
       FROM sessions
       WHERE id = $1 AND expires_at > NOW()`,
      [sessionId]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ session: null });
    }
    const row = result.rows[0];
    return NextResponse.json({
      session: { type: row.user_type, id: row.user_id, name: row.user_name },
    });
  } catch (err) {
    console.error('Session lookup error:', err);
    return NextResponse.json({ session: null });
  }
}
