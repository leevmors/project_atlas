'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WelcomeRules } from '@/components/welcome-rules';
import { ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'project-atlas-welcome-seen';

export function WelcomeOverlay() {
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    setShowWelcome(!seen);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    setTimeout(() => {
      setShowWelcome(false);
    }, 350);
  }, []);

  useEffect(() => {
    if (!showWelcome) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showWelcome, handleDismiss]);

  // Don't render anything until we know the localStorage state (prevents flash)
  if (showWelcome === null || showWelcome === false) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Project Atlas"
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 transition-all duration-500 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Glass Card */}
      <div
        className={`relative w-full max-w-2xl glass rounded-2xl overflow-hidden transition-all duration-500 ${
          isExiting
            ? 'scale-95 opacity-0 translate-y-4'
            : 'scale-100 opacity-100 translate-y-0 animate-in fade-in slide-in-from-bottom-4'
        }`}
      >
        {/* Decorative gradient glow behind the card */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 right-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <ScrollArea className="max-h-[85vh]">
          <div className="relative p-6 sm:p-8 flex flex-col items-center">
            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-tight mb-2">
                <span className="font-display font-bold text-foreground">
                  Project
                </span>{' '}
                <span className="font-cursive italic text-primary text-[1.15em]">
                  Atlas
                </span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm uppercase tracking-[0.25em] font-display">
                Lingua HQ Competition
              </p>
            </div>

            {/* Divider */}
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mb-6" />

            {/* Intro text */}
            <p className="text-center text-muted-foreground text-sm sm:text-base max-w-md mb-6 leading-relaxed">
              Welcome! Your performance is graded across{' '}
              <span className="text-foreground font-medium">11 criteria</span>{' '}
              in three categories. Explore the rubric below to understand how
              every point is earned.
            </p>

            {/* Rules Content */}
            <div className="w-full mb-8">
              <WelcomeRules />
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleDismiss}
              size="lg"
              className="group font-display font-semibold px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            >
              Enter Leaderboard
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
