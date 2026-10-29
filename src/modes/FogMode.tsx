import { usePreferences } from '../chaturanga/preferences';
import { usePremoveHandler } from '../chaturanga/usePremoveHandler';
import { useState, useMemo, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { useStockfish, getBotByElo } from '../ai/useStockfish';
import CourtyardMatch from './CourtyardMatch';
import { unlockAchievement } from '../chaturanga/achievements';
import { recordGameResult } from '../chaturanga/stats';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export interface GameModeProps {
  onExit: () => void;
  botElo: number;
  timeMinutes?: number;
  playerColor?: "w" | "b";
}

export default function FogMode({ onExit, botElo, timeMinutes = 10, playerColor = "w" }: GameModeProps) {
  const botColor = playerColor === "w" ? "b" : "w";
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
      if (chess.turn() === playerColor) {
        setPlayerTime((t) => {
          if (t <= 1) {
            setWinner(botColor);
            setResultReason('DEFEAT · TIME FORFEIT');
            recordGameResult('loss', currentBot.name, currentBotElo, 'Fog of War');
            return 0;
          }
          return t - 1;
        });
      } else {
        setBotTime((t) => {
          if (t <= 1) {
            setWinner(playerColor);
            setResultReason('VICTORY · WON ON TIME');
            unlockAchievement('first-win');
            recordGameResult('win', currentBot.name, currentBotElo, 'Fog of War');
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [chess, winner, playerColor, botColor, currentBot.name, currentBotElo]);

  const formatClock = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const visibleSquares = useMemo(() => {
    const visible = new Set<string>();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = board[r][f];
        if (piece && piece.color === playerColor) {
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
  }, [fen, chess, playerColor]);

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
    return playerColor === "w" ? whiteScore - blackScore : blackScore - whiteScore;
  }, [capturedByWhite, capturedByBlack, playerColor]);

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
    playerColor,
    isPlayerTurn: chess.turn() === playerColor && !winner,
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
    setWinner(botColor);
    setResultReason('DEFEAT · RESIGNED');
    recordGameResult('loss', currentBot.name, currentBotElo, 'Fog of War');
  };

  const handleSquareClick = (sq: string) => {
    if (winner) return;
    if (chess.turn() !== playerColor) {
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
        if (piece && piece.color === playerColor) {
          setSelectedSquare(sq);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      const piece = chess.get(sq as Square);
      if (piece && piece.color === playerColor) {
        setSelectedSquare(sq);
      }
    }
  };

  useEffect(() => {
    if (winner || chess.turn() === playerColor) return;
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
            recordGameResult('loss', currentBot.name, currentBotElo, 'Fog of War');
          } else if (chess.isDraw()) {
            recordGameResult('draw', currentBot.name, currentBotElo, 'Fog of War');
          }
        }
      } catch (e) {
        console.error("Bot attempted illegal move:", moveStr);
      }
    };
    playBotMove();

    return () => { isActive = false; };
  }, [fen, chess, getBestMove, currentBot, winner, botTime, playerColor, botColor]);

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

  return (
    <CourtyardMatch
      eyebrow="FOG OF WAR · THE CLASSIC COLLECTION"
      title="Fog of War"
      board={chess.board()}
      selectedSquare={selectedSquare}
      legalMoves={legalMoves}
      lastMove={lastMove}
      checkSquare={checkSquare}
      onSquareClick={handleSquareClick}
      hiddenSquares={visibleSquares}
      botName={currentBot.name}
      botElo={currentBotElo}
      isBotThinking={isThinking}
      capturedByWhite={capturedByWhite}
      capturedByBlack={capturedByBlack}
      playerColor={playerColor}
      materialAdvantage={materialAdvantage}
      botActive={chess.turn() === botColor && !winner}
      playerActive={chess.turn() === playerColor && !winner}
      playerClock={formatClock(playerTime)}
      botClock={formatClock(botTime)}
      resultTitle={resultReason || undefined}
      status={
        engineError
          ? 'The engine could not start. You can still set up a new game.'
          : isReady
            ? 'You only see the squares your pieces can reach.'
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
