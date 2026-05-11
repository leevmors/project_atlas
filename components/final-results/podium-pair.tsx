'use client';

import { Medal } from 'lucide-react';
import { useInView } from '@/hooks/use-in-view';
import type { FinalStandingWithQuote } from '@/lib/final-results-data';
import { ScoreBreakdown } from './atoms/score-breakdown';
import { GameWinBadges } from './atoms/game-win-badges';
import { TeamQuote } from './atoms/team-quote';

const TIERS = {
  2: {
    label: '2nd Place',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    score: 'text-slate-700',
    wash: 'from-slate-50',
  },
  3: {
    label: '3rd Place',
    border: 'border-sky-100',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    score: 'text-sky-700',
    wash: 'from-sky-50',
  },
};

function PodiumCard({ team, delay = 0 }: { team: FinalStandingWithQuote; delay?: number }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const cfg = TIERS[team.rank as 2 | 3] ?? TIERS[3];

  return (
    <article
      ref={ref}
      className={`relative overflow-hidden rounded-md border ${cfg.border} bg-white/90 backdrop-blur-xl shadow-[0_18px_60px_-42px_rgba(14,116,144,0.55)] transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${cfg.wash} to-transparent`} />

      <div className="relative flex h-full flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${cfg.badge}`}>
            <Medal className="h-3.5 w-3.5" />
            {cfg.label}
          </div>
          <div className={`text-4xl sm:text-5xl font-bold leading-none ${cfg.score}`}>
            {team.grandTotal}
          </div>
        </div>

        <div>
          <h3 className="break-words text-2xl sm:text-3xl font-bold leading-tight text-slate-950">
            {team.companyName}
          </h3>

          {team.members && team.members.length > 0 && (
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              {team.members.map((m) => m.name).join(' - ')}
            </p>
          )}
        </div>

        <div className="h-px bg-slate-100" />
        <ScoreBreakdown team={team} size="sm" />
        <GameWinBadges wins={team.gamesWon} />
        <TeamQuote text={team.quote} attribution={team.companyName} className="mt-auto" />
      </div>
    </article>
  );
}

export function PodiumPair({ teams }: { teams: FinalStandingWithQuote[] }) {
  return (
    <section className="py-4 sm:py-5 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {teams.map((team, i) => (
          <PodiumCard key={team.id} team={team} delay={i * 120} />
        ))}
      </div>
    </section>
  );
}
