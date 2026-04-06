import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { GAME_LEVEL_CONFIG } from '@/lib/game-answers';

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

type LetterStatus = 'correct' | 'present' | 'absent';

function computeLetterStatuses(guess: string, target: string): Array<{ letter: string; status: LetterStatus }> {
  const result: Array<{ letter: string; status: LetterStatus }> = [];
  const targetChars = target.split('');
  const remaining = [...targetChars];

  // First pass: mark correct positions
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === target[i]) {
      result.push({ letter: guess[i], status: 'correct' });
      remaining[i] = '';
    } else {
      result.push({ letter: guess[i], status: 'absent' });
    }
  }

  // Second pass: mark present letters (not already matched)
  for (let i = 0; i < guess.length; i++) {
    if (result[i].status === 'correct') continue;
    const idx = remaining.indexOf(guess[i]);
    if (idx !== -1) {
      result[i] = { letter: guess[i], status: 'present' };
      remaining[idx] = '';
    }
  }

  return result;
}

const noCache = { 'Cache-Control': 'no-store' };

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noCache });
    }

    const { guess } = await req.json();

    if (!guess || typeof guess !== 'string' || guess.length !== 5) {
      return NextResponse.json({ error: 'Guess must be exactly 5 letters' }, { status: 400, headers: noCache });
    }

    const upperGuess = guess.toUpperCase();

    // Load game info
    const gameRes = await pool.query<{ name: string; status: string }>(
      `SELECT name, status FROM games WHERE id = $1`,
      [id]
    );
    if (gameRes.rows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404, headers: noCache });
    }

    const game = gameRes.rows[0];
    const gameConfig = GAME_LEVEL_CONFIG[game.name];
    if (!gameConfig) {
      return NextResponse.json({ error: 'Game config not found' }, { status: 500, headers: noCache });
    }

    // Find the wordle level
    let wordleLevel: number | null = null;
    let targetWord = '';
    for (const [lvl, conf] of Object.entries(gameConfig)) {
      if (conf.type === 'wordle' && conf.answer) {
        wordleLevel = Number(lvl);
        targetWord = conf.answer.toUpperCase();
        break;
      }
    }

    if (wordleLevel === null) {
      return NextResponse.json({ error: 'No wordle level in this game' }, { status: 400, headers: noCache });
    }

    const letters = computeLetterStatuses(upperGuess, targetWord);
    const isCorrect = upperGuess === targetWord;

    // Admin dry-run
    if (session.user_type === 'admin') {
      return NextResponse.json({
        correct: isCorrect,
        letters,
        guessNumber: 0,
        lockedUntil: undefined,
      }, { headers: noCache });
    }

    // Team flow
    await pool.query(
      `INSERT INTO game_attempts (game_id, team_id) VALUES ($1, $2) ON CONFLICT (game_id, team_id) DO NOTHING`,
      [id, session.user_id]
    );

    const attemptRes = await pool.query<{
      current_level: number;
      level_sub_round: number;
      wordle_locked_until: string | null;
    }>(
      `SELECT current_level, level_sub_round, wordle_locked_until FROM game_attempts WHERE game_id = $1 AND team_id = $2`,
      [id, session.user_id]
    );

    const attempt = attemptRes.rows[0];

    if (attempt.current_level !== wordleLevel) {
      return NextResponse.json({ error: 'You are not on the wordle level' }, { status: 400, headers: noCache });
    }

    // Check lockout
    if (attempt.wordle_locked_until) {
      const lockTime = new Date(attempt.wordle_locked_until).getTime();
      if (Date.now() < lockTime) {
        return NextResponse.json({
          correct: false,
          letters: [],
          guessNumber: attempt.level_sub_round,
          lockedUntil: attempt.wordle_locked_until,
        }, { headers: noCache });
      }
    }

    // Track guess count via level_sub_round
    const newGuessCount = attempt.level_sub_round + 1;

    if (isCorrect) {
      // Advance to next level (final answer level)
      await pool.query(
        `UPDATE game_attempts SET current_level = GREATEST(current_level, $1), level_sub_round = 0, wordle_locked_until = NULL WHERE game_id = $2 AND team_id = $3`,
        [wordleLevel + 1, id, session.user_id]
      );
      return NextResponse.json({
        correct: true,
        letters,
        guessNumber: newGuessCount,
      }, { headers: noCache });
    }

    // Wrong guess
    if (newGuessCount >= 6) {
      // Lock for 30 minutes
      const lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      await pool.query(
        `UPDATE game_attempts SET level_sub_round = 0, wordle_locked_until = $1 WHERE game_id = $2 AND team_id = $3`,
        [lockedUntil, id, session.user_id]
      );
      return NextResponse.json({
        correct: false,
        letters,
        guessNumber: newGuessCount,
        lockedUntil,
      }, { headers: noCache });
    }

    // Update guess count
    await pool.query(
      `UPDATE game_attempts SET level_sub_round = $1 WHERE game_id = $2 AND team_id = $3`,
      [newGuessCount, id, session.user_id]
    );

    return NextResponse.json({
      correct: false,
      letters,
      guessNumber: newGuessCount,
    }, { headers: noCache });
  } catch (err) {
    console.error('POST /api/games/[id]/wordle-guess error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
