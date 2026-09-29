import { useState, useMemo, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { useStockfish, getBotByElo } from '../ai/useStockfish';
import ChessBoard from '../components/ChessBoard';
import PlayerBar from '../components/PlayerBar';
import MoveHistory from '../components/MoveHistory';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export interface GameModeProps {
  onExit: () => void;
  botElo: number;
}

export default function StandardMode({ onExit, botElo }: GameModeProps) {
  const [chess, setChess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]);
  const [winner, setWinner] = useState<'w' | 'b' | null>(null);

  const [currentBotElo, setCurrentBotElo] = useState<number>(botElo);
  const { isReady, isThinking, getBestMove, engineError } = useStockfish();
  const currentBot = getBotByElo(currentBotElo);

  const legalMoves = useMemo(() => {
    if (!selectedSquare || winner) return new Set<string>();
    try {
      const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
      return new Set(moves.map((m: Move) => m.to));
    } catch(e) {
      return new Set<string>();
    }
  }, [selectedSquare, fen, chess, winner]);

  const checkSquare = useMemo(() => {
    if (winner) return null;
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
    } catch(e) {}
    return null;
  }, [fen, chess, winner]);

  const materialAdvantage = useMemo(() => {
    const whiteScore = capturedByWhite.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
    const blackScore = capturedByBlack.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
    return whiteScore - blackScore;
  }, [capturedByWhite, capturedByBlack]);

  const recordCapture = (moveResult: any) => {
    if (moveResult.captured) {
      if (moveResult.color === 'w') {
        setCapturedByWhite(prev => [...prev, moveResult.captured]);
      } else {
        setCapturedByBlack(prev => [...prev, moveResult.captured]);
      }
    }
  };

  const handleSquareClick = (sq: string) => {
    if (winner || chess.turn() !== 'w') return;

    if (selectedSquare) {
      if (legalMoves.has(sq)) {
        try {
          const move = chess.move({ from: selectedSquare, to: sq, promotion: 'q' });
          recordCapture(move);
          setFen(chess.fen());
          setLastMove({ from: selectedSquare, to: sq });
          setSelectedSquare(null);

          if (chess.isGameOver()) {
            if (chess.isCheckmate()) setWinner('w');
          }
        } catch (e) {
          setSelectedSquare(null);
        }
      } else {
        const piece = chess.get(sq as Square);
        if (piece && piece.color === 'w') {
          setSelectedSquare(sq);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      const piece = chess.get(sq as Square);
      if (piece && piece.color === 'w') {
        setSelectedSquare(sq);
      }
    }
  };

  useEffect(() => {
    if (winner || chess.turn() === 'w') return;
    let isActive = true;

    const playBotMove = async () => {
      const moveStr = await getBestMove(chess.fen(), currentBot);
      if (!isActive || !moveStr) return;

      try {
        const from = moveStr.slice(0, 2);
        const to = moveStr.slice(2, 4);
        const promotion = moveStr.length > 4 ? moveStr[4] : undefined;
        
        const move = chess.move({ from, to, promotion });
        recordCapture(move);
        setFen(chess.fen());
        setLastMove({ from, to });
        
        if (chess.isGameOver()) {
          if (chess.isCheckmate()) setWinner('b');
        }
      } catch (e) {
        console.error("Bot attempted illegal move:", moveStr);
      }
    };
    playBotMove();

    return () => { isActive = false; };
  }, [fen, chess, getBestMove, currentBot, winner]);

  const handleNewGame = () => {
    const newChess = new Chess();
    setChess(newChess);
    setFen(newChess.fen());
    setSelectedSquare(null);
    setLastMove(null);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setWinner(null);
  };

  return (
    <div className="min-h-screen bg-void-black flex flex-col lg:flex-row items-center justify-center p-space-md gap-gutter w-full text-bone-ivory font-body-md">
      <div className="flex flex-col gap-4 w-full max-w-[600px]">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-surface-card p-3 rounded-lg border border-surface-container-high shadow-xl">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isReady ? (engineError ? 'bg-yellow-400' : 'bg-green-500') : 'bg-red-500'}`}></span>
            <span className="font-headline-sm uppercase tracking-wide">Ranked Classic</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest rounded text-sm transition-colors uppercase tracking-wider" onClick={handleNewGame}>New Game</button>
            <button className="px-3 py-1 bg-crimson-glow hover:bg-red-700 text-white font-bold rounded text-sm transition-colors uppercase tracking-wider shadow-[0_0_10px_rgba(255,0,0,0.2)]" onClick={onExit}>Surrender</button>
          </div>
        </div>

        {/* OPPONENT INFO BAR */}
        <PlayerBar
          name={currentBot.name}
          avatar={currentBot.avatar}
          isThinking={isThinking}
          capturedPieces={capturedByBlack}
          materialAdvantage={-materialAdvantage}
          isActive={chess.turn() === 'b' && !winner}
          elo={currentBotElo}
        />

        {/* CHESS BOARD */}
        <div className="relative">
          <ChessBoard
            board={chess.board()}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={lastMove}
            checkSquare={checkSquare}
            onSquareClick={handleSquareClick}
          />
          {winner && (
            <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
              <h2 className="font-display-lg text-6xl text-crimson-glow uppercase tracking-tighter mb-4 animate-pulse drop-shadow-[0_0_20px_rgba(255,0,0,0.5)]">
                {winner === 'w' ? 'VICTORY' : 'DEFEATED'}
              </h2>
              <button className="px-6 py-2 bg-bone-ivory text-void-black font-bold uppercase tracking-widest rounded hover:bg-white transition-colors" onClick={handleNewGame}>
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        {/* ELO SLIDER */}
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex justify-between font-label-sm text-[10px] text-on-surface-variant uppercase">
            <span>Mindless (1)</span>
            <span>Godlike (3500)</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="3500" 
            value={currentBotElo} 
            onChange={(e) => setCurrentBotElo(parseInt(e.target.value))}
            disabled={isThinking || chess.history().length > 0}
            className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-secondary"
            title={`Adjust AI ELO: ${currentBotElo}`}
          />
        </div>

        {/* PLAYER INFO BAR */}
        <PlayerBar
          name="You"
          avatar="👤"
          capturedPieces={capturedByWhite}
          materialAdvantage={materialAdvantage}
          isActive={chess.turn() === 'w' && !winner}
        />
      </div>

      <MoveHistory history={chess.history()} />
    </div>
  );
}
