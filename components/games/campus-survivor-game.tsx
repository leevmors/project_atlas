'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Clock, ExternalLink, Gamepad2, Crown } from 'lucide-react';

interface CampusSurvivorGameProps {
  gameId: string;
  isAdmin: boolean;
}

interface LeaderRow {
  team_id: string;
  company_name: string;
  best_score: number;
  best_kills: number;
  best_time: number;
  best_level: number;
  runs: number;
  last_run: string | null;
}

interface LeaderboardResponse {
  leaderboard: LeaderRow[];
  deadline_iso: string;
  ms_remaining: number;
  closed: boolean;
}

function formatCountdown(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function CampusSurvivorGame({ isAdmin }: CampusSurvivorGameProps) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/games/campus-survivor/leaderboard', { cache: 'no-store' });
      if (res.ok) setData(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = setInterval(load, 15000);
    const tick = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      clearInterval(refresh);
      clearInterval(tick);
    };
  }, [load]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-slate-400 animate-pulse">Loading the leaderboard...</div>
      </div>
    );
  }

  const topRows = (data?.leaderboard ?? []).slice(0, 5);
  const isClosed = data?.closed ?? false;
  const remaining = Math.max(0, data?.ms_remaining ?? 0);
  const winner = isClosed ? data?.leaderboard?.[0] : null;

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
          <span className="text-amber-600 text-xs font-bold uppercase tracking-wider">Admin Preview</span>
        </div>
      )}

      <div className="bg-slate-800/95 rounded-xl p-5 sm:p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
          <Gamepad2 className="w-7 h-7 text-purple-300" />
        </div>
        <h3 className="text-amber-400 font-bold text-lg mb-2">Campus Survivor</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
          Survive as long as you can. The team with the highest score when the deadline closes wins{' '}
          <strong className="text-amber-400">+100</strong> bonus points.
        </p>

        {!isClosed ? (
          <a
            href="/games/campus-survivor"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold text-sm uppercase tracking-wider transition-colors shadow-lg"
          >
            <Gamepad2 className="w-4 h-4" />
            Enter the Campus
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-700 text-slate-300 font-bold text-sm uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            Deadline Passed
          </div>
        )}

        <div className="mt-5 flex items-center justify-center gap-2">
          <Clock className={`w-4 h-4 ${isClosed ? 'text-red-400' : 'text-amber-400'}`} />
          <span className={`text-sm font-mono font-bold ${isClosed ? 'text-red-400' : 'text-amber-400'}`}>
            {isClosed ? 'CLOSED' : formatCountdown(remaining)}
          </span>
          <span className="text-slate-500 text-xs">
            {isClosed ? '— winner locked in' : 'until deadline'}
          </span>
        </div>
      </div>

      {isClosed && winner && (
        <div className="bg-amber-500/10 border-2 border-amber-400/50 rounded-xl p-4 text-center">
          <Crown className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-amber-300 font-bold uppercase tracking-wider text-xs mb-1">Winner</p>
          <p className="text-white text-lg font-bold">{winner.company_name}</p>
          <p className="text-amber-400 text-sm">Score: {winner.best_score.toLocaleString()}</p>
        </div>
      )}

      <div className="bg-slate-800/95 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h4 className="text-amber-400 font-bold text-sm uppercase tracking-wider">Top 5</h4>
        </div>
        {topRows.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No runs submitted yet. Be the first.</p>
        ) : (
          <div className="space-y-2">
            {topRows.map((row, idx) => (
              <div
                key={row.team_id}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-700/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-xs font-bold w-6 text-center ${
                    idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-slate-500'
                  }`}>
                    #{idx + 1}
                  </span>
                  <span className="text-white text-sm truncate">{row.company_name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs flex-shrink-0">
                  <span className="text-amber-300 font-bold">{row.best_score.toLocaleString()}</span>
                  <span className="text-slate-500">{row.runs} run{row.runs !== 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
