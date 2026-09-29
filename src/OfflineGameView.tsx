import { useState, useEffect, useMemo } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { useStockfish } from './ai/useStockfish';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const PIECE_SYMBOLS: Record<string, string> = {
  'w-p': '♙', 'w-n': '♘', 'w-b': '♗', 'w-r': '♖', 'w-q': '♕', 'w-k': '♔',
  'b-p': '♟', 'b-n': '♞', 'b-b': '♝', 'b-r': '♜', 'b-q': '♛', 'b-k': '♚',
};

const PIECE_IMAGES: Record<string, string> = {
  'w-k': '/pieces/wK.svg', 'w-q': '/pieces/wQ.svg', 'w-r': '/pieces/wR.svg',
  'w-b': '/pieces/wB.svg', 'w-n': '/pieces/wN.svg', 'w-p': '/pieces/wP.svg',
  'b-k': '/pieces/bK.svg', 'b-q': '/pieces/bQ.svg', 'b-r': '/pieces/bR.svg',
  'b-b': '/pieces/bB.svg', 'b-n': '/pieces/bN.svg', 'b-p': '/pieces/bP.svg',
};

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function generateChess960Fen(): string {
  const pieces = Array(8).fill('');
  // Place bishops on opposite colored squares
  const b1 = Math.floor(Math.random() * 4) * 2; // 0, 2, 4, 6
  const b2 = Math.floor(Math.random() * 4) * 2 + 1; // 1, 3, 5, 7
  pieces[b1] = 'b';
  pieces[b2] = 'b';
  // Place queen
  let q;
  do { q = Math.floor(Math.random() * 8); } while (pieces[q] !== '');
  pieces[q] = 'q';
  // Place knights
  for (let i = 0; i < 2; i++) {
    let n;
    do { n = Math.floor(Math.random() * 8); } while (pieces[n] !== '');
    pieces[n] = 'n';
  }
  // Place rooks and king
  const emptySquares = pieces.map((p, i) => p === '' ? i : -1).filter(i => i !== -1);
  pieces[emptySquares[0]] = 'r';
  pieces[emptySquares[1]] = 'k';
  pieces[emptySquares[2]] = 'r';
  
  const rank = pieces.join('');
  return `${rank.toLowerCase()}/pppppppp/8/8/8/8/PPPPPPPP/${rank.toUpperCase()} w KQkq - 0 1`;
}

interface OfflineGameViewProps {
  onExit: () => void;
  botElo?: number;
  timeMinutes?: number;
  gameMode?: 'standard' | 'chess960' | 'fog' | 'atomic';
}

import { getBotByElo } from './ai/useStockfish';

