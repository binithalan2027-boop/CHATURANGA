import { useState, useEffect, useCallback, useRef } from 'react';

export type BotPersonality = 'thrall' | 'fiend' | 'mage' | 'assassin' | 'lich' | 'voidweaver' | 'eldritch' | string;

export interface BotConfig {
  id: BotPersonality;
  name: string;
  avatar: string;
  skillLevel: number;
  depth: number;
  moveTime: number; // ms
  description: string;
  contempt: number;
  multiPv: number;
  blunderRate: number;
  uciElo?: number;
}

export const AI_TIERS = [
  { maxElo: 800, id: 'apprentice', name: 'Apprentice Bot', avatar: '🌱', desc: 'Learning fundamental lines & simple captures. Makes frequent novice oversights.', contempt: -40, multiPv: 4, blunderRate: 0.42 },
  { maxElo: 1400, id: 'tactical', name: 'Tactical Bot', avatar: '♟', desc: 'Calculates forks, pins, and pawn structure. Solid 2-3 ply tactical awareness.', contempt: 25, multiPv: 3, blunderRate: 0.18 },
  { maxElo: 2000, id: 'master', name: 'Master Bot', avatar: '🎯', desc: 'Relentless strategic pressure & king attacks. Punishes tactical mistakes decisively.', contempt: 50, multiPv: 2, blunderRate: 0.05 },
  { maxElo: 2600, id: 'grandmaster', name: 'Grandmaster Bot', avatar: '🏆', desc: 'Deep calculation, positional sacrifices, and endgame precision.', contempt: 0, multiPv: 2, blunderRate: 0.01 },
  { maxElo: 3500, id: 'stockfish', name: 'Stockfish Singular', avatar: '👑', desc: 'Inhuman calculation with near-zero blunders. Uncapped engine strength.', contempt: 0, multiPv: 1, blunderRate: 0 }
];

