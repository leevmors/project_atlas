'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/auth-provider';
import { AppShell } from '@/components/app-shell';
import { loginAsTeam, loginAsAdmin } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Users, Shield } from 'lucide-react';

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
            <Image
              src="/images/logo.png"
              alt="Project Atlas Logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <span className="text-2xl font-bold tracking-tight text-white drop-shadow-lg">
              Project Atlas
            </span>
          </Link>
        </div>

        {/* Login type selector */}
        <div className="flex gap-2 p-1 mb-8 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40">
          <button
            type="button"
            onClick={() => setLoginType('team')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              loginType === 'team'
                ? 'bg-white text-slate-800 shadow-md'
                : 'text-slate-500 hover:text-slate-700'
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
                ? 'bg-white text-slate-800 shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Shield className="h-4 w-4" />
            Admin Login
          </button>
        </div>

        {/* Login form */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/85 backdrop-blur-sm border border-white/50 shadow-lg">
          <h1 className="text-xl font-bold text-slate-800 mb-1">
            {loginType === 'admin' ? 'Admin Login' : 'Team Login'}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            {loginType === 'admin'
              ? 'Sign in to manage the competition'
              : 'Sign in with your company name and password'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-slate-700">
                {loginType === 'admin' ? 'Username' : 'Company Name'}
              </Label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={loginType === 'admin' ? 'Enter username' : 'Enter company name'}
                required
                className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-800 text-white hover:bg-slate-700"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {loginType === 'team' && (
            <p className="mt-6 text-center text-sm text-slate-500">
              {"Don't have a team yet?"}{' '}
              <Link href="/register" className="text-slate-800 hover:underline font-medium">
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
