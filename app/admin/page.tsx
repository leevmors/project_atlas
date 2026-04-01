'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { AppShell } from '@/components/app-shell';
import {
  getAllTeamsWithScores,
  saveTaskScore,
  updateTaskScore,
  deleteTaskScore,
  saveSocialScore,
  updateSocialScore,
  deleteSocialScore,
  savePresentationScore,
  updatePresentationScore,
  deletePresentationScore,
  deleteTeam,
} from '@/lib/store';
import type { TeamWithScores, TaskScore, SocialMediaScore } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Shield,
  Trophy,
  FileText,
  Share2,
  Users,
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  Award,
  Pencil,
  X,
} from 'lucide-react';

type TaskEditForm = Pick<TaskScore, 'taskName' | 'accuracy' | 'quality' | 'speed' | 'tools'>;
type SocialEditForm = Pick<
  SocialMediaScore,
  'weekNumber' | 'contentQuality' | 'postingFrequency' | 'likes' | 'views' | 'followers' | 'comments'
>;

const DEFAULT_TASK_FORM: TaskEditForm = { taskName: '', accuracy: 0, quality: 0, speed: 0, tools: 0 };
const DEFAULT_SOCIAL_FORM: SocialEditForm = {
  weekNumber: 1,
  contentQuality: 0,
  postingFrequency: 0,
  likes: 0,
  views: 0,
  followers: 0,
  comments: 0,
};

function clamp(val: number, min = 0, max = 10) {
  return Math.min(max, Math.max(min, val));
}

