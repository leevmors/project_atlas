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
        "bg-card/40 backdrop-blur-md border border-border/50",
        "hover:bg-card/60 hover:border-border hover:shadow-2xl hover:shadow-primary/10",
        isTopThree && "border-t-2",
        rank === 1 && "border-t-gold",
        rank === 2 && "border-t-silver",
        rank === 3 && "border-t-bronze"
      )}
    >
      {/* Background glow for top 3 */}
      {isTopThree && (
        <div 
          className={cn(
            "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20",
            `bg-gradient-to-br ${getMedalColor(rank)}`
          )}
        />
      )}

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Rank badge */}
          <div className={cn(
            "flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-display text-xl sm:text-2xl font-bold",
            getRankBadgeStyle(rank)
          )}>
            {rank <= 3 ? (
              <Trophy className="h-6 w-6 sm:h-7 sm:w-7" />
            ) : (
              rank
            )}
          </div>

          {/* Team info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg sm:text-xl font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {team.companyName}
            </h3>
            
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
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Total score */}
          <div className="flex-shrink-0 text-right">
            <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {team.grandTotal}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Points
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="mt-5 pt-4 border-t border-border/50 grid grid-cols-3 gap-3">
          <div className="text-center p-2 sm:p-3 rounded-xl bg-secondary/30">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs uppercase tracking-wider">Tasks</span>
            </div>
            <div className="font-display text-lg sm:text-xl font-bold text-foreground">
              {team.totalTaskPoints}
            </div>
          </div>
          
          <div className="text-center p-2 sm:p-3 rounded-xl bg-secondary/30">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <Share2 className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs uppercase tracking-wider">Social</span>
            </div>
            <div className="font-display text-lg sm:text-xl font-bold text-foreground">
              {team.totalSocialPoints}
            </div>
          </div>
          
          <div className="text-center p-2 sm:p-3 rounded-xl bg-secondary/30">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <Trophy className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs uppercase tracking-wider">Present</span>
            </div>
            <div className="font-display text-lg sm:text-xl font-bold text-foreground">
              {team.totalPresentationPoints}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
