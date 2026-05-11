'use client';

import { Star } from 'lucide-react';
import { useInView } from '@/hooks/use-in-view';
import type { FinalStandingWithQuote } from '@/lib/final-results-data';
import { ScoreBreakdown } from './atoms/score-breakdown';
import { GameWinBadges } from './atoms/game-win-badges';
import { TeamQuote } from './atoms/team-quote';

const RANK_LABELS: Record<number, string> = { 4: '4th Place', 5: '5th Place' };

function MentionCard({ team, delay = 0 }: { team: FinalStandingWithQuote; delay?: number }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <article
      ref={ref}
      className={`rounded-md border border-sky-100 bg-white/85 backdrop-blur-xl p-5 sm:p-6 shadow-[0_16px_50px_-42px_rgba(14,116,144,0.5)] transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          <Star className="h-3.5 w-3.5" />
          {RANK_LABELS[team.rank] ?? `${team.rank}th Place`}
        </p>
        <div className="text-3xl font-bold text-sky-700">{team.grandTotal}</div>
      </div>

      <h3 className="break-words text-xl sm:text-2xl font-bold text-slate-950">{team.companyName}</h3>

      {team.members && team.members.length > 0 && (
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          {team.members.map((m) => m.name).join(' - ')}
        </p>
      )}

      <div className="my-5 h-px bg-slate-100" />
      <ScoreBreakdown team={team} size="sm" />
      <GameWinBadges wins={team.gamesWon} className="mt-4" />
      <TeamQuote text={team.quote} attribution={team.companyName} className="mt-5" />
    </article>
  );
}

export function HonorableMentions({ teams }: { teams: FinalStandingWithQuote[] }) {
  return (
    <section className="py-4 sm:py-5 w-full">
      <p className="text-center text-slate-400 text-xs font-semibold tracking-[0.28em] uppercase mb-5">
        Honorable Mentions
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {teams.map((team, i) => (
          <MentionCard key={team.id} team={team} delay={i * 100} />
        ))}
      </div>
    </section>
  );
}
