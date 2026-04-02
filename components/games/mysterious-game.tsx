'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getGameProgress,
  saveGameProgress,
  submitGameAnswer,
  setWordleLock,
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

interface MysteriousGameProps {
  gameId: string;
  isAdmin: boolean;
}

export function MysteriousGame({ gameId, isAdmin }: MysteriousGameProps) {
  // Global state
  const [game, setGame] = useState<Game | null>(null);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState(1);

  // Level 1 — Temple Match
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [restoresUsed, setRestoresUsed] = useState(0);

  // Level 2 — Signal Decode
  const [morseInput, setMorseInput] = useState('');
  const [morseStatus, setMorseStatus] = useState<'playing' | 'error' | 'won'>('playing');

  // Level 3 — Rune Search
  const [grid, setGrid] = useState<string[]>([]);
  const [wallIndices, setWallIndices] = useState<number[]>([]);
  const [foundIndices, setFoundIndices] = useState<number[]>([]);
  const [l3Status, setL3Status] = useState<'playing' | 'won'>('playing');

  // Level 4 — Final Realm
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [l4Status, setL4Status] = useState<'playing' | 'won_wordle' | 'timeout' | 'won'>('playing');
  const [timeLeft, setTimeLeft] = useState('');
  const [finalInput, setFinalInput] = useState('');
  const [finalError, setFinalError] = useState('');
  const [finalAttemptsLeft, setFinalAttemptsLeft] = useState(3);
  const [isLockedOut, setIsLockedOut] = useState(false);

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
        if (data.progress.wordleLockedUntil) {
          const lockTime = new Date(data.progress.wordleLockedUntil).getTime();
          if (Date.now() < lockTime) {
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
        setRestoresUsed((prev) => {
          if (prev < 3) {
            setLives((cl) => Math.min(3, cl + 1));
            return prev + 1;
          }
          return prev;
        });
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

  // --- Level 2: Signal Decode ---
  const playAudio = () => {
    const audio = new Audio(
      'https://www.meridianoutpost.com/resources/etools/calculators/morsecode/morsecode_lcr184vutooq3hsipjjja6q90a.wav'
    );
    audio.play();
  };

  const handleMorseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (morseInput.trim().toLowerCase() === 'betrayal') {
      setMorseStatus('won');
    } else {
      setMorseStatus('error');
      setTimeout(() => setMorseStatus('playing'), 2000);
    }
  };

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
        setTimeout(() => setL3Status('won'), 300);
      }
    }
  };

  // --- Level 4: Final Realm ---
  const checkTimeout = () => {
    if (progress?.wordleLockedUntil) {
      const lockTime = new Date(progress.wordleLockedUntil).getTime();
      if (Date.now() < lockTime) {
        setL4Status('timeout');
        return;
      }
    }
    setL4Status('playing');
    setGuesses([]);
    setCurrentGuess('');
  };

  useEffect(() => {
    if (l4Status !== 'timeout') return;
    const interval = setInterval(() => {
      const lockUntil = progress?.wordleLockedUntil;
      if (lockUntil) {
        const remaining = new Date(lockUntil).getTime() - Date.now();
        if (remaining <= 0) {
          setL4Status('playing');
          setGuesses([]);
          setCurrentGuess('');
        } else {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [l4Status, progress?.wordleLockedUntil]);

  const handleWordleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentGuess.length !== 5 || l4Status !== 'playing') return;
    const newGuesses = [...guesses, currentGuess.toUpperCase()];
    setGuesses(newGuesses);
    setCurrentGuess('');

    if (currentGuess.toUpperCase() === 'REALM') {
      setL4Status('won_wordle');
    } else if (newGuesses.length >= 6) {
      setL4Status('timeout');
      try {
        await setWordleLock(gameId);
        // Refresh progress to get server timestamp
        const data = await getGameProgress(gameId);
        if (data.progress) setProgress(data.progress);
      } catch {
        // ignore
      }
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

  const getLetterStatus = (letter: string, index: number) => {
    const target = 'REALM';
    if (target[index] === letter) return 'bg-green-600 border-green-500 text-white';
    if (target.includes(letter)) return 'bg-yellow-500 border-yellow-400 text-white';
    return 'bg-slate-600 border-slate-500 text-slate-300';
  };

  const advanceLevel = async (nextLevel: number) => {
    setLevel(nextLevel);
    try {
      await saveGameProgress(gameId, nextLevel);
    } catch {
      // ignore
    }
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

  return (
    <div className="relative">
      {/* Admin skip (hidden) */}
      {isAdmin && level < 4 && (
        <button
          onClick={() => {
            if (level === 1) setGameState('won');
            if (level === 2) setMorseStatus('won');
            if (level === 3) setL3Status('won');
          }}
          className="absolute top-0 left-0 w-12 h-12 opacity-0 z-50"
        />
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
                <p className="text-lg text-slate-300 mb-2">Your word is:</p>
                <h2 className="text-4xl font-bold text-amber-400 uppercase tracking-widest mb-8 animate-pulse">
                  &ldquo;BATTLE&rdquo;
                </h2>
                <button
                  onClick={() => advanceLevel(2)}
                  className="px-6 py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase tracking-wider transition-all shadow-lg"
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

            {morseStatus !== 'won' ? (
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
                    className="w-full py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase tracking-wider transition-all shadow-lg"
                  >
                    Submit
                  </button>
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
                  Find the hidden runes:{' '}
                  <span className="font-bold text-amber-400 tracking-widest">WALL</span>
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
                    return (
                      <div key={rowIndex} className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 5 }).map((_, colIndex) => {
                          const letter = guessStr[colIndex] ?? '';
                          const statusClass = guesses[rowIndex]
                            ? getLetterStatus(letter, colIndex)
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
                    disabled={currentGuess.length !== 5}
                    className="w-full py-3 rounded-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider transition-all shadow-lg"
                  >
                    Guess
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
