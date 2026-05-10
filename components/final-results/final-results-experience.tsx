'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Trophy } from 'lucide-react';
import { getFinalStandings } from '@/lib/final-results-data';
import type { FinalStandingWithQuote } from '@/lib/final-results-data';
import { FinalResultsHero } from './final-results-hero';
import { ChampionStage } from './champion-stage';
import { PodiumPair } from './podium-pair';
import { HonorableMentions } from './honorable-mentions';
import { RemainingTeams } from './remaining-teams';
import { AsylbiMessage } from './asylbi-message';

const STORAGE_KEY = 'atlas-final-results-dismissed-v1';

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4 text-white/40">
        <Trophy className="w-10 h-10 animate-pulse" />
        <p className="text-sm tracking-widest uppercase">preparing results…</p>
      </div>
    </div>
  );
}

export function FinalResultsExperience() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [standings, setStandings] = useState<FinalStandingWithQuote[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setMounted(true);
    const seen = localStorage.getItem(STORAGE_KEY);
    setDismissed(seen === 'true');
  }, []);

  useEffect(() => {
    if (!mounted || dismissed) return;
    let cancelled = false;
    getFinalStandings()
      .then((data) => { if (!cancelled) setStandings(data); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [mounted, dismissed]);

  useEffect(() => {
    if (!mounted || dismissed) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mounted, dismissed]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    setTimeout(() => setDismissed(true), 380);
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleDismiss(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dismissed, handleDismiss]);

  if (!mounted || dismissed) return null;
  if (error) return null;
  if (!standings) return <FullScreenLoader />;

  const [first, second, third, fourth, fifth, ...rest] = standings;
  const podium = [second, third].filter(Boolean);
  const honorable = [fourth, fifth].filter(Boolean);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Project Atlas Final Results"
      className={`fixed inset-0 z-[70] overflow-y-auto bg-gradient-to-b from-slate-950 via-[#0a0d1a] to-slate-950 transition-opacity duration-400 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Subtle noise grain */}
      <div aria-hidden className="noise-overlay" style={{ zIndex: 1 }} />

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Close final results"
        className="fixed top-5 right-5 z-[80] w-10 h-10 rounded-full bg-white/8 hover:bg-white/15 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/50 hover:text-white/80 transition-all"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Content */}
      <div className="relative z-10">
        <FinalResultsHero />
        {first && <ChampionStage team={first} />}
        {podium.length > 0 && <PodiumPair teams={podium} />}
        {honorable.length > 0 && <HonorableMentions teams={honorable} />}
        {rest.length > 0 && <RemainingTeams teams={rest} />}
        <AsylbiMessage />

        {/* Footer CTA */}
        <div className="flex flex-col items-center pb-20 pt-8 gap-4 text-center px-6">
          <div className="w-16 h-px bg-white/10 mb-2" />
          <p className="text-white/20 text-xs tracking-widest uppercase">Project Atlas · 2026</p>
          <button
            onClick={handleDismiss}
            className="mt-4 px-6 py-2.5 rounded-full border border-white/15 text-white/40 hover:text-white/70 hover:border-white/30 text-sm tracking-wide transition-all"
          >
            View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
