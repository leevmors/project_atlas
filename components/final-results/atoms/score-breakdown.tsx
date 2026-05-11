import { ClipboardList, Share2, Award, Gamepad2 } from 'lucide-react';
import type { FinalStanding } from '@/lib/types';

interface ScoreBreakdownProps {
  team: Pick<FinalStanding, 'totalTaskPoints' | 'totalSocialPoints' | 'totalPresentationPoints' | 'totalGamePoints'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE = {
  sm: 'text-xs gap-2',
  md: 'text-sm gap-3',
  lg: 'text-sm sm:text-base gap-2 sm:gap-3',
};

const PILL_SIZE = {
  sm: 'px-2.5 py-1.5',
  md: 'px-3 py-1.5',
  lg: 'px-3.5 py-2',
};

export function ScoreBreakdown({ team, size = 'md', className = '' }: ScoreBreakdownProps) {
  const items = [
    { icon: ClipboardList, label: 'Tasks', value: team.totalTaskPoints, color: 'text-sky-600' },
    { icon: Share2, label: 'Social', value: team.totalSocialPoints, color: 'text-pink-500' },
    { icon: Award, label: 'Presentation', value: team.totalPresentationPoints, color: 'text-violet-500' },
    { icon: Gamepad2, label: 'Games', value: team.totalGamePoints, color: 'text-emerald-600' },
  ].filter((item) => item.value > 0);

  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap justify-center ${SIZE[size]} ${className}`}>
      {items.map(({ icon: Icon, label, value, color }) => (
        <div
          key={label}
          className={`flex items-center gap-1.5 ${PILL_SIZE[size]} rounded-full bg-white/85 border border-sky-100 text-slate-700 shadow-sm`}
        >
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className="font-semibold">{value}</span>
          <span className="text-slate-500">{label}</span>
        </div>
      ))}
    </div>
  );
}
