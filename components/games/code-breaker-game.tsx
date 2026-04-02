'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getGameProgress,
  saveGameProgress,
  submitGameAnswer,
} from '@/lib/store';
import type { Game, GameProgress } from '@/lib/types';
import { Trophy, Lock, AlertTriangle, Binary, Puzzle, Keyboard } from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const SIMON_COLORS = [
  '#ef4444', '#3b82f6', '#22c55e', '#eab308',
  '#a855f7', '#f97316', '#06b6d4', '#ec4899', '#6366f1',
];

const EMOJI_ROUNDS = [
  { emoji: '👑', answer: 'CROWN' },
  { emoji: '🌰  ➡️  🌱🌱🌱', answer: 'SEEDS' },
  { emoji: '👑  +  🌱🌱🌱', answer: 'CROWN OF SEEDS' },
];

const BINARY_ROWS = [
  '01001010', // J
  '01011000', // X
  '01000101', // E
  '01011010', // Z
  '01010111', // W
  '01010001', // Q
  '01000101', // E
  '01001011', // K
  '01001100', // L
  '01010110', // V
  '01001101', // M
  '01001010', // J
  '01000101', // E
  '01010111', // W
  '01000101', // E
  '01001100', // L
  '01011001', // Y
  '01001000', // H
  '01010010', // R
  '01000110', // F
];

const CLUE_FRAGMENTS = ['PERSEPHONE', 'SEEDS', 'RUBY', 'JEWEL'];

// ─── Sliding Puzzle Helpers ──────────────────────────────────────────────────

function createSolvablePuzzle(): number[] {
  const solved = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
  const tiles = [...solved];
  let blankIdx = 15;
  // Perform 200 random valid moves to scramble
  for (let i = 0; i < 200; i++) {
    const row = Math.floor(blankIdx / 4);
    const col = blankIdx % 4;
    const neighbors: number[] = [];
    if (row > 0) neighbors.push(blankIdx - 4);
    if (row < 3) neighbors.push(blankIdx + 4);
    if (col > 0) neighbors.push(blankIdx - 1);
    if (col < 3) neighbors.push(blankIdx + 1);
    const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
    tiles[blankIdx] = tiles[pick];
    tiles[pick] = 0;
    blankIdx = pick;
  }
  return tiles;
}

