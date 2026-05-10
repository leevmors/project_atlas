import type { FinalStanding } from './types';
import { pickQuote } from './team-quotes';

export interface FinalStandingWithQuote extends FinalStanding {
  quote: string;
}

export async function getFinalStandings(): Promise<FinalStandingWithQuote[]> {
  const res = await fetch('/api/final-standings', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch final standings: ${res.status}`);
  const { standings } = (await res.json()) as { standings: FinalStanding[] };
  return standings.map((s) => ({ ...s, quote: pickQuote(s) }));
}
