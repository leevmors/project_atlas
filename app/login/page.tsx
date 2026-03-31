'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { AppShell } from '@/components/app-shell';
import { loginAsTeam, loginAsAdmin } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mountain, ArrowRight, Users, Shield } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [loginType, setLoginType] = useState<'team' | 'admin'>('team');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let session;
      if (loginType === 'admin') {
        session = await loginAsAdmin(identifier, password);
        if (session) {
          setSession(session);
          router.push('/admin');
          return;
        }
      } else {
        session = await loginAsTeam(identifier, password);
        if (session) {
          setSession(session);
          router.push('/team');
          return;
        }
      }
      setError('Invalid credentials. Please check your login details.');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-colors" />
              <Mountain className="relative h-10 w-10 text-primary" strokeWidth={1.5} />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              Project Atlas
            </span>
          </Link>
        </div>

        {/* Login type selector */}
        <div className="flex gap-2 p-1 mb-8 rounded-xl bg-secondary/30 border border-border/50">
          <button
            type="button"
            onClick={() => setLoginType('team')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              loginType === 'team'
                ? 'bg-card text-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Team Login
          </button>
          <button
            type="button"
            onClick={() => setLoginType('admin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              loginType === 'admin'
                ? 'bg-card text-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="h-4 w-4" />
            Admin Login
          </button>
        </div>

        {/* Login form */}
        <div className="p-6 sm:p-8 rounded-2xl bg-card/40 backdrop-blur-md border border-border/50">
          <h1 className="font-display text-xl font-bold text-foreground mb-1">
            {loginType === 'admin' ? 'Admin Login' : 'Team Login'}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {loginType === 'admin'
              ? 'Sign in to manage the competition'
              : 'Sign in with your company name and password'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">
                {loginType === 'admin' ? 'Username' : 'Company Name'}
              </Label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={loginType === 'admin' ? 'Enter username' : 'Enter company name'}
                required
                className="bg-secondary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="bg-secondary/50"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {loginType === 'team' && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {"Don't have a team yet?"}{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AppShell showHeader={false}>
      <LoginContent />
    </AppShell>
  );
}
