'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { AppShell } from '@/components/app-shell';
import { registerTeam, loginAsTeam } from '@/lib/store';
import type { TeamMember } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mountain, ArrowRight, Plus, X, Users } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const { setSession } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [instagram, setInstagram] = useState('');
  const [threads, setThreads] = useState('');
  const [email, setEmail] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([{ name: '', role: '' }]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const addMember = () => {
    if (members.length < 10) {
      setMembers([...members, { name: '', role: '' }]);
    }
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const validMembers = members.filter((m) => m.name.trim());
    if (validMembers.length === 0) {
      setError('Please add at least one team member.');
      return;
    }

    setIsLoading(true);

    try {
      await registerTeam({
        companyName,
        password,
        instagram: instagram || undefined,
        threads: threads || undefined,
        email,
        members: validMembers,
      });

      const session = await loginAsTeam(companyName, password);
      if (session) {
        setSession(session);
        router.push('/team');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to register team. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
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

        {/* Registration form */}
        <div className="p-6 sm:p-8 rounded-2xl bg-card/40 backdrop-blur-md border border-border/50">
          <h1 className="font-display text-xl font-bold text-foreground mb-1">
            Register Your Team
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Create your translation company account to join the competition
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company details */}
            <div className="space-y-4">
              <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
                Company Information
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your translation company"
                    required
                    className="bg-secondary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Team Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="team@example.com"
                    required
                    className="bg-secondary/50"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram Handle</Label>
                  <Input
                    id="instagram"
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@yourcompany"
                    className="bg-secondary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threads">Threads Handle</Label>
                  <Input
                    id="threads"
                    type="text"
                    value={threads}
                    onChange={(e) => setThreads(e.target.value)}
                    placeholder="@yourcompany"
                    className="bg-secondary/50"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-4">
              <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
                Security
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a password"
                    required
                    className="bg-secondary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                    className="bg-secondary/50"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Remember this password! You will need it to log in.
              </p>
            </div>

            {/* Team members */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
                  Team Members
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addMember}
                  disabled={members.length >= 10}
                  className="text-primary"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Member
                </Button>
              </div>

              <div className="space-y-3">
                {members.map((member, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1 grid gap-3 sm:grid-cols-2">
                      <Input
                        type="text"
                        value={member.name}
                        onChange={(e) => updateMember(index, 'name', e.target.value)}
                        placeholder="Member name"
                        className="bg-secondary/50"
                      />
                      <Input
                        type="text"
                        value={member.role}
                        onChange={(e) => updateMember(index, 'role', e.target.value)}
                        placeholder="Role (e.g., Translator, PM)"
                        className="bg-secondary/50"
                      />
                    </div>
                    {members.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMember(index)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
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
              <Users className="mr-2 h-4 w-4" />
              {isLoading ? 'Creating Team...' : 'Register Team'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have a team?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AppShell showHeader={false}>
      <RegisterContent />
    </AppShell>
  );
}