export function getBotByElo(elo: number): BotConfig {
  const tier = AI_TIERS.find(t => elo <= t.maxElo) || AI_TIERS[AI_TIERS.length - 1];
  
  // Accurately map Stockfish skill level & search depth based on calibrated human Elo:
  let skillLevel: number;
  let depth: number;
  let moveTime: number;

  if (elo <= 800) {
    skillLevel = 0;
    depth = 2;
    moveTime = 300;
  } else if (elo <= 1400) {
    // 801-1400: Linear scaling 1-6
    skillLevel = Math.round(1 + ((elo - 800) / 600) * 5);
    depth = Math.round(3 + ((elo - 800) / 600) * 3);
    moveTime = 650;
  } else if (elo <= 2000) {
    // 1401-2000: Linear scaling 7-13
    skillLevel = Math.round(7 + ((elo - 1400) / 600) * 6);
    depth = Math.round(7 + ((elo - 1400) / 600) * 5);
    moveTime = 1200;
  } else if (elo <= 2600) {
    // 2001-2600: Linear scaling 14-18
    skillLevel = Math.round(14 + ((elo - 2000) / 600) * 4);
    depth = Math.round(13 + ((elo - 2000) / 600) * 4);
    moveTime = 1600;
  } else {
    skillLevel = 20;
    depth = 20;
    moveTime = 2000;
  }

  return {
    id: tier.id,
    name: tier.name,
    avatar: tier.avatar,
    description: tier.desc,
    skillLevel,
    depth,
    moveTime,
    contempt: tier.contempt,
    multiPv: tier.multiPv,
    blunderRate: tier.blunderRate,
    uciElo: elo >= 1320 && elo <= 3190 ? elo : undefined,
  };
}

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const readyRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [engineError, setEngineError] = useState(false);
  const resolveMoveRef = useRef<((move: string) => void) | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveStartTimeRef = useRef<number>(0);
  const targetDelayRef = useRef<number>(0);
  
  // To track MultiPV lines during a search
  const pvLinesRef = useRef<Record<number, string>>({});
  const activeBotConfigRef = useRef<BotConfig | null>(null);

  const stopThinking = useCallback(() => {
    if (pendingMoveTimerRef.current) {
      clearTimeout(pendingMoveTimerRef.current);
      pendingMoveTimerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    resolveMoveRef.current = null;
    setIsThinking(false);
    if (workerRef.current && readyRef.current) {
      try {
        workerRef.current.postMessage('stop');
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    try {
      const worker = new Worker('/stockfish.js');
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const msg = e.data;

        if (typeof msg === 'string' && msg.includes('uciok')) {
          readyRef.current = true;
          setIsReady(true);
        }

        if (typeof msg === 'string' && msg.includes('readyok')) {
          readyRef.current = true;
          setIsReady(true);
        }

        // Parse MultiPV lines
        if (typeof msg === 'string' && msg.includes('multipv') && msg.includes(' pv ')) {
          const mpvMatch = msg.match(/multipv (\d+)/);
          const pvMatch = msg.match(/pv ([a-h1-8qrbn]{4,5})/);
          if (mpvMatch && pvMatch) {
            const pvIndex = parseInt(mpvMatch[1], 10);
            const move = pvMatch[1];
            pvLinesRef.current[pvIndex] = move;
          }
        }

        if (typeof msg === 'string' && msg.startsWith('bestmove')) {
          const parts = msg.split(' ');
          let finalMove = parts[1];
          
          // Human-like Blunder Mechanic
          const bot = activeBotConfigRef.current;
          if (bot && bot.blunderRate > 0 && Object.keys(pvLinesRef.current).length > 1) {
            if (Math.random() < bot.blunderRate) {
              // Pick a random sub-optimal line (e.g. multipv 2 or 3)
              const maxPv = Math.max(...Object.keys(pvLinesRef.current).map(Number));
              if (maxPv > 1) {
                // Bias towards slightly worse moves rather than completely terrible ones
                const blunderPv = Math.floor(Math.random() * (maxPv - 1)) + 2; 
                if (pvLinesRef.current[blunderPv]) {
                  finalMove = pvLinesRef.current[blunderPv];
                  console.log(`[Grim AI] Blunder triggered! Expected ${parts[1]}, playing ${finalMove} (PV ${blunderPv})`);
                }
              }
            }
          }

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          const elapsed = Date.now() - moveStartTimeRef.current;
          const waitRemaining = Math.max(0, targetDelayRef.current - elapsed);

          const finalizeMove = () => {
            if (finalMove && finalMove !== '(none)' && resolveMoveRef.current) {
              resolveMoveRef.current(finalMove);
              resolveMoveRef.current = null;
            }
            setIsThinking(false);
            pendingMoveTimerRef.current = null;
          };

          if (waitRemaining > 0) {
            pendingMoveTimerRef.current = setTimeout(finalizeMove, waitRemaining);
          } else {
            finalizeMove();
          }
        }
      };

      worker.onerror = (err) => {
        console.error('Stockfish Worker error:', err);
        setEngineError(true);
        setIsReady(true);
      };

      worker.postMessage('uci');
      worker.postMessage('isready');

      const initTimeout = setTimeout(() => {
        if (!readyRef.current) {
          console.warn('Stockfish did not respond in 5s, using fallback');
          setEngineError(true);
          setIsReady(true);
        }
      }, 5000);

      return () => {
        clearTimeout(initTimeout);
        stopThinking();
        worker.terminate();
      };
    } catch (err) {
      console.error('Failed to create Stockfish worker:', err);
      setEngineError(true);
      setIsReady(true);
    }
  }, [stopThinking]);

  const getBestMove = useCallback(async (fen: string, bot: BotConfig, botClockSeconds?: number): Promise<string> => {
    // Calculate humanized thinking duration
    const pieceCount = (fen.split(' ')[0].match(/[pnbrqkPNBRQK]/g) || []).length;
    let targetDelay: number;
    if (pieceCount >= 28) {
      // Opening: snappy, natural moves (700ms - 1300ms)
      targetDelay = 700 + Math.random() * 600;
    } else if (pieceCount >= 14) {
      // Middlegame: tactical calculation pause (1100ms - 2200ms)
      targetDelay = 1100 + Math.random() * 1100;
      if (Math.random() < 0.15) {
        targetDelay += 800 + Math.random() * 800; // Deep think
      }
    } else {
      // Endgame: fast, decisive pacing (800ms - 1500ms)
      targetDelay = 800 + Math.random() * 700;
    }

    // Time-scramble guard: if bot clock is low, think faster so it doesn't self-flag
    if (typeof botClockSeconds === 'number') {
      if (botClockSeconds <= 5) {
        targetDelay = Math.min(targetDelay, 250 + Math.random() * 250);
      } else if (botClockSeconds <= 12) {
        targetDelay = Math.min(targetDelay, 500 + Math.random() * 500);
      }
    }

    targetDelayRef.current = targetDelay;
    moveStartTimeRef.current = Date.now();

    if (engineError || !workerRef.current) {
      setIsThinking(true);
      return new Promise((resolve) => {
        pendingMoveTimerRef.current = setTimeout(() => {
          import('chess.js').then(({ Chess }) => {
            const game = new Chess(fen);
            const moves = game.moves({ verbose: true });
            setIsThinking(false);
            if (moves.length > 0) {
              const m = moves[Math.floor(Math.random() * moves.length)];
              resolve(m.from + m.to + (m.promotion || ''));
            } else {
              resolve('');
            }
          });
        }, targetDelay);
      });
    }

    setIsThinking(true);
    activeBotConfigRef.current = bot;
    pvLinesRef.current = {}; // Reset MultiPV collection for this turn

    return new Promise((resolve) => {
      resolveMoveRef.current = resolve;
      const w = workerRef.current!;

      w.postMessage('ucinewgame');
      // Apply calibrated Stockfish strength & personality options
      if (bot.uciElo && bot.uciElo >= 1320 && bot.uciElo <= 3190) {
        w.postMessage('setoption name UCI_LimitStrength value true');
        w.postMessage(`setoption name UCI_Elo value ${bot.uciElo}`);
      } else {
        w.postMessage('setoption name UCI_LimitStrength value false');
      }
      w.postMessage(`setoption name Skill Level value ${bot.skillLevel}`);
      w.postMessage(`setoption name Contempt value ${bot.contempt}`);
      w.postMessage(`setoption name MultiPV value ${bot.multiPv}`);
      
      w.postMessage(`position fen ${fen}`);
      w.postMessage(`go depth ${bot.depth} movetime ${bot.moveTime}`);

      timeoutRef.current = setTimeout(() => {
        console.warn('Stockfish timeout, using random move fallback');
        resolveMoveRef.current = null;
        setIsThinking(false);
        import('chess.js').then(({ Chess }) => {
          const game = new Chess(fen);
          const moves = game.moves({ verbose: true });
          if (moves.length > 0) {
            const m = moves[Math.floor(Math.random() * moves.length)];
            resolve(m.from + m.to + (m.promotion || ''));
          } else {
            resolve('');
          }
        });
      }, 12000);
    });
  }, [engineError]);

  return { isReady, isThinking, getBestMove, engineError, stopThinking };
}
