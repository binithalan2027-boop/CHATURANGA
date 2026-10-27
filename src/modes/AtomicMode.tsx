import { usePreferences } from '../chaturanga/preferences';
import { usePremoveHandler } from '../chaturanga/usePremoveHandler';
import { useState, useMemo, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { useStockfish, getBotByElo } from '../ai/useStockfish';
import CourtyardMatch, { SquareMark } from './CourtyardMatch';
import { unlockAchievement } from '../chaturanga/achievements';
import { recordGameResult } from '../chaturanga/stats';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export interface GameModeProps {
  onExit: () => void;
  botElo: number;
  timeMinutes?: number;
}

export default function AtomicMode({ onExit, botElo, timeMinutes = 10 }: GameModeProps) {
  const { prefs } = usePreferences();
  const [chess, setChess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]);
  const [winner, setWinner] = useState<'w' | 'b' | 'draw' | null>(null);
  const [resultReason, setResultReason] = useState<string | null>(null);

  const initialTime = Math.max(60, timeMinutes * 60);
  const [playerTime, setPlayerTime] = useState<number>(initialTime);
  const [botTime, setBotTime] = useState<number>(initialTime);

  const [currentBotElo] = useState<number>(botElo);
  const { isReady, isThinking, getBestMove, engineError, stopThinking } = useStockfish();
  const currentBot = getBotByElo(currentBotElo);

  useEffect(() => {
    if (winner) return;
    const interval = setInterval(() => {
      if (chess.turn() === 'w') {
        setPlayerTime((t) => {
          if (t <= 1) {
            setWinner('b');
            setResultReason('DEFEAT · TIME FORFEIT');
            recordGameResult('loss', currentBot.name, currentBotElo, 'Atomic Chess');
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
            recordGameResult('win', currentBot.name, currentBotElo, 'Atomic Chess');
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

  const [explodingSquares, setExplodingSquares] = useState<Set<string>>(new Set());

  const applyAtomicExplosion = (sq: string) => {
    const file = FILES.indexOf(sq[0]);
    const rank = RANKS.indexOf(sq[1]);
    const radius = [-1, 0, 1];
    const destroyed = new Set<string>();
    destroyed.add(sq);
    
    radius.forEach(dr => {
      radius.forEach(df => {
        const r = rank + dr;
        const f = file + df;
        if (r >= 0 && r < 8 && f >= 0 && f < 8) {
          const targetSq = `${FILES[f]}${RANKS[r]}`;
          const piece = chess.get(targetSq as Square);
          if (piece && piece.type !== 'p') {
            destroyed.add(targetSq);
          }
        }
      });
    });

    destroyed.forEach(s => {
      const piece = chess.get(s as Square);
      if (piece && piece.type === 'k') {
        const winColor = piece.color === 'w' ? 'b' : 'w';
        setWinner(winColor);
        if (winColor === 'w') {
          unlockAchievement('atomic-win');
          recordGameResult('win', currentBot.name, currentBotElo, 'Atomic Chess');
        } else {
          recordGameResult('loss', currentBot.name, currentBotElo, 'Atomic Chess');
        }
      }
      chess.remove(s as Square);
    });

    setExplodingSquares(destroyed);
    setTimeout(() => setExplodingSquares(new Set()), 600);
  };

  const recordCapture = (moveResult: Move) => {
    const captured = moveResult.captured;
    if (captured) {
      if (moveResult.color === 'w') setCapturedByWhite(prev => [...prev, captured]);
      else setCapturedByBlack(prev => [...prev, captured]);
      applyAtomicExplosion(moveResult.to);
    }
  };

  
  const checkGameOver = () => {
    checkGameOver();
  };

  const {
    premoves,
    premoveSquares,
    premoveAlert,
    handlePremoveSquareClick,
    clearPremoves,
    setPremoveAlert,
  } = usePremoveHandler({
    chess,
    playerColor: 'w',
    isPlayerTurn: chess.turn() === 'w' && !winner,
    isGameOver: Boolean(winner),
    premoveLimit: prefs.premoveLimit,
    onMoveSuccess: (move) => {
      recordCapture(move);
      setFen(chess.fen());
      setLastMove({ from: move.from, to: move.to });
      setSelectedSquare(null);
    },
    onGameOverCheck: () => checkGameOver(),
  });

  const handleResign = () => {
    if (winner) return;
    stopThinking();
    clearPremoves();
    setWinner('b');
    setResultReason('DEFEAT · RESIGNED');
    recordGameResult('loss', currentBot.name, currentBotElo, 'Atomic Chess');
  };

  const handleSquareClick = (sq: string) => {
    if (winner) return;
    if (chess.turn() !== 'w') {
      handlePremoveSquareClick(sq);
      return;
    }

    if (selectedSquare) {
      if (legalMoves.has(sq)) {
        try {
          const move = chess.move({ from: selectedSquare, to: sq, promotion: 'q' });
          recordCapture(move);
          setFen(chess.fen());
          setLastMove({ from: selectedSquare, to: sq });
          setSelectedSquare(null);

          checkGameOver();
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
            recordGameResult('loss', currentBot.name, currentBotElo, 'Atomic Chess');
          } else if (chess.isDraw()) {
            recordGameResult('draw', currentBot.name, currentBotElo, 'Atomic Chess');
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
    clearPremoves();
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

  const squareMarks: Record<string, SquareMark> = {};
  explodingSquares.forEach(sq => {
    squareMarks[sq] = { className: 'boom', icon: '💥' };
  });

  return (
    <CourtyardMatch
      eyebrow="ATOMIC · THE CLASSIC COLLECTION"
      title="Atomic"
      board={chess.board()}
      selectedSquare={selectedSquare}
      legalMoves={legalMoves}
      lastMove={lastMove}
      checkSquare={checkSquare}
      onSquareClick={handleSquareClick}
      squareMarks={squareMarks}
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
            ? 'Captures explode every non-pawn piece around the square. Keep your king clear.'
            : 'Loading the engine…'
      }
      history={chess.history()}
      winner={winner}
      premoveSquares={premoveSquares}
      premovesCount={premoves.length}
      onClearPremoves={clearPremoves}
      premoveAlert={premoveAlert}
      onDismissPremoveAlert={() => setPremoveAlert(null)}
      onResign={handleResign}
      onNewGame={handleNewGame}
      onExit={onExit}
    />
  );
}
