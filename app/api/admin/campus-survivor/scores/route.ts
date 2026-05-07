import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { pool } from '@/lib/db';

const noCache = { 'Cache-Control': 'no-store' };

interface AdminSessionRow {
  user_type: string;
  user_id: string;
  user_name: string;
}

interface TeamRow {
  id: string;
  company_name: string;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function parseTimeSurvived(value: unknown): number {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{1,4}):([0-5]\d)$/);
    if (match) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      return Math.min(86_400, (minutes * 60) + seconds);
    }
  }
  return clampInt(value, 0, 86_400, 0);
}

async function getAdminSession(req: NextRequest): Promise<AdminSessionRow | null> {
  const sessionId = req.cookies.get('atlas_sid')?.value;
  if (!sessionId) return null;

  const res = await pool.query<AdminSessionRow>(
    `SELECT user_type, user_id, user_name
     FROM sessions
     WHERE id = $1 AND expires_at > NOW()`,
    [sessionId]
  );

  const session = res.rows[0];
  if (!session || session.user_type !== 'admin') return null;
  return session;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'admin_required' },
        { status: 403, headers: noCache }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid body', code: 'invalid_body' },
        { status: 400, headers: noCache }
      );
    }

    const teamId = typeof body.teamId === 'string'
      ? body.teamId.trim()
      : typeof body.team_id === 'string'
        ? body.team_id.trim()
        : '';
    const adminNote = typeof body.adminNote === 'string'
      ? body.adminNote.trim()
      : typeof body.admin_note === 'string'
        ? body.admin_note.trim()
        : '';

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId is required', code: 'missing_team_id' },
        { status: 400, headers: noCache }
      );
    }
    if (adminNote.length < 3) {
      return NextResponse.json(
        { error: 'Evidence / note is required', code: 'missing_admin_note' },
        { status: 400, headers: noCache }
      );
    }

    const score = clampInt(body.score, 0, 99_999_999, 0);
    const kills = clampInt(body.kills, 0, 999_999, 0);
    const timeSurvived = parseTimeSurvived(body.timeSurvived ?? body.time_survived);
    const levelReached = clampInt(body.levelReached ?? body.level_reached, 1, 999, 1);
    const goldEarned = clampInt(body.goldEarned ?? body.gold_earned, 0, 9_999_999, 0);

    if (score <= 0) {
      return NextResponse.json(
        { error: 'score must be greater than 0', code: 'invalid_score' },
        { status: 400, headers: noCache }
      );
    }

    const teamRes = await pool.query<TeamRow>(
      `SELECT id, company_name FROM teams WHERE id = $1`,
      [teamId]
    );
    const team = teamRes.rows[0];
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', code: 'team_not_found' },
        { status: 404, headers: noCache }
      );
    }

    const clientRunId = `admin_${Date.now().toString(36)}_${randomUUID()}`;
    const db = await pool.connect();

    try {
      await db.query('BEGIN');
      const scoreRes = await db.query(
        `INSERT INTO campus_survivor_scores
           (team_id, score, kills, time_survived, level_reached, gold_earned,
            client_run_id, source, admin_note, admin_user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'admin', $8, $9)
         RETURNING id, team_id, score, kills, time_survived, level_reached,
                   gold_earned, client_run_id, source, admin_note, admin_user_id,
                   submitted_at`,
        [
          team.id,
          score,
          kills,
          timeSurvived,
          levelReached,
          goldEarned,
          clientRunId,
          adminNote,
          admin.user_id,
        ]
      );

      let shopGold: number | null = null;
      if (goldEarned > 0) {
        const shopRes = await db.query<{ gold: number }>(
          `INSERT INTO campus_survivor_shop (team_id, gold, stats, updated_at)
           VALUES ($1, $2, '{}', NOW())
           ON CONFLICT (team_id) DO UPDATE
             SET gold = LEAST(9999999, campus_survivor_shop.gold + EXCLUDED.gold),
                 updated_at = NOW()
           RETURNING gold`,
          [team.id, goldEarned]
        );
        shopGold = Number(shopRes.rows[0]?.gold ?? 0);
      }

      await db.query('COMMIT');

      const row = scoreRes.rows[0];
      return NextResponse.json(
        {
          ok: true,
          score: {
            id: String(row.id),
            teamId: String(row.team_id),
            teamName: team.company_name,
            score: row.score,
            kills: row.kills,
            timeSurvived: row.time_survived,
            levelReached: row.level_reached,
            goldEarned: row.gold_earned,
            clientRunId: row.client_run_id,
            source: row.source,
            adminNote: row.admin_note,
            adminUserId: row.admin_user_id,
            submittedAt: row.submitted_at,
          },
          ...(shopGold !== null ? { shop_gold: shopGold } : {}),
        },
        { headers: noCache }
      );
    } catch (err) {
      try { await db.query('ROLLBACK'); } catch { /* ignore */ }
      throw err;
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('POST /api/admin/campus-survivor/scores error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'internal_error' },
      { status: 500, headers: noCache }
    );
  }
}
