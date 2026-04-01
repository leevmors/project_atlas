'use client';

import { useAuth } from './auth-provider';
import { User, LogOut, Shield, Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function Header() {
  const { session, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const navLinkClass = (path: string) =>
    `px-4 py-2 rounded-full text-base transition-all font-medium ${
      isActive(path)
        ? 'text-white font-semibold bg-white/20 backdrop-blur-sm'
        : 'text-white/70 hover:text-white hover:bg-white/10'
    }`;

  return (
    <>
      {/* Desktop floating pill navbar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 hidden md:block">
        <div className="flex items-center gap-8 px-8 py-4 rounded-full backdrop-blur-2xl bg-white/25 border border-white/40 shadow-xl">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Project Atlas Logo"
              width={42}
              height={42}
              className="rounded-lg"
            />
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link href="/about" className={navLinkClass('/about')}>
              About
            </Link>
            <Link href="/" className={navLinkClass('/')}>
              Leaderboard
            </Link>
            <Link href="/rules" className={navLinkClass('/rules')}>
              Rules
            </Link>
            <Link href="/games" className={navLinkClass('/games')}>
              Games
            </Link>
            {session?.type === 'admin' && (
              <Link href="/admin" className={navLinkClass('/admin')}>
                Admin Panel
              </Link>
            )}
            {session?.type === 'team' && (
              <Link href="/team" className={navLinkClass('/team')}>
                My Team
              </Link>
            )}
          </div>

          {/* Auth section */}
          {session ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20">
                {session.type === 'admin' ? (
                  <Shield className="h-4 w-4 text-white/80" />
                ) : (
                  <User className="h-4 w-4 text-white/80" />
                )}
                <span className="text-sm font-medium text-white">
                  {session.name}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/15 border border-white/20 text-white/70 hover:bg-white/25 hover:text-white transition-all duration-200"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-full text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all font-medium"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-full text-sm text-white font-semibold bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile navbar */}
      <nav className="fixed top-4 left-4 right-4 z-50 md:hidden">
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl backdrop-blur-2xl bg-white/25 border border-white/40 shadow-xl">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Project Atlas Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-white font-semibold text-sm">Atlas</span>
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/15 border border-white/20 text-white"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="mt-2 p-4 rounded-2xl backdrop-blur-2xl bg-white/25 border border-white/40 shadow-xl">
            <div className="flex flex-col gap-1">
              <Link
                href="/about"
                onClick={() => setMobileOpen(false)}
                className={navLinkClass('/about')}
              >
                About
              </Link>
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className={navLinkClass('/')}
              >
                Leaderboard
              </Link>
              <Link
                href="/rules"
                onClick={() => setMobileOpen(false)}
                className={navLinkClass('/rules')}
              >
                Rules
              </Link>
              <Link
                href="/games"
                onClick={() => setMobileOpen(false)}
                className={navLinkClass('/games')}
              >
                Games
              </Link>
              {session?.type === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass('/admin')}
                >
                  Admin Panel
                </Link>
              )}
              {session?.type === 'team' && (
                <Link
                  href="/team"
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass('/team')}
                >
                  My Team
                </Link>
              )}

              <div className="border-t border-white/20 mt-2 pt-2">
                {session ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white text-sm">
                      {session.type === 'admin' ? (
                        <Shield className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      {session.name}
                    </div>
                    <button
                      onClick={() => { logout(); setMobileOpen(false); }}
                      className="px-3 py-1.5 rounded-full text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center px-3 py-2 rounded-full text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center px-3 py-2 rounded-full text-sm text-white font-semibold bg-white/20 hover:bg-white/30 transition-all"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
