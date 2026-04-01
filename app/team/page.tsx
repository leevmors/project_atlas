'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { AppShell } from '@/components/app-shell';
import { getAllTeamsWithScores, getTeamWithScores, updateTeam } from '@/lib/store';
import type { TeamWithScores, TeamMember } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Pencil,
  Save,
  X,
  Plus,
  Hash,
} from 'lucide-react';

function TeamContent() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const [team, setTeam] = useState<TeamWithScores | null>(null);
  const [rank, setRank] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editInstagram, setEditInstagram] = useState('');
  const [editThreads, setEditThreads] = useState('');
  const [editGroupNumber, setEditGroupNumber] = useState('');
  const [editMembers, setEditMembers] = useState<TeamMember[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!authLoading && (!session || session.type !== 'team')) {
      router.push('/login');
      return;
    }

    if (session?.type === 'team') {
      Promise.all([
        getTeamWithScores(session.id),
        getAllTeamsWithScores(),
      ])
        .then(([ownTeam, allTeams]) => {
          if (ownTeam) {
            setTeam(ownTeam);
            const teamRank = allTeams.findIndex((t) => t.id === session.id) + 1;
            setRank(teamRank > 0 ? teamRank : allTeams.length);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, authLoading]);

  const startEditing = () => {
    setEditInstagram(team?.instagram ?? '');
    setEditThreads(team?.threads ?? '');
    setEditGroupNumber(team?.groupNumber ?? '');
    setEditMembers(team?.members ? team.members.map(m => ({ ...m })) : [{ name: '', role: '' }]);
    setIsEditing(true);
    setSaveError('');
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveError('');
  };

  const addEditMember = () => {
    if (editMembers.length < 10) {
      setEditMembers([...editMembers, { name: '', role: '' }]);
    }
  };

  const removeEditMember = (index: number) => {
    if (editMembers.length > 1) {
      setEditMembers(editMembers.filter((_, i) => i !== index));
    }
  };

  const updateEditMember = (index: number, field: keyof TeamMember, value: string) => {
    setEditMembers(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const handleSave = async () => {
    const validMembers = editMembers.filter(m => m.name.trim());
    if (validMembers.length === 0) {
      setSaveError('At least one member is required.');
      return;
    }
    setIsSaving(true);
    setSaveError('');
    try {
      await updateTeam(team!.id, {
        instagram: editInstagram || undefined,
        threads: editThreads || undefined,
        groupNumber: editGroupNumber || undefined,
        members: validMembers,
      });
      const updated = await getTeamWithScores(team!.id);
      if (updated) setTeam(updated);
      setIsEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Trophy className="h-12 w-12 text-white/70 animate-pulse" />
          <p className="text-white/60 text-sm">Loading your team...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">Team not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 pt-32 md:pt-36">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Team header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 mb-4">
            <Award className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-slate-700 uppercase tracking-wider">
              Rank #{rank}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg mb-2">
            {team.companyName}
          </h1>
          <p className="text-white/60">Your team dashboard and performance overview</p>
        </div>

        {/* Score overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/85 backdrop-blur-sm border-white/50 shadow-md">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 mb-3">
                <Trophy className="h-6 w-6 text-slate-700" />
              </div>
              <div className="font-display text-3xl font-bold text-foreground">
                {team.grandTotal}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                Total Points
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/85 backdrop-blur-sm border-white/50 shadow-md">
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

          <Card className="bg-white/85 backdrop-blur-sm border-white/50 shadow-md">
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

          <Card className="bg-white/85 backdrop-blur-sm border-white/50 shadow-md">
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
          <Card className="bg-white/85 backdrop-blur-sm border-white/50 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-slate-700" />
                  Team Information
                </CardTitle>
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={startEditing} className="text-muted-foreground hover:text-slate-700">
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="editInstagram">Instagram Handle</Label>
                    <Input
                      id="editInstagram"
                      value={editInstagram}
                      onChange={(e) => setEditInstagram(e.target.value)}
                      placeholder="@yourcompany"
                      className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editThreads">Threads Handle</Label>
                    <Input
                      id="editThreads"
                      value={editThreads}
                      onChange={(e) => setEditThreads(e.target.value)}
                      placeholder="@yourcompany"
                      className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editGroupNumber">Group Number</Label>
                    <Input
                      id="editGroupNumber"
                      value={editGroupNumber}
                      onChange={(e) => setEditGroupNumber(e.target.value)}
                      placeholder="e.g. 301-1"
                      className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div className="text-sm font-medium text-foreground">{team.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80">
                    <Instagram className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Instagram</div>
                      <div className="text-sm font-medium text-foreground">
                        {team.instagram ? (
                          <a
                            href={`https://instagram.com/${team.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-slate-700 transition-colors"
                          >
                            {team.instagram}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80">
                    <AtSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Threads</div>
                      <div className="text-sm font-medium text-foreground">
                        {team.threads ? (
                          <a
                            href={`https://threads.net/${team.threads.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-slate-700 transition-colors"
                          >
                            {team.threads}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80">
                    <Hash className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Group Number</div>
                      <div className="text-sm font-medium text-foreground">
                        {team.groupNumber || <span className="text-muted-foreground">Not set</span>}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Team members */}
          <Card className="bg-white/85 backdrop-blur-sm border-white/50 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-slate-700" />
                  Team Members ({isEditing ? editMembers.filter(m => m.name.trim()).length : (team.members?.length ?? 0)})
                </CardTitle>
                {isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addEditMember}
                    disabled={editMembers.length >= 10}
                    className="text-slate-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-3">
                  {editMembers.map((member, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 grid gap-2 sm:grid-cols-2">
                        <Input
                          value={member.name}
                          onChange={(e) => updateEditMember(index, 'name', e.target.value)}
                          placeholder="Member name"
                          className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400"
                        />
                        <Input
                          value={member.role}
                          onChange={(e) => updateEditMember(index, 'role', e.target.value)}
                          placeholder="Role (e.g. Translator)"
                          className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400"
                        />
                      </div>
                      {editMembers.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEditMember(index)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {(team.members ?? []).map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-display font-bold text-slate-600">
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Save/Cancel bar when editing */}
        {isEditing && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/85 backdrop-blur-sm border border-white/50 shadow-md">
            <div className="flex-1">
              {saveError && (
                <p className="text-red-600 text-sm">{saveError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={cancelEditing} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-slate-800 text-white hover:bg-slate-700">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}

        {/* Task scores */}
        <Card className="bg-white/85 backdrop-blur-sm border-white/50 shadow-md">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-700" />
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
                  <div key={score.id} className="p-4 rounded-xl bg-slate-50/80">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-foreground">{score.taskName}</h4>
                      <span className="font-display font-bold text-slate-700">
                        {score.accuracy + score.quality + score.speed + score.tools} pts
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-white/60">
                        <div className="text-xs text-muted-foreground">Accuracy</div>
                        <div className="font-semibold text-foreground">{score.accuracy}/10</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/60">
                        <div className="text-xs text-muted-foreground">Quality</div>
                        <div className="font-semibold text-foreground">{score.quality}/10</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/60">
                        <div className="text-xs text-muted-foreground">Speed</div>
                        <div className="font-semibold text-foreground">{score.speed}/10</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/60">
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
        <Card className="bg-white/85 backdrop-blur-sm border-white/50 shadow-md">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Share2 className="h-5 w-5 text-slate-700" />
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
                  <div key={score.id} className="p-4 rounded-xl bg-slate-50/80">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-foreground">Week {score.weekNumber}</h4>
                      <span className="font-display font-bold text-slate-700">
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
                      <div className="p-2 rounded-lg bg-white/60">
                        <div className="text-xs text-muted-foreground">Quality</div>
                        <div className="font-semibold text-foreground">
                          {score.contentQuality}/10
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/60">
                        <div className="text-xs text-muted-foreground">Freq</div>
                        <div className="font-semibold text-foreground">
                          {score.postingFrequency}/10
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/60">
                        <div className="text-xs text-muted-foreground">Likes</div>
                        <div className="font-semibold text-foreground">{score.likes}/10</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/60">
                        <div className="text-xs text-muted-foreground">Views</div>
                        <div className="font-semibold text-foreground">{score.views}/10</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/60">
                        <div className="text-xs text-muted-foreground">Follows</div>
                        <div className="font-semibold text-foreground">{score.followers}/10</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/60">
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
