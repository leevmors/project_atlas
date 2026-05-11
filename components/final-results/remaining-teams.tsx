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
    <section ref={ref} className="py-4 sm:py-5 w-full">
      <div className="mb-6 h-px bg-sky-100" />
      <p className="text-center text-slate-400 text-xs font-semibold tracking-[0.28em] uppercase mb-5">
        All Participants
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {teams.map((team, i) => (
          <article
            key={team.id}
            className={`flex min-w-0 items-center gap-4 rounded-md border border-sky-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl transition-all duration-500 ${
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${i * 45}ms` }}
          >
            <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-sky-50 text-xs font-bold text-sky-700">
              {team.rank}{getRankSuffix(team.rank)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{team.companyName}</p>
              {team.members && team.members.length > 0 && (
                <p className="truncate text-xs text-slate-500">
                  {team.members.map((m) => m.name).join(', ')}
                </p>
              )}
            </div>
            <span className="shrink-0 text-sm font-bold text-slate-700">{team.grandTotal}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
