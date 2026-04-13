'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/components/auth-provider';
import { getGames } from '@/lib/store';
import type { Game } from '@/lib/types';
import { MysteriousGame } from '@/components/games/mysterious-game';
import { CodeBreakerGame } from '@/components/games/code-breaker-game';
import { HoustonGame } from '@/components/games/houston-game';
import { HuntGame } from '@/components/games/hunt-game';
import { FinalPieceGame } from '@/components/games/final-piece-game';
import { FinalBossGame } from '@/components/games/final-boss-game';
import { DungeonGame } from '@/components/games/dungeon-game';
import { Gamepad2, Trophy, Lock, Crown, Users } from 'lucide-react';
import Link from 'next/link';

function GamesContent() {
  const { session, isLoading: authLoading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0); // Forces re-render for live timers

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getGames()
      .then(setGames)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isTeam = session?.type === 'team';
  const isAdmin = session?.type === 'admin';

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 pt-32 md:pt-40 pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg mb-4">
            Games
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            Solve puzzles, crack codes, and earn bonus points for your team.
          </p>
        </div>

        {loading || authLoading ? (
          <div className="text-center py-12">
            <Gamepad2 className="w-10 h-10 text-white/40 mx-auto animate-pulse" />
          </div>
        ) : games.length === 0 ? (
          <div className="bg-white/85 backdrop-blur-sm rounded-2xl border border-white/50 shadow-md p-12 text-center">
            <Gamepad2 className="w-8 h-8 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">No games available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {games.map((game) => {
              const isLive = game.status === 'live';
              const isActive = activeGameId === game.id;

              return (
                <div
                  key={game.id}
                  className={`bg-white/85 backdrop-blur-sm rounded-2xl overflow-hidden transition-all ${
                    isLive
                      ? 'border border-white/50 shadow-md'
                      : 'border-2 border-amber-300/60 shadow-lg shadow-amber-100/40'
                  }`}
                >
                  {/* Game header */}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                          isLive ? 'bg-slate-100' : 'bg-amber-100'
                        }`}>
                          {isLive ? (
                            <Gamepad2 className="w-5 h-5 text-slate-600" />
                          ) : (
                            <Trophy className="w-5 h-5 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-800">
                              {game.name}
                            </h2>
                            {isLive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 border border-green-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
                                  Live
                                </span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-200">
                                <Crown className="w-3 h-3 text-amber-500" />
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                                  Solved
                                </span>
                              </span>
                            )}
                          </div>

                          {/* Subtitle: live vs completed */}
                          {isLive ? (
                            <p className="text-sm text-slate-500 mt-0.5">
                              First to solve wins {game.bonusPoints} bonus points!
                            </p>
                          ) : (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Crown className="w-4 h-4 text-amber-500" />
                              <span className="text-sm font-bold text-amber-700">
                                {game.winnerTeamName}
                              </span>
                              <span className="text-xs text-amber-500 font-medium">
                                won +{game.bonusPoints} pts!
                              </span>
                            </div>
                          )}

                          {/* 6-hour countdown for THE FINAL BOSS */}
                          {isLive && game.name === 'THE FINAL BOSS??!!' && game.createdAt && (() => {
                            const deadline = new Date(game.createdAt).getTime() + 6 * 60 * 60 * 1000;
                            const remaining = deadline - Date.now();
                            if (remaining <= 0) {
                              return (
                                <div className="flex items-center gap-1.5 mt-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500" />
                                  <span className="text-xs font-bold text-red-600">TIME EXPIRED</span>
                                </div>
                              );
                            }
                            const h = Math.floor(remaining / 3600000);
                            const m = Math.floor((remaining % 3600000) / 60000);
                            const s = Math.floor((remaining % 60000) / 1000);
                            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                            const isUrgent = remaining < 600000;
                            return (
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                                <span className={`text-xs font-mono font-bold ${isUrgent ? 'text-red-600 animate-pulse' : 'text-amber-600'}`}>
                                  {timeStr} remaining
                                </span>
                              </div>
                            );
                          })()}

                          {/* Active players indicator (live games only) */}
                          {isLive && (game.activeTeamCount ?? 0) > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mt-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <Users className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-xs font-semibold text-blue-700">
                                  {game.activeTeamCount} team{game.activeTeamCount !== 1 ? 's' : ''} playing
                                </span>
                              </div>
                              {(game.activeTeams ?? []).slice(0, 3).map((t) => (
                                <span
                                  key={t.teamName}
                                  className="bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-2.5 py-0.5 text-xs font-medium"
                                >
                                  {t.teamName}
                                </span>
                              ))}
                              {(game.activeTeamCount ?? 0) > 3 && (
                                <span className="text-xs text-blue-500 font-medium">
                                  +{(game.activeTeamCount ?? 0) - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Prize badge */}
                      <div className={`hidden sm:flex flex-col items-center px-3 py-1.5 rounded-xl ${
                        isLive
                          ? 'bg-amber-50 border border-amber-200/50'
                          : 'bg-amber-100 border border-amber-300/50'
                      }`}>
                        <span className="text-xl font-bold text-amber-600">
                          +{game.bonusPoints}
                        </span>
                        <span className="text-[10px] text-amber-500 uppercase tracking-wider font-semibold">
                          Points
                        </span>
                      </div>
                    </div>

                    {/* Action area */}
                    {!isActive && (
                      <div className="mt-4">
                        {!session ? (
                          <Link
                            href="/login"
                            className="inline-flex px-5 py-2.5 rounded-full bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
                          >
                            Log in to play
                          </Link>
                        ) : isAdmin ? (
                          <button
                            onClick={() => setActiveGameId(game.id)}
                            className="px-5 py-2.5 rounded-full bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500 transition-colors"
                          >
                            Admin Preview
                          </button>
                        ) : isTeam && isLive ? (
                          <button
                            onClick={() => setActiveGameId(game.id)}
                            className="px-5 py-2.5 rounded-full bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
                          >
                            Play Now
                          </button>
                        ) : isTeam && !isLive ? (
                          <button
                            onClick={() => setActiveGameId(game.id)}
                            className="px-5 py-2.5 rounded-full bg-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-300 transition-colors"
                          >
                            View Result
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Answer reveal (completed games only) */}
                  {!isLive && game.answer && (
                    <div className="mx-5 sm:mx-6 mb-5 sm:mb-6 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                        The answer was
                      </p>
                      <p className="text-base font-bold text-slate-800 font-mono tracking-wide">
                        {game.answer}
                      </p>
                    </div>
                  )}

                  {/* Game component */}
                  {isActive && (
                    <div className="border-t border-slate-200/50 p-4 sm:p-6">
                      {game.name === 'Dungeon - 12 Doors of Death' ? (
                        <DungeonGame
                          gameId={game.id}
                          isAdmin={isAdmin ?? false}
                        />
                      ) : game.name === 'THE FINAL BOSS??!!' ? (
                        <FinalBossGame
                          gameId={game.id}
                          isAdmin={isAdmin ?? false}
                        />
                      ) : game.name === 'The Final Piece' ? (
                        <FinalPieceGame
                          gameId={game.id}
                          isAdmin={isAdmin ?? false}
                        />
                      ) : game.name === 'The Hunt' ? (
                        <HuntGame
                          gameId={game.id}
                          isAdmin={isAdmin ?? false}
                        />
                      ) : game.name === 'Houston we have a problem!' ? (
                        <HoustonGame
                          gameId={game.id}
                          isAdmin={isAdmin ?? false}
                        />
                      ) : game.name === 'The Code Breaker' ? (
                        <CodeBreakerGame
                          gameId={game.id}
                          isAdmin={isAdmin ?? false}
                        />
                      ) : (
                        <MysteriousGame
                          gameId={game.id}
                          isAdmin={isAdmin ?? false}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GamesPage() {
  return (
    <AppShell>
      <GamesContent />
    </AppShell>
  );
}
