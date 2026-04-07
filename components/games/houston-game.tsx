'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getGameProgress,
  saveGameProgress,
  submitGameAnswer,
  submitLevelAnswer,
} from '@/lib/store';
import type { Game, GameProgress } from '@/lib/types';
import { Trophy, Lock, AlertTriangle } from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const YOUTUBE_VIDEO_ID = 'hn8N8p9P5gw';

// ─── Component ───────────────────────────────────────────────────────────────

interface HoustonGameProps {
  gameId: string;
  isAdmin: boolean;
}

export function HoustonGame({ gameId, isAdmin }: HoustonGameProps) {
  // Global state
  const [game, setGame] = useState<Game | null>(null);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState(1);

  // Level 1 — The Signal
  const [l1Input, setL1Input] = useState('');
  const [l1Cooldown, setL1Cooldown] = useState(0);
  const [l1Status, setL1Status] = useState<'playing' | 'won'>('playing');
  const [l1Submitting, setL1Submitting] = useState(false);
  const [l1Error, setL1Error] = useState('');

  // Level 2 — The Darkness
  const [l2Input, setL2Input] = useState('');
  const [l2Cooldown, setL2Cooldown] = useState(0);
  const [l2Status, setL2Status] = useState<'playing' | 'won'>('playing');
  const [l2Submitting, setL2Submitting] = useState(false);
  const [l2Error, setL2Error] = useState('');

  // Level 3 — The Fall
  const [l3Input, setL3Input] = useState('');
  const [l3Cooldown, setL3Cooldown] = useState(0);
  const [l3Status, setL3Status] = useState<'playing' | 'won'>('playing');
  const [l3Submitting, setL3Submitting] = useState(false);
  const [l3Error, setL3Error] = useState('');

  // Clue returned by server after completing a level
  const [earnedClue, setEarnedClue] = useState<string>('');

  // Level 4 — The Void
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

        // Sync server-enforced cooldown on page load
        if (data.progress.levelCooldownUntil) {
          const remaining = Math.ceil(
            (new Date(data.progress.levelCooldownUntil).getTime() - Date.now()) / 1000
          );
          if (remaining > 0) {
            if (data.progress.currentLevel === 1) setL1Cooldown(remaining);
            else if (data.progress.currentLevel === 2) setL2Cooldown(remaining);
            else if (data.progress.currentLevel === 3) setL3Cooldown(remaining);
          }
        }

        // Restore last earned clue so won-state UI shows it after refresh
        if (data.progress.earnedClues && data.progress.earnedClues.length > 0) {
          setEarnedClue(data.progress.earnedClues[data.progress.earnedClues.length - 1]);
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


  // ─── Cooldown formatter ───────────────────────────────────────────────────

  const formatCooldown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Level 1: The Signal ──────────────────────────────────────────────────

  const handleL1Submit = async () => {
    if (l1Cooldown > 0 || l1Submitting) return;
    setL1Submitting(true);
    setL1Error('');
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
    } catch (err) {
      setL1Error(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setL1Submitting(false);
    }
  };

  // ─── Level 2: The Darkness ────────────────────────────────────────────────

  const handleL2Submit = async () => {
    if (l2Cooldown > 0 || l2Submitting) return;
    setL2Submitting(true);
    setL2Error('');
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
    } catch (err) {
      setL2Error(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setL2Submitting(false);
    }
  };

  // ─── Level 3: The Fall ────────────────────────────────────────────────────

  const handleL3Submit = async () => {
    if (l3Cooldown > 0 || l3Submitting) return;
    setL3Submitting(true);
    setL3Error('');
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
    } catch (err) {
      setL3Error(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setL3Submitting(false);
    }
  };

  // ─── Level 4: The Void ────────────────────────────────────────────────────

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

  const adminSkip = () => {
    if (!isAdmin) return;
    if (level < 4) {
      saveGameProgress(gameId, level + 1).catch(() => {});
      setLevel(level + 1);
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

  // Game completed by another team
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
  if (level >= 5 || (progress?.bonusAwarded ?? 0) > 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-800 mb-1">Mission Complete!</h3>
        <p className="text-slate-500">
          Your team earned <strong className="text-amber-600">+{game?.bonusPoints ?? 150}</strong> bonus points!
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

      {/* Admin skip button */}
      {isAdmin && level < 4 && (
        <button onClick={adminSkip} className="opacity-0 hover:opacity-100 text-xs text-slate-400">
          [skip]
        </button>
      )}

      {/* ─── LEVEL 1: The Signal ─── */}
      {level === 1 && (
        <div className="bg-slate-800/95 rounded-xl p-5 sm:p-6">
          <h3 className="text-amber-400 font-bold text-lg mb-1">Level 1: The Signal</h3>
          <p className="text-slate-400 text-sm mb-4">Watch carefully.</p>

          {/* YouTube embed */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4 bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0`}
              title="The Signal"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
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
                  disabled={l1Cooldown > 0 || l1Submitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                />
                <button
                  onClick={handleL1Submit}
                  disabled={l1Cooldown > 0 || l1Submitting || !l1Input.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {l1Submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
              {l1Error && (
                <p className="text-red-400 text-sm text-center mt-2">{l1Error}</p>
              )}
            </>
          )}

          {l1Status === 'won' && (
            <div className="text-center py-4 bg-green-900/30 rounded-lg border border-green-800/50">
              <p className="text-green-300 font-bold">Signal Decoded!</p>
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

      {/* ─── LEVEL 2: The Darkness ─── */}
      {level === 2 && (
        <div className="bg-slate-800/95 rounded-xl p-5 sm:p-6">
          <h3 className="text-amber-400 font-bold text-lg mb-1">Level 2: The Darkness</h3>
          <p className="text-slate-400 text-sm mb-4">What do you see?</p>

          {/* The hidden word image */}
          <div className="rounded-lg overflow-hidden mb-4 border border-slate-700">
            <img
              src="/images/the-word.png"
              alt="What do you see?"
              className="w-full"
              draggable
            />
          </div>

          {l2Cooldown > 0 && (
            <div className="text-center py-3 mb-3 rounded-lg bg-red-900/30 border border-red-800/50">
              <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-red-300 text-sm">Wrong! Cooldown: {formatCooldown(l2Cooldown)}</p>
            </div>
          )}

          {l2Status === 'playing' && (
            <>
              <p className="text-slate-300 text-sm text-center mb-3">What is the answer?</p>
              <div className="flex gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  value={l2Input}
                  onChange={(e) => setL2Input(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleL2Submit()}
                  placeholder="Type your answer..."
                  disabled={l2Cooldown > 0 || l2Submitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                />
                <button
                  onClick={handleL2Submit}
                  disabled={l2Cooldown > 0 || l2Submitting || !l2Input.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {l2Submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
              {l2Error && (
                <p className="text-red-400 text-sm text-center mt-2">{l2Error}</p>
              )}
            </>
          )}

          {l2Status === 'won' && (
            <div className="text-center py-4 bg-green-900/30 rounded-lg border border-green-800/50">
              <p className="text-green-300 font-bold">Darkness Pierced!</p>
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

      {/* ─── LEVEL 3: The Fall ─── */}
      {level === 3 && (
        <div className="bg-slate-800/95 rounded-xl p-5 sm:p-6">
          <h3 className="text-amber-400 font-bold text-lg mb-1">Level 3: The Fall</h3>
          <p className="text-slate-400 text-sm mb-4">Observe.</p>

          {/* Stickman falling animation */}
          <div className="relative w-full h-[300px] rounded-lg overflow-hidden mb-4 bg-slate-900 border border-slate-700">
            {/* Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-500" />

            {/* Cliff */}
            <div className="absolute left-[15%] bottom-0 w-[3px] bg-slate-500" style={{ height: '65%' }} />
            <div className="absolute left-0 bg-slate-500" style={{ bottom: '65%', height: '3px', width: '15%' }} />
            {/* Cliff fill */}
            <div className="absolute left-0 bottom-0 bg-slate-800" style={{ width: '15%', height: '65%' }} />
            <div className="absolute left-0 bg-slate-700/50" style={{ bottom: 0, width: '15%', height: '65%' }} />

            {/* Stickman — animated falling */}
            <svg className="absolute animate-stickman-fall" style={{ left: '16%', width: '40px', height: '60px' }} viewBox="0 0 40 60">
              {/* Head */}
              <circle cx="20" cy="8" r="6" fill="none" stroke="#e2e8f0" strokeWidth="2" />
              {/* Body */}
              <line x1="20" y1="14" x2="20" y2="35" stroke="#e2e8f0" strokeWidth="2" />
              {/* Arms */}
              <line x1="20" y1="20" x2="8" y2="28" stroke="#e2e8f0" strokeWidth="2" />
              <line x1="20" y1="20" x2="32" y2="28" stroke="#e2e8f0" strokeWidth="2" />
              {/* Legs */}
              <line x1="20" y1="35" x2="10" y2="50" stroke="#e2e8f0" strokeWidth="2" />
              <line x1="20" y1="35" x2="30" y2="50" stroke="#e2e8f0" strokeWidth="2" />
            </svg>

            <style>{`
              @keyframes stickman-fall {
                0% {
                  top: calc(35% - 60px);
                  transform: rotate(0deg);
                }
                8% {
                  top: calc(35% - 60px);
                  transform: rotate(0deg);
                }
                12% {
                  top: calc(35% - 50px);
                  transform: rotate(5deg);
                }
                15% {
                  top: calc(35% - 40px);
                  transform: rotate(10deg);
                }
                70% {
                  top: calc(100% - 62px);
                  transform: rotate(15deg);
                }
                72% {
                  top: calc(100% - 62px);
                  transform: rotate(0deg) scaleY(0.7);
                }
                80% {
                  top: calc(100% - 62px);
                  transform: rotate(0deg) scaleY(1);
                }
                90% {
                  top: calc(100% - 62px);
                  transform: rotate(0deg);
                }
                100% {
                  top: calc(100% - 62px);
                  transform: rotate(0deg);
                  opacity: 0;
                }
              }
              .animate-stickman-fall {
                animation: stickman-fall 4s ease-in infinite;
              }
            `}</style>
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
                  onChange={(e) => setL3Input(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleL3Submit()}
                  placeholder="Type your answer..."
                  disabled={l3Cooldown > 0 || l3Submitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                />
                <button
                  onClick={handleL3Submit}
                  disabled={l3Cooldown > 0 || l3Submitting || !l3Input.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {l3Submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
              {l3Error && (
                <p className="text-red-400 text-sm text-center mt-2">{l3Error}</p>
              )}
            </>
          )}

          {l3Status === 'won' && (
            <div className="text-center py-4 bg-green-900/30 rounded-lg border border-green-800/50">
              <p className="text-green-300 font-bold">Gravity Understood!</p>
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

      {/* ─── LEVEL 4: The Void ─── */}
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
