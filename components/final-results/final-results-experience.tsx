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
import { CloudBackdrop } from './atoms/cloud-backdrop';

const STORAGE_KEY = 'atlas-final-results-dismissed-v1';

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-sky-50">
      <CloudBackdrop />
      <div className="relative flex flex-col items-center gap-4 text-sky-700">
        <Trophy className="w-10 h-10 animate-pulse" />
        <p className="text-sm tracking-widest uppercase">preparing results...</p>
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
    setTimeout(() => setDismissed(true), 300);
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
      className={`fixed inset-0 z-[70] overflow-y-auto bg-white text-slate-900 transition-opacity duration-300 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <CloudBackdrop />

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Close final results"
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[80] w-10 h-10 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-sky-100 shadow-sm flex items-center justify-center text-slate-500 hover:text-sky-700 transition-all"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative z-10 min-h-full px-4 sm:px-6 py-5 sm:py-8">
        <div className="mx-auto w-full max-w-6xl">
          <FinalResultsHero />
          {first && <ChampionStage team={first} />}
          {podium.length > 0 && <PodiumPair teams={podium} />}
          {honorable.length > 0 && <HonorableMentions teams={honorable} />}
          {rest.length > 0 && <RemainingTeams teams={rest} />}
          <AsylbiMessage />

          <div className="flex flex-col items-center pb-10 pt-5 gap-4 text-center">
            <div className="w-16 h-px bg-sky-200 mb-1" />
            <p className="text-slate-400 text-xs tracking-widest uppercase">Project Atlas - 2026</p>
            <button
              onClick={handleDismiss}
              className="mt-1 px-5 py-2.5 rounded-full bg-sky-600 text-white hover:bg-sky-700 text-sm font-medium shadow-sm shadow-sky-200 transition-all"
            >
              View Leaderboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
