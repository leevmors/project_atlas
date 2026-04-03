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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  try {
    const { id } = await context.params;
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { answer } = await req.json();

    if (!answer || typeof answer !== 'string') {
      return NextResponse.json({ error: 'Answer is required' }, { status: 400 });
    }

    // Admin dry-run: check answer without persisting anything
    if (session.user_type === 'admin') {
      const adminGameRes = await pool.query<{ answer: string }>(
        `SELECT answer FROM games WHERE id = $1`,
        [id]
      );
      if (adminGameRes.rows.length === 0) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
      }
      const isCorrect = answer.trim().toUpperCase() === adminGameRes.rows[0].answer;
      return NextResponse.json({
        correct: isCorrect,
        attemptsRemaining: 99,
        isLockedOut: false,
        gameCompleted: false,
      });
    }

    await client.query('BEGIN');

    // Lock the game row to prevent race conditions
    const gameRes = await client.query<{ id: number; status: string; answer: string; bonus_points: number }>(
      `SELECT id, status, answer, bonus_points FROM games WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (gameRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const game = gameRes.rows[0];

    if (game.status !== 'live') {
      await client.query('ROLLBACK');
      return NextResponse.json({
        correct: false,
        attemptsRemaining: 0,
        isLockedOut: true,
        gameCompleted: true,
      });
    }

    // Get or create attempt
    await client.query(
      `INSERT INTO game_attempts (game_id, team_id) VALUES ($1, $2) ON CONFLICT (game_id, team_id) DO NOTHING`,
      [id, session.user_id]
    );

    const attemptRes = await client.query<{
      final_answer_attempts: number;
      is_locked_out: boolean;
    }>(
      `SELECT final_answer_attempts, is_locked_out FROM game_attempts WHERE game_id = $1 AND team_id = $2 FOR UPDATE`,
      [id, session.user_id]
    );

    const attempt = attemptRes.rows[0];

    if (attempt.is_locked_out) {
      await client.query('ROLLBACK');
      return NextResponse.json({
        correct: false,
        attemptsRemaining: 0,
        isLockedOut: true,
        gameCompleted: false,
      });
    }

    const isCorrect = answer.trim().toUpperCase() === game.answer;

    if (isCorrect) {
      // Award bonus and mark game completed
      await client.query(
        `UPDATE game_attempts SET bonus_awarded = $1, completed_at = NOW() WHERE game_id = $2 AND team_id = $3`,
        [game.bonus_points, id, session.user_id]
      );
      await client.query(
        `UPDATE games SET status = 'completed', winner_team_id = $1, completed_at = NOW() WHERE id = $2`,
        [session.user_id, id]
      );
      await client.query('COMMIT');

      return NextResponse.json({
        correct: true,
        attemptsRemaining: 3 - attempt.final_answer_attempts - 1,
        isLockedOut: false,
        gameCompleted: true,
      });
    }

    // Wrong answer
    const newAttempts = attempt.final_answer_attempts + 1;
    const isLockedOut = newAttempts >= 3;

    await client.query(
      `UPDATE game_attempts SET final_answer_attempts = $1, is_locked_out = $2 WHERE game_id = $3 AND team_id = $4`,
      [newAttempts, isLockedOut, id, session.user_id]
    );
    await client.query('COMMIT');

    return NextResponse.json({
      correct: false,
      attemptsRemaining: Math.max(0, 3 - newAttempts),
      isLockedOut,
      gameCompleted: false,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/games/[id]/answer error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
