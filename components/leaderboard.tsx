'use client';

import { useState, useEffect } from 'react';
import { getAllTeamsWithScores } from '@/lib/store';
import type { TeamWithScores } from '@/lib/types';
import { LeaderboardCard } from './leaderboard-card';
import { Trophy, Users, Sparkles } from 'lucide-react';

export function Leaderboard() {
  const [teams, setTeams] = useState<TeamWithScores[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTeams = () => {
      const teamsWithScores = getAllTeamsWithScores();
      setTeams(teamsWithScores);
      setIsLoading(false);
    };

    loadTeams();
    
    // Poll for updates every 5 seconds for "live" feel
    const interval = setInterval(loadTeams, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <Trophy className="relative h-12 w-12 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
          <Users className="relative h-16 w-16 text-muted-foreground" />
        </div>
        <h3 className="font-display text-xl font-bold text-foreground mb-2">
          No Teams Yet
        </h3>
        <p className="text-muted-foreground max-w-md">
          The competition is about to begin! Register your team to be the first on the leaderboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="text-center py-8 sm:py-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wider">Live Rankings</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 text-balance">
          Competition Leaderboard
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
          Real-time standings for all translation companies. Earn points through task completion, 
          social media engagement, and your final presentation.
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto mb-8">
        <div className="text-center p-4 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50">
          <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {teams.length}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
            Teams
          </div>
        </div>
        <div className="text-center p-4 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50">
          <div className="font-display text-2xl sm:text-3xl font-bold text-primary">
            {teams[0]?.grandTotal || 0}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
            Top Score
          </div>
        </div>
        <div className="text-center p-4 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50">
          <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {teams.reduce((sum, t) => sum + t.members.length, 0)}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
            Competitors
          </div>
        </div>
      </div>

      {/* Leaderboard cards */}
      <div className="space-y-4">
        {teams.map((team, index) => (
          <LeaderboardCard key={team.id} team={team} rank={index + 1} />
        ))}
      </div>
    </div>
  );
}
