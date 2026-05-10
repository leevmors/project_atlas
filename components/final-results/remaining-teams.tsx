'use client';

import { useInView } from '@/hooks/use-in-view';
import type { FinalStandingWithQuote } from '@/lib/final-results-data';

function getRankSuffix(n: number) {
  if (n === 11 || n === 12 || n === 13) return 'th';
  const last = n % 10;
  if (last === 1) return 'st';
  if (last === 2) return 'nd';
  if (last === 3) return 'rd';
  return 'th';
}

export function RemainingTeams({ teams }: { teams: FinalStandingWithQuote[] }) {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.05 });

  if (teams.length === 0) return null;

  return (
    <section ref={ref} className="px-6 py-8 max-w-5xl mx-auto w-full">
      <div className="w-full h-px bg-white/8 mb-10" />
      <p className="text-center text-white/15 text-xs tracking-[0.4em] uppercase mb-8">All Participants</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {teams.map((team, i) => (
          <div
            key={team.id}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.03] transition-all duration-500 ${
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <span className="text-white/20 text-xs font-mono w-8 shrink-0 text-right">
              {team.rank}{getRankSuffix(team.rank)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white/60 font-medium text-sm truncate">{team.companyName}</p>
              {team.members && team.members.length > 0 && (
                <p className="text-white/25 text-xs truncate">
                  {team.members.map((m) => m.name).join(', ')}
                </p>
              )}
            </div>
            <span className="text-white/40 text-sm font-bold shrink-0">{team.grandTotal}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
