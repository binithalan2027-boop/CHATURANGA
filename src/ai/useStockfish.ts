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
}

export const AI_TIERS = [
  { maxElo: 500, id: 'thrall', name: 'Cursed Thrall', avatar: '💀', desc: 'A mindless vessel of the dark arts. Sacrifices pieces without reason.', contempt: -50, multiPv: 4, blunderRate: 0.6 },
  { maxElo: 1000, id: 'fiend', name: 'Shadow Fiend', avatar: '🦇', desc: 'Erratic and unpredictable. Barely understands strategy.', contempt: -20, multiPv: 3, blunderRate: 0.4 },
  { maxElo: 1500, id: 'mage', name: 'Blood Mage', avatar: '🧛', desc: 'Highly aggressive and predatory. Strikes fast, seeking early decimation.', contempt: 100, multiPv: 3, blunderRate: 0.2 },
  { maxElo: 2000, id: 'assassin', name: 'Nightmare Assassin', avatar: '🥷', desc: 'Lethal precision. Will punish every tactical blunder.', contempt: 50, multiPv: 2, blunderRate: 0.1 },
  { maxElo: 2500, id: 'lich', name: 'Lich King', avatar: '👑', desc: 'An immortal grandmaster. Commands the board with absolute control.', contempt: 0, multiPv: 1, blunderRate: 0.05 },
  { maxElo: 3000, id: 'voidweaver', name: 'The Voidweaver', avatar: '👁️', desc: 'An ancient tactical intelligence from the abyss.', contempt: 0, multiPv: 1, blunderRate: 0.01 },
  { maxElo: 3500, id: 'eldritch', name: 'Eldritch God', avatar: '🐙', desc: 'Flawless execution. Perfect foresight. Resistance is futile.', contempt: 0, multiPv: 1, blunderRate: 0 }
];

export function getBotByElo(elo: number): BotConfig {
  const tier = AI_TIERS.find(t => elo <= t.maxElo) || AI_TIERS[AI_TIERS.length - 1];
  
  const skillLevel = Math.max(0, Math.min(20, Math.floor((elo / 3500) * 20)));
  const depth = Math.max(1, Math.min(20, Math.floor((elo / 3500) * 20)));
  const moveTime = Math.max(50, Math.min(2000, Math.floor((elo / 3500) * 2000)));

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
    blunderRate: tier.blunderRate
  };
}

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [engineError, setEngineError] = useState(false);
  const resolveMoveRef = useRef<((move: string) => void) | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // To track MultiPV lines during a search
  const pvLinesRef = useRef<Record<number, string>>({});
  const activeBotConfigRef = useRef<BotConfig | null>(null);

  useEffect(() => {
    try {
      const worker = new Worker('/stockfish.js');
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const msg = e.data;

        if (typeof msg === 'string' && msg.includes('uciok')) {
          setIsReady(true);
        }

        if (typeof msg === 'string' && msg.includes('readyok')) {
          if (!isReady) setIsReady(true);
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

          if (finalMove && finalMove !== '(none)' && resolveMoveRef.current) {
            resolveMoveRef.current(finalMove);
            resolveMoveRef.current = null;
          }
          setIsThinking(false);
          
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
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
        if (!isReady) {
          console.warn('Stockfish did not respond in 5s, using fallback');
          setEngineError(true);
          setIsReady(true);
        }
      }, 5000);

      return () => {
        clearTimeout(initTimeout);
        worker.terminate();
      };
    } catch (err) {
      console.error('Failed to create Stockfish worker:', err);
      setEngineError(true);
      setIsReady(true);
    }
  }, []);

  const getBestMove = useCallback(async (fen: string, bot: BotConfig): Promise<string> => {
    if (engineError || !workerRef.current) {
      return new Promise((resolve) => {
        setTimeout(() => {
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
        }, 300 + Math.random() * 500);
      });
    }

    setIsThinking(true);
    activeBotConfigRef.current = bot;
    pvLinesRef.current = {}; // Reset MultiPV collection for this turn

    return new Promise((resolve) => {
      resolveMoveRef.current = resolve;
      const w = workerRef.current!;

      w.postMessage('ucinewgame');
      // Apply advanced Personality Options
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
      }, 10000);
    });
  }, [engineError]);

  return { isReady, isThinking, getBestMove, engineError };
}