function isSolved(tiles: number[]): boolean {
  for (let i = 0; i < 15; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[15] === 0;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface CodeBreakerGameProps {
  gameId: string;
  isAdmin: boolean;
}

export function CodeBreakerGame({ gameId, isAdmin }: CodeBreakerGameProps) {
  // Global state
  const [game, setGame] = useState<Game | null>(null);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState(1);

  // Level 1 — Sequence Recall
  const [simonSequence, setSimonSequence] = useState<number[]>([]);
  const [simonInput, setSimonInput] = useState<number[]>([]);
  const [simonRound, setSimonRound] = useState(1);
  const [simonPlaying, setSimonPlaying] = useState(false);
  const [simonActiveBtn, setSimonActiveBtn] = useState<number | null>(null);
  const [simonPressedBtn, setSimonPressedBtn] = useState<number | null>(null);
  const [simonCooldown, setSimonCooldown] = useState(0);
  const [simonStatus, setSimonStatus] = useState<'idle' | 'playing' | 'input' | 'won'>('idle');

  // Level 2 — Emoji Cipher
  const [emojiRound, setEmojiRound] = useState(0);
  const [emojiInput, setEmojiInput] = useState('');
  const [emojiCooldown, setEmojiCooldown] = useState(0);
  const [emojiStatus, setEmojiStatus] = useState<'playing' | 'won'>('playing');

  // Level 3 — Sliding Puzzle
  const [tiles, setTiles] = useState<number[]>([]);
  const [moveCount, setMoveCount] = useState(0);
  const [slideCooldown, setSlideCooldown] = useState(0);
  const [slidePhase, setSlidePhase] = useState<'puzzle' | 'answer' | 'won'>('puzzle');
  const [slideInput, setSlideInput] = useState('');
  const [slideAnswerCooldown, setSlideAnswerCooldown] = useState(0);

  // Level 4 — Binary Decoder
  const [binaryInput, setBinaryInput] = useState('');
  const [binaryCooldown, setBinaryCooldown] = useState(0);
  const [binaryStatus, setBinaryStatus] = useState<'playing' | 'won'>('playing');

  // Level 5 — The Vault
  const [finalInput, setFinalInput] = useState('');
  const [finalError, setFinalError] = useState('');
  const [finalAttemptsLeft, setFinalAttemptsLeft] = useState(3);
  const [isLockedOut, setIsLockedOut] = useState(false);


  // ─── Initialization ──────────────────────────────────────────────────────

  const loadProgress = useCallback(async () => {
    try {
      const data = await getGameProgress(gameId);
      setGame(data.game);
      setProgress(data.progress);
      if (data.progress) {
        setLevel(data.progress.currentLevel);
        setFinalAttemptsLeft(3 - data.progress.finalAnswerAttempts);
        setIsLockedOut(data.progress.isLockedOut);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Poll for game status changes
  useEffect(() => {
    if (game?.status === 'completed') return;
    const interval = setInterval(async () => {
      try {
        const data = await getGameProgress(gameId);
        setGame(data.game);
        if (data.progress) {
          setFinalAttemptsLeft(3 - data.progress.finalAnswerAttempts);
          setIsLockedOut(data.progress.isLockedOut);
        }
      } catch {
        // ignore
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [gameId, game?.status]);

  // ─── Cooldown timers ─────────────────────────────────────────────────────

  useEffect(() => {
    if (simonCooldown <= 0) return;
    const t = setInterval(() => setSimonCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [simonCooldown]);

  useEffect(() => {
    if (emojiCooldown <= 0) return;
    const t = setInterval(() => setEmojiCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [emojiCooldown]);

  useEffect(() => {
    if (slideCooldown <= 0) return;
    const t = setInterval(() => setSlideCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [slideCooldown]);

  useEffect(() => {
    if (slideAnswerCooldown <= 0) return;
    const t = setInterval(() => setSlideAnswerCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [slideAnswerCooldown]);

  useEffect(() => {
    if (binaryCooldown <= 0) return;
    const t = setInterval(() => setBinaryCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [binaryCooldown]);

  // ─── Level 1: Sequence Recall (Simon Says) ───────────────────────────────

  const generateSequence = useCallback((length: number) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 9));
  }, []);

  const playSequence = useCallback(async (seq: number[]) => {
    setSimonPlaying(true);
    setSimonStatus('playing');
    for (let i = 0; i < seq.length; i++) {
      await new Promise((r) => setTimeout(r, 300));
      setSimonActiveBtn(seq[i]);
      await new Promise((r) => setTimeout(r, 800));
      setSimonActiveBtn(null);
    }
    await new Promise((r) => setTimeout(r, 200));
    setSimonPlaying(false);
    setSimonStatus('input');
  }, []);

  const startSimonRound = useCallback(() => {
    const length = simonRound + 3; // round 1 = 4, round 2 = 5, round 3 = 6
    const seq = generateSequence(length);
    setSimonSequence(seq);
    setSimonInput([]);
    playSequence(seq);
  }, [simonRound, generateSequence, playSequence]);

  useEffect(() => {
    if (level === 1 && simonStatus === 'idle' && simonCooldown === 0) {
      const timer = setTimeout(() => startSimonRound(), 600);
      return () => clearTimeout(timer);
    }
  }, [level, simonCooldown, simonStatus, simonRound, startSimonRound]);

  const handleSimonPress = (btnIdx: number) => {
    if (simonPlaying || simonCooldown > 0 || simonStatus !== 'input') return;

    // Visual press feedback
    setSimonPressedBtn(btnIdx);
    setTimeout(() => setSimonPressedBtn(null), 250);

    const nextInput = [...simonInput, btnIdx];
    setSimonInput(nextInput);

    const stepIdx = nextInput.length - 1;
    if (nextInput[stepIdx] !== simonSequence[stepIdx]) {
      // Wrong — reset round with cooldown
      setSimonCooldown(15);
      setSimonInput([]);
      setSimonStatus('idle');
      return;
    }

    if (nextInput.length === simonSequence.length) {
      // Round complete
      if (simonRound >= 3) {
        setSimonStatus('won');
        saveGameProgress(gameId, 2).catch(() => {});
      } else {
        setSimonRound((r) => r + 1);
        setSimonInput([]);
        setSimonStatus('idle');
      }
    }
  };

  // ─── Level 2: Emoji Cipher ────────────────────────────────────────────────

  const handleEmojiSubmit = () => {
    if (emojiCooldown > 0) return;
    const answer = emojiInput.trim().toUpperCase();
    if (answer === EMOJI_ROUNDS[emojiRound].answer) {
      if (emojiRound >= 2) {
        setEmojiStatus('won');
        saveGameProgress(gameId, 3).catch(() => {});
      } else {
        setEmojiRound((r) => r + 1);
        setEmojiInput('');
      }
    } else {
      setEmojiCooldown(300); // 5 minutes
      setEmojiInput('');
    }
  };

  // ─── Level 3: Sliding Puzzle ──────────────────────────────────────────────

  useEffect(() => {
    if (level === 3 && tiles.length === 0) {
      setTiles(createSolvablePuzzle());
      setMoveCount(0);
      setSlidePhase('puzzle');
    }
  }, [level, tiles.length]);

  const handleTileClick = (idx: number) => {
    if (slideCooldown > 0 || slidePhase !== 'puzzle') return;
    const blankIdx = tiles.indexOf(0);
    const row = Math.floor(idx / 4);
    const col = idx % 4;
    const blankRow = Math.floor(blankIdx / 4);
    const blankCol = blankIdx % 4;
    const isAdjacent =
      (Math.abs(row - blankRow) === 1 && col === blankCol) ||
      (Math.abs(col - blankCol) === 1 && row === blankRow);

    if (!isAdjacent) return;

    const newTiles = [...tiles];
    newTiles[blankIdx] = newTiles[idx];
    newTiles[idx] = 0;
    setTiles(newTiles);

    const newMoves = moveCount + 1;
    setMoveCount(newMoves);

    // Every 30 moves, add cooldown
    if (newMoves % 30 === 0) {
      setSlideCooldown(10);
    }

    if (isSolved(newTiles)) {
      setSlidePhase('answer');
    }
  };

  const handleSlideAnswer = () => {
    if (slideAnswerCooldown > 0) return;
    if (slideInput.trim().toUpperCase() === 'RUBY') {
      setSlidePhase('won');
      saveGameProgress(gameId, 4).catch(() => {});
    } else {
      setSlideAnswerCooldown(300); // 5 minutes
      setSlideInput('');
    }
  };

  // ─── Level 4: Binary Decoder ──────────────────────────────────────────────

  const handleBinarySubmit = () => {
    if (binaryCooldown > 0) return;
    if (binaryInput.trim().toUpperCase() === 'JEWEL') {
      setBinaryStatus('won');
      saveGameProgress(gameId, 5).catch(() => {});
    } else {
      setBinaryCooldown(300); // 5 minutes
      setBinaryInput('');
    }
  };

  // ─── Level 5: The Vault ───────────────────────────────────────────────────

  const handleFinalSubmit = async () => {
    if (isLockedOut || finalAttemptsLeft <= 0) return;
    setFinalError('');
    try {
      const res = await submitGameAnswer(gameId, finalInput.trim());
      if (res.correct) {
        setLevel(6); // Won
        setGame((g) => (g ? { ...g, status: 'completed' } : g));
      } else {
        setFinalAttemptsLeft(res.attemptsRemaining);
        setIsLockedOut(res.isLockedOut);
        setFinalError(
          res.isLockedOut
            ? 'Locked out — no more attempts.'
            : `Wrong answer. ${res.attemptsRemaining} attempt${res.attemptsRemaining !== 1 ? 's' : ''} remaining.`
        );
        setFinalInput('');
      }
    } catch {
      setFinalError('An error occurred. Try again.');
    }
  };

  // ─── Cooldown formatter ───────────────────────────────────────────────────

  const formatCooldown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Admin skip ───────────────────────────────────────────────────────────

  const adminSkip = () => {
    if (!isAdmin) return;
    if (level < 5) advanceLevel(level + 1);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-slate-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  // Game already completed by another team
  if (game?.status === 'completed' && (progress?.bonusAwarded ?? 0) === 0) {
    return (
      <div className="text-center py-8">
        <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">This game has been solved!</p>
        <p className="text-slate-400 text-sm mt-1">
          Won by {game.winnerTeamName ?? 'another team'}
        </p>
      </div>
    );
  }

  // Team won this game
  if (level >= 6 || (progress?.bonusAwarded ?? 0) > 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-800 mb-1">Code Cracked!</h3>
        <p className="text-slate-500">
          Your team earned <strong className="text-amber-600">+{game?.bonusPoints ?? 40}</strong> bonus points!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Level indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((l) => (
            <div
              key={l}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                l < level
                  ? 'bg-green-500 text-white'
                  : l === level
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {l < level ? '✓' : l}
            </div>
          ))}
        </div>
        <span className="text-xs text-slate-400">Level {level}/5</span>
      </div>

      {/* Admin skip button */}
      {isAdmin && level < 5 && (
        <button onClick={adminSkip} className="opacity-0 hover:opacity-100 text-xs text-slate-400">
          [skip]
        </button>
      )}

      {/* ─── LEVEL 1: Sequence Recall ─── */}
      {level === 1 && (
        <div className="bg-slate-800/95 rounded-xl p-5 sm:p-6">
          <h3 className="text-amber-400 font-bold text-lg mb-1">Level 1: Sequence Recall</h3>
          <p className="text-slate-400 text-sm mb-4">
            Watch the sequence, then repeat it. Round {simonRound}/3
          </p>

          {simonCooldown > 0 && (
            <div className="text-center py-4 mb-4 rounded-lg bg-red-900/30 border border-red-800/50">
              <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-red-300 text-sm">Wrong sequence! Cooldown: {simonCooldown}s</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto mb-4">
            {SIMON_COLORS.map((color, idx) => (
              <button
                key={idx}
                disabled={simonPlaying || simonCooldown > 0 || simonStatus !== 'input'}
                onClick={() => handleSimonPress(idx)}
                className="w-full aspect-square rounded-xl transition-all duration-200 border-2 border-white/10 disabled:opacity-40"
                style={{
                  backgroundColor: color,
                  transform: (simonActiveBtn === idx || simonPressedBtn === idx) ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: (simonActiveBtn === idx || simonPressedBtn === idx) ? `0 0 24px ${color}, 0 0 8px ${color}` : 'none',
                  opacity: (simonActiveBtn !== null && simonActiveBtn !== idx) ? 0.3 : 1,
                }}
              />
            ))}
          </div>

          {simonStatus === 'input' && (
            <p className="text-center text-slate-300 text-sm">
              Your turn! {simonInput.length}/{simonSequence.length}
            </p>
          )}
          {simonStatus === 'playing' && (
            <p className="text-center text-amber-300 text-sm animate-pulse">Watch carefully...</p>
          )}

          {simonStatus === 'won' && (
            <div className="text-center py-4 bg-green-900/30 rounded-lg border border-green-800/50">
              <p className="text-green-300 font-bold">Sequence Cracked!</p>
              <p className="text-green-400 text-2xl font-mono mt-2 mb-3">PERSEPHONE</p>
              <p className="text-slate-400 text-xs mb-3">Remember this clue — you'll need it later.</p>
              <button
                onClick={() => setLevel(2)}
                className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
              >
                Continue to Level 2
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── LEVEL 2: Emoji Cipher ─── */}
      {level === 2 && (
        <div className="bg-slate-800/95 rounded-xl p-5 sm:p-6">
          <h3 className="text-amber-400 font-bold text-lg mb-1">Level 2: Emoji Cipher</h3>
          <p className="text-slate-400 text-sm mb-4">
            Decode the emoji message. Round {emojiRound + 1}/3
          </p>

          {emojiCooldown > 0 && (
            <div className="text-center py-4 mb-4 rounded-lg bg-red-900/30 border border-red-800/50">
              <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-red-300 text-sm">Wrong! Cooldown: {formatCooldown(emojiCooldown)}</p>
            </div>
          )}

          <div className="text-center py-8 mb-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
            <span className="text-4xl sm:text-5xl">{EMOJI_ROUNDS[emojiRound].emoji}</span>
          </div>

          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={emojiInput}
              onChange={(e) => setEmojiInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleEmojiSubmit()}
              placeholder="Type your answer..."
              disabled={emojiCooldown > 0}
              className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
            />
            <button
              onClick={handleEmojiSubmit}
              disabled={emojiCooldown > 0 || !emojiInput.trim()}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              Submit
            </button>
          </div>

          {emojiStatus === 'won' && (
            <div className="text-center py-4 mt-4 bg-green-900/30 rounded-lg border border-green-800/50">
              <p className="text-green-300 font-bold">Cipher Decoded!</p>
              <p className="text-green-400 text-2xl font-mono mt-2 mb-3">SEEDS</p>
              <p className="text-slate-400 text-xs mb-3">Remember this clue — you'll need it later.</p>
              <button
                onClick={() => setLevel(3)}
                className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
              >
                Continue to Level 3
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── LEVEL 3: Sliding Puzzle ─── */}
      {level === 3 && (
        <div className="bg-slate-800/95 rounded-xl p-5 sm:p-6">
          <h3 className="text-amber-400 font-bold text-lg mb-1">Level 3: Picture Puzzle</h3>
          <p className="text-slate-400 text-sm mb-4">
            {slidePhase === 'puzzle'
              ? `Slide the tiles to solve the puzzle. Moves: ${moveCount}`
              : slidePhase === 'answer'
              ? 'Puzzle solved! Now enter the keyword.'
              : 'Complete!'}
          </p>

          {slideCooldown > 0 && (
            <div className="text-center py-2 mb-3 rounded-lg bg-red-900/30 border border-red-800/50">
              <p className="text-red-300 text-sm">Cooldown: {slideCooldown}s</p>
            </div>
          )}

          {slidePhase === 'puzzle' && (
            <>
              <div className="grid grid-cols-4 gap-1 max-w-[280px] mx-auto mb-4">
                {tiles.map((tile, idx) => {
                  if (tile === 0) {
                    return (
                      <div key={idx} className="aspect-square rounded-lg bg-slate-700/30" />
                    );
                  }
                  // tile 1 = row 0 col 0, tile 2 = row 0 col 1, etc.
                  const srcRow = Math.floor((tile - 1) / 4);
                  const srcCol = (tile - 1) % 4;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleTileClick(idx)}
                      disabled={slideCooldown > 0}
                      className="aspect-square rounded-lg transition-all duration-200 shadow-md hover:scale-105 active:scale-95 border border-white/10 overflow-hidden"
                      style={{
                        backgroundImage: 'url(/images/ruby.png)',
                        backgroundSize: '400% 400%',
                        backgroundPosition: `${(srcCol / 3) * 100}% ${(srcRow / 3) * 100}%`,
                      }}
                    />
                  );
                })}
              </div>
              {/* Reference thumbnail */}
              <div className="flex justify-center mb-2">
                <div className="text-center">
                  <p className="text-slate-500 text-xs mb-1">Reference</p>
                  <img
                    src="/images/ruby.png"
                    alt="Solved puzzle"
                    className="w-16 h-16 rounded-lg border border-slate-600 object-cover"
                  />
                </div>
              </div>
            </>
          )}

          {slidePhase === 'answer' && (
            <div className="space-y-3">
              <div className="flex justify-center mb-2">
                <img
                  src="/images/ruby.png"
                  alt="Solved puzzle — a ruby gemstone"
                  className="w-40 h-40 rounded-xl border border-slate-600 object-cover"
                />
              </div>
              {slideAnswerCooldown > 0 && (
                <div className="text-center py-2 rounded-lg bg-red-900/30 border border-red-800/50">
                  <p className="text-red-300 text-sm">Wrong! Cooldown: {formatCooldown(slideAnswerCooldown)}</p>
                </div>
              )}
              <p className="text-slate-300 text-sm text-center">What gemstone is this?</p>
              <div className="flex gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  value={slideInput}
                  onChange={(e) => setSlideInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleSlideAnswer()}
                  placeholder="Type the keyword..."
                  disabled={slideAnswerCooldown > 0}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                />
                <button
                  onClick={handleSlideAnswer}
                  disabled={slideAnswerCooldown > 0 || !slideInput.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {slidePhase === 'won' && (
            <div className="text-center py-4 bg-green-900/30 rounded-lg border border-green-800/50">
              <p className="text-green-300 font-bold">Puzzle Cracked!</p>
              <p className="text-green-400 text-2xl font-mono mt-2 mb-3">RUBY</p>
              <p className="text-slate-400 text-xs mb-3">Remember this clue — you'll need it later.</p>
              <button
                onClick={() => setLevel(4)}
                className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
              >
                Continue to Level 4
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── LEVEL 4: Binary Decoder ─── */}
      {level === 4 && (
        <div className="bg-slate-800/95 rounded-xl p-5 sm:p-6">
          <h3 className="text-amber-400 font-bold text-lg mb-1 flex items-center gap-2">
            <Binary className="w-5 h-5" />
            Level 4: Binary Decoder
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            Each row is an 8-bit ASCII character. Decode them all, then find the hidden English word.
          </p>

          {binaryCooldown > 0 && (
            <div className="text-center py-4 mb-4 rounded-lg bg-red-900/30 border border-red-800/50">
              <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-red-300 text-sm">Wrong! Cooldown: {formatCooldown(binaryCooldown)}</p>
            </div>
          )}

          <div className="bg-slate-900 rounded-lg p-4 mb-4 max-h-[300px] overflow-y-auto border border-slate-700">
            <div className="font-mono text-sm space-y-1">
              {BINARY_ROWS.map((row, idx) => (
                <div key={idx} className="text-green-400/80 flex items-center gap-3">
                  <span className="text-slate-600 text-xs w-6 text-right">{idx + 1}.</span>
                  <span className="tracking-widest">{row}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={binaryInput}
              onChange={(e) => setBinaryInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleBinarySubmit()}
              placeholder="The hidden word is..."
              disabled={binaryCooldown > 0}
              className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
            />
            <button
              onClick={handleBinarySubmit}
              disabled={binaryCooldown > 0 || !binaryInput.trim()}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              Submit
            </button>
          </div>

          {binaryStatus === 'won' && (
            <div className="text-center py-4 mt-4 bg-green-900/30 rounded-lg border border-green-800/50">
              <p className="text-green-300 font-bold">Binary Decoded!</p>
              <p className="text-green-400 text-2xl font-mono mt-2 mb-3">JEWEL</p>
              <p className="text-slate-400 text-xs mb-3">Remember this clue — you'll need it later.</p>
              <button
                onClick={() => setLevel(5)}
                className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
              >
                Continue to Final Level
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── LEVEL 5: The Vault ─── */}
      {level === 5 && (
        <div className="bg-slate-800/95 rounded-xl p-5 sm:p-6">
          <h3 className="text-amber-400 font-bold text-lg mb-1">Level 5: The Vault</h3>
          <p className="text-slate-400 text-sm mb-6">
            You've collected four fragments. What connects them all?
          </p>

          {/* Clue fragments */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {CLUE_FRAGMENTS.map((frag) => (
              <div
                key={frag}
                className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 border border-amber-500/30 rounded-xl p-3 text-center"
              >
                <span className="text-amber-300 font-mono font-bold text-sm sm:text-base">{frag}</span>
              </div>
            ))}
          </div>

          {isLockedOut ? (
            <div className="text-center py-6 rounded-lg bg-red-900/30 border border-red-800/50">
              <Lock className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-red-300 font-bold">Locked Out</p>
              <p className="text-red-400 text-sm">No more attempts remaining.</p>
            </div>
          ) : game?.status === 'completed' ? (
            <div className="text-center py-6 rounded-lg bg-slate-700/50 border border-slate-600/50">
              <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-300">Another team cracked the code!</p>
              <p className="text-slate-400 text-sm mt-1">Won by {game.winnerTeamName ?? 'another team'}</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  value={finalInput}
                  onChange={(e) => setFinalInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleFinalSubmit()}
                  placeholder="Enter the final answer..."
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <button
                  onClick={handleFinalSubmit}
                  disabled={!finalInput.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  Submit
                </button>
              </div>

              <div className="text-center mt-3">
                <span className="text-slate-500 text-xs">
                  {finalAttemptsLeft} attempt{finalAttemptsLeft !== 1 ? 's' : ''} remaining
                </span>
              </div>

              {finalError && (
                <div className="text-center mt-3 py-2 rounded-lg bg-red-900/30 border border-red-800/50">
                  <p className="text-red-300 text-sm">{finalError}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
