'use client';

import type { TeamWithScores } from '@/lib/types';
import { Trophy, Instagram, AtSign, Mail, Users, FileText, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardCardProps {
  team: TeamWithScores;
  rank: number;
}

export function LeaderboardCard({ team, rank }: LeaderboardCardProps) {
  const isTopThree = rank <= 3;
  
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-gold via-gold/80 to-gold/60';
      case 2: return 'from-silver via-silver/80 to-silver/60';
      case 3: return 'from-bronze via-bronze/80 to-bronze/60';
      default: return 'from-muted via-muted/80 to-muted/60';
    }
  };

  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-br from-gold to-gold/70 text-background shadow-lg shadow-gold/30';
      case 2: return 'bg-gradient-to-br from-silver to-silver/70 text-background shadow-lg shadow-silver/30';
      case 3: return 'bg-gradient-to-br from-bronze to-bronze/70 text-background shadow-lg shadow-bronze/30';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl transition-all duration-500",
        "bg-card/50 backdrop-blur-xl border border-white/[0.08] shadow-lg shadow-black/10",
        "hover:bg-card/70 hover:border-white/15 hover:shadow-2xl hover:shadow-primary/15 hover:-translate-y-0.5",
        isTopThree && "border-t-2",
        rank === 1 && "border-t-gold shadow-gold/5",
        rank === 2 && "border-t-silver shadow-silver/5",
        rank === 3 && "border-t-bronze shadow-bronze/5"
      )}
    >
      {/* Background glow for top 3 */}
      {isTopThree && (
        <div
          className={cn(
            "absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl opacity-25",
            `bg-gradient-to-br ${getMedalColor(rank)}`
          )}
        />
      )}

      <div className="relative p-6 sm:p-7">
        <div className="flex items-start gap-4">
          {/* Rank badge */}
          <div className={cn(
            "flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center font-display text-xl sm:text-2xl font-bold",
            getRankBadgeStyle(rank)
          )}>
            {rank <= 3 ? (
              <Trophy className="h-7 w-7 sm:h-8 sm:w-8" />
            ) : (
              rank
            )}
          </div>

          {/* Team info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {team.companyName}
              </h3>
              {team.groupNumber && (
                <span className="shrink-0 px-2 py-0.5 rounded-md bg-secondary/50 text-[10px] sm:text-xs font-medium text-muted-foreground border border-border/30">
                  {team.groupNumber}
                </span>
              )}
            </div>
            
            {/* Social links */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-muted-foreground">
              {team.instagram && (
                <a 
                  href={`https://instagram.com/${team.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs hover:text-primary transition-colors"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{team.instagram}</span>
                </a>
              )}
              {team.threads && (
                <a 
                  href={`https://threads.net/${team.threads.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs hover:text-primary transition-colors"
                >
                  <AtSign className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Threads</span>
                </a>
              )}
              {team.email && (
                <a 
                  href={`mailto:${team.email}`}
                  className="flex items-center gap-1 text-xs hover:text-primary transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{team.email}</span>
                </a>
              )}
            </div>

            {/* Team members */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5 shrink-0" />
              {team.members && team.members.length > 0 ? (
                <span className="line-clamp-1">{team.members.map(m => m.name).join(', ')}</span>
              ) : (
                <span>{team.memberCount ?? 0} member{(team.memberCount ?? 0) !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          {/* Total score */}
          <div className="flex-shrink-0 text-right">
            <div className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              {team.grandTotal}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
              Points
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="mt-6 pt-5 border-t border-white/[0.06] grid grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4 rounded-xl bg-white/[0.04] border border-white/[0.05]">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs uppercase tracking-wider font-medium">Tasks</span>
            </div>
            <div className="font-display text-xl sm:text-2xl font-bold text-foreground">
              {team.totalTaskPoints}
            </div>
          </div>

          <div className="text-center p-3 sm:p-4 rounded-xl bg-white/[0.04] border border-white/[0.05]">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1.5">
              <Share2 className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs uppercase tracking-wider font-medium">Social</span>
            </div>
            <div className="font-display text-xl sm:text-2xl font-bold text-foreground">
              {team.totalSocialPoints}
            </div>
          </div>

          <div className="text-center p-3 sm:p-4 rounded-xl bg-white/[0.04] border border-white/[0.05]">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1.5">
              <Trophy className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs uppercase tracking-wider font-medium">Present</span>
            </div>
            <div className="font-display text-xl sm:text-2xl font-bold text-foreground">
              {team.totalPresentationPoints}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
