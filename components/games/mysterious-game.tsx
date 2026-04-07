'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getGameProgress,
  submitGameAnswer,
  completePuzzleLevel,
  submitLevelAnswer,
  submitWordleGuess,
} from '@/lib/store';
import type { Game, GameProgress } from '@/lib/types';
import { Trophy, Volume2, Lock, AlertTriangle } from 'lucide-react';

const FRUITS = ['🍎', '🍌', '🍇', '🍉', '🍊', '🍍', '🥝', '🍒'];

interface Card {
  readonly id: number;
  readonly fruit: string;
  isMatched: boolean;
  isFlipped: boolean;
}

interface LetterResult {
  readonly letter: string;
  readonly status: 'correct' | 'present' | 'absent';
}

interface MysteriousGameProps {
  gameId: string;
  isAdmin: boolean;
}

const STATUS_CLASSES: Record<string, string> = {
  correct: 'bg-green-600 border-green-500 text-white',
  present: 'bg-yellow-500 border-yellow-400 text-white',
  absent: 'bg-slate-600 border-slate-500 text-slate-300',
};

export function MysteriousGame({ gameId, isAdmin }: MysteriousGameProps) {
  // Global state
  const [game, setGame] = useState<Game | null>(null);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState(1);

  // Earned clues from server
  const [earnedClues, setEarnedClues] = useState<string[]>([]);

  // Level 1 — Temple Match
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [restoresUsed, setRestoresUsed] = useState(0);
  const [level1Clue, setLevel1Clue] = useState<string | null>(null);

  // Level 2 — Signal Decode
  const [morseInput, setMorseInput] = useState('');
  const [morseStatus, setMorseStatus] = useState<'playing' | 'error' | 'won' | 'cooldown'>('playing');
  const [morseCooldownUntil, setMorseCooldownUntil] = useState<string | null>(null);
  const [morseCooldownLeft, setMorseCooldownLeft] = useState('');

  // Level 3 — Rune Search
  const [grid, setGrid] = useState<string[]>([]);
  const [wallIndices, setWallIndices] = useState<number[]>([]);
  const [foundIndices, setFoundIndices] = useState<number[]>([]);
  const [l3Status, setL3Status] = useState<'playing' | 'won'>('playing');

  // Level 4 — Final Realm
  const [guesses, setGuesses] = useState<string[]>([]);
  const [guessResults, setGuessResults] = useState<ReadonlyArray<ReadonlyArray<LetterResult>>>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [l4Status, setL4Status] = useState<'playing' | 'won_wordle' | 'timeout' | 'won'>('playing');
  const [timeLeft, setTimeLeft] = useState('');
  const [finalInput, setFinalInput] = useState('');
  const [finalError, setFinalError] = useState('');
  const [finalAttemptsLeft, setFinalAttemptsLeft] = useState(3);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [wordleLockedUntil, setWordleLockedUntil] = useState<string | null>(null);
  const [wordleSubmitting, setWordleSubmitting] = useState(false);
  const [morseSubmitting, setMorseSubmitting] = useState(false);
  const [morseError, setMorseError] = useState('');
  const [level1Completing, setLevel1Completing] = useState(false);
  const [level3Completing, setLevel3Completing] = useState(false);

  // --- Initialization ---
  const loadProgress = useCallback(async () => {
    try {
      const data = await getGameProgress(gameId);
      setGame(data.game);
      setProgress(data.progress);
      if (data.progress) {
        setLevel(data.progress.currentLevel);
        setFinalAttemptsLeft(3 - data.progress.finalAnswerAttempts);
        setIsLockedOut(data.progress.isLockedOut);

        // Restore earned clues from server
        if (data.progress.earnedClues) {
          setEarnedClues(data.progress.earnedClues);
          if (data.progress.earnedClues.length > 0) {
            setLevel1Clue(data.progress.earnedClues[0]);
          }
        }

        // Restore morse cooldown from server
        if (data.progress.levelCooldownUntil) {
          const cooldownTime = new Date(data.progress.levelCooldownUntil).getTime();
          if (Date.now() < cooldownTime) {
            setMorseCooldownUntil(data.progress.levelCooldownUntil);
            setMorseStatus('cooldown');
          }
        }

        // Restore wordle lock from server
        if (data.progress.wordleLockedUntil) {
          const lockTime = new Date(data.progress.wordleLockedUntil).getTime();
          if (Date.now() < lockTime) {
            setWordleLockedUntil(data.progress.wordleLockedUntil);
            setL4Status('timeout');
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Poll for game status changes (another team might win)
  useEffect(() => {
    if (game?.status === 'completed') return;
    const interval = setInterval(async () => {
      try {
        const data = await getGameProgress(gameId);
        setGame(data.game);
        if (data.progress) {
          setFinalAttemptsLeft(3 - data.progress.finalAnswerAttempts);
          setIsLockedOut(data.progress.isLockedOut);
        }
      } catch {
        // ignore
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [gameId, game?.status]);

  // --- Level 1: Temple Match ---
  const initGame = useCallback(() => {
    const shuffled = [...FRUITS, ...FRUITS]
      .sort(() => Math.random() - 0.5)
      .map((fruit, idx) => ({ id: idx, fruit, isMatched: false, isFlipped: false }));
    setCards(shuffled);
    setLives(3);
    setGameState('playing');
    setFlippedIndices([]);
    setRestoresUsed(0);
  }, []);

  useEffect(() => {
    if (level === 1) initGame();
    if (level === 3) initLevel3();
    if (level === 4) checkTimeout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  useEffect(() => {
    if (flippedIndices.length === 2) {
      const [firstIdx, secondIdx] = flippedIndices;
      const match = cards[firstIdx].fruit === cards[secondIdx].fruit;

      if (match) {
        setCards((prev) =>
          prev.map((c, i) =>
            i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c
          )
        );
        setFlippedIndices([]);
        if (restoresUsed < 3) {
          setLives((cl) => Math.min(cl + 1, 3));
          setRestoresUsed((prev) => prev + 1);
        }
        const matchedSoFar = cards.filter((c) => c.isMatched).length;
        if (matchedSoFar + 2 === cards.length) {
          setTimeout(() => setGameState('won'), 500);
        }
      } else {
        const timer = setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
          setLives((prev) => {
            if (prev - 1 <= 0) {
              setGameState('lost');
              return 0;
            }
            return prev - 1;
          });
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [flippedIndices, cards]);

  const handleCardClick = (index: number) => {
    if (gameState !== 'playing') return;
    if (flippedIndices.length >= 2) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, isFlipped: true } : c))
    );
    setFlippedIndices((prev) => [...prev, index]);
  };

  // Complete Level 1 via server
  const handleLevel1Complete = async () => {
    if (level1Completing) return;
    setLevel1Completing(true);
    try {
      const result = await completePuzzleLevel(gameId, 1);
      if (result.ok && result.clue) {
        setLevel1Clue(result.clue);
        setEarnedClues((prev) => [...prev, result.clue!]);
      }
    } catch {
      // ignore — clue display will fall back gracefully
    } finally {
      setLevel1Completing(false);
    }
  };

  // Trigger server call when Level 1 is won
  useEffect(() => {
    if (gameState === 'won' && level === 1 && !level1Clue) {
      handleLevel1Complete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, level]);

  // --- Level 2: Signal Decode ---
  const playAudio = () => {
    const audio = new Audio(
      'https://www.meridianoutpost.com/resources/etools/calculators/morsecode/morsecode_lcr184vutooq3hsipjjja6q90a.wav'
    );
    audio.play();
  };

  const handleMorseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (morseSubmitting || morseStatus === 'cooldown') return;
    const trimmed = morseInput.trim();
    if (!trimmed) return;

    setMorseSubmitting(true);
    try {
      const result = await submitLevelAnswer(gameId, 2, trimmed);
      if (result.correct) {
        setMorseStatus('won');
      } else {
        if (result.cooldownUntil) {
          setMorseCooldownUntil(result.cooldownUntil);
          setMorseStatus('cooldown');
        } else {
          setMorseStatus('error');
          setTimeout(() => setMorseStatus('playing'), 2000);
        }
      }
    } catch (err) {
      setMorseStatus('error');
      setMorseError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setTimeout(() => setMorseStatus('playing'), 2000);
    } finally {
      setMorseSubmitting(false);
    }
  };

  // Morse cooldown countdown timer
  useEffect(() => {
    if (morseStatus !== 'cooldown' || !morseCooldownUntil) return;
    const interval = setInterval(() => {
      const remaining = new Date(morseCooldownUntil).getTime() - Date.now();
      if (remaining <= 0) {
        setMorseStatus('playing');
        setMorseCooldownUntil(null);
        setMorseCooldownLeft('');
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setMorseCooldownLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [morseStatus, morseCooldownUntil]);

  // --- Level 3: Rune Search ---
  const initLevel3 = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const newGrid = Array.from({ length: 100 }, () =>
      letters[Math.floor(Math.random() * letters.length)]
    );
    const row = Math.floor(Math.random() * 10);
    const col = Math.floor(Math.random() * 7);
    const startIndex = row * 10 + col;
    newGrid[startIndex] = 'W';
    newGrid[startIndex + 1] = 'A';
    newGrid[startIndex + 2] = 'L';
    newGrid[startIndex + 3] = 'L';
    setWallIndices([startIndex, startIndex + 1, startIndex + 2, startIndex + 3]);
    setGrid(newGrid);
    setFoundIndices([]);
    setL3Status('playing');
  };

  const handleGridClick = (index: number) => {
    if (l3Status !== 'playing') return;
    if (wallIndices.includes(index) && !foundIndices.includes(index)) {
      const newFound = [...foundIndices, index];
      setFoundIndices(newFound);
      if (newFound.length === 4) {
        setTimeout(() => {
          setL3Status('won');
          handleLevel3Complete();
        }, 300);
      }
    }
  };

  // Complete Level 3 via server
  const handleLevel3Complete = async () => {
    if (level3Completing) return;
    setLevel3Completing(true);
    try {
      await completePuzzleLevel(gameId, 3);
    } catch {
      // ignore
    } finally {
      setLevel3Completing(false);
    }
  };

  // --- Level 4: Final Realm ---
  const checkTimeout = () => {
    if (wordleLockedUntil) {
      const lockTime = new Date(wordleLockedUntil).getTime();
      if (Date.now() < lockTime) {
        setL4Status('timeout');
        return;
      }
    }
    if (progress?.wordleLockedUntil) {
      const lockTime = new Date(progress.wordleLockedUntil).getTime();
      if (Date.now() < lockTime) {
        setWordleLockedUntil(progress.wordleLockedUntil);
        setL4Status('timeout');
        return;
      }
    }
    setL4Status('playing');
    setGuesses([]);
    setGuessResults([]);
    setCurrentGuess('');
  };

  useEffect(() => {
    if (l4Status !== 'timeout') return;
    const lockUntilStr = wordleLockedUntil ?? progress?.wordleLockedUntil;
    if (!lockUntilStr) return;
    const interval = setInterval(() => {
      const remaining = new Date(lockUntilStr).getTime() - Date.now();
      if (remaining <= 0) {
        setL4Status('playing');
        setGuesses([]);
        setGuessResults([]);
        setCurrentGuess('');
        setWordleLockedUntil(null);
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [l4Status, wordleLockedUntil, progress?.wordleLockedUntil]);

  const handleWordleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentGuess.length !== 5 || l4Status !== 'playing' || wordleSubmitting) return;

    setWordleSubmitting(true);
    try {
      const result = await submitWordleGuess(gameId, currentGuess);
      const upperGuess = currentGuess.toUpperCase();
      setGuesses((prev) => [...prev, upperGuess]);
      setGuessResults((prev) => [...prev, result.letters]);
      setCurrentGuess('');

      if (result.correct) {
        setL4Status('won_wordle');
      } else if (result.lockedUntil) {
        setWordleLockedUntil(result.lockedUntil);
        setL4Status('timeout');
        // Refresh progress to sync server state
        try {
          const data = await getGameProgress(gameId);
          if (data.progress) setProgress(data.progress);
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore — don't advance state on network error
    } finally {
      setWordleSubmitting(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalInput.trim()) return;
    setFinalError('');
    try {
      const result = await submitGameAnswer(gameId, finalInput.trim());
      if (result.correct) {
        setL4Status('won');
        setGame((prev) => (prev ? { ...prev, status: 'completed' } : prev));
      } else {
        setFinalAttemptsLeft(result.attemptsRemaining);
        setIsLockedOut(result.isLockedOut);
        setFinalInput('');
        if (result.isLockedOut) {
          setFinalError('No attempts remaining. You are locked out.');
        } else {
          setFinalError(`Wrong answer. ${result.attemptsRemaining} attempt${result.attemptsRemaining !== 1 ? 's' : ''} remaining.`);
        }
      }
    } catch {
      setFinalError('Something went wrong. Try again.');
    }
  };

  const advanceLevel = async (nextLevel: number) => {
    setLevel(nextLevel);
  };

  // --- Render ---
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse text-slate-400">Loading game...</div>
      </div>
    );
  }

  // Game completed by another team
  if (game?.status === 'completed' && !progress?.bonusAwarded) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Game Completed!</h3>
        <p className="text-slate-500">
          Won by <span className="font-semibold text-slate-700">{game.winnerTeamName}</span>
        </p>
        <p className="text-amber-600 font-semibold mt-2">+{game.bonusPoints} points awarded</p>
      </div>
    );
  }

  // This team won
  if (l4Status === 'won' || progress?.bonusAwarded) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-3xl font-bold text-green-600 mb-2">YOU WON!</h3>
        <p className="text-slate-600 mb-2">You solved the mystery!</p>
        <p className="text-amber-600 font-bold text-xl">+{game?.bonusPoints ?? 100} points!</p>
      </div>
    );
  }

  // Locked out
  if (isLockedOut) {
    return (
      <div className="text-center py-12">
        <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Locked Out</h3>
        <p className="text-slate-500">You have used all 3 attempts for the final answer.</p>
      </div>
    );
  }

  const adminSolveLevel = async () => {
    if (!isAdmin) return;
    if (level === 1) {
      setGameState('won');
    }
    if (level === 2) {
      setMorseStatus('won');
    }
    if (level === 3) {
      setL3Status('won');
    }
    if (level === 4 && l4Status === 'playing') {
      // Admin auto-solve: submit via server
      try {
        const result = await submitWordleGuess(gameId, 'ADMIN');
        // If the server gives a correct answer back, use it; otherwise just force won state
        if (result.correct) {
          setGuesses((prev) => [...prev, 'ADMIN']);
          setGuessResults((prev) => [...prev, result.letters]);
        }
      } catch {
        // ignore
      }
      setL4Status('won_wordle');
    }
  };

  return (
    <div className="relative">
      {/* Admin toolbar */}
      {isAdmin && (
        <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 flex-wrap">
          <span className="text-amber-600 text-xs font-bold uppercase tracking-wider">Admin</span>
          <span className="text-slate-400 text-xs">Level {level}/4</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={adminSolveLevel}
              className="px-3 py-1 rounded-md bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-colors"
            >
              Auto-solve
            </button>
            {level < 4 && (
              <button
                onClick={() => advanceLevel(level + 1)}
                className="px-3 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
              >
                Skip Level
              </button>
            )}
          </div>
        </div>
      )}

      {/* Game area — dark themed interior */}
      <div className="bg-slate-800/95 rounded-xl p-5 sm:p-6 text-slate-100">
        {/* Level 1 */}
        {level === 1 && (
          <>
            <div className="flex justify-between items-center mb-5 border-b border-slate-700 pb-4">
              <h3 className="text-xl font-bold text-amber-400 uppercase tracking-widest">
                Temple Match
              </h3>
              <div className="flex gap-1 text-xl">
                {Array.from({ length: Math.max(3, lives) }).map((_, i) => (
                  <span
                    key={i}
                    className={`transition-all duration-300 ${i < lives ? 'opacity-100 scale-100' : 'opacity-30 grayscale scale-75'}`}
                  >
                    🔥
                  </span>
                ))}
              </div>
            </div>

            {gameState === 'playing' && (
              <div className="grid grid-cols-4 gap-2.5">
                {cards.map((card, index) => {
                  const showFace = card.isFlipped || card.isMatched;
                  return (
                    <button
                      key={card.id}
                      onClick={() => handleCardClick(index)}
                      className={`h-18 sm:h-22 rounded-lg text-3xl flex items-center justify-center transition-all duration-300 relative ${
                        showFace
                          ? 'bg-slate-900 border-2 border-slate-700 shadow-inner scale-95'
                          : 'bg-slate-600 border-2 border-slate-500 hover:bg-slate-500 hover:scale-105 hover:-translate-y-0.5 shadow-md cursor-pointer'
                      }`}
                      disabled={showFace}
                    >
                      <span className={`transition-opacity duration-300 ${showFace ? 'opacity-100' : 'opacity-0'}`}>
                        {card.fruit}
                      </span>
                      {!showFace && (
                        <span className="absolute inset-0 flex items-center justify-center opacity-20 text-slate-400 text-xl font-bold">
                          ?
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {gameState === 'won' && (
              <div className="text-center py-8">
                {level1Clue ? (
                  <>
                    <p className="text-lg text-slate-300 mb-2">Your word is:</p>
                    <h2 className="text-4xl font-bold text-amber-400 uppercase tracking-widest mb-8 animate-pulse">
                      &ldquo;{level1Clue}&rdquo;
                    </h2>
                  </>
                ) : (
                  <div className="animate-pulse text-slate-400 mb-8">Revealing clue...</div>
                )}
                <button
                  onClick={() => advanceLevel(2)}
                  disabled={!level1Clue}
                  className="px-6 py-3 rounded-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider transition-all shadow-lg"
                >
                  Next Game
                </button>
              </div>
            )}

            {gameState === 'lost' && (
              <div className="text-center py-8">
                <h2 className="text-3xl font-bold text-red-500 uppercase tracking-widest mb-2">
                  Cave In!
                </h2>
                <p className="text-slate-400 mb-8">The torches went out!</p>
                <button
                  onClick={initGame}
                  className="px-6 py-3 rounded-full bg-slate-600 hover:bg-slate-500 text-white font-bold uppercase tracking-wider transition-all shadow-lg"
                >
                  Try Again
                </button>
              </div>
            )}
          </>
        )}

        {/* Level 2 */}
        {level === 2 && (
          <>
            <div className="mb-5 border-b border-slate-700 pb-4">
              <h3 className="text-xl font-bold text-amber-400 uppercase tracking-widest">
                Signal Decode
              </h3>
            </div>

            {morseStatus === 'cooldown' ? (
              <div className="text-center py-8">
                <h2 className="text-3xl font-bold text-red-500 uppercase tracking-widest mb-4 animate-pulse">
                  LOCKED OUT
                </h2>
                <p className="text-slate-300 mb-2">Wrong decryption. Wait to try again.</p>
                <div className="text-4xl font-mono text-red-400">{morseCooldownLeft}</div>
              </div>
            ) : morseStatus !== 'won' ? (
              <div className="text-center py-4">
                <p className="text-slate-400 mb-6">
                  Listen to the ancient transmission and decipher the word.
                </p>
                <button
                  onClick={playAudio}
                  className="mb-8 px-8 py-4 rounded-full bg-slate-600 hover:bg-slate-500 text-white font-bold transition-all shadow-lg flex items-center justify-center mx-auto gap-2"
                >
                  <Volume2 className="w-5 h-5" />
                  Play Audio
                </button>
                <form onSubmit={handleMorseSubmit} className="space-y-4 max-w-sm mx-auto">
                  <input
                    type="text"
                    value={morseInput}
                    onChange={(e) => setMorseInput(e.target.value)}
                    placeholder="Enter decrypted word"
                    className="w-full bg-slate-900/80 border-2 border-slate-600 text-slate-100 p-3 rounded-lg text-center uppercase tracking-widest focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-500"
                  />
                  {morseStatus === 'error' && (
                    <p className="text-red-400 font-bold">Incorrect decryption.</p>
                  )}
                  <button
                    type="submit"
                    disabled={morseSubmitting}
                    className="w-full py-3 rounded-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider transition-all shadow-lg"
                  >
                    {morseSubmitting ? 'Checking...' : 'Submit'}
                  </button>
                  {morseError && (
                    <p className="text-red-400 text-sm text-center mt-2">{morseError}</p>
                  )}
                </form>
              </div>
            ) : (
              <div className="text-center py-8">
                <h2 className="text-3xl font-bold text-green-400 uppercase tracking-widest mb-4 animate-pulse">
                  SUCCESS
                </h2>
                <p className="text-slate-300 mb-8">Transmission decrypted correctly!</p>
                <button
                  onClick={() => advanceLevel(3)}
                  className="px-6 py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase tracking-wider transition-all shadow-lg"
                >
                  Next Game
                </button>
              </div>
            )}
          </>
        )}

        {/* Level 3 */}
        {level === 3 && (
          <>
            <div className="mb-5 border-b border-slate-700 pb-4">
              <h3 className="text-xl font-bold text-amber-400 uppercase tracking-widest">
                Rune Search
              </h3>
            </div>

            {l3Status === 'playing' && (
              <div className="text-center">
                <p className="text-slate-400 mb-4">
                  Find the hidden word in the grid below.
                </p>
                <div className="grid grid-cols-10 gap-1 bg-slate-900 p-2 sm:p-3 rounded-lg border border-slate-700">
                  {grid.map((letter, idx) => {
                    const isFound = foundIndices.includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleGridClick(idx)}
                        className={`aspect-square flex items-center justify-center text-xs sm:text-base font-bold rounded transition-colors ${
                          isFound
                            ? 'bg-green-600 text-white shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                        }`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {l3Status === 'won' && (
              <div className="text-center py-8">
                <h2 className="text-3xl font-bold text-green-400 uppercase tracking-widest mb-6">
                  Congratulations!
                </h2>
                <button
                  onClick={() => advanceLevel(4)}
                  className="px-6 py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase tracking-wider transition-all shadow-lg"
                >
                  Next Game
                </button>
              </div>
            )}
          </>
        )}

        {/* Level 4 */}
        {level === 4 && (
          <>
            <div className="mb-5 border-b border-slate-700 pb-4">
              <h3 className="text-xl font-bold text-amber-400 uppercase tracking-widest">
                Final Realm
              </h3>
            </div>

            {l4Status === 'playing' && (
              <div className="text-center">
                <p className="text-slate-400 mb-6">
                  Guess the 5-letter word to unlock the final door. You have 6 attempts.
                </p>
                <div className="grid gap-2 mb-6 max-w-[250px] mx-auto">
                  {Array.from({ length: 6 }).map((_, rowIndex) => {
                    const guessStr = guesses[rowIndex] ?? '';
                    const rowResult = guessResults[rowIndex];
                    return (
                      <div key={rowIndex} className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 5 }).map((_, colIndex) => {
                          const letter = guessStr[colIndex] ?? '';
                          const statusClass = rowResult
                            ? STATUS_CLASSES[rowResult[colIndex].status]
                            : 'bg-slate-900 border-slate-700 text-slate-400';
                          return (
                            <div
                              key={colIndex}
                              className={`aspect-square flex items-center justify-center text-xl font-bold uppercase border-2 rounded ${statusClass}`}
                            >
                              {letter}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={handleWordleSubmit} className="space-y-4 max-w-sm mx-auto">
                  <input
                    type="text"
                    maxLength={5}
                    value={currentGuess}
                    onChange={(e) => setCurrentGuess(e.target.value.replace(/[^A-Za-z]/g, ''))}
                    placeholder="5-letter word"
                    className="w-full bg-slate-900/80 border-2 border-slate-600 text-slate-100 p-3 rounded-lg text-center uppercase tracking-widest focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={currentGuess.length !== 5 || wordleSubmitting}
                    className="w-full py-3 rounded-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider transition-all shadow-lg"
                  >
                    {wordleSubmitting ? 'Checking...' : 'Guess'}
                  </button>
                </form>
              </div>
            )}

            {l4Status === 'timeout' && (
              <div className="text-center py-8">
                <h2 className="text-3xl font-bold text-red-500 uppercase tracking-widest mb-4 animate-pulse">
                  LOCKED OUT
                </h2>
                <p className="text-slate-300 mb-2">The realm rejected your answers.</p>
                <p className="text-slate-500 mb-6">You must wait to try again.</p>
                <div className="text-4xl font-mono text-red-400">{timeLeft}</div>
              </div>
            )}

            {l4Status === 'won_wordle' && (
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-amber-400 uppercase tracking-widest mb-4">
                  Realm Unlocked
                </h2>
                <form onSubmit={handleFinalSubmit} className="space-y-4 max-w-sm mx-auto">
                  <p className="text-slate-300 mb-2">What&apos;s your final answer?</p>
                  <p className="text-xs text-slate-500 mb-4">
                    {finalAttemptsLeft} attempt{finalAttemptsLeft !== 1 ? 's' : ''} remaining
                  </p>
                  <input
                    type="text"
                    value={finalInput}
                    onChange={(e) => setFinalInput(e.target.value)}
                    placeholder="Final Answer"
                    className="w-full bg-slate-900/80 border-2 border-slate-600 text-slate-100 p-3 rounded-lg text-center uppercase tracking-widest focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-500"
                  />
                  {finalError && (
                    <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {finalError}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase tracking-wider transition-all shadow-lg"
                  >
                    Submit
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
