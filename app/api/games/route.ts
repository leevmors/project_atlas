import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface GameRow {
  id: number;
  name: string;
  status: string;
  bonus_points: number;
  winner_team_id: number | null;
  winner_team_name: string | null;
  completed_at: string | null;
}

export async function GET() {
  try {
    const result = await pool.query<GameRow>(
      `SELECT g.id, g.name, g.status, g.bonus_points, g.winner_team_id,
              t.company_name as winner_team_name, g.completed_at
       FROM games g
       LEFT JOIN teams t ON t.id = g.winner_team_id
       ORDER BY g.created_at`
    );

    const games = result.rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      status: row.status,
      bonusPoints: row.bonus_points,
      winnerTeamId: row.winner_team_id ? String(row.winner_team_id) : undefined,
      winnerTeamName: row.winner_team_name ?? undefined,
      completedAt: row.completed_at ?? undefined,
    }));

    return NextResponse.json({ games });
  } catch (err) {
    console.error('GET /api/games error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
