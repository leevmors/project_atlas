'use client';

import { useState, useEffect, useCallback } from 'react';
import { getGameProgress, submitGameAnswer } from '@/lib/store';
import type { Game, GameProgress } from '@/lib/types';
import { Trophy, Lock, Skull, ExternalLink } from 'lucide-react';

interface FinalGameProps {
  gameId: string;
  isAdmin: boolean;
}

export function FinalGame({ gameId, isAdmin }: FinalGameProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const [finalInput, setFinalInput] = useState('');
  const [finalError, setFinalError] = useState('');
  const [finalAttemptsLeft, setFinalAttemptsLeft] = useState(3);
  const [isLockedOut, setIsLockedOut] = useState(false);

  const hasWon = (progress?.bonusAwarded ?? 0) > 0;

  const loadProgress = useCallback(async () => {
    try {
      const data = await getGameProgress(gameId);
      setGame(data.game);
      setProgress(data.progress);
      if (data.progress) {
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

  const handleFinalSubmit = async () => {
    if (isLockedOut || finalAttemptsLeft <= 0) return;
    setFinalError('');
    try {
      const res = await submitGameAnswer(gameId, finalInput.trim());
      if (res.correct) {
        setProgress((p) => (p ? { ...p, bonusAwarded: game?.bonusPoints ?? 50 } : p));
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-slate-400 animate-pulse">Loading the chair...</div>
      </div>
    );
  }

  if (game?.status === 'completed' && !hasWon) {
    return (
      <div className="text-center py-8">
        <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">The kidnapper has already chosen a survivor.</p>
        <p className="text-slate-400 text-sm mt-1 mb-5">
          Survived by {game.winnerTeamName ?? 'another team'}
        </p>
        <a
          href="/games/final-game"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors shadow"
        >
          <Skull className="w-4 h-4" />
          Try the game — just for fun
          <ExternalLink className="w-4 h-4" />
        </a>
        <p className="text-slate-400 text-xs mt-3">
          No points — the game is already won.
        </p>
      </div>
    );
  }

  if (hasWon) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-800 mb-1">YOU SURVIVED!</h3>
        <p className="text-slate-500">
          Your team earned <strong className="text-amber-600">+{game?.bonusPoints ?? 50}</strong> bonus points!
        </p>
      </div>
    );
  }

  if (isLockedOut) {
    return (
      <div className="text-center py-8">
        <Lock className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">Locked Out</h3>
        <p className="text-slate-500 text-sm">You have used all 3 answer attempts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
          <span className="text-amber-600 text-xs font-bold uppercase tracking-wider">Admin Preview</span>
        </div>
      )}

      <div className="bg-slate-900/95 rounded-xl p-5 sm:p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <Skull className="w-7 h-7 text-red-400" />
        </div>
        <h3 className="text-red-400 font-bold text-lg mb-2">Deadman&apos;s Choice</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
          You are tied to a chair. Mr Asylbi is asking the questions. Plead your case, prove yourself, and survive the final tablet — or don&apos;t come home.
        </p>

        <a
          href="/games/final-game"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-sm uppercase tracking-wider transition-colors shadow-lg"
        >
          <Skull className="w-4 h-4" />
          ENTER THE ROOM
          <ExternalLink className="w-4 h-4" />
        </a>

        <p className="text-slate-500 text-xs mt-4">
          Survive to discover the code, then enter it below.
        </p>
      </div>

      <div className="bg-slate-900/95 rounded-xl p-5 sm:p-6">
        <h4 className="text-red-400 font-bold text-sm uppercase tracking-wider mb-3">
          Submit Your Answer
        </h4>

        <div className="flex gap-2 max-w-md mx-auto">
          <input
            type="text"
            value={finalInput}
            onChange={(e) => setFinalInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFinalSubmit()}
            placeholder="Enter the code from the room..."
            className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
          <button
            onClick={handleFinalSubmit}
            disabled={!finalInput.trim()}
            className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
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
      </div>
    </div>
  );
}
