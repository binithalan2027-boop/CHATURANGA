import { useState, useEffect, useCallback, useMemo } from 'react';
import { Chess, Move, Square } from 'chess.js';
import {
  Premove,
  isPlausiblePremove,
  enqueuePremove,
  crossCheckAndExecutePremove,
  getPremoveSquares,
} from './premoveManager';

export interface UsePremoveHandlerOptions {
  chess: Chess;
  playerColor?: 'w' | 'b';
  isPlayerTurn: boolean;
  isGameOver: boolean;
  premoveLimit?: 'single' | 'limitless';
  onMoveSuccess: (move: Move, nextFen: string) => void;
  onGameOverCheck?: () => void;
}

export function usePremoveHandler({
  chess,
  playerColor = 'w',
  isPlayerTurn,
  isGameOver,
  premoveLimit = 'single',
  onMoveSuccess,
  onGameOverCheck,
}: UsePremoveHandlerOptions) {
  const [premoves, setPremoves] = useState<Premove[]>([]);
  const [premoveSelectedSquare, setPremoveSelectedSquare] = useState<string | null>(null);
  const [premoveAlert, setPremoveAlert] = useState<string | null>(null);

  // Clear premoves when game is over
  useEffect(() => {
    if (isGameOver) {
      setPremoves([]);
      setPremoveSelectedSquare(null);
    }
  }, [isGameOver]);

  // Handle off-turn clicks (queuing premoves)
  const handlePremoveSquareClick = useCallback(
    (sq: string): boolean => {
      if (isGameOver || isPlayerTurn) return false;

      // First click: selecting a piece
      if (!premoveSelectedSquare) {
        const piece = chess.get(sq as Square);
        if (piece && piece.color === playerColor) {
          setPremoveSelectedSquare(sq);
          return true;
        }
        return false;
      }

      // Second click:
      // If clicking another piece of our own color, change selected piece
      const targetPiece = chess.get(sq as Square);
      if (targetPiece && targetPiece.color === playerColor) {
        if (premoveSelectedSquare === sq) {
          // Deselect
          setPremoveSelectedSquare(null);
        } else {
          setPremoveSelectedSquare(sq);
        }
        return true;
      }

      // Plausibility check
      if (isPlausiblePremove(chess, premoveSelectedSquare, sq, playerColor)) {
        const newPremove: Premove = {
          id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          from: premoveSelectedSquare,
          to: sq,
          promotion: 'q',
        };

        setPremoves((current) => enqueuePremove(current, newPremove, premoveLimit));
        setPremoveSelectedSquare(null);
        setPremoveAlert(null);
        return true;
      }

      setPremoveSelectedSquare(null);
      return false;
    },
    [isGameOver, isPlayerTurn, premoveSelectedSquare, chess, playerColor, premoveLimit]
  );

  // Trigger when it becomes player's turn to cross-check and execute the queued premove
  useEffect(() => {
    if (!isPlayerTurn || premoves.length === 0 || isGameOver) return;

    const candidate = premoves[0];
    const check = crossCheckAndExecutePremove(chess, candidate);

    if (check.valid && check.moveResult) {
      // Valid move! Pop and apply
      setPremoves((prev) => prev.slice(1));
      setPremoveAlert(null);
      onMoveSuccess(check.moveResult, chess.fen());
      if (onGameOverCheck) {
        onGameOverCheck();
      }
    } else {
      // Invalid premove: illegal in the new board position!
      // Discard queue and alert user
      setPremoves([]);
      setPremoveAlert(
        check.reason || `Premove ${candidate.from}→${candidate.to} was cancelled (illegal move).`
      );
    }
  }, [isPlayerTurn, chess, premoves, isGameOver, onMoveSuccess, onGameOverCheck]);

  const clearPremoves = useCallback(() => {
    setPremoves([]);
    setPremoveSelectedSquare(null);
    setPremoveAlert(null);
  }, []);

  const premoveSquares = useMemo(() => {
    const squares = getPremoveSquares(premoves);
    if (premoveSelectedSquare) {
      squares.add(premoveSelectedSquare);
    }
    return squares;
  }, [premoves, premoveSelectedSquare]);

  return {
    premoves,
    premoveSelectedSquare,
    premoveSquares,
    premoveAlert,
    handlePremoveSquareClick,
    clearPremoves,
    setPremoveAlert,
  };
}
