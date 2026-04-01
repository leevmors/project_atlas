'use client';

import { useAuth } from './auth-provider';
import { Button } from '@/components/ui/button';
import { Mountain, LogOut, User, Shield } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const { session, logout } = useAuth();

  return (
    <header className="relative z-50 border-b border-border/50 bg-card/30 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-colors" />
              <Mountain className="relative h-8 w-8 text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg tracking-tight leading-none">
                <span className="font-display font-bold text-foreground">Project</span>{' '}
                <span className="font-cursive italic text-primary">Atlas</span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Lingua HQ
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Leaderboard
            </Link>
            {session?.type === 'admin' && (
              <Link 
                href="/admin" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Admin Panel
              </Link>
            )}
            {session?.type === 'team' && (
              <Link 
                href="/team" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                My Team
              </Link>
            )}
          </nav>

          {/* Auth section */}
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50">
                  {session.type === 'admin' ? (
                    <Shield className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {session.name}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={logout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Register Team
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
