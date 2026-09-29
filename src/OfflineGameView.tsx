import { useState, useEffect, useMemo } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { useStockfish, BOTS, BotPersonality } from './ai/useStockfish';

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
  botId?: BotPersonality;
  timeMinutes?: number;
  gameMode?: 'standard' | 'chess960' | 'fog' | 'atomic';
}

export default function OfflineGameView({ onExit, botId = 'martin', gameMode = 'standard' }: OfflineGameViewProps) {
  const [chess, setChess] = useState(() => new Chess(gameMode === 'chess960' ? generateChess960Fen() : undefined));
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]); // pieces white captured (black pieces)
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]); // pieces black captured (white pieces)
  const [atomicWinner, setAtomicWinner] = useState<'w' | 'b' | null>(null);

  const [selectedBotId, setSelectedBotId] = useState<BotPersonality>(botId);
  const { isReady, isThinking, getBestMove, engineError } = useStockfish();

  const currentBot = BOTS[selectedBotId];

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
    <div className="game-wrapper">
      {/* HEADER */}
      <div className="game-header">
        <div className="header-left">
          <span className="status-dot" style={{ background: isReady ? (engineError ? '#FFDE00' : '#00FF66') : '#FF3366' }}></span>
          <span>{currentBot.avatar} Vs {currentBot.name}</span>
          {engineError && <span style={{ fontSize: '0.7rem', background: '#FFDE00', border: '2px solid #000', padding: '0.1rem 0.4rem', fontWeight: 800 }}>Fallback Mode</span>}
        </div>
        <div className="header-right">
          <label>Opponent:</label>
          <select
            value={selectedBotId}
            onChange={(e) => setSelectedBotId(e.target.value as BotPersonality)}
            disabled={isThinking || chess.history().length > 0}
          >
            {Object.values(BOTS).map(bot => (
              <option key={bot.id} value={bot.id}>{bot.name}</option>
            ))}
          </select>
          <button className="btn-new-game" onClick={handleNewGame}>New Game</button>
          <button className="btn-exit" onClick={onExit}>Exit</button>
        </div>
      </div>

      <div className="game-body">
        {/* OPPONENT INFO BAR (Black / Bot) */}
        <div className="player-bar opponent-bar">
          <div className="player-identity">
            <div className="player-avatar">{currentBot.avatar}</div>
            <div className="player-name">{currentBot.name}</div>
          </div>
          <div className="captured-pieces">
            {capturedByBlack.map((p, i) => (
              <span key={i} className="captured-piece">{PIECE_SYMBOLS[`w-${p}`]}</span>
            ))}
            {materialAdvantage < 0 && <span className="material-diff">+{Math.abs(materialAdvantage)}</span>}
          </div>
        </div>

        <div className="board-and-history">
          {/* BOARD */}
          <div className="board-container-active">
            <div className="active-board">
              {RANKS.map((r, rIdx) => (
                <div className="board-row" key={r}>
                  <span className="rank-label">{r}</span>
                  {FILES.map((f, fIdx) => {
                    const sq = `${f}${r}`;
                    const piece = board[rIdx][fIdx];
                    const isLight = (rIdx + fIdx) % 2 === 0;
                    const isSelected = selectedSquare === sq;
                    const isLegalTarget = legalMoves.has(sq);
                    const isLastMove = lastMove && (lastMove.from === sq || lastMove.to === sq);
                    const isCheck = checkSquare === sq;
                    const isCapture = isLegalTarget && piece !== null;
                    const isVisible = gameMode === 'fog' && visibleSquares ? visibleSquares.has(sq) : true;

                    const classes = [
                      'board-sq',
                      isLight ? 'light' : 'dark',
                      isSelected ? 'selected' : '',
                      isLastMove ? 'last-move' : '',
                      isCheck ? 'in-check' : '',
                    ].filter(Boolean).join(' ');

                    return (
                      <div
                        key={sq}
                        className={classes}
                        onClick={() => handleSquareClick(sq)}
                      >
                        {isVisible ? (
                          <>
                            {piece && (
                              <img 
                                src={PIECE_IMAGES[`${piece.color}-${piece.type}`]} 
                                alt={`${piece.color} ${piece.type}`}
                                className="board-piece-img" 
                                draggable={false} 
                              />
                            )}
                            {isLegalTarget && !isCapture && <span className="legal-dot"></span>}
                            {isLegalTarget && isCapture && <span className="legal-capture"></span>}
                          </>
                        ) : (
                          <div className="fog-overlay"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="file-labels">
                <span className="rank-spacer"></span>
                {FILES.map(f => <span key={f} className="file-label">{f}</span>)}
              </div>
            </div>
          </div>

          {/* MOVE HISTORY */}
          <div className="move-history-panel">
            <h4>Moves</h4>
            <div className="move-list">
              {moveHistory.length === 0 && <p className="no-moves">No moves yet</p>}
              {moveHistory.map(pair => (
                <div className="move-row" key={pair.num}>
                  <span className="move-num">{pair.num}.</span>
                  <span className="move-white">{pair.white}</span>
                  <span className="move-black">{pair.black || ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PLAYER INFO BAR (White / You) */}
        <div className="player-bar player-bar-you">
          <div className="player-identity">
            <div className="player-avatar">👤</div>
            <div className="player-name">You (White)</div>
          </div>
          <div className="captured-pieces">
            {capturedByWhite.map((p, i) => (
              <span key={i} className="captured-piece">{PIECE_SYMBOLS[`b-${p}`]}</span>
            ))}
            {materialAdvantage > 0 && <span className="material-diff">+{materialAdvantage}</span>}
          </div>
        </div>
      </div>

      {/* STATUS FOOTER */}
      <div className="game-footer">
        <h3 className={isThinking && !isGameOver ? 'thinking-pulse' : ''}>{gameStatus}</h3>
        <p className="bot-quote">"{currentBot.description}"</p>
      </div>
    </div>
  );
}
