import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import type { PoolClient } from 'pg';

// May 10, 2026 18:00 GMT+5 = May 10, 2026 13:00 UTC
const DEADLINE_MS = new Date('2026-05-10T13:00:00Z').getTime();

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

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function parseClientRunId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length < 8 || trimmed.length > 80) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

// POST a completed run.
// Body: { score, kills, time_survived, level_reached, gold_earned, client_run_id }.
// Only registered team accounts count toward the leaderboard.
export async function POST(req: NextRequest) {
  let client: PoolClient | null = null;
  let didBegin = false;

  try {
    const session = await getSession(req);
    if (!session || session.user_type !== 'team') {
      return NextResponse.json(
        { error: 'Only registered teams can submit scores.' },
        { status: 401, headers: noCache }
      );
    }

    if (Date.now() > DEADLINE_MS) {
      return NextResponse.json(
        { error: 'The Campus Survivor leaderboard has closed.', closed: true },
        { status: 410, headers: noCache }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid body' },
        { status: 400, headers: noCache }
      );
    }

    const clientRunId = parseClientRunId(body.client_run_id);
    if (!clientRunId) {
      return NextResponse.json(
        { error: 'client_run_id is required' },
        { status: 400, headers: noCache }
      );
    }

    const score = clampInt(body.score, 0, 99_999_999, 0);
    const kills = clampInt(body.kills, 0, 999_999, 0);
    const timeSurvived = clampInt(body.time_survived, 0, 86_400, 0);
    const levelReached = clampInt(body.level_reached, 1, 999, 1);
    const goldEarned = clampInt(body.gold_earned, 0, 9_999_999, 0);

    client = await pool.connect();
    await client.query('BEGIN');
    didBegin = true;

    const runRes = await client.query<{ id: number }>(
      `INSERT INTO campus_survivor_scores
         (team_id, score, kills, time_survived, level_reached, gold_earned, client_run_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (team_id, client_run_id) DO NOTHING
       RETURNING id`,
      [session.user_id, score, kills, timeSurvived, levelReached, goldEarned, clientRunId]
    );

    const duplicate = (runRes.rowCount ?? 0) === 0;
    let shopGold = 0;

    if (duplicate) {
      const shopRes = await client.query<{ gold: number }>(
        `SELECT gold FROM campus_survivor_shop WHERE team_id = $1`,
        [session.user_id]
      );
      shopGold = Number(shopRes.rows[0]?.gold ?? 0);
    } else {
      const shopRes = await client.query<{ gold: number }>(
        `INSERT INTO campus_survivor_shop (team_id, gold, stats, updated_at)
         VALUES ($1, $2, '{}', NOW())
         ON CONFLICT (team_id) DO UPDATE
           SET gold = LEAST(9999999, campus_survivor_shop.gold + EXCLUDED.gold),
               updated_at = NOW()
         RETURNING gold`,
        [session.user_id, goldEarned]
      );
      shopGold = Number(shopRes.rows[0]?.gold ?? 0);
    }

    await client.query('COMMIT');
    didBegin = false;

    return NextResponse.json(
      { ok: true, shop_gold: shopGold, ...(duplicate ? { duplicate: true } : {}) },
      { headers: noCache }
    );
  } catch (err) {
    if (client && didBegin) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Keep the original error for logging below.
      }
    }
    console.error('POST /api/games/campus-survivor/score error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: noCache }
    );
  } finally {
    client?.release();
  }
}
