import type { 
  Team, 
  TaskScore, 
  SocialMediaScore, 
  PresentationScore,
  TeamWithScores,
  AuthSession 
} from './types';

const TEAMS_KEY = 'atlas_teams';
const TASK_SCORES_KEY = 'atlas_task_scores';
const SOCIAL_SCORES_KEY = 'atlas_social_scores';
const PRESENTATION_SCORES_KEY = 'atlas_presentation_scores';
const SESSION_KEY = 'atlas_session';

// Admin credentials
const ADMIN_USERNAME = 'leev';
const ADMIN_PASSWORD = '8702594qwe';

// Helper to generate IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Teams
export function getTeams(): Team[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(TEAMS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTeam(team: Team): void {
  const teams = getTeams();
  const existingIndex = teams.findIndex(t => t.id === team.id);
  if (existingIndex >= 0) {
    teams[existingIndex] = team;
  } else {
    teams.push(team);
  }
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
}

export function getTeamById(id: string): Team | undefined {
  return getTeams().find(t => t.id === id);
}

export function deleteTeam(id: string): void {
  const teams = getTeams().filter(t => t.id !== id);
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
  
  // Also delete associated scores
  const taskScores = getTaskScores().filter(s => s.teamId !== id);
  localStorage.setItem(TASK_SCORES_KEY, JSON.stringify(taskScores));
  
  const socialScores = getSocialScores().filter(s => s.teamId !== id);
  localStorage.setItem(SOCIAL_SCORES_KEY, JSON.stringify(socialScores));
  
  const presentationScores = getPresentationScores().filter(s => s.teamId !== id);
  localStorage.setItem(PRESENTATION_SCORES_KEY, JSON.stringify(presentationScores));
}

// Task Scores
export function getTaskScores(): TaskScore[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(TASK_SCORES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTaskScore(score: TaskScore): void {
  const scores = getTaskScores();
  const existingIndex = scores.findIndex(s => s.id === score.id);
  if (existingIndex >= 0) {
    scores[existingIndex] = score;
  } else {
    scores.push(score);
  }
  localStorage.setItem(TASK_SCORES_KEY, JSON.stringify(scores));
}

export function getTaskScoresForTeam(teamId: string): TaskScore[] {
  return getTaskScores().filter(s => s.teamId === teamId);
}

export function deleteTaskScore(id: string): void {
  const scores = getTaskScores().filter(s => s.id !== id);
  localStorage.setItem(TASK_SCORES_KEY, JSON.stringify(scores));
}

// Social Media Scores
export function getSocialScores(): SocialMediaScore[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(SOCIAL_SCORES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveSocialScore(score: SocialMediaScore): void {
  const scores = getSocialScores();
  const existingIndex = scores.findIndex(s => s.id === score.id);
  if (existingIndex >= 0) {
    scores[existingIndex] = score;
  } else {
    scores.push(score);
  }
  localStorage.setItem(SOCIAL_SCORES_KEY, JSON.stringify(scores));
}

export function getSocialScoresForTeam(teamId: string): SocialMediaScore[] {
  return getSocialScores().filter(s => s.teamId === teamId);
}

export function deleteSocialScore(id: string): void {
  const scores = getSocialScores().filter(s => s.id !== id);
  localStorage.setItem(SOCIAL_SCORES_KEY, JSON.stringify(scores));
}

// Presentation Scores
export function getPresentationScores(): PresentationScore[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(PRESENTATION_SCORES_KEY);
  return data ? JSON.parse(data) : [];
}

export function savePresentationScore(score: PresentationScore): void {
  const scores = getPresentationScores();
  const existingIndex = scores.findIndex(s => s.teamId === score.teamId);
  if (existingIndex >= 0) {
    scores[existingIndex] = score;
  } else {
    scores.push(score);
  }
  localStorage.setItem(PRESENTATION_SCORES_KEY, JSON.stringify(scores));
}

export function getPresentationScoreForTeam(teamId: string): PresentationScore | undefined {
  return getPresentationScores().find(s => s.teamId === teamId);
}

// Calculate team totals
export function calculateTeamWithScores(team: Team): TeamWithScores {
  const taskScores = getTaskScoresForTeam(team.id);
  const socialScores = getSocialScoresForTeam(team.id);
  const presentationScore = getPresentationScoreForTeam(team.id);

  // Sum up task scores (each task has accuracy + quality + speed + tools = max 40 per task)
  const totalTaskPoints = taskScores.reduce((sum, score) => {
    return sum + score.accuracy + score.quality + score.speed + score.tools;
  }, 0);

  // Sum up social scores (each week has 6 categories = max 60 per week)
  const totalSocialPoints = socialScores.reduce((sum, score) => {
    return sum + score.contentQuality + score.postingFrequency + 
           score.likes + score.views + score.followers + score.comments;
  }, 0);

  // Presentation score (max 10)
  const totalPresentationPoints = presentationScore?.score || 0;

  return {
    ...team,
    taskScores,
    socialScores,
    presentationScore,
    totalTaskPoints,
    totalSocialPoints,
    totalPresentationPoints,
    grandTotal: totalTaskPoints + totalSocialPoints + totalPresentationPoints
  };
}

export function getAllTeamsWithScores(): TeamWithScores[] {
  const teams = getTeams();
  return teams
    .map(calculateTeamWithScores)
    .sort((a, b) => b.grandTotal - a.grandTotal);
}

// Authentication
export function loginAsTeam(companyName: string, password: string): AuthSession {
  const teams = getTeams();
  const team = teams.find(
    t => t.companyName.toLowerCase() === companyName.toLowerCase() && t.password === password
  );
  
  if (team) {
    const session: AuthSession = { type: 'team', id: team.id, name: team.companyName };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }
  return null;
}

export function loginAsAdmin(username: string, password: string): AuthSession {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const session: AuthSession = { type: 'admin', id: 'admin', name: 'Lingua HQ Admin' };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }
  return null;
}

export function getSession(): AuthSession {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function registerTeam(teamData: Omit<Team, 'id' | 'createdAt'>): Team {
  const team: Team = {
    ...teamData,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  saveTeam(team);
  return team;
}
