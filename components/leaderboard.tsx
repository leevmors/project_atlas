'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllTeamsWithScores } from '@/lib/store';
import type { TeamWithScores } from '@/lib/types';
import { LeaderboardCard } from './leaderboard-card';
import { useDebounce } from '@/hooks/use-debounce';
import { Trophy, Users, Search, Calendar, Filter } from 'lucide-react';

export function Leaderboard() {
  const [teams, setTeams] = useState<TeamWithScores[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'points' | 'tasks' | 'social' | 'present'>('points');

  const loadTeams = useCallback(async () => {
    try {
      const teamsWithScores = await getAllTeamsWithScores();
      setTeams(teamsWithScores ?? []);
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
    const interval = setInterval(loadTeams, 30000);
    return () => clearInterval(interval);
  }, [loadTeams]);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filter and sort teams (memoized to avoid recalculation on unrelated re-renders)
  const filteredTeams = useMemo(() =>
    teams
      .filter((team) =>
        debouncedSearch === '' ||
        team.companyName.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'tasks': return (b.totalTaskPoints ?? 0) - (a.totalTaskPoints ?? 0);
          case 'social': return (b.totalSocialPoints ?? 0) - (a.totalSocialPoints ?? 0);
          case 'present': return (b.totalPresentationPoints ?? 0) - (a.totalPresentationPoints ?? 0);
          default: return (b.grandTotal ?? 0) - (a.grandTotal ?? 0);
        }
      }),
    [teams, debouncedSearch, sortBy]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Trophy className="h-12 w-12 text-white/70 animate-pulse" />
          <p className="text-white/60 text-sm">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if ((hasError && teams.length === 0) || teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <Users className="h-16 w-16 text-white/50 mb-6" />
        <h3 className="text-xl font-bold text-white mb-2">No Teams Yet</h3>
        <p className="text-white/60 max-w-md">
          The competition is about to begin! Register your team to be the first on the leaderboard.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto">
      {/* Hero Section */}
      <div className="flex flex-col items-center mb-24 md:mb-32">
        <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-wide text-center">
          <span className="font-bold text-white drop-shadow-lg">Project</span>
          {' '}
          <span className="font-cursive italic text-white/90 drop-shadow-lg">Atlas</span>
        </h1>
        <p className="mt-6 text-base md:text-lg text-white/50 font-light text-center max-w-lg leading-relaxed tracking-wide">
          What you create is what you leave behind.
        </p>
      </div>

      {/* Section Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-md">
          Leaderboards
        </h2>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 text-sm text-slate-700 placeholder:text-slate-400 w-full sm:w-44 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          <div className="flex gap-2">
            {/* Time Filter */}
            <div className="flex-1 sm:flex-none flex items-center gap-1 px-3 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-white/50">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <select className="bg-transparent text-sm text-slate-700 font-medium focus:outline-none cursor-pointer w-full">
                <option>All Time</option>
                <option>This Month</option>
                <option>This Week</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex-1 sm:flex-none flex items-center gap-1 px-3 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-white/50">
              <Filter className="w-4 h-4 text-slate-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-transparent text-sm text-slate-700 font-medium focus:outline-none cursor-pointer w-full"
              >
                <option value="points">Points</option>
                <option value="tasks">Tasks</option>
                <option value="social">Social</option>
                <option value="present">Present</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
        {filteredTeams.map((team, index) => (
          <LeaderboardCard key={team.id} team={team} rank={index + 1} />
        ))}
      </div>
    </div>
  );
}