export default function OfflineGameView({ onExit, botElo = 250, gameMode = 'standard' }: OfflineGameViewProps) {
  const [chess, setChess] = useState(() => new Chess(gameMode === 'chess960' ? generateChess960Fen() : undefined));
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]); 
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]); 
  const [atomicWinner, setAtomicWinner] = useState<'w' | 'b' | null>(null);

  const [currentBotElo, setCurrentBotElo] = useState<number>(botElo);
  const { isReady, isThinking, getBestMove, engineError } = useStockfish();

  const currentBot = getBotByElo(currentBotElo);

  // Compute legal moves for the selected piece
  const legalMoves = useMemo(() => {
    if (!selectedSquare || atomicWinner) return new Set<string>();
    try {
      const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
      return new Set(moves.map((m: Move) => m.to));
    } catch(e) {
      return new Set<string>();
    }
  }, [selectedSquare, fen, chess, atomicWinner]);

  // Find king square if in check
  const checkSquare = useMemo(() => {
    if (atomicWinner) return null;
    try {
      if (!chess.isCheck()) return null;
      const turn = chess.turn();
      const board = chess.board();
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const piece = board[r][f];
          if (piece && piece.type === 'k' && piece.color === turn) {
            return `${FILES[f]}${RANKS[r]}`;
          }
        }
      }
    } catch(e) {
      // In case atomic chess broke the internal state by removing a king
    }
    return null;
  }, [fen, chess, atomicWinner]);

  // Compute material advantage
  const materialAdvantage = useMemo(() => {
    const whiteScore = capturedByWhite.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
    const blackScore = capturedByBlack.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
    return whiteScore - blackScore;
  }, [capturedByWhite, capturedByBlack]);

  // Move history
  const moveHistory = useMemo(() => {
    const history = chess.history();
    const pairs: { num: number; white: string; black?: string }[] = [];
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({
        num: Math.floor(i / 2) + 1,
        white: history[i],
        black: history[i + 1],
      });
    }
    return pairs;
  }, [fen, chess]);

  // Compute visible squares for Fog of War mode
  const visibleSquares = useMemo(() => {
    if (gameMode !== 'fog') return null;
    const visible = new Set<string>();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = board[r][f];
        if (piece && piece.color === 'w') {
          const sq = `${FILES[f]}${RANKS[r]}`;
          visible.add(sq);
          try {
            const moves = chess.moves({ square: sq as Square, verbose: true });
            moves.forEach(m => visible.add(m.to));
          } catch(e) {}
        }
      }
    }
    return visible;
  }, [fen, chess, gameMode]);

  const recordCapture = (moveResult: any) => {
    if (moveResult.captured) {
      if (moveResult.color === 'w') {
        setCapturedByWhite(prev => [...prev, moveResult.captured]);
      } else {
        setCapturedByBlack(prev => [...prev, moveResult.captured]);
      }
    }
  };

  const applyAtomicExplosion = (moveResult: any) => {
    if (gameMode !== 'atomic' || !moveResult.captured) return;
    
    const to = moveResult.to;
    const fileIdx = FILES.indexOf(to[0]);
    const rankIdx = RANKS.indexOf(to[1]);
    
    const toRemove: string[] = [to];
    for (let r = Math.max(0, rankIdx - 1); r <= Math.min(7, rankIdx + 1); r++) {
      for (let f = Math.max(0, fileIdx - 1); f <= Math.min(7, fileIdx + 1); f++) {
        const sq = `${FILES[f]}${RANKS[r]}`;
        if (sq !== to) {
           const p = chess.get(sq as Square);
           if (p && p.type !== 'p') {
               toRemove.push(sq);
           }
        }
      }
    }
    
    let kingExploded: 'w' | 'b' | null = null;
    toRemove.forEach(sq => {
       const p = chess.get(sq as Square);
       if (p) {
           if (p.type === 'k') kingExploded = p.color;
           chess.remove(sq as Square);
       }
    });
    
    if (kingExploded) {
       setAtomicWinner(kingExploded === 'w' ? 'b' : 'w');
    }
  };

  useEffect(() => {
    async function playBotMove() {
      if (chess.turn() === 'b' && !chess.isGameOver() && !atomicWinner && isReady) {
        try {
          const moveLan = await getBestMove(chess.fen(), currentBot);
          if (moveLan) {
            const result = chess.move(moveLan);
            if (result) {
              setLastMove({ from: result.from, to: result.to });
              recordCapture(result);
              applyAtomicExplosion(result);
            }
            setFen(chess.fen());
          }
        } catch (e) {
          console.error("Bot failed to move", e);
        }
      }
    }
    playBotMove();
  }, [fen, chess, isReady, currentBot, getBestMove, atomicWinner, gameMode]);

  const handleSquareClick = (sq: string) => {
    if (chess.turn() === 'b' || chess.isGameOver() || atomicWinner) return;

    if (selectedSquare) {
      if (selectedSquare !== sq) {
        try {
          const result = chess.move({ from: selectedSquare, to: sq, promotion: 'q' });
          if (result) {
            setLastMove({ from: result.from, to: result.to });
            recordCapture(result);
            applyAtomicExplosion(result);
          }
          setFen(chess.fen());
        } catch (e) {
          // Invalid move — check if clicking a different own piece
          const piece = chess.get(sq as Square);
          if (piece && piece.color === 'w') {
            setSelectedSquare(sq);
            return;
          }
        }
      }
      setSelectedSquare(null);
    } else {
      const piece = chess.get(sq as Square);
      if (piece && piece.color === 'w') {
        setSelectedSquare(sq);
      }
    }
  };

  const handleNewGame = () => {
    const newChess = new Chess(gameMode === 'chess960' ? generateChess960Fen() : undefined);
    setChess(newChess);
    setFen(newChess.fen());
    setSelectedSquare(null);
    setLastMove(null);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setAtomicWinner(null);
  };

  const board = chess.board();

  const isGameOver = chess.isGameOver() || atomicWinner;
  const gameStatus = atomicWinner
    ? `Game Over! ${atomicWinner === 'w' ? 'You' : currentBot.name} wins! (Atomic explosion)`
    : chess.isGameOver()
      ? chess.isCheckmate()
        ? `Checkmate! ${chess.turn() === 'w' ? currentBot.name : 'You'} win!`
        : chess.isDraw()
          ? 'Draw!'
          : chess.isStalemate()
            ? 'Stalemate!'
            : 'Game Over!'
      : isThinking
        ? `${currentBot.avatar} ${currentBot.name} is thinking...`
        : '🎯 Your Turn (White)';

  return (
    <div className="min-h-screen bg-void-black flex flex-col lg:flex-row items-center justify-center p-space-md gap-gutter w-full text-bone-ivory font-body-md">
      <div className="flex flex-col gap-4 w-full max-w-[600px]">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-surface-card p-3 rounded-lg border border-surface-container-high">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isReady ? (engineError ? 'bg-yellow-400' : 'bg-green-500') : 'bg-red-500'}`}></span>
            <span className="font-headline-sm">{currentBot.avatar} Vs {currentBot.name}</span>
            {engineError && <span className="text-xs bg-yellow-400 text-black px-1 font-bold">Fallback</span>}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="3500"
              value={currentBotElo}
              onChange={(e) => setCurrentBotElo(parseInt(e.target.value))}
              disabled={isThinking || chess.history().length > 0}
              className="w-24 h-2 bg-surface-container-highest rounded appearance-none cursor-pointer accent-secondary"
              title={`ELO: ${currentBotElo}`}
            />
            <button className="px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest rounded text-sm transition-colors" onClick={handleNewGame}>New Game</button>
            <button className="px-3 py-1 bg-crimson-glow hover:bg-red-700 text-white font-bold rounded text-sm transition-colors" onClick={onExit}>SURRENDER TO THE VOID</button>
          </div>
        </div>

        {/* OPPONENT INFO BAR */}
        <div className="bg-surface-card border border-surface-container-high p-space-sm rounded flex items-center justify-between font-headline-md text-bone-ivory">
          <div className="flex items-center gap-2">
            <div>{currentBot.avatar}</div>
            <div>{currentBot.name}</div>
          </div>
          <div className="flex items-center gap-1 text-surface-container-highest">
            {capturedByBlack.map((p, i) => (
              <span key={i}>{PIECE_SYMBOLS[`w-${p}`]}</span>
            ))}
            {materialAdvantage < 0 && <span className="text-sm ml-2 text-green-400">+{Math.abs(materialAdvantage)}</span>}
          </div>
        </div>

        {/* BOARD */}
        <div className="aspect-square w-full max-w-[600px] border-4 border-surface-container-highest shadow-[0_0_40px_rgba(163,19,43,0.3)] rounded grid grid-cols-8 grid-rows-8">
          {RANKS.map((r, rIdx) => 
            FILES.map((f, fIdx) => {
              const sq = `${f}${r}`;
              const piece = board[rIdx][fIdx];
              const isLight = (rIdx + fIdx) % 2 === 0;
              const isSelected = selectedSquare === sq;
              const isLegalTarget = legalMoves.has(sq);
              const isLastMove = lastMove && (lastMove.from === sq || lastMove.to === sq);
              const isCheck = checkSquare === sq;
              const isCapture = isLegalTarget && piece !== null;
              const isVisible = gameMode === 'fog' && visibleSquares ? visibleSquares.has(sq) : true;

              let bgClass = isLight ? 'bg-surface-container-high' : 'bg-surface-dark';
              if (isCheck) bgClass = 'bg-crimson-glow/40 animate-pulse';
              else if (isSelected) bgClass = 'bg-tertiary-container/40';
              else if (isLastMove) bgClass = 'bg-secondary-container/20';

              return (
                <div
                  key={sq}
                  className={`relative flex items-center justify-center cursor-pointer ${bgClass}`}
                  onClick={() => handleSquareClick(sq)}
                >
                  {fIdx === 0 && <span className="absolute top-0.5 left-1 text-[10px] font-mono opacity-40 pointer-events-none select-none">{r}</span>}
                  {rIdx === 7 && <span className="absolute bottom-0.5 right-1 text-[10px] font-mono opacity-40 pointer-events-none select-none">{f}</span>}

                  {isVisible ? (
                    <>
                      {piece && (
                        <img 
                          src={PIECE_IMAGES[`${piece.color}-${piece.type}`]} 
                          alt={`${piece.color} ${piece.type}`}
                          className="w-[85%] h-[85%] drop-shadow-lg pointer-events-none select-none transition-transform hover:scale-110 z-10" 
                          draggable={false} 
                        />
                      )}
                      {isLegalTarget && !isCapture && <div className="absolute w-1/3 h-1/3 rounded-full bg-crimson-glow/50 z-20 pointer-events-none" />}
                      {isLegalTarget && isCapture && <div className="absolute w-[85%] h-[85%] rounded-full border-[4px] border-crimson-glow/50 z-20 pointer-events-none" />}
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-void-black/90 backdrop-blur-sm z-30 pointer-events-none"></div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* PLAYER INFO BAR */}
        <div className="bg-surface-card border border-surface-container-high p-space-sm rounded flex items-center justify-between font-headline-md text-bone-ivory">
          <div className="flex items-center gap-2">
            <div>👤</div>
            <div>You (White)</div>
          </div>
          <div className="flex items-center gap-1 text-surface-container-highest">
            {capturedByWhite.map((p, i) => (
              <span key={i}>{PIECE_SYMBOLS[`b-${p}`]}</span>
            ))}
            {materialAdvantage > 0 && <span className="text-sm ml-2 text-green-400">+{materialAdvantage}</span>}
          </div>
        </div>

        {/* STATUS FOOTER */}
        <div className="text-center mt-2">
          <h3 className={`text-xl font-headline-lg text-crimson-glow ${isThinking && !isGameOver ? 'animate-pulse' : ''}`}>{gameStatus}</h3>
          <p className="text-surface-container-highest italic opacity-80 mt-1">"{currentBot.description}"</p>
        </div>
      </div>

      {/* MOVE HISTORY SIDEBAR */}
      <div className="w-full lg:w-80 bg-surface-card rounded-xl p-space-md font-mono text-body-sm h-[60vh] overflow-y-auto border border-surface-container-high flex flex-col">
        <h4 className="text-lg font-headline-sm text-bone-ivory mb-4 border-b border-surface-container-high pb-2">Chronicles of Void</h4>
        <div className="flex flex-col gap-1">
          {moveHistory.length === 0 && <p className="text-surface-container-highest italic">The abyss awaits the first move...</p>}
          {moveHistory.map(pair => (
            <div className="flex items-center hover:bg-surface-container-high/50 p-1 rounded transition-colors" key={pair.num}>
              <span className="w-8 text-surface-container-highest opacity-70">{pair.num}.</span>
              <span className="flex-1 text-bone-ivory">{pair.white}</span>
              <span className="flex-1 text-tertiary-container">{pair.black || ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
