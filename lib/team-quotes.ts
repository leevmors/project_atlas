import type { FinalStanding } from './types';

const BANKS = {
  champion: [
    "the table was theirs from february. they never looked up.",
    "they competed quietly and won loudly.",
    "every point they earned, they earned twice.",
  ],
  silver: [
    "half a step. that's all it ever was.",
    "they pushed the champion every single week.",
    "the gap was smaller than the number looks.",
  ],
  bronze: [
    "three weeks in, everyone noticed. they already knew.",
    "they didn't blink. that's rarer than people think.",
    "the fight was real. the bronze proves it.",
  ],
  game_master: [
    "every locked door — they had the key.",
    "they didn't just play the games. they ran them.",
    "the games had a favourite. it was them.",
  ],
  task_master: [
    "quietly, deliberately, they out-worked everyone.",
    "the rubric loved them. so did the results.",
    "no flash. just the work, week after week.",
  ],
  social_master: [
    "the algorithm picked a side. it was theirs.",
    "they made the feed move.",
    "the numbers didn't lie. neither did they.",
  ],
  balanced: [
    "good at everything. loud about nothing.",
    "no weak side, no loud side — just the work.",
    "they spread the points because they could.",
  ],
  underdog: [
    "no one saw them coming. now everyone has.",
    "they showed up. that was the whole trick.",
    "every week they were there. that counts.",
  ],
  default: [
    "they made the road harder for everyone behind them.",
    "good company, good fight, good work.",
    "they were here. they competed. that's enough.",
  ],
} as const;

type BankKey = keyof typeof BANKS;

function stableIndex(teamId: string, bankLen: number): number {
  let hash = 0;
  for (let i = 0; i < teamId.length; i++) {
    hash = (hash * 31 + teamId.charCodeAt(i)) >>> 0;
  }
  return hash % bankLen;
}

function pick(bank: readonly string[], teamId: string): string {
  return bank[stableIndex(teamId, bank.length)];
}

export function pickQuote(team: FinalStanding): string {
  if (team.rank === 1) return pick(BANKS.champion, team.id);
  if (team.rank === 2) return pick(BANKS.silver, team.id);
  if (team.rank === 3) return pick(BANKS.bronze, team.id);
  if (team.gamesWon.length >= 2) return pick(BANKS.game_master, team.id);
  if (team.totalTaskPoints > 0 &&
      team.totalTaskPoints >= team.totalSocialPoints * 1.4 &&
      team.totalTaskPoints >= team.totalPresentationPoints * 1.4) {
    return pick(BANKS.task_master, team.id);
  }
  if (team.totalSocialPoints > 0 &&
      team.totalSocialPoints >= team.totalTaskPoints * 1.4) {
    return pick(BANKS.social_master, team.id);
  }
  const scores = [team.totalTaskPoints, team.totalSocialPoints, team.totalPresentationPoints];
  const max = Math.max(...scores);
  const min = Math.min(...scores.filter(s => s > 0));
  if (max > 0 && min > 0 && max / min < 1.5) return pick(BANKS.balanced, team.id);
  if (team.rank >= 4 && team.rank <= 5) return pick(BANKS.underdog, team.id);
  return pick(BANKS.default, team.id);
}