function AdminContent() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const [teams, setTeams] = useState<TeamWithScores[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'task' | 'social' | 'presentation'>('task');

  const [taskForm, setTaskForm] = useState<TaskEditForm>(DEFAULT_TASK_FORM);
  const [socialForm, setSocialForm] = useState<SocialEditForm>(DEFAULT_SOCIAL_FORM);
  const [presentationForm, setPresentationForm] = useState({ score: 0 });

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskForm, setEditTaskForm] = useState<TaskEditForm>(DEFAULT_TASK_FORM);
  const [editingSocialId, setEditingSocialId] = useState<string | null>(null);
  const [editSocialForm, setEditSocialForm] = useState<SocialEditForm>(DEFAULT_SOCIAL_FORM);

  const loadTeams = useCallback(async () => {
    try {
      const teamsWithScores = await getAllTeamsWithScores();
      setTeams(teamsWithScores);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!session || session.type !== 'admin')) {
      router.push('/login');
      return;
    }
    if (session?.type === 'admin') {
      loadTeams();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, authLoading]);

  const handleAddTaskScore = async (teamId: string) => {
    if (!taskForm.taskName.trim()) return;
    try {
      await saveTaskScore({ teamId, ...taskForm, scoredBy: session?.name ?? 'admin' });
      setTaskForm(DEFAULT_TASK_FORM);
      await loadTeams();
    } catch (err) {
      console.error('Failed to save task score:', err);
    }
  };

  const handleUpdateTaskScore = async () => {
    if (!editingTaskId) return;
    try {
      await updateTaskScore(editingTaskId, editTaskForm);
      setEditingTaskId(null);
      await loadTeams();
    } catch (err) {
      console.error('Failed to update task score:', err);
    }
  };

  const handleDeleteTaskScore = async (scoreId: string) => {
    if (!confirm('Delete this task score?')) return;
    try {
      await deleteTaskScore(scoreId);
      await loadTeams();
    } catch (err) {
      console.error('Failed to delete task score:', err);
    }
  };

  const handleAddSocialScore = async (teamId: string) => {
    try {
      await saveSocialScore({ teamId, ...socialForm, scoredBy: session?.name ?? 'admin' });
      setSocialForm(DEFAULT_SOCIAL_FORM);
      await loadTeams();
    } catch (err) {
      console.error('Failed to save social score:', err);
    }
  };

  const handleUpdateSocialScore = async () => {
    if (!editingSocialId) return;
    try {
      await updateSocialScore(editingSocialId, editSocialForm);
      setEditingSocialId(null);
      await loadTeams();
    } catch (err) {
      console.error('Failed to update social score:', err);
    }
  };

  const handleDeleteSocialScore = async (scoreId: string) => {
    if (!confirm('Delete this social media score?')) return;
    try {
      await deleteSocialScore(scoreId);
      await loadTeams();
    } catch (err) {
      console.error('Failed to delete social score:', err);
    }
  };

  const handleAddPresentationScore = async (teamId: string) => {
    try {
      await savePresentationScore({ teamId, score: presentationForm.score, scoredBy: session?.name ?? 'admin' });
      setPresentationForm({ score: 0 });
      await loadTeams();
    } catch (err) {
      console.error('Failed to save presentation score:', err);
    }
  };

  const handleEditPresentationScore = async (scoreId: string, newScore: number) => {
    try {
      await updatePresentationScore(scoreId, newScore);
      await loadTeams();
    } catch (err) {
      console.error('Failed to update presentation score:', err);
    }
  };

  const handleDeletePresentationScore = async (scoreId: string) => {
    if (!confirm('Delete this presentation score?')) return;
    try {
      await deletePresentationScore(scoreId);
      await loadTeams();
    } catch (err) {
      console.error('Failed to delete presentation score:', err);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Delete team "${teamName}"? This cannot be undone.`)) return;
    try {
      await deleteTeam(teamId);
      await loadTeams();
    } catch (err) {
      console.error('Failed to delete team:', err);
    }
  };

  const startEditTask = (score: TaskScore) => {
    setEditingTaskId(score.id);
    setEditTaskForm({
      taskName: score.taskName,
      accuracy: score.accuracy,
      quality: score.quality,
      speed: score.speed,
      tools: score.tools,
    });
  };

  const startEditSocial = (score: SocialMediaScore) => {
    setEditingSocialId(score.id);
    setEditSocialForm({
      weekNumber: score.weekNumber,
      contentQuality: score.contentQuality,
      postingFrequency: score.postingFrequency,
      likes: score.likes,
      views: score.views,
      followers: score.followers,
      comments: score.comments,
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Shield className="h-12 w-12 text-white/70 animate-pulse" />
          <p className="text-white/60 text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 pt-32 md:pt-36">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 mb-4">
            <Shield className="h-4 w-4 text-slate-700" />
            <span className="text-xs font-medium text-slate-700 uppercase tracking-wider">Admin Panel</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg mb-2">
            Manage Competition
          </h1>
          <p className="text-white/60">Award points to teams and manage the leaderboard</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Users className="h-6 w-6 text-slate-600" />, value: teams.length, label: 'Teams' },
            { icon: <FileText className="h-6 w-6 text-chart-1" />, value: teams.reduce((s, t) => s + t.taskScores.length, 0), label: 'Task Scores' },
            { icon: <Share2 className="h-6 w-6 text-chart-2" />, value: teams.reduce((s, t) => s + t.socialScores.length, 0), label: 'Social Scores' },
            { icon: <Trophy className="h-6 w-6 text-amber-500" />, value: teams[0]?.grandTotal ?? 0, label: 'Top Score' },
          ].map(({ icon, value, label }) => (
            <Card key={label} className="bg-white/85 backdrop-blur-sm border-white/50 shadow-md">
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">{icon}</div>
                <div className="font-display text-2xl font-bold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Teams */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white drop-shadow-md">Teams</h2>

          {teams.length === 0 ? (
            <Card className="bg-white/85 backdrop-blur-sm border-white/50 shadow-md">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No teams registered yet.</p>
              </CardContent>
            </Card>
          ) : (
            teams.map((team, index) => (
              <Card key={team.id} className="bg-white/85 backdrop-blur-sm border-white/50 shadow-md overflow-hidden">
                {/* Team header row */}
                <div
                  className="p-4 sm:p-6 cursor-pointer hover:bg-slate-50/60 transition-colors"
                  onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center font-display font-bold text-slate-600">
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-foreground">{team.companyName}</h3>
                        <div className="text-sm text-muted-foreground">
                          {team.members?.length ?? team.memberCount ?? 0} members | {team.email ?? ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="font-display text-xl font-bold text-foreground">{team.grandTotal}</div>
                        <div className="text-xs text-muted-foreground">Total Points</div>
                      </div>
                      {expandedTeam === team.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded scoring panel */}
                {expandedTeam === team.id && (
                  <div className="border-t border-slate-100 p-4 sm:p-6 space-y-6">
                    {/* Tab switcher */}
                    <div className="flex gap-2 p-1 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40">
                      {(['task', 'social', 'presentation'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === tab
                              ? 'bg-white text-slate-800 shadow'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {tab === 'task' && <FileText className="h-4 w-4 inline mr-1" />}
                          {tab === 'social' && <Share2 className="h-4 w-4 inline mr-1" />}
                          {tab === 'presentation' && <Award className="h-4 w-4 inline mr-1" />}
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* ── TASK TAB ── */}
                    {activeTab === 'task' && (
                      <div className="space-y-4">
                        <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Task Score
                        </h4>
                        <div className="space-y-2">
                          <Label>Task Name</Label>
                          <Input
                            placeholder="e.g., Translation Week 3"
                            value={taskForm.taskName}
                            onChange={(e) => setTaskForm({ ...taskForm, taskName: e.target.value })}
                            className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400"
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {(['accuracy', 'quality', 'speed', 'tools'] as const).map((field) => (
                            <div key={field} className="space-y-2">
                              <Label>{field.charAt(0).toUpperCase() + field.slice(1)} (0-10)</Label>
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                value={taskForm[field]}
                                onChange={(e) => setTaskForm({ ...taskForm, [field]: clamp(parseInt(e.target.value) || 0) })}
                                className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400"
                              />
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => handleAddTaskScore(team.id)}
                          disabled={!taskForm.taskName.trim()}
                          className="w-full sm:w-auto"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save ({taskForm.accuracy + taskForm.quality + taskForm.speed + taskForm.tools} pts)
                        </Button>

                        {/* Existing task scores */}
                        {team.taskScores.length > 0 && (
                          <div className="mt-6 space-y-2">
                            <h5 className="text-sm font-medium text-muted-foreground">Existing Task Scores</h5>
                            {team.taskScores.map((score) =>
                              editingTaskId === score.id ? (
                                <div key={score.id} className="p-3 rounded-lg bg-white/90 border border-slate-200 space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Task Name</Label>
                                    <Input
                                      value={editTaskForm.taskName}
                                      onChange={(e) => setEditTaskForm({ ...editTaskForm, taskName: e.target.value })}
                                      className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400 h-8 text-sm"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 gap-2">
                                    {(['accuracy', 'quality', 'speed', 'tools'] as const).map((f) => (
                                      <div key={f} className="space-y-1">
                                        <Label className="text-xs capitalize">{f}</Label>
                                        <Input
                                          type="number"
                                          min={0}
                                          max={10}
                                          value={editTaskForm[f]}
                                          onChange={(e) => setEditTaskForm({ ...editTaskForm, [f]: clamp(parseInt(e.target.value) || 0) })}
                                          className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400 h-8 text-sm"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={handleUpdateTaskScore}>
                                      <Save className="h-3 w-3 mr-1" />
                                      Save
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingTaskId(null)}>
                                      <X className="h-3 w-3 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div key={score.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80">
                                  <div>
                                    <span className="font-medium text-foreground">{score.taskName}</span>
                                    <span className="text-muted-foreground ml-2 text-sm">
                                      (A:{score.accuracy} Q:{score.quality} S:{score.speed} T:{score.tools})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-display font-bold text-slate-700">
                                      {score.accuracy + score.quality + score.speed + score.tools} pts
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => startEditTask(score)}
                                      className="text-muted-foreground hover:text-slate-700"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteTaskScore(score.id)}
                                      className="text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── SOCIAL TAB ── */}
                    {activeTab === 'social' && (
                      <div className="space-y-4">
                        <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Social Media Score
                        </h4>
                        <div className="space-y-2">
                          <Label>Week Number</Label>
                          <Input
                            type="number"
                            min={1}
                            max={14}
                            value={socialForm.weekNumber}
                            onChange={(e) => setSocialForm({ ...socialForm, weekNumber: parseInt(e.target.value) || 1 })}
                            className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400 w-32"
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                          {(
                            [
                              ['contentQuality', 'Content'],
                              ['postingFrequency', 'Freq'],
                              ['likes', 'Likes'],
                              ['views', 'Views'],
                              ['followers', 'Follows'],
                              ['comments', 'Comments'],
                            ] as const
                          ).map(([field, label]) => (
                            <div key={field} className="space-y-2">
                              <Label>{label} (0-10)</Label>
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                value={socialForm[field]}
                                onChange={(e) => setSocialForm({ ...socialForm, [field]: clamp(parseInt(e.target.value) || 0) })}
                                className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400"
                              />
                            </div>
                          ))}
                        </div>
                        <Button onClick={() => handleAddSocialScore(team.id)} className="w-full sm:w-auto">
                          <Save className="h-4 w-4 mr-2" />
                          Save ({socialForm.contentQuality + socialForm.postingFrequency + socialForm.likes + socialForm.views + socialForm.followers + socialForm.comments} pts)
                        </Button>

                        {/* Existing social scores */}
                        {team.socialScores.length > 0 && (
                          <div className="mt-6 space-y-2">
                            <h5 className="text-sm font-medium text-muted-foreground">Existing Social Scores</h5>
                            {team.socialScores.map((score) =>
                              editingSocialId === score.id ? (
                                <div key={score.id} className="p-3 rounded-lg bg-white/90 border border-slate-200 space-y-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Week</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={14}
                                      value={editSocialForm.weekNumber}
                                      onChange={(e) => setEditSocialForm({ ...editSocialForm, weekNumber: parseInt(e.target.value) || 1 })}
                                      className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400 h-8 w-24 text-sm"
                                    />
                                  </div>
                                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {(
                                      [
                                        ['contentQuality', 'Content'],
                                        ['postingFrequency', 'Freq'],
                                        ['likes', 'Likes'],
                                        ['views', 'Views'],
                                        ['followers', 'Follows'],
                                        ['comments', 'Comments'],
                                      ] as const
                                    ).map(([field, label]) => (
                                      <div key={field} className="space-y-1">
                                        <Label className="text-xs">{label}</Label>
                                        <Input
                                          type="number"
                                          min={0}
                                          max={10}
                                          value={editSocialForm[field]}
                                          onChange={(e) => setEditSocialForm({ ...editSocialForm, [field]: clamp(parseInt(e.target.value) || 0) })}
                                          className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400 h-8 text-sm"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={handleUpdateSocialScore}>
                                      <Save className="h-3 w-3 mr-1" />
                                      Save
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingSocialId(null)}>
                                      <X className="h-3 w-3 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div key={score.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80">
                                  <div>
                                    <span className="font-medium text-foreground">Week {score.weekNumber}</span>
                                    <span className="text-muted-foreground ml-2 text-sm">
                                      (C:{score.contentQuality} F:{score.postingFrequency} L:{score.likes} V:{score.views} Fo:{score.followers} Co:{score.comments})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-display font-bold text-slate-700">
                                      {score.contentQuality + score.postingFrequency + score.likes + score.views + score.followers + score.comments} pts
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => startEditSocial(score)}
                                      className="text-muted-foreground hover:text-slate-700"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteSocialScore(score.id)}
                                      className="text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── PRESENTATION TAB ── */}
                    {activeTab === 'presentation' && (
                      <div className="space-y-4">
                        <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Presentation Score (Week 14)
                        </h4>
                        {team.presentationScore ? (
                          <div className="p-4 rounded-lg bg-slate-50/80 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-foreground">Current Score:</span>
                              <span className="font-display text-2xl font-bold text-slate-700">
                                {team.presentationScore.score}/10
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Scored on {new Date(team.presentationScore.scoredAt).toLocaleDateString()}
                            </p>
                            <div className="flex items-end gap-3 pt-2 border-t border-border/30">
                              <div className="space-y-1">
                                <Label className="text-xs">Update Score (0-10)</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={10}
                                  value={presentationForm.score}
                                  onChange={(e) => setPresentationForm({ score: clamp(parseInt(e.target.value) || 0) })}
                                  className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400 w-28"
                                />
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleEditPresentationScore(team.presentationScore!.id, presentationForm.score)}
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Update
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeletePresentationScore(team.presentationScore!.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <Label>Score (0-10)</Label>
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                value={presentationForm.score}
                                onChange={(e) => setPresentationForm({ score: clamp(parseInt(e.target.value) || 0) })}
                                className="bg-white/70 border-slate-200 text-slate-800 placeholder:text-slate-400 w-32"
                              />
                            </div>
                            <Button onClick={() => handleAddPresentationScore(team.id)} className="w-full sm:w-auto">
                              <Save className="h-4 w-4 mr-2" />
                              Save Presentation Score
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delete team */}
                    <div className="pt-4 border-t border-slate-100">
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteTeam(team.id, team.companyName)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Team
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AppShell>
      <AdminContent />
    </AppShell>
  );
}
