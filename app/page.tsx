'use client';

import { AppShell } from '@/components/app-shell';
import { Leaderboard } from '@/components/leaderboard';

export default function HomePage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-16">
        <Leaderboard />
      </main>
    </AppShell>
  );
}
