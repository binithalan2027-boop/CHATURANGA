import { useState, useEffect, useMemo } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { useStockfish, BOTS, BotPersonality } from './ai/useStockfish';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const PIECE_SYMBOLS: Record<string, string> = {
  'w-p': '♙', 'w-n': '♘', 'w-b': '♗', 'w-r': '♖', 'w-q': '♕', 'w-k': '♔',
  'b-p': '♟', 'b-n': '♞', 'b-b': '♝', 'b-r': '♜', 'b-q': '♛', 'b-k': '♚',
};

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

interface OfflineGameViewProps {
  onExit: () => void;
  botId?: BotPersonality;
  timeMinutes?: number;
}

export default function OfflineGameView({ onExit, botId = 'martin' }: OfflineGameViewProps) {
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]); // pieces white captured (black pieces)
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]); // pieces black captured (white pieces)

  const [selectedBotId, setSelectedBotId] = useState<BotPersonality>(botId);
  const { isReady, isThinking, getBestMove, engineError } = useStockfish();

  const currentBot = BOTS[selectedBotId];

  // Compute legal moves for the selected piece
  const legalMoves = useMemo(() => {
    if (!selectedSquare) return new Set<string>();
    const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
    return new Set(moves.map((m: Move) => m.to));
  }, [selectedSquare, fen, chess]);

  // Find king square if in check
  const checkSquare = useMemo(() => {
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
    return null;
  }, [fen, chess]);

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

  const recordCapture = (moveResult: any) => {
    if (moveResult.captured) {
      if (moveResult.color === 'w') {
        // White captured a black piece
        setCapturedByWhite(prev => [...prev, moveResult.captured]);
      } else {
        // Black captured a white piece
        setCapturedByBlack(prev => [...prev, moveResult.captured]);
      }
    }
  };

  useEffect(() => {
    async function playBotMove() {
      if (chess.turn() === 'b' && !chess.isGameOver() && isReady) {
        try {
          const moveLan = await getBestMove(chess.fen(), currentBot);
          if (moveLan) {
            const result = chess.move(moveLan);
            if (result) {
              setLastMove({ from: result.from, to: result.to });
              recordCapture(result);
            }
            setFen(chess.fen());
          }
        } catch (e) {
          console.error("Bot failed to move", e);
        }
      }
    }
    playBotMove();
  }, [fen, chess, isReady, currentBot, getBestMove]);

  const handleSquareClick = (sq: string) => {
    if (chess.turn() === 'b' || chess.isGameOver()) return;

    if (selectedSquare) {
      if (selectedSquare !== sq) {
        try {
          const result = chess.move({ from: selectedSquare, to: sq, promotion: 'q' });
          if (result) {
            setLastMove({ from: result.from, to: result.to });
            recordCapture(result);
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
    chess.reset();
    setFen(chess.fen());
    setSelectedSquare(null);
    setLastMove(null);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
  };

  const board = chess.board();

  const gameStatus = chess.isGameOver()
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
                        {piece && (
                          <span className={`board-piece ${piece.color}-piece-active`}>
                            {PIECE_SYMBOLS[`${piece.color}-${piece.type}`]}
                          </span>
                        )}
                        {isLegalTarget && !isCapture && <span className="legal-dot"></span>}
                        {isLegalTarget && isCapture && <span className="legal-capture"></span>}
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
        <h3 className={isThinking ? 'thinking-pulse' : ''}>{gameStatus}</h3>
        <p className="bot-quote">"{currentBot.description}"</p>
      </div>
    </div>
  );
}
