import { useState, useEffect, useCallback, useRef } from 'react';

export type BotPersonality = 'martin' | 'nelson' | 'mittens';

export interface BotConfig {
  id: BotPersonality;
  name: string;
  avatar: string;
  skillLevel: number;
  depth: number;
  moveTime: number; // ms
  description: string;
}

export const BOTS: Record<BotPersonality, BotConfig> = {
  martin: {
    id: 'martin',
    name: 'Martin (Novice)',
    avatar: '👶',
    skillLevel: 0,
    depth: 1,
    moveTime: 50,
    description: 'Barely knows how the pieces move. Drops pieces constantly.'
  },
  nelson: {
    id: 'nelson',
    name: 'Nelson (Intermediate)',
    avatar: '🤠',
    skillLevel: 5,
    depth: 5,
    moveTime: 500,
    description: 'Aggressive. Will try to checkmate you as fast as possible.'
  },
  mittens: {
    id: 'mittens',
    name: 'Mittens (Boss)',
    avatar: '🐱',
    skillLevel: 20,
    depth: 15,
    moveTime: 1500,
    description: 'A ruthless, calculating machine. Abandon all hope.'
  }
};

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
