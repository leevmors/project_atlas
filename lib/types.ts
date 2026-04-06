export interface TeamMember {
  name: string;
  role: string;
}

export interface Team {
  id: string;
  companyName: string;
  password?: string;
  instagram?: string;
  threads?: string;
  groupNumber?: string;
  email?: string;
  members?: TeamMember[];
  memberCount?: number;
  createdAt?: string;
}

export interface TaskScore {
  id: string;
  teamId: string;
  taskName: string;
  accuracy: number;      // 0-10
  quality: number;       // 0-10
  speed: number;         // 0-10
  tools: number;         // 0-10
  scoredAt: string;
  scoredBy: string;
}

export interface SocialMediaScore {
  id: string;
  teamId: string;
  weekNumber: number;
  contentQuality: number;    // 0-10
  postingFrequency: number;  // 0-10
  likes: number;             // 0-10
  views: number;             // 0-10
  followers: number;         // 0-10
  comments: number;          // 0-10
  scoredAt: string;
  scoredBy: string;
}

export interface PresentationScore {
  id: string;
  teamId: string;
  score: number;        // 0-10
  scoredAt: string;
  scoredBy: string;
}

export interface TeamWithScores extends Team {
  taskScores: TaskScore[];
  socialScores: SocialMediaScore[];
  presentationScore?: PresentationScore;
  totalTaskPoints: number;
  totalSocialPoints: number;
  totalPresentationPoints: number;
  totalGamePoints: number;
  grandTotal: number;
}

export interface Game {
  id: string;
  name: string;
  status: 'live' | 'completed';
  bonusPoints: number;
  winnerTeamId?: string;
  winnerTeamName?: string;
  completedAt?: string;
  activeTeams?: { teamName: string }[];
  activeTeamCount?: number;
  answer?: string; // only present when status === 'completed'
}

export interface GameProgress {
  gameId: string;
  teamId: string;
  currentLevel: number;
  finalAnswerAttempts: number;
  isLockedOut: boolean;
  bonusAwarded: number;
  wordleLockedUntil?: string;
}

export interface AdminUser {
  username: string;
  password?: string;
}

export type AuthSession = {
  type: 'team' | 'admin';
  id: string;
  name: string;
} | null;
