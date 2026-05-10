'use client';

import { useMemo } from 'react';

interface ParticleFieldProps {
  density?: 'low' | 'medium' | 'high';
  tier?: 'gold' | 'silver' | 'bronze';
}

const TIER_COLORS = {
  gold: ['bg-yellow-300', 'bg-amber-200', 'bg-yellow-100'],
  silver: ['bg-slate-200', 'bg-zinc-100', 'bg-white'],
  bronze: ['bg-orange-300', 'bg-amber-200', 'bg-orange-100'],
};

const COUNTS = { low: 12, medium: 22, high: 35 };

export function ParticleField({ density = 'medium', tier = 'gold' }: ParticleFieldProps) {
  const particles = useMemo(() => {
    const count = COUNTS[density];
    const colors = TIER_COLORS[tier];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${5 + (i * 91 + 13) % 90}%`,
      top: `${10 + (i * 67 + 7) % 80}%`,
      size: 2 + (i * 37) % 5,
      duration: `${2.5 + (i * 0.3) % 3}s`,
      delay: `${(i * 0.17) % 2}s`,
      driftX: `${((i * 23 + 5) % 40) - 20}px`,
      driftY: `-${60 + (i * 31) % 80}px`,
      color: colors[i % colors.length],
    }));
  }, [density, tier]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full ${p.color} opacity-70 animate-particle`}
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
            '--pdx': p.driftX,
            '--pdy': p.driftY,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
