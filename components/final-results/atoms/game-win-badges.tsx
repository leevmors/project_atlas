import { Trophy } from 'lucide-react';
import type { GameWinSummary } from '@/lib/types';

interface GameWinBadgesProps {
  wins: GameWinSummary[];
  className?: string;
}

export function GameWinBadges({ wins, className = '' }: GameWinBadgesProps) {
  if (wins.length === 0) return null;
  return (
    <div className={`flex flex-wrap justify-center gap-2 ${className}`}>
      {wins.map((win) => (
        <div
          key={win.gameId}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold shadow-sm"
        >
          <Trophy className="w-3 h-3" />
          <span>{win.gameName}</span>
          <span className="text-amber-600/70">+{win.bonusPoints}pts</span>
        </div>
      ))}
    </div>
  );
}
