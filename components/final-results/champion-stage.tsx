'use client';

import { Crown, Trophy } from 'lucide-react';
import { useInView } from '@/hooks/use-in-view';
import type { FinalStandingWithQuote } from '@/lib/final-results-data';
import { ScoreBreakdown } from './atoms/score-breakdown';
import { GameWinBadges } from './atoms/game-win-badges';
import { TeamQuote } from './atoms/team-quote';

interface ChampionStageProps {
  team: FinalStandingWithQuote;
}

export function ChampionStage({ team }: ChampionStageProps) {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.15 });

  return (
    <section ref={ref} className="px-0 py-4 sm:py-5">
      <div
        className={`relative overflow-hidden rounded-md border border-sky-100 bg-white/90 backdrop-blur-xl shadow-[0_24px_90px_-54px_rgba(14,116,144,0.65)] transition-all duration-700 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-sky-100/80 via-sky-50/50 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-sky-100/65 via-sky-50/35 to-transparent blur-2xl" />

        <div className="relative grid gap-7 lg:grid-cols-[1fr_18rem] p-5 sm:p-7 md:p-9">
          <div className="min-w-0">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              <Crown className="h-3.5 w-3.5" />
              Champions
            </div>

            <h2 className="break-words text-3xl sm:text-5xl md:text-6xl font-bold leading-tight text-slate-950">
              {team.companyName}
            </h2>

            {team.members && team.members.length > 0 && (
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-500">
                {team.members.map((m) => m.name).join(' - ')}
              </p>
            )}

            <div className="mt-7">
              <ScoreBreakdown team={team} size="lg" className="justify-start" />
            </div>
            <GameWinBadges wins={team.gamesWon} className="mt-4 justify-start" />
          </div>

          <aside className="flex flex-col justify-between border-t border-sky-100 pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
            <div className="flex items-center gap-2 text-sky-700">
              <Trophy className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.22em]">Total Points</span>
            </div>
            <div className="mt-5 text-5xl sm:text-6xl md:text-7xl font-bold leading-none text-sky-700">
              {team.grandTotal}
            </div>
            <div className="mt-6 h-px bg-sky-100" />
            <TeamQuote text={team.quote} attribution={team.companyName} className="mt-5 text-left" />
          </aside>
        </div>
      </div>
    </section>
  );
}
