import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface SessionRow {
  user_type: string;
  user_id: string;
}

async function getSession(req: NextRequest): Promise<SessionRow | null> {
  const sessionId = req.cookies.get('atlas_sid')?.value;
  if (!sessionId) return null;
  try {
    const res = await pool.query<SessionRow>(
      `SELECT user_type, user_id FROM sessions WHERE id = $1 AND expires_at > NOW()`,
      [sessionId]
    );
    return res.rows[0] ?? null;
  } catch {
    return null;
  }
}

const noCache = { 'Cache-Control': 'no-store' };

const VALID_STAT_KEYS = new Set([
  'maxHp', 'speed', 'damage', 'armor', 'pickup',
  'cooldown', 'area', 'luck', 'coin', 'xp',
  'reroll', 'revive', 'freshmanKit',
]);

// GET — return this team's saved gold + shop stats.
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || session.user_type !== 'team') {
    return NextResponse.json({ gold: 0, stats: {} }, { headers: noCache });
  }

  try {
    const res = await pool.query(
      `SELECT gold, stats FROM campus_survivor_shop WHERE team_id = $1`,
      [session.user_id]
    );
    const row = res.rows[0];
    return NextResponse.json(
      { gold: row?.gold ?? 0, stats: row?.stats ?? {} },
      { headers: noCache }
    );
  } catch {
    return NextResponse.json({ gold: 0, stats: {} }, { headers: noCache });
  }
}

// POST — upsert this team's gold + shop stats.
// Body: { gold: number, stats: Record<string, number> }
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || session.user_type !== 'team') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noCache });
  }

  let body: { gold?: unknown; stats?: unknown } | null = null;
  try { body = await req.json(); } catch { /* invalid json */ }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400, headers: noCache });
  }

  const gold = Math.max(0, Math.min(9_999_999, Math.floor(Number(body.gold) || 0)));

  // Sanitise stats: only known keys, integer values 0-99.
  const rawStats = (typeof body.stats === 'object' && body.stats !== null)
    ? body.stats as Record<string, unknown>
    : {};
  const stats: Record<string, number> = {};
  for (const key of VALID_STAT_KEYS) {
    const v = rawStats[key];
    if (typeof v === 'number' && Number.isFinite(v)) {
      stats[key] = Math.max(0, Math.min(99, Math.floor(v)));
    }
  }

  try {
    await pool.query(
      `INSERT INTO campus_survivor_shop (team_id, gold, stats, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (team_id) DO UPDATE
         SET gold = EXCLUDED.gold,
             stats = EXCLUDED.stats,
             updated_at = NOW()`,
      [session.user_id, gold, JSON.stringify(stats)]
    );
    return NextResponse.json({ ok: true }, { headers: noCache });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: noCache });
  }
}
