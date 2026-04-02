'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/components/auth-provider';
import { getGames } from '@/lib/store';
import type { Game } from '@/lib/types';
import { MysteriousGame } from '@/components/games/mysterious-game';
import { Gamepad2, Trophy, Lock } from 'lucide-react';
import Link from 'next/link';

function GamesContent() {
  const { session, isLoading: authLoading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
                  className="bg-white/85 backdrop-blur-sm rounded-2xl border border-white/50 shadow-md overflow-hidden"
                >
                  {/* Game header */}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shadow-sm">
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
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Completed
                                </span>
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {isLive
                              ? `First to solve wins ${game.bonusPoints} bonus points!`
                              : `Won by ${game.winnerTeamName}`}
                          </p>
                        </div>
                      </div>

                      {/* Prize badge */}
                      <div className="hidden sm:flex flex-col items-center px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/50">
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
                          <p className="text-sm text-slate-400 italic">
                            Team accounts only
                          </p>
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

                  {/* Game component */}
                  {isActive && (
                    <div className="border-t border-slate-200/50 p-4 sm:p-6">
                      <MysteriousGame
                        gameId={game.id}
                        isAdmin={isAdmin ?? false}
                      />
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
