'use client';

import { ReactNode } from 'react';
import { AuthProvider } from './auth-provider';
import { SakuraBackground } from './sakura-background';
import { Header } from './header';

interface AppShellProps {
  children: ReactNode;
  showHeader?: boolean;
}

export function AppShell({ children, showHeader = true }: AppShellProps) {
  return (
    <AuthProvider>
      <div className="relative min-h-screen w-full overflow-x-hidden">
        {/* Cinematic Noise Texture */}
        <div className="noise-overlay" />

        <SakuraBackground />

        <div className="relative z-10">
          {showHeader && <Header />}
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
