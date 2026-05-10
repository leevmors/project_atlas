'use client';

import { useInView } from '@/hooks/use-in-view';
import type { FinalStandingWithQuote } from '@/lib/final-results-data';
import { ShimmerText } from './atoms/shimmer-text';
import { ParticleField } from './atoms/particle-field';
import { RankNumeral } from './atoms/rank-numeral';
import { ScoreBreakdown } from './atoms/score-breakdown';
import { GameWinBadges } from './atoms/game-win-badges';
import { TeamQuote } from './atoms/team-quote';

const TIERS = {
  2: { tier: 'silver' as const, label: '2nd Place', labelColor: 'text-slate-300/60', border: 'border-slate-300/20', glow: 'from-slate-400/10', numColor: 'text-slate-300' },
  3: { tier: 'bronze' as const, label: '3rd Place', labelColor: 'text-orange-400/60', border: 'border-orange-400/20', glow: 'from-orange-500/10', numColor: 'text-orange-400' },
};

function PodiumCard({ team, delay = 0 }: { team: FinalStandingWithQuote; delay?: number }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const cfg = TIERS[team.rank as 2 | 3] ?? TIERS[3];

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-2xl border ${cfg.border} bg-white/5 backdrop-blur-sm transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div aria-hidden className={`absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,${cfg.glow.replace('from-', '')},transparent)]`} />
      {inView && <ParticleField density="low" tier={cfg.tier} />}
      <RankNumeral rank={team.rank} />

      <div className="relative z-10 p-8 md:p-10 text-center flex flex-col items-center gap-5">
        <p className={`text-xs tracking-[0.4em] uppercase ${cfg.labelColor}`}>{cfg.label}</p>

        <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
          <ShimmerText tier={cfg.tier}>{team.companyName}</ShimmerText>
        </h3>

        {team.members && team.members.length > 0 && (
          <p className="text-white/40 text-sm">{team.members.map((m) => m.name).join(' · ')}</p>
        )}

        <div className={`text-5xl md:text-6xl font-bold ${cfg.numColor} ${inView ? 'animate-count-up' : 'opacity-0'}`}
          style={{ animationDelay: `${delay + 200}ms` }}>
          {team.grandTotal}
        </div>
        <p className="text-white/25 text-xs tracking-[0.3em] uppercase -mt-3">pts</p>

        <div className="w-full h-px bg-white/10" />
        <ScoreBreakdown team={team} size="sm" />
        <GameWinBadges wins={team.gamesWon} />
        <TeamQuote text={team.quote} attribution={team.companyName} className="mt-2" />
      </div>
    </div>
  );
}

export function PodiumPair({ teams }: { teams: FinalStandingWithQuote[] }) {
  return (
    <section className="px-6 py-12 max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team, i) => (
          <PodiumCard key={team.id} team={team} delay={i * 150} />
        ))}
      </div>
    </section>
  );
}
