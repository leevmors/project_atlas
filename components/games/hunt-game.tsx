'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getGameProgress,
  submitGameAnswer,
  submitLevelAnswer,
} from '@/lib/store';
import type { Game, GameProgress } from '@/lib/types';
import { Trophy, Lock, AlertTriangle, ExternalLink } from 'lucide-react';

const RIDDLE_POEM = `It was a freezing day, winter and blizzard was hitting me
Celebration of birthday they said,
I did not mind the cold, I did not stay there for long,
I was better underneath.
Where I could see the gate to the multiverse.
A more scientifically advanced place, it was no place for me, as well
Though better than the cold.
Two of them were looking at the gate, one was writing down something
Looking out for the creature that was coming out from the gate.
I exited and went outside, they were shooting the zombies.
That was being observed by the man in a suit.
I noticed him staring and glaring.
Giggling and fixing his suit.
Hanging man however, that was behind him is what caught my eyes
With his little helper, he was striving to survive.
Maybe that was what he had been doing all this time.`;

const AKINATOR_CLUES = [
  'Not a real person',
  'Male character',
  'Wears shoes',
  'From a game',
  "Doesn't use guns",
  "Doesn't wear a hat",
  'Unknown if he has dark hair',
  'Not from a horror game',
  'Wears a mask',
  'Probably from a mobile game',
  "He's a ninja",
  'Not connected with fire',
  "Doesn't wear blue",
  "Doesn't wear just black",
  'Not linked with water',
  'His username is not linked with Animals',
  'Controls souls',
];

interface HuntGameProps {
  gameId: string;
  isAdmin: boolean;
}

