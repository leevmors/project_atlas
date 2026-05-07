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

function getPgErrorCode(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code?: unknown }).code;
    return typeof code === 'string' ? code : '';
  }
  return '';
}

function isMissingCampusScoreRunColumns(err: unknown): boolean {
  const code = getPgErrorCode(err);
  if (code === '42703' || code === '42P10') return true;
  if (typeof err !== 'object' || err === null || !('message' in err)) return false;
  const message = String((err as { message?: unknown }).message ?? '').toLowerCase();
  return message.includes('gold_earned') || message.includes('client_run_id');
}

async function getShopGold(client: PoolClient, teamId: string): Promise<number> {
  const res = await client.query<{ gold: number }>(
    `SELECT gold FROM campus_survivor_shop WHERE team_id = $1`,
    [teamId]
  );
  return Number(res.rows[0]?.gold ?? 0);
}

async function creditShopGold(client: PoolClient, teamId: string, goldEarned: number): Promise<number> {
  const res = await client.query<{ gold: number }>(
    `INSERT INTO campus_survivor_shop (team_id, gold, stats, updated_at)
     VALUES ($1, $2, '{}', NOW())
     ON CONFLICT (team_id) DO UPDATE
       SET gold = LEAST(9999999, campus_survivor_shop.gold + EXCLUDED.gold),
           updated_at = NOW()
     RETURNING gold`,
    [teamId, goldEarned]
  );
  return Number(res.rows[0]?.gold ?? 0);
}

async function insertMigratedRun(
  client: PoolClient,
  values: {
    teamId: string;
    score: number;
    kills: number;
    timeSurvived: number;
    levelReached: number;
    goldEarned: number;
    clientRunId: string;
  }
): Promise<boolean> {
  const res = await client.query<{ id: number }>(
    `INSERT INTO campus_survivor_scores
       (team_id, score, kills, time_survived, level_reached, gold_earned, client_run_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (team_id, client_run_id) DO NOTHING
     RETURNING id`,
    [
      values.teamId,
      values.score,
      values.kills,
      values.timeSurvived,
      values.levelReached,
      values.goldEarned,
      values.clientRunId,
    ]
  );
  return (res.rowCount ?? 0) === 0;
}

async function insertLegacyRun(
  client: PoolClient,
  values: {
    teamId: string;
    score: number;
    kills: number;
    timeSurvived: number;
    levelReached: number;
  }
): Promise<void> {
  await client.query(
    `INSERT INTO campus_survivor_scores (team_id, score, kills, time_survived, level_reached)
     VALUES ($1, $2, $3, $4, $5)`,
    [values.teamId, values.score, values.kills, values.timeSurvived, values.levelReached]
  );
}

// POST a completed run.
// Body: { score, kills, time_survived, level_reached, gold_earned, client_run_id }.
// Only registered team accounts count toward the leaderboard.
//
// Two-phase design: score insert is its own transaction (critical path).
// Shop gold credit is a separate best-effort operation so a missing or broken
// campus_survivor_shop table cannot prevent a score from being recorded.
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.user_type !== 'team') {
      return NextResponse.json(
        { error: 'Only registered teams can submit scores.', code: 'not_team_session' },
        { status: 401, headers: noCache }
      );
    }

    if (Date.now() > DEADLINE_MS) {
      return NextResponse.json(
        { error: 'The Campus Survivor leaderboard has closed.', code: 'leaderboard_closed', closed: true },
        { status: 410, headers: noCache }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid body', code: 'invalid_body' },
        { status: 400, headers: noCache }
      );
    }

    const clientRunId = parseClientRunId(body.client_run_id);
    if (!clientRunId) {
      return NextResponse.json(
        { error: 'client_run_id is required', code: 'invalid_body' },
        { status: 400, headers: noCache }
      );
    }

    const score = clampInt(body.score, 0, 99_999_999, 0);
    const kills = clampInt(body.kills, 0, 999_999, 0);
    const timeSurvived = clampInt(body.time_survived, 0, 86_400, 0);
    const levelReached = clampInt(body.level_reached, 1, 999, 1);
    const goldEarned = clampInt(body.gold_earned, 0, 9_999_999, 0);

    // --- Phase 1: Save the score (critical — own transaction) ---
    let duplicate = false;
    let usedFallback = false;

    {
      const scoreClient = await pool.connect();
      let didBegin = false;
      try {
        await scoreClient.query('BEGIN');
        didBegin = true;

        try {
          duplicate = await insertMigratedRun(scoreClient, {
            teamId: session.user_id,
            score,
            kills,
            timeSurvived,
            levelReached,
            goldEarned,
            clientRunId,
          });
        } catch (err) {
          if (!isMissingCampusScoreRunColumns(err)) throw err;

          await scoreClient.query('ROLLBACK');
          didBegin = false;
          await scoreClient.query('BEGIN');
          didBegin = true;

          await insertLegacyRun(scoreClient, {
            teamId: session.user_id,
            score,
            kills,
            timeSurvived,
            levelReached,
          });
          usedFallback = true;
        }

        await scoreClient.query('COMMIT');
        didBegin = false;
      } catch (err) {
        if (didBegin) {
          try { await scoreClient.query('ROLLBACK'); } catch { /* ignore */ }
        }
        console.error('POST /api/games/campus-survivor/score — score insert failed:', err);
        return NextResponse.json(
          { error: 'Internal server error', code: 'score_save_failed' },
          { status: 500, headers: noCache }
        );
      } finally {
        scoreClient.release();
      }
    }

    // --- Phase 2: Credit shop gold (best-effort — separate connection) ---
    let previousShopGold = 0;
    let shopGold = 0;

    try {
      const goldClient = await pool.connect();
      try {
        previousShopGold = await getShopGold(goldClient, session.user_id);
        shopGold = duplicate
          ? previousShopGold
          : await creditShopGold(goldClient, session.user_id, goldEarned);
      } finally {
        goldClient.release();
      }
    } catch (goldErr) {
      // Score is already committed — don't fail the request over gold.
      console.error('POST /api/games/campus-survivor/score — shop gold update failed (non-fatal, score was saved):', goldErr);
    }

    return NextResponse.json(
      {
        ok: true,
        score_saved: !duplicate,
        coins_saved: !duplicate,
        gold_earned: duplicate ? 0 : goldEarned,
        previous_shop_gold: previousShopGold,
        shop_gold: shopGold,
        ...(duplicate ? { duplicate: true } : {}),
        ...(usedFallback ? { migration_fallback: true } : {}),
      },
      { headers: noCache }
    );
  } catch (err) {
    console.error('POST /api/games/campus-survivor/score error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'internal_error' },
      { status: 500, headers: noCache }
    );
  }
}
