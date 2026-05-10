import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import type { FinalStanding, GameWinSummary } from '@/lib/types';

interface TeamRow {
  id: number;
  company_name: string;
  instagram: string | null;
  threads: string | null;
  group_number: string | null;
  members: { name: string; role: string }[];
  member_count: string;
}

interface TaskRow { id: number; team_id: number; task_name: string; accuracy: number; quality: number; speed: number; tools: number; scored_at: string; scored_by: string; }
interface SocialRow { id: number; team_id: number; week_number: number; content_quality: number; posting_frequency: number; likes: number; views: number; followers: number; comments: number; scored_at: string; scored_by: string; }
interface PresentationRow { id: number; team_id: number; score: number; scored_at: string; scored_by: string; }
interface GameBonusRow { team_id: number; game_bonus: string; }
interface GameWinRow { team_id: number; game_id: number; game_name: string; bonus_awarded: number; }

export async function GET() {
  try {
    const [teamsRes, taskRes, socialRes, presentRes, gameBonusRes, gameWinsRes] = await Promise.all([
      pool.query<TeamRow>(
        `SELECT id, company_name, instagram, threads, group_number, members,
                jsonb_array_length(members) AS member_count
           FROM teams ORDER BY created_at`
      ),
      pool.query<TaskRow>(
        `SELECT id, team_id, task_name, accuracy, quality, speed, tools, scored_at, scored_by
           FROM task_scores ORDER BY scored_at`
      ),
      pool.query<SocialRow>(
        `SELECT id, team_id, week_number, content_quality, posting_frequency, likes, views, followers, comments, scored_at, scored_by
           FROM social_media_scores ORDER BY scored_at`
      ),
      pool.query<PresentationRow>(
        `SELECT id, team_id, score, scored_at, scored_by FROM presentation_scores`
      ),
      pool.query<GameBonusRow>(
        `SELECT team_id, COALESCE(SUM(bonus_awarded), 0) AS game_bonus
           FROM game_attempts WHERE bonus_awarded > 0 GROUP BY team_id`
      ),
      pool.query<GameWinRow>(
        `SELECT ga.team_id, g.id AS game_id, g.name AS game_name, ga.bonus_awarded
           FROM game_attempts ga
           JOIN games g ON g.id = ga.game_id
          WHERE ga.bonus_awarded > 0
          ORDER BY ga.team_id, g.name`
      ),
    ]);

    const gameWinsByTeam = new Map<string, GameWinSummary[]>();
    for (const row of gameWinsRes.rows) {
      const key = String(row.team_id);
      if (!gameWinsByTeam.has(key)) gameWinsByTeam.set(key, []);
      gameWinsByTeam.get(key)!.push({
        gameId: String(row.game_id),
        gameName: row.game_name,
        bonusPoints: row.bonus_awarded,
      });
    }

    const standings: Omit<FinalStanding, 'rank'>[] = teamsRes.rows.map((team) => {
      const tid = String(team.id);

      const ts = taskRes.rows
        .filter((s) => String(s.team_id) === tid)
        .map((s) => ({ id: String(s.id), teamId: tid, taskName: s.task_name, accuracy: s.accuracy, quality: s.quality, speed: s.speed, tools: s.tools, scoredAt: s.scored_at, scoredBy: s.scored_by }));

      const ss = socialRes.rows
        .filter((s) => String(s.team_id) === tid)
        .map((s) => ({ id: String(s.id), teamId: tid, weekNumber: s.week_number, contentQuality: s.content_quality, postingFrequency: s.posting_frequency, likes: s.likes, views: s.views, followers: s.followers, comments: s.comments, scoredAt: s.scored_at, scoredBy: s.scored_by }));

      const ps = presentRes.rows.find((s) => String(s.team_id) === tid);
      const gb = gameBonusRes.rows.find((g) => String(g.team_id) === tid);

      const totalTaskPoints = ts.reduce((sum, s) => sum + s.accuracy + s.quality + s.speed + s.tools, 0);
      const totalSocialPoints = ss.reduce((sum, s) => sum + s.contentQuality + s.postingFrequency + s.likes + s.views + s.followers + s.comments, 0);
      const totalPresentationPoints = ps?.score ?? 0;
      const totalGamePoints = parseInt(gb?.game_bonus ?? '0', 10) || 0;

      return {
        id: tid,
        companyName: team.company_name,
        instagram: team.instagram ?? undefined,
        threads: team.threads ?? undefined,
        groupNumber: team.group_number ?? undefined,
        members: team.members,
        memberCount: parseInt(team.member_count, 10) || 0,
        taskScores: ts,
        socialScores: ss,
        presentationScore: ps ? { id: String(ps.id), teamId: tid, score: ps.score, scoredAt: ps.scored_at, scoredBy: ps.scored_by } : undefined,
        totalTaskPoints,
        totalSocialPoints,
        totalPresentationPoints,
        totalGamePoints,
        grandTotal: totalTaskPoints + totalSocialPoints + totalPresentationPoints + totalGamePoints,
        gamesWon: gameWinsByTeam.get(tid) ?? [],
      };
    });

    standings.sort((a, b) => b.grandTotal - a.grandTotal || a.id.localeCompare(b.id));

    const ranked: FinalStanding[] = standings.map((s, i) => ({ ...s, rank: i + 1 }));

    return NextResponse.json(
      { standings: ranked, generatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (err) {
    console.error('GET /api/final-standings error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
