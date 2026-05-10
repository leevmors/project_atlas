'use client';

import { useInView } from '@/hooks/use-in-view';
import type { FinalStandingWithQuote } from '@/lib/final-results-data';
import { ScoreBreakdown } from './atoms/score-breakdown';
import { GameWinBadges } from './atoms/game-win-badges';
import { TeamQuote } from './atoms/team-quote';

const RANK_LABELS: Record<number, string> = { 4: '4th Place', 5: '5th Place' };

function MentionCard({ team, delay = 0 }: { team: FinalStandingWithQuote; delay?: number }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`relative rounded-2xl border border-blue-400/15 bg-white/[0.04] backdrop-blur-sm p-7 md:p-9 text-center flex flex-col items-center gap-4 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <p className="text-xs tracking-[0.4em] uppercase text-blue-400/50">
        {RANK_LABELS[team.rank] ?? `${team.rank}th Place`}
      </p>

      <h3 className="text-2xl sm:text-3xl font-bold text-white/90">{team.companyName}</h3>

      {team.members && team.members.length > 0 && (
        <p className="text-white/35 text-sm">{team.members.map((m) => m.name).join(' · ')}</p>
      )}

      <div className="text-4xl font-bold text-blue-300/80">{team.grandTotal}</div>
      <p className="text-white/20 text-xs tracking-widest uppercase -mt-2">pts</p>

      <div className="w-full h-px bg-white/8" />
      <ScoreBreakdown team={team} size="sm" />
      <GameWinBadges wins={team.gamesWon} />
      <TeamQuote text={team.quote} attribution={team.companyName} className="mt-1" />
    </div>
  );
}

export function HonorableMentions({ teams }: { teams: FinalStandingWithQuote[] }) {
  return (
    <section className="px-6 py-8 max-w-5xl mx-auto w-full">
      <p className="text-center text-white/20 text-xs tracking-[0.4em] uppercase mb-8">Honorable Mentions</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {teams.map((team, i) => (
          <MentionCard key={team.id} team={team} delay={i * 120} />
        ))}
      </div>
    </section>
  );
}
