'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { AppShell } from '@/components/app-shell';
import { 
  getAllTeamsWithScores, 
  saveTaskScore, 
  saveSocialScore, 
  savePresentationScore,
  deleteTeam,
  deleteTaskScore,
  deleteSocialScore,
  generateId
} from '@/lib/store';
import type { TeamWithScores, TaskScore, SocialMediaScore, PresentationScore } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Award
} from 'lucide-react';

function AdminContent() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const [teams, setTeams] = useState<TeamWithScores[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'task' | 'social' | 'presentation'>('task');

  // Task score form
  const [taskForm, setTaskForm] = useState({
    teamId: '',
    taskName: '',
    accuracy: 0,
    quality: 0,
    speed: 0,
    tools: 0
  });

  // Social score form
  const [socialForm, setSocialForm] = useState({
    teamId: '',
    weekNumber: 1,
    contentQuality: 0,
    postingFrequency: 0,
    likes: 0,
    views: 0,
    followers: 0,
    comments: 0
  });

  // Presentation score form
  const [presentationForm, setPresentationForm] = useState({
    teamId: '',
    score: 0
  });

  const loadTeams = () => {
    const teamsWithScores = getAllTeamsWithScores();
    setTeams(teamsWithScores);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!authLoading && (!session || session.type !== 'admin')) {
      router.push('/login');
      return;
    }

    if (session?.type === 'admin') {
      loadTeams();
    }
  }, [session, authLoading, router]);

  const handleAddTaskScore = (teamId: string) => {
    if (!taskForm.taskName.trim()) return;
    
    const score: TaskScore = {
      id: generateId(),
      teamId,
      taskName: taskForm.taskName,
      accuracy: taskForm.accuracy,
      quality: taskForm.quality,
      speed: taskForm.speed,
      tools: taskForm.tools,
      scoredAt: new Date().toISOString(),
      scoredBy: session?.name || 'admin'
    };
    
    saveTaskScore(score);
    setTaskForm({ teamId: '', taskName: '', accuracy: 0, quality: 0, speed: 0, tools: 0 });
    loadTeams();
  };

  const handleAddSocialScore = (teamId: string) => {
    const score: SocialMediaScore = {
      id: generateId(),
      teamId,
      weekNumber: socialForm.weekNumber,
      contentQuality: socialForm.contentQuality,
      postingFrequency: socialForm.postingFrequency,
      likes: socialForm.likes,
      views: socialForm.views,
      followers: socialForm.followers,
      comments: socialForm.comments,
      scoredAt: new Date().toISOString(),
      scoredBy: session?.name || 'admin'
    };
    
    saveSocialScore(score);
    setSocialForm({
      teamId: '',
      weekNumber: 1,
      contentQuality: 0,
      postingFrequency: 0,
      likes: 0,
      views: 0,
      followers: 0,
      comments: 0
    });
    loadTeams();
  };

  const handleAddPresentationScore = (teamId: string) => {
    const score: PresentationScore = {
      id: generateId(),
      teamId,
      score: presentationForm.score,
      scoredAt: new Date().toISOString(),
      scoredBy: session?.name || 'admin'
    };
    
    savePresentationScore(score);
    setPresentationForm({ teamId: '', score: 0 });
    loadTeams();
  };

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    if (confirm(`Are you sure you want to delete team "${teamName}"? This cannot be undone.`)) {
      deleteTeam(teamId);
      loadTeams();
    }
  };

  const handleDeleteTaskScore = (scoreId: string) => {
    if (confirm('Delete this task score?')) {
      deleteTaskScore(scoreId);
      loadTeams();
    }
  };

  const handleDeleteSocialScore = (scoreId: string) => {
    if (confirm('Delete this social media score?')) {
      deleteSocialScore(scoreId);
      loadTeams();
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <Shield className="relative h-12 w-12 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              Admin Panel
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Manage Competition
          </h1>
          <p className="text-muted-foreground">
            Award points to teams and manage the leaderboard
          </p>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/40 backdrop-blur-md border-border/50">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="font-display text-2xl font-bold text-foreground">{teams.length}</div>
              <div className="text-xs text-muted-foreground">Teams</div>
            </CardContent>
          </Card>
          <Card className="bg-card/40 backdrop-blur-md border-border/50">
            <CardContent className="p-4 text-center">
              <FileText className="h-6 w-6 text-chart-1 mx-auto mb-2" />
              <div className="font-display text-2xl font-bold text-foreground">
                {teams.reduce((sum, t) => sum + t.taskScores.length, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Task Scores</div>
            </CardContent>
          </Card>
          <Card className="bg-card/40 backdrop-blur-md border-border/50">
            <CardContent className="p-4 text-center">
              <Share2 className="h-6 w-6 text-chart-2 mx-auto mb-2" />
              <div className="font-display text-2xl font-bold text-foreground">
                {teams.reduce((sum, t) => sum + t.socialScores.length, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Social Scores</div>
            </CardContent>
          </Card>
          <Card className="bg-card/40 backdrop-blur-md border-border/50">
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 text-gold mx-auto mb-2" />
              <div className="font-display text-2xl font-bold text-foreground">
                {teams[0]?.grandTotal || 0}
              </div>
              <div className="text-xs text-muted-foreground">Top Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Teams list */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">Teams</h2>
          
          {teams.length === 0 ? (
            <Card className="bg-card/40 backdrop-blur-md border-border/50">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No teams registered yet.</p>
              </CardContent>
            </Card>
          ) : (
            teams.map((team, index) => (
              <Card 
                key={team.id} 
                className="bg-card/40 backdrop-blur-md border-border/50 overflow-hidden"
              >
                {/* Team header */}
                <div 
                  className="p-4 sm:p-6 cursor-pointer hover:bg-secondary/20 transition-colors"
                  onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-display font-bold text-primary">
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-foreground">{team.companyName}</h3>
                        <div className="text-sm text-muted-foreground">
                          {team.members.length} members | {team.email}
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

                {/* Expanded content */}
                {expandedTeam === team.id && (
                  <div className="border-t border-border/50 p-4 sm:p-6 space-y-6">
                    {/* Score tabs */}
                    <div className="flex gap-2 p-1 rounded-xl bg-secondary/30">
                      <button
                        onClick={() => setActiveTab('task')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === 'task' 
                            ? 'bg-card text-foreground shadow' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <FileText className="h-4 w-4 inline mr-1" />
                        Tasks
                      </button>
                      <button
                        onClick={() => setActiveTab('social')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === 'social' 
                            ? 'bg-card text-foreground shadow' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Share2 className="h-4 w-4 inline mr-1" />
                        Social
                      </button>
                      <button
                        onClick={() => setActiveTab('presentation')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === 'presentation' 
                            ? 'bg-card text-foreground shadow' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Award className="h-4 w-4 inline mr-1" />
                        Present
                      </button>
                    </div>

                    {/* Task scoring */}
                    {activeTab === 'task' && (
                      <div className="space-y-4">
                        <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Task Score
                        </h4>
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label>Task Name</Label>
                            <Input
                              placeholder="e.g., Translation Week 3"
                              value={taskForm.taskName}
                              onChange={(e) => setTaskForm({ ...taskForm, taskName: e.target.value })}
                              className="bg-secondary/50"
                            />
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label>Accuracy (0-10)</Label>
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                value={taskForm.accuracy}
                                onChange={(e) => setTaskForm({ ...taskForm, accuracy: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)) })}
                                className="bg-secondary/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Quality (0-10)</Label>
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                value={taskForm.quality}
                                onChange={(e) => setTaskForm({ ...taskForm, quality: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)) })}
                                className="bg-secondary/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Speed (0-10)</Label>
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                value={taskForm.speed}
                                onChange={(e) => setTaskForm({ ...taskForm, speed: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)) })}
                                className="bg-secondary/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Tools (0-10)</Label>
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                value={taskForm.tools}
                                onChange={(e) => setTaskForm({ ...taskForm, tools: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)) })}
                                className="bg-secondary/50"
                              />
                            </div>
                          </div>
                          <Button 
                            onClick={() => handleAddTaskScore(team.id)}
                            disabled={!taskForm.taskName.trim()}
                            className="w-full sm:w-auto"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Task Score ({taskForm.accuracy + taskForm.quality + taskForm.speed + taskForm.tools} pts)
                          </Button>
                        </div>

                        {/* Existing task scores */}
                        {team.taskScores.length > 0 && (
                          <div className="mt-6 space-y-2">
                            <h5 className="text-sm font-medium text-muted-foreground">Existing Task Scores</h5>
                            {team.taskScores.map((score) => (
                              <div key={score.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                                <div>
                                  <span className="font-medium text-foreground">{score.taskName}</span>
                                  <span className="text-muted-foreground ml-2">
                                    (A:{score.accuracy} Q:{score.quality} S:{score.speed} T:{score.tools})
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-display font-bold text-primary">
                                    {score.accuracy + score.quality + score.speed + score.tools} pts
                                  </span>
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
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Social scoring */}
                    {activeTab === 'social' && (
                      <div className="space-y-4">
                        <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Social Media Score
                        </h4>
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label>Week Number</Label>
                            <Input
                              type="number"
                              min={1}
                              max={14}
                              value={socialForm.weekNumber}
                              onChange={(e) => setSocialForm({ ...socialForm, weekNumber: parseInt(e.target.value) || 1 })}
                              className="bg-secondary/50 w-32"
                            />
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div className="space-y-2">
                              <Label>Content (0-10)</Label>
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                value={socialForm.contentQuality}
                                onChange={(e) => setSocialForm({ ...socialForm, contentQuality: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)) })}
                                className="bg-secondary/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Freq (0-10)</Label>
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                value={socialForm.postingFrequency}
                                onChange={(e) => setSocialForm({ ...socialForm, postingFrequency: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)) })}
                                className="bg-secondary/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Likes (0-10)</Label>
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                value={socialForm.likes}
                                onChange={(e) => setSocialForm({ ...socialForm, likes: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)) })}
                                className="bg-secondary/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Views (0-10)</Label>
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                value={socialForm.views}
                                onChange={(e) => setSocialForm({ ...socialForm, views: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)) })}
                                className="bg-secondary/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Follows (0-10)</Label>
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                value={socialForm.followers}
                                onChange={(e) => setSocialForm({ ...socialForm, followers: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)) })}
                                className="bg-secondary/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Comments (0-10)</Label>
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                value={socialForm.comments}
                                onChange={(e) => setSocialForm({ ...socialForm, comments: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)) })}
                                className="bg-secondary/50"
                              />
                            </div>
                          </div>
                          <Button 
                            onClick={() => handleAddSocialScore(team.id)}
                            className="w-full sm:w-auto"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Social Score ({socialForm.contentQuality + socialForm.postingFrequency + socialForm.likes + socialForm.views + socialForm.followers + socialForm.comments} pts)
                          </Button>
                        </div>

                        {/* Existing social scores */}
                        {team.socialScores.length > 0 && (
                          <div className="mt-6 space-y-2">
                            <h5 className="text-sm font-medium text-muted-foreground">Existing Social Scores</h5>
                            {team.socialScores.map((score) => (
                              <div key={score.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                                <div>
                                  <span className="font-medium text-foreground">Week {score.weekNumber}</span>
                                  <span className="text-muted-foreground ml-2 text-sm">
                                    (C:{score.contentQuality} F:{score.postingFrequency} L:{score.likes} V:{score.views} Fo:{score.followers} Co:{score.comments})
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-display font-bold text-primary">
                                    {score.contentQuality + score.postingFrequency + score.likes + score.views + score.followers + score.comments} pts
                                  </span>
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
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Presentation scoring */}
                    {activeTab === 'presentation' && (
                      <div className="space-y-4">
                        <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Presentation Score (Week 14)
                        </h4>
                        {team.presentationScore ? (
                          <div className="p-4 rounded-lg bg-secondary/30">
                            <div className="flex items-center justify-between">
                              <span className="text-foreground">Current Score:</span>
                              <span className="font-display text-2xl font-bold text-primary">
                                {team.presentationScore.score}/10
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Scored on {new Date(team.presentationScore.scoredAt).toLocaleDateString()}
                            </p>
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
                                onChange={(e) => setPresentationForm({ ...presentationForm, score: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)) })}
                                className="bg-secondary/50 w-32"
                              />
                            </div>
                            <Button 
                              onClick={() => handleAddPresentationScore(team.id)}
                              className="w-full sm:w-auto"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save Presentation Score
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delete team */}
                    <div className="pt-4 border-t border-border/50">
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
