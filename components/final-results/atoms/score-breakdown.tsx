import { ClipboardList, Share2, Award, Gamepad2 } from 'lucide-react';
import type { FinalStanding } from '@/lib/types';

interface ScoreBreakdownProps {
  team: Pick<FinalStanding, 'totalTaskPoints' | 'totalSocialPoints' | 'totalPresentationPoints' | 'totalGamePoints'>;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE = {
  sm: 'text-xs gap-2',
  md: 'text-sm gap-3',
  lg: 'text-base gap-4',
};

const PILL_SIZE = {
  sm: 'px-2 py-1',
  md: 'px-3 py-1.5',
  lg: 'px-4 py-2',
};

export function ScoreBreakdown({ team, size = 'md' }: ScoreBreakdownProps) {
  const items = [
    { icon: ClipboardList, label: 'Tasks', value: team.totalTaskPoints, color: 'text-blue-300' },
    { icon: Share2, label: 'Social', value: team.totalSocialPoints, color: 'text-pink-300' },
    { icon: Award, label: 'Presentation', value: team.totalPresentationPoints, color: 'text-purple-300' },
    { icon: Gamepad2, label: 'Games', value: team.totalGamePoints, color: 'text-emerald-300' },
  ].filter((item) => item.value > 0);

  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap justify-center ${SIZE[size]}`}>
      {items.map(({ icon: Icon, label, value, color }) => (
        <div
          key={label}
          className={`flex items-center gap-1.5 ${PILL_SIZE[size]} rounded-full bg-white/10 border border-white/15 text-white/70`}
        >
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className="font-medium">{value}</span>
          <span className="text-white/40">{label}</span>
        </div>
      ))}
    </div>
  );
}
