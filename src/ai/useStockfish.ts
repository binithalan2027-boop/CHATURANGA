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
}

export const AI_TIERS = [
  { maxElo: 500, id: 'thrall', name: 'Cursed Thrall', avatar: '💀', desc: 'A mindless vessel of the dark arts. Sacrifices pieces without reason.' },
  { maxElo: 1000, id: 'fiend', name: 'Shadow Fiend', avatar: '🦇', desc: 'Erratic and unpredictable. Barely understands strategy.' },
  { maxElo: 1500, id: 'mage', name: 'Blood Mage', avatar: '🧛', desc: 'Highly aggressive and predatory. Strikes fast, seeking early decimation.' },
  { maxElo: 2000, id: 'assassin', name: 'Nightmare Assassin', avatar: '🥷', desc: 'Lethal precision. Will punish every tactical blunder.' },
  { maxElo: 2500, id: 'lich', name: 'Lich King', avatar: '👑', desc: 'An immortal grandmaster. Commands the board with absolute control.' },
  { maxElo: 3000, id: 'voidweaver', name: 'The Voidweaver', avatar: '👁️', desc: 'An ancient tactical intelligence from the abyss.' },
  { maxElo: 3500, id: 'eldritch', name: 'Eldritch God', avatar: '🐙', desc: 'Flawless execution. Perfect foresight. Resistance is futile.' }
];

export function getBotByElo(elo: number): BotConfig {
  const tier = AI_TIERS.find(t => elo <= t.maxElo) || AI_TIERS[AI_TIERS.length - 1];
  
  // Scale skill level (0 to 20) based on elo
  const skillLevel = Math.max(0, Math.min(20, Math.floor((elo / 3500) * 20)));
  
  // Scale depth (1 to 20) based on elo
  const depth = Math.max(1, Math.min(20, Math.floor((elo / 3500) * 20)));
  
  // Scale movetime (50ms to 2000ms)
  const moveTime = Math.max(50, Math.min(2000, Math.floor((elo / 3500) * 2000)));

  return {
    id: tier.id as any,
    name: tier.name,
    avatar: tier.avatar,
    description: tier.desc,
    skillLevel,
    depth,
    moveTime
  };
}

// Keep BOTS exported for backward compatibility if needed in game view
export const BOTS = AI_TIERS.reduce((acc, tier) => ({ ...acc, [tier.id]: getBotByElo(tier.maxElo) }), {} as Record<string, BotConfig>);

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [engineError, setEngineError] = useState(false);
  const resolveMoveRef = useRef<((move: string) => void) | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const worker = new Worker('/stockfish.js');
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const msg = e.data;

        // Stockfish sends 'uciok' after UCI initialization
        if (typeof msg === 'string' && msg.includes('uciok')) {
          setIsReady(true);
        }

        // Also accept 'readyok' as a ready signal
        if (typeof msg === 'string' && msg.includes('readyok')) {
          if (!isReady) setIsReady(true);
        }

        // Look for bestmove response
        if (typeof msg === 'string' && msg.startsWith('bestmove')) {
          const parts = msg.split(' ');
          const move = parts[1];
          if (move && move !== '(none)' && resolveMoveRef.current) {
            resolveMoveRef.current(move);
            resolveMoveRef.current = null;
          }
          setIsThinking(false);
          // Clear safety timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      };

      worker.onerror = (err) => {
        console.error('Stockfish Worker error:', err);
        setEngineError(true);
        setIsReady(true); // Still mark as "ready" so we fallback gracefully
      };

      worker.postMessage('uci');
      worker.postMessage('isready');

      // Safety: if stockfish doesn't respond in 5s, mark as error
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
    // If engine errored, fall back to picking a random legal move
    if (engineError || !workerRef.current) {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Import chess.js dynamically to pick a random move as fallback
          import('chess.js').then(({ Chess }) => {
            const game = new Chess(fen);
            const moves = game.moves();
            if (moves.length > 0) {
              const randomMove = moves[Math.floor(Math.random() * moves.length)];
              resolve(randomMove);
            } else {
              resolve('');
            }
          });
        }, 300 + Math.random() * 500); // Fake think time
      });
    }

    setIsThinking(true);

    return new Promise((resolve) => {
      resolveMoveRef.current = resolve;

      const w = workerRef.current!;

      // Configure Personality
      w.postMessage('ucinewgame');
      w.postMessage(`setoption name Skill Level value ${bot.skillLevel}`);
      w.postMessage(`position fen ${fen}`);
      w.postMessage(`go depth ${bot.depth} movetime ${bot.moveTime}`);

      // Safety timeout: if no response in 10s, pick a random move
      timeoutRef.current = setTimeout(() => {
        console.warn('Stockfish timeout, using random move fallback');
        resolveMoveRef.current = null;
        setIsThinking(false);
        import('chess.js').then(({ Chess }) => {
          const game = new Chess(fen);
          const moves = game.moves();
          if (moves.length > 0) {
            resolve(moves[Math.floor(Math.random() * moves.length)]);
          } else {
            resolve('');
          }
        });
      }, 10000);
    });
  }, [engineError]);

  return { isReady, isThinking, getBestMove, engineError };
}
