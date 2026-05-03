import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface SessionRow {
  user_type: string;
  user_id: string;
}

async function getSession(req: NextRequest): Promise<SessionRow | null> {
  const sessionId = req.cookies.get('atlas_sid')?.value;
  if (!sessionId) return null;
  const res = await pool.query<SessionRow>(
    `SELECT user_type, user_id FROM sessions WHERE id = $1 AND expires_at > NOW()`,
    [sessionId]
  );
  return res.rows[0] ?? null;
}

const noCache = { 'Cache-Control': 'no-store' };

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized — log in to play.' },
        { status: 401, headers: noCache }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500, headers: noCache }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400, headers: noCache }
      );
    }

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('Gemini API error:', upstream.status, data);
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 502, headers: noCache }
      );
    }

    return NextResponse.json(data, { headers: noCache });
  } catch (err) {
    console.error('POST /api/games/final-game/chat error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: noCache }
    );
  }
}
