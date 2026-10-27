import { useState, useMemo, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { useStockfish, getBotByElo } from '../ai/useStockfish';
import CourtyardMatch from './CourtyardMatch';
import { unlockAchievement } from '../chaturanga/achievements';
import { recordGameResult } from '../chaturanga/stats';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const START_COUNTS: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 0 };

export interface GameModeProps {
  onExit: () => void;
  botElo: number;
  timeMinutes?: number;
}

// Rebuild capture lists from the board so takebacks stay accurate.
export function capturedFromBoard(chess: Chess) {
  const onBoard: Record<'w' | 'b', Record<string, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };
  let extraWhiteQueens = 0;
  let extraBlackQueens = 0;
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece || piece.type === 'k') continue;
      onBoard[piece.color as 'w' | 'b'][piece.type]++;
    }
  }
  const capturedByWhite: string[] = [];
  const capturedByBlack: string[] = [];
  for (const t of ['q', 'r', 'b', 'n', 'p']) {
    const missingBlack = START_COUNTS[t] - onBoard.b[t];
    const missingWhite = START_COUNTS[t] - onBoard.w[t];
    // Promotions can push a count above the start; treat the excess as
    // offsetting missing pawns instead of pretending pieces were captured.
    const blackDeficit = Math.max(0, missingBlack - (t === 'p' ? extraBlackQueens : 0));
    const whiteDeficit = Math.max(0, missingWhite - (t === 'p' ? extraWhiteQueens : 0));
    if (t === 'q') {
      extraBlackQueens = Math.max(0, -missingBlack);
      extraWhiteQueens = Math.max(0, -missingWhite);
    }
    for (let i = 0; i < blackDeficit; i++) capturedByWhite.push(t);
    for (let i = 0; i < whiteDeficit; i++) capturedByBlack.push(t);
  }
  return { capturedByWhite, capturedByBlack };
}

export default function StandardMode({ onExit, botElo, timeMinutes = 10 }: GameModeProps) {
  const [chess, setChess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]);
  const [winner, setWinner] = useState<'w' | 'b' | null>(null);
  const [resultReason, setResultReason] = useState<string | null>(null);

  const initialTime = Math.max(60, timeMinutes * 60);
  const [playerTime, setPlayerTime] = useState<number>(initialTime);
  const [botTime, setBotTime] = useState<number>(initialTime);

  const [currentBotElo] = useState<number>(botElo);
  const { isReady, isThinking, getBestMove, engineError, stopThinking } = useStockfish();
  const currentBot = getBotByElo(currentBotElo);

  // Active game clock countdown
  useEffect(() => {
    if (winner) return;
    const interval = setInterval(() => {
      if (chess.turn() === 'w') {
        setPlayerTime((t) => {
          if (t <= 1) {
            setWinner('b');
            setResultReason('DEFEAT · TIME FORFEIT');
            recordGameResult('loss');
            return 0;
          }
          return t - 1;
        });
      } else {
        setBotTime((t) => {
          if (t <= 1) {
            setWinner('w');
            setResultReason('VICTORY · WON ON TIME');
            unlockAchievement('first-win');
            recordGameResult('win');
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [chess, winner]);

  const formatClock = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const legalMoves = useMemo(() => {
    if (!selectedSquare || winner) return new Set<string>();
    try {
      const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
      return new Set(moves.map((m: Move) => m.to));
    } catch (e) {
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
    } catch (e) {}
    return null;
  }, [fen, chess, winner]);

  const materialAdvantage = useMemo(() => {
    const whiteScore = capturedByWhite.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
    const blackScore = capturedByBlack.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
    return whiteScore - blackScore;
  }, [capturedByWhite, capturedByBlack]);

  const recordCapture = (moveResult: Move) => {
    const captured = moveResult.captured;
    if (captured) {
      if (moveResult.color === 'w') {
        setCapturedByWhite(prev => [...prev, captured]);
      } else {
        setCapturedByBlack(prev => [...prev, captured]);
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
            if (chess.isCheckmate()) {
              setWinner('w');
              unlockAchievement('first-win');
              if (botElo >= 1500) unlockAchievement('mate-sprint');
              recordGameResult('win');
            } else if (chess.isDraw()) {
              recordGameResult('draw');
            }
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
      const moveStr = await getBestMove(chess.fen(), currentBot, botTime);
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
          if (chess.isCheckmate()) {
            setWinner('b');
            setResultReason('DEFEAT · CHECKMATE');
            recordGameResult('loss');
          } else if (chess.isDraw()) {
            recordGameResult('draw');
          }
        }
      } catch (e) {
        console.error("Bot attempted illegal move:", moveStr);
      }
    };
    playBotMove();

    return () => { isActive = false; };
  }, [fen, chess, getBestMove, currentBot, winner, botTime]);

  const handleNewGame = () => {
    stopThinking();
    const newChess = new Chess();
    setChess(newChess);
    setFen(newChess.fen());
    setSelectedSquare(null);
    setLastMove(null);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setWinner(null);
    setResultReason(null);
    setPlayerTime(initialTime);
    setBotTime(initialTime);
  };

  // Take back the last full move (bot reply plus your move).
  const handleTakeback = () => {
    if (chess.history().length === 0) return;
    stopThinking();
    chess.undo();
    if (chess.turn() === 'b' && chess.history().length > 0) chess.undo();
    setFen(chess.fen());
    setLastMove(null);
    setSelectedSquare(null);
    const rebuilt = capturedFromBoard(chess);
    setCapturedByWhite(rebuilt.capturedByWhite);
    setCapturedByBlack(rebuilt.capturedByBlack);
  };

  return (
    <CourtyardMatch
      eyebrow="CLASSIC CHESS · THE CLASSIC COLLECTION"
      title="Classic chess"
      board={chess.board()}
      selectedSquare={selectedSquare}
      legalMoves={legalMoves}
      lastMove={lastMove}
      checkSquare={checkSquare}
      onSquareClick={handleSquareClick}
      botName={currentBot.name}
      botElo={currentBotElo}
      isBotThinking={isThinking}
      capturedByWhite={capturedByWhite}
      capturedByBlack={capturedByBlack}
      materialAdvantage={materialAdvantage}
      botActive={chess.turn() === 'b' && !winner}
      playerActive={chess.turn() === 'w' && !winner}
      playerClock={formatClock(playerTime)}
      botClock={formatClock(botTime)}
      resultTitle={resultReason || undefined}
      status={
        engineError
          ? 'The engine could not start. You can still set up a new game.'
          : isReady
            ? 'Engine ready. You play White.'
            : 'Loading the engine…'
      }
      tools={<button onClick={handleTakeback}>Takeback</button>}
      history={chess.history()}
      winner={winner}
      onNewGame={handleNewGame}
      onExit={onExit}
    />
  );
}
