import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface GameRow {
  id: number;
  name: string;
  status: string;
  answer: string;
  bonus_points: number;
  winner_team_id: number | null;
  winner_team_name: string | null;
  completed_at: string | null;
}

interface ActiveTeamRow {
  game_id: number;
  company_name: string;
}

export async function GET() {
  try {
    const [gamesRes, activeRes] = await Promise.all([
      pool.query<GameRow>(
        `SELECT g.id, g.name, g.status, g.answer, g.bonus_points, g.winner_team_id,
                t.company_name as winner_team_name, g.completed_at
         FROM games g
         LEFT JOIN teams t ON t.id = g.winner_team_id
         ORDER BY g.created_at`
      ),
      pool.query<ActiveTeamRow>(
        `SELECT ga.game_id, t.company_name
         FROM game_attempts ga
         JOIN teams t ON t.id = ga.team_id
         WHERE ga.bonus_awarded = 0 AND ga.is_locked_out = false`
      ),
    ]);

    // Build active teams map: game_id → team names
    const activeMap = new Map<number, string[]>();
    for (const row of activeRes.rows) {
      const list = activeMap.get(row.game_id) ?? [];
      list.push(row.company_name);
      activeMap.set(row.game_id, list);
    }

    const games = gamesRes.rows.map((row) => {
      const activeNames = activeMap.get(row.id) ?? [];
      return {
        id: String(row.id),
        name: row.name,
        status: row.status,
        bonusPoints: row.bonus_points,
        winnerTeamId: row.winner_team_id ? String(row.winner_team_id) : undefined,
        winnerTeamName: row.winner_team_name ?? undefined,
        completedAt: row.completed_at ?? undefined,
        activeTeams: activeNames.map((n) => ({ teamName: n })),
        activeTeamCount: activeNames.length,
        // Security: only expose answer for completed games
        answer: row.status === 'completed' ? row.answer : undefined,
      };
    });

    return NextResponse.json({ games });
  } catch (err) {
    console.error('GET /api/games error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
