'use client';

import { AppShell } from '@/components/app-shell';
import { Gamepad2 } from 'lucide-react';

function GamesContent() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 pt-32 md:pt-40 pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg mb-4">
            Games
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            Fun activities and challenges for all teams
          </p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white/85 backdrop-blur-sm rounded-2xl border border-white/50 shadow-md p-12 sm:p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <Gamepad2 className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Coming Soon</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
            Games and interactive challenges will be introduced soon. Stay tuned for team-based activities,
            quizzes, and more ways to earn points and compete!
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GamesPage() {
  return (
    <AppShell>
      <GamesContent />
    </AppShell>
  );
}
