import type {
  Team,
  TaskScore,
  SocialMediaScore,
  PresentationScore,
  TeamWithScores,
  AuthSession,
} from './types';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  const text = await res.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response from server');
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Teams
export async function getAllTeamsWithScores(): Promise<TeamWithScores[]> {
  const data = await apiFetch('/api/teams');
  return data.teams ?? [];
}

export async function getTeamWithScores(teamId: string): Promise<TeamWithScores | null> {
  try {
    const data = await apiFetch(`/api/teams/${teamId}`);
    return data.team;
  } catch {
    return null;
  }
}

export async function deleteTeam(id: string): Promise<void> {
  await apiFetch(`/api/teams/${id}`, { method: 'DELETE' });
}

export async function registerTeam(
  teamData: Omit<Team, 'id' | 'createdAt'>
): Promise<Team> {
  const data = await apiFetch('/api/teams', {
    method: 'POST',
    body: JSON.stringify(teamData),
  });
  return data.team;
}

// Task Scores
export async function saveTaskScore(
  score: Omit<TaskScore, 'id' | 'scoredAt'>
): Promise<TaskScore> {
  const data = await apiFetch('/api/scores/task', {
    method: 'POST',
    body: JSON.stringify(score),
  });
  return data.score;
}

export async function updateTaskScore(
  id: string,
  updates: Partial<Pick<TaskScore, 'taskName' | 'accuracy' | 'quality' | 'speed' | 'tools'>>
): Promise<TaskScore> {
  const data = await apiFetch(`/api/scores/task/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return data.score;
}

export async function deleteTaskScore(id: string): Promise<void> {
  await apiFetch(`/api/scores/task/${id}`, { method: 'DELETE' });
}

// Social Media Scores
export async function saveSocialScore(
  score: Omit<SocialMediaScore, 'id' | 'scoredAt'>
): Promise<SocialMediaScore> {
  const data = await apiFetch('/api/scores/social', {
    method: 'POST',
    body: JSON.stringify(score),
  });
  return data.score;
}

export async function updateSocialScore(
  id: string,
  updates: Partial<
    Pick<
      SocialMediaScore,
      | 'weekNumber'
      | 'contentQuality'
      | 'postingFrequency'
      | 'likes'
      | 'views'
      | 'followers'
      | 'comments'
    >
  >
): Promise<SocialMediaScore> {
  const data = await apiFetch(`/api/scores/social/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return data.score;
}

export async function deleteSocialScore(id: string): Promise<void> {
  await apiFetch(`/api/scores/social/${id}`, { method: 'DELETE' });
}

// Presentation Scores
export async function savePresentationScore(
  score: Omit<PresentationScore, 'id' | 'scoredAt'>
): Promise<PresentationScore> {
  const data = await apiFetch('/api/scores/presentation', {
    method: 'POST',
    body: JSON.stringify(score),
  });
  return data.score;
}

export async function updatePresentationScore(
  id: string,
  score: number
): Promise<PresentationScore> {
  const data = await apiFetch(`/api/scores/presentation/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ score }),
  });
  return data.score;
}

export async function deletePresentationScore(id: string): Promise<void> {
  await apiFetch(`/api/scores/presentation/${id}`, { method: 'DELETE' });
}

// Authentication
export async function loginAsTeam(
  companyName: string,
  password: string
): Promise<AuthSession> {
  try {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ type: 'team', identifier: companyName, password }),
    });
    return data.session;
  } catch {
    return null;
  }
}

export async function loginAsAdmin(
  username: string,
  password: string
): Promise<AuthSession> {
  try {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ type: 'admin', identifier: username, password }),
    });
    return data.session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthSession> {
  try {
    const data = await apiFetch('/api/auth/session');
    return data.session;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' });
}
