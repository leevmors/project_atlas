'use client';

import { useInView } from '@/hooks/use-in-view';
import type { FinalStandingWithQuote } from '@/lib/final-results-data';
import { ShimmerText } from './atoms/shimmer-text';
import { ParticleField } from './atoms/particle-field';
import { RankNumeral } from './atoms/rank-numeral';
import { ScoreBreakdown } from './atoms/score-breakdown';
import { GameWinBadges } from './atoms/game-win-badges';
import { TeamQuote } from './atoms/team-quote';

interface ChampionStageProps {
  team: FinalStandingWithQuote;
}

export function ChampionStage({ team }: ChampionStageProps) {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.1 });

  return (
    <section
      ref={ref}
      className="relative min-h-[90vh] flex items-center justify-center px-6 py-24 overflow-hidden"
    >
      {/* Radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(251,191,36,0.18),transparent)] animate-glow-pulse"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-amber-950/30 via-transparent to-transparent"
      />

      {inView && <ParticleField density="high" tier="gold" />}
      <RankNumeral rank={1} />

      <div
        className={`relative z-10 max-w-3xl w-full text-center transition-all duration-1000 ${
          inView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
        }`}
      >
        {/* Crown label */}
        <p className="text-amber-300/60 text-xs tracking-[0.5em] uppercase mb-5">
          ✦ Champions ✦
        </p>

        {/* Team name */}
        <h2 className="text-6xl sm:text-7xl md:text-8xl font-bold leading-none mb-6">
          <ShimmerText tier="gold">{team.companyName}</ShimmerText>
        </h2>

        {/* Members */}
        {team.members && team.members.length > 0 && (
          <p className="text-white/50 text-base sm:text-lg mb-10 tracking-wide">
            {team.members.map((m) => m.name).join(' · ')}
          </p>
        )}

        {/* Score */}
        <div
          className={`text-amber-300 font-bold leading-none mb-2 transition-all duration-700 delay-300 ${
            inView ? 'animate-count-up' : 'opacity-0'
          }`}
          style={{ fontSize: 'clamp(5rem, 15vw, 11rem)' }}
        >
          {team.grandTotal}
        </div>
        <p className="text-white/30 text-xs tracking-[0.4em] uppercase mb-10">Total Points</p>

        {/* Divider */}
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent mx-auto mb-8" />

        <ScoreBreakdown team={team} size="lg" />
        <GameWinBadges wins={team.gamesWon} className="mt-6" />
        <TeamQuote text={team.quote} attribution={team.companyName} className="mt-12" />
      </div>
    </section>
  );
}
