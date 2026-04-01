'use client';

import { AppShell } from '@/components/app-shell';
import { Leaderboard } from '@/components/leaderboard';
import { WelcomeOverlay } from '@/components/welcome-overlay';

export default function HomePage() {
  return (
    <AppShell>
      <main className="relative z-10 flex flex-col px-6 lg:px-12 pt-32 md:pt-40 pb-16">
        <Leaderboard />
      </main>
      <WelcomeOverlay />
    </AppShell>
  );
}
