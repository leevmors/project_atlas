// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  SERVER-ONLY — this file must NEVER be imported from a 'use client'    ║
// ║  component. It contains all game answers and is used exclusively by    ║
// ║  API route handlers. Importing it client-side would leak every answer. ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export interface LevelConfig {
  readonly type: 'text-answer' | 'puzzle-complete' | 'wordle' | 'multi-round';
  readonly answer?: string;
  readonly rounds?: readonly { readonly answer: string; readonly cooldownSeconds: number }[];
  readonly clue?: string;
  readonly cooldownSeconds: number;
}

/**
 * Complete answer + clue map for every level of every game.
 * Keyed by game name (must match the `name` column in the `games` DB table).
 */
export const GAME_LEVEL_CONFIG: Record<string, Record<number, LevelConfig>> = {
  'Mysterious Game': {
    1: { type: 'puzzle-complete', clue: 'BATTLE', cooldownSeconds: 0 },
    2: { type: 'text-answer', answer: 'BETRAYAL', clue: undefined, cooldownSeconds: 300 },
    3: { type: 'puzzle-complete', clue: undefined, cooldownSeconds: 0 },
    4: { type: 'wordle', answer: 'REALM', clue: undefined, cooldownSeconds: 0 },
  },

  'The Code Breaker': {
    1: { type: 'puzzle-complete', clue: 'PERSEPHONE', cooldownSeconds: 0 },
    2: {
      type: 'multi-round',
      rounds: [
        { answer: 'CROWN', cooldownSeconds: 60 },
        { answer: 'SEEDS', cooldownSeconds: 180 },
        { answer: 'CROWN OF SEEDS', cooldownSeconds: 300 },
      ],
      clue: 'SEEDS',
      cooldownSeconds: 300,
    },
    3: { type: 'text-answer', answer: 'RUBY', clue: 'RUBY', cooldownSeconds: 300 },
    4: { type: 'text-answer', answer: 'JEWEL', clue: 'JEWEL', cooldownSeconds: 300 },
  },

  'Houston we have a problem!': {
    1: { type: 'text-answer', answer: 'INSTABILITY', clue: 'INTERSTELLAR', cooldownSeconds: 300 },
    2: { type: 'text-answer', answer: 'HAWK', clue: 'HAWK', cooldownSeconds: 300 },
    3: { type: 'text-answer', answer: '9.81', clue: 'KING', cooldownSeconds: 300 },
  },

  'The Hunt': {
    1: { type: 'text-answer', answer: 'GUTS', clue: 'DAUGHTER', cooldownSeconds: 300 },
    2: { type: 'text-answer', answer: 'RESIDENT EVIL REQUIEM', clue: 'HATRED', cooldownSeconds: 300 },
    3: { type: 'text-answer', answer: 'ERMAC', clue: 'VENGEANCE', cooldownSeconds: 300 },
  },

  'The Final Piece': {
    1: { type: 'text-answer', answer: 'FACADE', clue: 'MEINCRAFT', cooldownSeconds: 300 },
    2: { type: 'text-answer', answer: 'BOMB', clue: 'JUICE', cooldownSeconds: 300 },
    3: { type: 'text-answer', answer: 'ATTACK', clue: 'MASSACRE', cooldownSeconds: 300 },
  },
} as const;

/**
 * Get earned clue fragments for a team based on how far they've progressed.
 * Returns clues for all levels below their current level.
 */
export function getEarnedClues(gameName: string, currentLevel: number): string[] {
  const config = GAME_LEVEL_CONFIG[gameName];
  if (!config) return [];

  const clues: string[] = [];
  for (let l = 1; l < currentLevel; l++) {
    const levelConf = config[l];
    if (levelConf?.clue) {
      clues.push(levelConf.clue);
    }
  }
  return clues;
}
