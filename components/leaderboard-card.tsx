'use client';

import { memo } from 'react';
import type { TeamWithScores } from '@/lib/types';
import { Trophy, Instagram, AtSign, Mail, Users, ClipboardList, Share2, Award, Crown, Gamepad2 } from 'lucide-react';

interface LeaderboardCardProps {
  team: TeamWithScores;
  rank: number;
}

function getRankLabel(rank: number): string {
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  return `${rank}th`;
}

function getRankGradient(rank: number): string {
  switch (rank) {
    case 1: return 'bg-gradient-to-r from-amber-400 to-amber-500';
    case 2: return 'bg-gradient-to-r from-slate-400 to-slate-500';
    case 3: return 'bg-gradient-to-r from-orange-400 to-orange-500';
    default: return 'bg-gradient-to-r from-sky-400 to-sky-500';
  }
}

function getScoreBadgeBg(rank: number): string {
  switch (rank) {
    case 1: return 'bg-amber-50';
    case 2: return 'bg-slate-50';
    case 3: return 'bg-orange-50';
    default: return 'bg-sky-50';
  }
}

function getScoreTextColor(rank: number): string {
  switch (rank) {
    case 1: return 'text-amber-600';
    case 2: return 'text-slate-600';
    case 3: return 'text-orange-600';
    default: return 'text-sky-600';
  }
}

export const LeaderboardCard = memo(function LeaderboardCard({ team, rank }: LeaderboardCardProps) {
  const memberNames = team.members && team.members.length > 0
    ? team.members.map(m => m.name).join(', ')
    : `${team.memberCount ?? 0} member${(team.memberCount ?? 0) !== 1 ? 's' : ''}`;

  return (
    <div className="bg-white/85 backdrop-blur-sm rounded-2xl overflow-visible shadow-md flex flex-col relative">
      {/* Rank Stamp - Top Center */}
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 rounded-full shadow-lg z-10 ${getRankGradient(rank)}`}>
        <Crown className="w-4 h-4 text-white" strokeWidth={2.5} />
        <span className="text-white font-bold text-sm">
          {getRankLabel(rank)}
        </span>
      </div>

      {/* Main Card Content */}
      <div className="px-4 sm:px-5 pt-5 pb-4 flex-1">
        {/* Company Logo Placeholder + Info */}
        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          {/* Company Logo */}
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-slate-400" strokeWidth={1.5} />
          </div>

          {/* Company Name + Group */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2">
              <h3 className="text-slate-800 font-bold text-lg truncate">{team.companyName}</h3>
              {team.groupNumber && (
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium flex-shrink-0">
                  {team.groupNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <span>{team.memberCount ?? (team.members?.length ?? 0)} members</span>
            </div>
          </div>

          {/* Score Badge */}
          <div className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl ${getScoreBadgeBg(rank)}`}>
            <div className={`text-2xl font-bold ${getScoreTextColor(rank)}`}>{team.grandTotal}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Points</div>
          </div>
        </div>

        {/* Identity Info */}
        <div className="space-y-2 text-sm">
          {/* Students */}
          <div className="flex items-center gap-2 text-slate-700">
            <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">{memberNames}</span>
          </div>

          {/* Email */}
          {team.email && (
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <a
                href={`mailto:${team.email}`}
                className="truncate hover:text-blue-500 transition-colors"
              >
                {team.email}
              </a>
            </div>
          )}

          {/* Social Links */}
          <div className="flex items-center gap-3 text-slate-500">
            {team.instagram && (
              <a
                href={`https://instagram.com/${team.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-pink-500 transition-colors"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span className="text-xs">@{team.instagram.replace('@', '')}</span>
              </a>
            )}
            {team.threads && (
              <a
                href={`https://threads.net/@${team.threads.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-slate-700 transition-colors"
              >
                <AtSign className="w-3.5 h-3.5" />
                <span className="text-xs">Threads</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-slate-50/80 border-t border-slate-100">
        <div className={`grid ${team.totalGamePoints > 0 ? 'grid-cols-4' : 'grid-cols-3'} divide-x divide-slate-100`}>
          <div className="flex flex-col items-center py-3">
            <div className="flex items-center gap-1 text-slate-500 text-[10px] uppercase tracking-wider mb-0.5 font-semibold">
              <ClipboardList className="w-3.5 h-3.5" />
              Tasks
            </div>
            <div className="text-xl font-bold text-slate-700">{team.totalTaskPoints}</div>
          </div>
          <div className="flex flex-col items-center py-3">
            <div className="flex items-center gap-1 text-slate-500 text-[10px] uppercase tracking-wider mb-0.5 font-semibold">
              <Share2 className="w-3.5 h-3.5" />
              Social
            </div>
            <div className="text-xl font-bold text-slate-700">{team.totalSocialPoints}</div>
          </div>
          <div className="flex flex-col items-center py-3">
            <div className="flex items-center gap-1 text-slate-500 text-[10px] uppercase tracking-wider mb-0.5 font-semibold">
              <Award className="w-3.5 h-3.5" />
              Present
            </div>
            <div className="text-xl font-bold text-slate-700">{team.totalPresentationPoints}</div>
          </div>
          {team.totalGamePoints > 0 && (
            <div className="flex flex-col items-center py-3">
              <div className="flex items-center gap-1 text-amber-500 text-[10px] uppercase tracking-wider mb-0.5 font-semibold">
                <Gamepad2 className="w-3.5 h-3.5" />
                Games
              </div>
              <div className="text-xl font-bold text-amber-600">{team.totalGamePoints}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
