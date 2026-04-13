'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getGameProgress,
  getGameChat,
  sendGameChat,
  submitGameAnswer,
} from '@/lib/store';
import type { Game, GameProgress, ChatMessage } from '@/lib/types';
import { Trophy, Lock, AlertTriangle, Send, Skull } from 'lucide-react';

interface FinalBossGameProps {
  gameId: string;
  isAdmin: boolean;
}

export function FinalBossGame({ gameId, isAdmin }: FinalBossGameProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [messagesRemaining, setMessagesRemaining] = useState(50);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Final answer state
  const [finalInput, setFinalInput] = useState('');
  const [finalError, setFinalError] = useState('');
  const [finalAttemptsLeft, setFinalAttemptsLeft] = useState(3);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  // --- Initialization ---
  const loadProgress = useCallback(async () => {
    try {
      const [progressData, chatData] = await Promise.all([
        getGameProgress(gameId),
        getGameChat(gameId),
      ]);
      setGame(progressData.game);
      setProgress(progressData.progress);
      if (progressData.progress) {
        setFinalAttemptsLeft(3 - progressData.progress.finalAnswerAttempts);
        setIsLockedOut(progressData.progress.isLockedOut);
        if (progressData.progress.bonusAwarded > 0) setHasWon(true);
      }
      setMessages(chatData.messages);
      setMessagesUsed(chatData.messagesUsed);
      setMessagesRemaining(chatData.messagesRemaining);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Poll for game status
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

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Chat handlers ---
  const handleSendMessage = async () => {
    if (sending || !inputValue.trim() || messagesRemaining <= 0) return;
    const userMsg = inputValue.trim();
    setInputValue('');
    setSending(true);
    setChatError('');

    // Optimistic: show user message immediately
    const updatedMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(updatedMessages);

    try {
      // Admin: pass full history so server can do crack detection without DB
      const res = await sendGameChat(gameId, userMsg, isAdmin ? updatedMessages : undefined);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
      setMessagesUsed(res.messagesUsed);
      setMessagesRemaining(res.messagesRemaining);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Failed to send message.');
      // Remove optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  // --- Final answer ---
  const handleFinalSubmit = async () => {
    if (isLockedOut || finalAttemptsLeft <= 0 || !finalInput.trim()) return;
    setFinalError('');
    try {
      const res = await submitGameAnswer(gameId, finalInput.trim());
      if (res.correct) {
        setHasWon(true);
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
    } catch (err) {
      setFinalError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  // --- 6-hour countdown timer ---
  const GAME_DURATION_MS = 6 * 60 * 60 * 1000;
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!game?.createdAt) return;
    const deadline = new Date(game.createdAt).getTime() + GAME_DURATION_MS;

    const tick = () => {
      const remaining = deadline - Date.now();
      setTimeRemaining(Math.max(0, remaining));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [game?.createdAt]);

  const isExpired = timeRemaining !== null && timeRemaining <= 0 && game?.status === 'live';

  const formatTimer = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Message counter color ---
  const counterColor =
    messagesRemaining > 20
      ? 'text-green-400'
      : messagesRemaining > 10
      ? 'text-amber-400'
      : 'text-red-400 animate-pulse';

  // --- Render ---
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-slate-400 animate-pulse">Awakening the serpent...</div>
      </div>
    );
  }

  // Game completed by another team
  if (game?.status === 'completed' && !hasWon) {
    return (
      <div className="text-center py-8">
        <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">The serpent has been defeated!</p>
        <p className="text-slate-400 text-sm mt-1">
          Conquered by {game.winnerTeamName ?? 'another team'}
        </p>
      </div>
    );
  }

  // This team won
  if (hasWon) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-800 mb-1">THE SERPENT IS SLAIN!</h3>
        <p className="text-slate-500">
          Your team earned <strong className="text-amber-600">+{game?.bonusPoints ?? 200}</strong> bonus points!
        </p>
      </div>
    );
  }

  // Timer expired
  if (isExpired) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">Time&apos;s Up!</h3>
        <p className="text-slate-500 text-sm">The serpent has grown bored of waiting. The game has closed.</p>
      </div>
    );
  }

  // Locked out
  if (isLockedOut) {
    return (
      <div className="text-center py-8">
        <Lock className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">Locked Out</h3>
        <p className="text-slate-500 text-sm">You have used all 3 final answer attempts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Admin toolbar */}
      {isAdmin && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
          <span className="text-amber-600 text-xs font-bold uppercase tracking-wider">Admin Preview</span>
          <span className="text-slate-400 text-xs">Messages don&apos;t persist</span>
        </div>
      )}

      {/* Game area */}
      <div className="bg-slate-800/95 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-600/20 flex items-center justify-center">
              <Skull className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wider">
                Jörmungandr
              </h3>
              <p className="text-slate-500 text-xs">The World Serpent</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {timeRemaining !== null && timeRemaining > 0 && (
              <div className={`text-sm font-mono font-bold ${timeRemaining < 600000 ? 'text-red-400 animate-pulse' : timeRemaining < 3600000 ? 'text-amber-400' : 'text-slate-400'}`}>
                {formatTimer(timeRemaining)}
              </div>
            )}
            <div className={`text-sm font-mono font-bold ${counterColor}`}>
              {messagesUsed}/{50}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="h-80 sm:h-96 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && !sending && (
            <div className="text-center py-12">
              <Skull className="w-10 h-10 text-amber-500/30 mx-auto mb-3" />
              <p className="text-slate-500 text-sm italic">
                &quot;You dare approach me, mortal? Speak, and choose your words wisely...&quot;
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-slate-600 text-slate-100 rounded-br-md'
                    : 'bg-amber-900/40 border border-amber-700/30 text-amber-100 rounded-bl-md'
                }`}
              >
                {msg.role === 'assistant' && (
                  <span className="text-amber-500 text-xs font-bold block mb-1">Jörmungandr</span>
                )}
                {msg.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-amber-900/40 border border-amber-700/30 rounded-2xl rounded-bl-md px-4 py-2.5">
                <span className="text-amber-500 text-xs font-bold block mb-1">Jörmungandr</span>
                <span className="text-amber-200/60 text-sm italic animate-pulse">
                  The serpent stirs...
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat input */}
        <div className="border-t border-slate-700 px-4 py-3">
          {messagesRemaining <= 0 ? (
            <p className="text-red-400 text-sm text-center py-2">
              No messages remaining. Submit your final answer below.
            </p>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Challenge the serpent..."
                disabled={sending || messagesRemaining <= 0}
                maxLength={1000}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !inputValue.trim() || messagesRemaining <= 0}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
          {chatError && (
            <p className="text-red-400 text-xs text-center mt-2">{chatError}</p>
          )}
          <p className="text-slate-500 text-xs text-center mt-2">
            {messagesRemaining > 0
              ? `${messagesRemaining} message${messagesRemaining !== 1 ? 's' : ''} remaining`
              : ''}
          </p>
        </div>
      </div>

      {/* Final answer section */}
      <div className="bg-slate-800/95 rounded-xl p-5">
        <h4 className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Submit Final Answer
        </h4>
        <p className="text-slate-400 text-xs mb-3">
          {finalAttemptsLeft} attempt{finalAttemptsLeft !== 1 ? 's' : ''} remaining. Choose wisely.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={finalInput}
            onChange={(e) => setFinalInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleFinalSubmit()}
            placeholder="Type the secret word..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <button
            onClick={handleFinalSubmit}
            disabled={!finalInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            Submit
          </button>
        </div>
        {finalError && (
          <p className="text-red-400 text-sm text-center mt-2">{finalError}</p>
        )}
      </div>
    </div>
  );
}
