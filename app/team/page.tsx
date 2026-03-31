'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { AppShell } from '@/components/app-shell';
import { getAllTeamsWithScores } from '@/lib/store';
import type { TeamWithScores } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trophy,
  FileText,
  Share2,
  Instagram,
  AtSign,
  Mail,
  Users,
  TrendingUp,
  Target,
  Award,
} from 'lucide-react';

function TeamContent() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const [team, setTeam] = useState<TeamWithScores | null>(null);
  const [rank, setRank] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!session || session.type !== 'team')) {
      router.push('/login');
      return;
    }

    if (session?.type === 'team') {
      getAllTeamsWithScores()
        .then((allTeams) => {
          const found = allTeams.find((t) => t.id === session.id);
          if (found) {
            setTeam(found);
            const teamRank = allTeams.findIndex((t) => t.id === session.id) + 1;
            setRank(teamRank);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [session, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <Trophy className="relative h-12 w-12 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm">Loading your team...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Team not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Team header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              Rank #{rank}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
            {team.companyName}
          </h1>
          <p className="text-muted-foreground">Your team dashboard and performance overview</p>
        </div>

        {/* Score overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/40 backdrop-blur-md border-border/50">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div className="font-display text-3xl font-bold text-foreground">
                {team.grandTotal}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                Total Points
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-md border-border/50">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-chart-1/10 mb-3">
                <FileText className="h-6 w-6 text-chart-1" />
              </div>
              <div className="font-display text-3xl font-bold text-foreground">
                {team.totalTaskPoints}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                Task Points
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-md border-border/50">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-chart-2/10 mb-3">
                <Share2 className="h-6 w-6 text-chart-2" />
              </div>
              <div className="font-display text-3xl font-bold text-foreground">
                {team.totalSocialPoints}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                Social Points
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-md border-border/50">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-chart-3/10 mb-3">
                <Target className="h-6 w-6 text-chart-3" />
              </div>
              <div className="font-display text-3xl font-bold text-foreground">
                {team.totalPresentationPoints}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                Presentation
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team info and members */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Team info */}
          <Card className="bg-card/40 backdrop-blur-md border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Team Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm font-medium text-foreground">{team.email}</div>
                </div>
              </div>

              {team.instagram && (
                <a
                  href={`https://instagram.com/${team.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <Instagram className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Instagram</div>
                    <div className="text-sm font-medium text-foreground">{team.instagram}</div>
                  </div>
                </a>
              )}

              {team.threads && (
                <a
                  href={`https://threads.net/${team.threads.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <AtSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Threads</div>
                    <div className="text-sm font-medium text-foreground">{team.threads}</div>
                  </div>
                </a>
              )}
            </CardContent>
          </Card>

          {/* Team members */}
          <Card className="bg-card/40 backdrop-blur-md border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Members ({team.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.members.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-primary">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{member.name}</div>
                      {member.role && (
                        <div className="text-xs text-muted-foreground">{member.role}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task scores */}
        <Card className="bg-card/40 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Task Scores ({team.taskScores.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {team.taskScores.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No task scores yet. Complete tasks to earn points!
              </p>
            ) : (
              <div className="space-y-3">
                {team.taskScores.map((score) => (
                  <div key={score.id} className="p-4 rounded-xl bg-secondary/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-foreground">{score.taskName}</h4>
                      <span className="font-display font-bold text-primary">
                        {score.accuracy + score.quality + score.speed + score.tools} pts
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-background/50">
                        <div className="text-xs text-muted-foreground">Accuracy</div>
                        <div className="font-semibold text-foreground">{score.accuracy}/10</div>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50">
                        <div className="text-xs text-muted-foreground">Quality</div>
                        <div className="font-semibold text-foreground">{score.quality}/10</div>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50">
                        <div className="text-xs text-muted-foreground">Speed</div>
                        <div className="font-semibold text-foreground">{score.speed}/10</div>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50">
                        <div className="text-xs text-muted-foreground">Tools</div>
                        <div className="font-semibold text-foreground">{score.tools}/10</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social media scores */}
        <Card className="bg-card/40 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Social Media Scores ({team.socialScores.length} weeks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {team.socialScores.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No social media scores yet. Post content to earn points!
              </p>
            ) : (
              <div className="space-y-3">
                {team.socialScores.map((score) => (
                  <div key={score.id} className="p-4 rounded-xl bg-secondary/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-foreground">Week {score.weekNumber}</h4>
                      <span className="font-display font-bold text-primary">
                        {score.contentQuality +
                          score.postingFrequency +
                          score.likes +
                          score.views +
                          score.followers +
                          score.comments}{' '}
                        pts
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-background/50">
                        <div className="text-xs text-muted-foreground">Quality</div>
                        <div className="font-semibold text-foreground">
                          {score.contentQuality}/10
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50">
                        <div className="text-xs text-muted-foreground">Freq</div>
                        <div className="font-semibold text-foreground">
                          {score.postingFrequency}/10
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50">
                        <div className="text-xs text-muted-foreground">Likes</div>
                        <div className="font-semibold text-foreground">{score.likes}/10</div>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50">
                        <div className="text-xs text-muted-foreground">Views</div>
                        <div className="font-semibold text-foreground">{score.views}/10</div>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50">
                        <div className="text-xs text-muted-foreground">Follows</div>
                        <div className="font-semibold text-foreground">{score.followers}/10</div>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50">
                        <div className="text-xs text-muted-foreground">Comments</div>
                        <div className="font-semibold text-foreground">{score.comments}/10</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <AppShell>
      <TeamContent />
    </AppShell>
  );
}