export function HuntGame({ gameId, isAdmin }: HuntGameProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState(1);

  // Earned clues from server
  const [earnedClue, setEarnedClue] = useState('');

  // Level 1
  const [l1Input, setL1Input] = useState('');
  const [l1Cooldown, setL1Cooldown] = useState(0);
  const [l1Status, setL1Status] = useState<'playing' | 'won'>('playing');

  // Level 2
  const [l2Input, setL2Input] = useState('');
  const [l2Cooldown, setL2Cooldown] = useState(0);
  const [l2Status, setL2Status] = useState<'playing' | 'won'>('playing');

  // Level 3
  const [l3Input, setL3Input] = useState('');
  const [l3Cooldown, setL3Cooldown] = useState(0);
  const [l3Status, setL3Status] = useState<'playing' | 'won'>('playing');

  // Level 4
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

        // Sync server-side cooldown
        if (data.progress.levelCooldownUntil) {
          const remaining = Math.ceil(
            (new Date(data.progress.levelCooldownUntil).getTime() - Date.now()) / 1000
          );
          if (remaining > 0) {
            const currentLevel = data.progress.currentLevel;
            if (currentLevel === 1) setL1Cooldown(remaining);
            else if (currentLevel === 2) setL2Cooldown(remaining);
            else if (currentLevel === 3) setL3Cooldown(remaining);
          }
        }

        // Restore earned clues from previously completed levels
        if (data.progress.earnedClues && data.progress.earnedClues.length > 0) {
          const clues = data.progress.earnedClues;
          const currentLevel = data.progress.currentLevel;
          // Show the most recently earned clue for the level the player just completed
          if (currentLevel > 1 && clues[currentLevel - 2]) {
            setEarnedClue(clues[currentLevel - 2]);
          }
        }
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
    if (l1Cooldown <= 0) return;
    const t = setInterval(() => setL1Cooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [l1Cooldown]);

  useEffect(() => {
    if (l2Cooldown <= 0) return;
    const t = setInterval(() => setL2Cooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [l2Cooldown]);

  useEffect(() => {
    if (l3Cooldown <= 0) return;
    const t = setInterval(() => setL3Cooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [l3Cooldown]);

  const formatCooldown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Level handlers ───────────────────────────────────────────────────────

  const handleL1Submit = async () => {
    if (l1Cooldown > 0) return;
    try {
      const res = await submitLevelAnswer(gameId, 1, l1Input.trim());
      if (res.correct) {
        setL1Status('won');
        setEarnedClue(res.clue ?? '');
      } else if (res.cooldownUntil) {
        const remaining = Math.ceil(
          (new Date(res.cooldownUntil).getTime() - Date.now()) / 1000
        );
        setL1Cooldown(Math.max(0, remaining));
        setL1Input('');
      }
    } catch {
      // handle error silently
    }
  };

  const handleL2Submit = async () => {
    if (l2Cooldown > 0) return;
    try {
      const res = await submitLevelAnswer(gameId, 2, l2Input.trim());
      if (res.correct) {
        setL2Status('won');
        setEarnedClue(res.clue ?? '');
      } else if (res.cooldownUntil) {
        const remaining = Math.ceil(
          (new Date(res.cooldownUntil).getTime() - Date.now()) / 1000
        );
        setL2Cooldown(Math.max(0, remaining));
        setL2Input('');
      }
    } catch {
      // handle error silently
    }
  };

  const handleL3Submit = async () => {
    if (l3Cooldown > 0) return;
    try {
      const res = await submitLevelAnswer(gameId, 3, l3Input.trim());
      if (res.correct) {
        setL3Status('won');
        setEarnedClue(res.clue ?? '');
      } else if (res.cooldownUntil) {
        const remaining = Math.ceil(
          (new Date(res.cooldownUntil).getTime() - Date.now()) / 1000
        );
        setL3Cooldown(Math.max(0, remaining));
        setL3Input('');
      }
    } catch {
      // handle error silently
    }
  };

  const handleFinalSubmit = async () => {
    if (isLockedOut || finalAttemptsLeft <= 0) return;
    setFinalError('');
    try {
      const res = await submitGameAnswer(gameId, finalInput.trim());
      if (res.correct) {
        setLevel(5);
        setGame((g) => (g ? { ...g, status: 'completed' } : g));
      } else {
        setFinalAttemptsLeft(res.attemptsRemaining);
        setIsLockedOut(res.isLockedOut);
        if (res.isLockedOut) {
          setFinalError('Locked out — no more attempts.');
        } else {
          setFinalError(
            `Wrong answer. ${res.attemptsRemaining} attempt${res.attemptsRemaining !== 1 ? 's' : ''} remaining.`
          );
        }
        setFinalInput('');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setFinalError(`Error: ${msg}`);
    }
  };

  // ─── Admin skip ───────────────────────────────────────────────────────────

  const adminSkip = async () => {
    if (!isAdmin) return;
    if (level < 4) {
      try {
        const res = await submitLevelAnswer(gameId, level, '__ADMIN_SKIP__');
        if (res.correct) {
          setLevel(level + 1);
        }
      } catch {
        // Fallback: just advance locally
        setLevel(level + 1);
      }
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-slate-400 animate-pulse">Loading...</div>
      </div>
    );
  }

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

  if (level >= 5 || (progress?.bonusAwarded ?? 0) > 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-800 mb-1">Hunt Complete!</h3>
        <p className="text-slate-500">
          Your team earned <strong className="text-amber-600">+{game?.bonusPoints ?? 50}</strong> bonus points!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Level indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((l) => (
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
        <span className="text-xs text-slate-400">Level {level}/4</span>
      </div>

      {isAdmin && level < 4 && (
        <button onClick={adminSkip} className="opacity-0 hover:opacity-100 text-xs text-slate-400">
          [skip]
        </button>
      )}

      {/* ─── LEVEL 1: The Floor ─── */}
      {level === 1 && (
        <div className="bg-slate-800/95 rounded-xl p-5 sm:p-6">
          <h3 className="text-amber-400 font-bold text-lg mb-3">Level 1: The Floor</h3>

          <a
            href="https://floor796.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors mb-4"
          >
            <ExternalLink className="w-4 h-4" />
            Open floor796.com
          </a>

          <div className="mb-4 p-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
            <p className="text-amber-300 text-sm font-semibold mb-2">Find the character:</p>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line italic">
              {RIDDLE_POEM}
            </p>
          </div>

          {l1Cooldown > 0 && (
            <div className="text-center py-3 mb-3 rounded-lg bg-red-900/30 border border-red-800/50">
              <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-red-300 text-sm">Wrong! Cooldown: {formatCooldown(l1Cooldown)}</p>
            </div>
          )}

          {l1Status === 'playing' && (
            <>
              <p className="text-slate-300 text-sm text-center mb-3">What is the answer?</p>
              <div className="flex gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  value={l1Input}
                  onChange={(e) => setL1Input(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleL1Submit()}
                  placeholder="Type your answer..."
                  disabled={l1Cooldown > 0}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                />
                <button
                  onClick={handleL1Submit}
                  disabled={l1Cooldown > 0 || !l1Input.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  Submit
                </button>
              </div>
            </>
          )}

          {l1Status === 'won' && (
            <div className="text-center py-4 bg-green-900/30 rounded-lg border border-green-800/50">
              <p className="text-green-300 font-bold">Character Found!</p>
              <p className="text-green-400 text-2xl font-mono mt-2 mb-3">{earnedClue}</p>
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

      {/* ─── LEVEL 2: The Document ─── */}
      {level === 2 && (
        <div className="bg-slate-800/95 rounded-xl p-5 sm:p-6">
          <h3 className="text-amber-400 font-bold text-lg mb-3">Level 2: The Document</h3>

          <a
            href="https://docs.google.com/document/d/17kMlYw3zOUp40Hb8EhZmTT5ySFrFODU6/edit?usp=sharing&ouid=116328290851788719389&rtpof=true&sd=true"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors mb-4"
          >
            <ExternalLink className="w-4 h-4" />
            Open the Document
          </a>

          {l2Cooldown > 0 && (
            <div className="text-center py-3 mb-3 rounded-lg bg-red-900/30 border border-red-800/50">
              <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-red-300 text-sm">Wrong! Cooldown: {formatCooldown(l2Cooldown)}</p>
            </div>
          )}

          {l2Status === 'playing' && (
            <>
              <p className="text-slate-300 text-sm text-center mb-3">
                What's Mr. Asylbi's Most favorite Recent game?
              </p>
              <div className="flex gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  value={l2Input}
                  onChange={(e) => setL2Input(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleL2Submit()}
                  placeholder="Type your answer..."
                  disabled={l2Cooldown > 0}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                />
                <button
                  onClick={handleL2Submit}
                  disabled={l2Cooldown > 0 || !l2Input.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  Submit
                </button>
              </div>
            </>
          )}

          {l2Status === 'won' && (
            <div className="text-center py-4 bg-green-900/30 rounded-lg border border-green-800/50">
              <p className="text-green-300 font-bold">Document Decoded!</p>
              <p className="text-green-400 text-2xl font-mono mt-2 mb-3">{earnedClue}</p>
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

      {/* ─── LEVEL 3: The Oracle ─── */}
      {level === 3 && (
        <div className="bg-slate-800/95 rounded-xl p-5 sm:p-6">
          <h3 className="text-amber-400 font-bold text-lg mb-3">Level 3: The Oracle</h3>

          <a
            href="https://en.akinator.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors mb-4"
          >
            <ExternalLink className="w-4 h-4" />
            Open Akinator
          </a>

          <div className="mb-4 p-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
            <p className="text-amber-300 text-sm font-semibold mb-2">
              If you play this game and choose these answers, what character will you get?
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {AKINATOR_CLUES.map((clue, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-md bg-slate-600/50 text-slate-300 text-xs border border-slate-500/30"
                >
                  {clue}
                </span>
              ))}
            </div>
          </div>

          {l3Cooldown > 0 && (
            <div className="text-center py-3 mb-3 rounded-lg bg-red-900/30 border border-red-800/50">
              <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-red-300 text-sm">Wrong! Cooldown: {formatCooldown(l3Cooldown)}</p>
            </div>
          )}

          {l3Status === 'playing' && (
            <>
              <p className="text-slate-300 text-sm text-center mb-3">What is the answer?</p>
              <div className="flex gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  value={l3Input}
                  onChange={(e) => setL3Input(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleL3Submit()}
                  placeholder="Type your answer..."
                  disabled={l3Cooldown > 0}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                />
                <button
                  onClick={handleL3Submit}
                  disabled={l3Cooldown > 0 || !l3Input.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  Submit
                </button>
              </div>
            </>
          )}

          {l3Status === 'won' && (
            <div className="text-center py-4 bg-green-900/30 rounded-lg border border-green-800/50">
              <p className="text-green-300 font-bold">Oracle Answered!</p>
              <p className="text-green-400 text-2xl font-mono mt-2 mb-3">{earnedClue}</p>
              <p className="text-slate-400 text-xs mb-3">Remember this clue — you'll need it later.</p>
              <button
                onClick={() => setLevel(4)}
                className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
              >
                Continue to Final Level
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── LEVEL 4: Final Answer ─── */}
      {level === 4 && (
        <div className="bg-slate-800/95 rounded-xl p-5 sm:p-6">
          <h3 className="text-amber-400 font-bold text-lg mb-4">Final Answer</h3>

          {isLockedOut ? (
            <div className="text-center py-6 rounded-lg bg-red-900/30 border border-red-800/50">
              <Lock className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-red-300 font-bold">Locked Out</p>
              <p className="text-red-400 text-sm">No more attempts remaining.</p>
            </div>
          ) : game?.status === 'completed' ? (
            <div className="text-center py-6 rounded-lg bg-slate-700/50 border border-slate-600/50">
              <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-300">Another team solved it!</p>
              <p className="text-slate-400 text-sm mt-1">Won by {game.winnerTeamName ?? 'another team'}</p>
            </div>
          ) : (
            <>
              <p className="text-slate-300 text-sm text-center mb-3">What is the answer?</p>

              <div className="flex gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  value={finalInput}
                  onChange={(e) => setFinalInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleFinalSubmit()}
                  placeholder="Type your answer..."
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
