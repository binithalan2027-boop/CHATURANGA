import { useState, useEffect, useRef, useCallback } from "react";
import { Chess, Square } from "chess.js";
import {
  PreparedBankPuzzle,
  getMateSprintPuzzles,
  validatePuzzleMove,
} from "./puzzleBank";
import PositionBoard from "./PositionBoard";
import MatiksPiece from "../components/MatiksPiece";

interface MateSprintProps {
  onExit: () => void;
  bestRush: number;
  onRecordRush: (score: number) => void;
}

export default function MateSprintSession({
  onExit,
  bestRush,
  onRecordRush,
}: MateSprintProps) {
  const [phase, setPhase] = useState<"active" | "results">("active");

  const [puzzles] = useState<PreparedBankPuzzle[]>(() => getMateSprintPuzzles());
  const [puzzleIndex, setPuzzleIndex] = useState(0);

  const currentPuzzle = puzzles[puzzleIndex];

  // Chess board state
  const [currentFen, setCurrentFen] = useState<string>(() =>
    currentPuzzle ? currentPuzzle.setupFen : "8/8/8/8/8/8/8/8 w - - 0 1",
  );
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [statusNotice, setStatusNotice] = useState("Find checkmate in one!");

  // Sprint stats
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(180);

  // Promotion modal state
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  const deadlineRef = useRef<number>(Date.now() + 180 * 1000);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finishSprint = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setPhase("results");
  }, []);

  // Update deadline and clock
  useEffect(() => {
    const deadline = Date.now() + 180 * 1000;
    deadlineRef.current = deadline;

    timerIntervalRef.current = setInterval(() => {
      const leftMs = deadlineRef.current - Date.now();
      const leftSec = Math.max(0, Math.ceil(leftMs / 1000));
      setRemainingSeconds(leftSec);

      if (leftMs <= 0) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        finishSprint();
      }
    }, 200);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [finishSprint]);

  // When current puzzle changes, update board
  useEffect(() => {
    if (currentPuzzle) {
      setCurrentFen(currentPuzzle.setupFen);
      setSelectedSquare(null);
      setStatusNotice("Find checkmate in one!");
      setPendingPromotion(null);
    }
  }, [currentPuzzle]);

  // Sync high score when results are reached
  useEffect(() => {
    if (phase === "results") {
      onRecordRush(score);
    }
  }, [phase, score, onRecordRush]);

  const executeMove = useCallback(
    (from: Square, to: Square, promotionPiece?: string) => {
      if (phase !== "active" || !currentPuzzle) return;

      const validation = validatePuzzleMove(currentPuzzle, 0, currentFen, {
        from,
        to,
        promotion: promotionPiece,
      });

      if (validation.valid && validation.nextFen) {
        // Solved checkmate!
        setCurrentFen(validation.nextFen);
        setSelectedSquare(null);
        setScore((s) => s + 1);

        if (puzzleIndex + 1 < puzzles.length) {
          setPuzzleIndex((i) => i + 1);
        } else {
          // Finished all 20 puzzles in bank!
          finishSprint();
        }
      } else {
        // Mistake!
        setSelectedSquare(null);
        const newStrikes = strikes + 1;
        setStrikes(newStrikes);
        setStatusNotice("Incorrect move! +1 strike");

        if (newStrikes >= 3) {
          finishSprint();
        }
      }
    },
    [phase, currentPuzzle, currentFen, puzzleIndex, puzzles.length, strikes, finishSprint],
  );

  const handleSquareClick = (sq: Square) => {
    if (phase !== "active" || !currentPuzzle) return;

    const chess = new Chess(currentFen);

    if (!selectedSquare) {
      const piece = chess.get(sq);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(sq);
      }
      return;
    }

    if (selectedSquare === sq) {
      setSelectedSquare(null);
      return;
    }

    const moves = chess.moves({ square: selectedSquare, verbose: true });
    const match = moves.find((m) => m.to === sq);

    if (match) {
      const piece = chess.get(selectedSquare);
      const isPawn = piece?.type === "p";
      const isPromotionRank =
        (sq[1] === "8" && chess.turn() === "w") ||
        (sq[1] === "1" && chess.turn() === "b");

      if (isPawn && isPromotionRank) {
        setPendingPromotion({ from: selectedSquare, to: sq });
        return;
      }

      executeMove(selectedSquare, sq);
    } else {
      const piece = chess.get(sq);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(sq);
      } else {
        setSelectedSquare(null);
      }
    }
  };

  const handleSelectPromotion = (pieceType: "q" | "r" | "b" | "n") => {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;
    setPendingPromotion(null);
    executeMove(from, to, pieceType);
  };

  const restartSprint = () => {
    setScore(0);
    setStrikes(0);
    setPuzzleIndex(0);
    setPhase("active");
    deadlineRef.current = Date.now() + 180 * 1000;
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (phase === "results") {
    return (
      <div className="max-w-[600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#A594F0] uppercase">
              SPRINT FINISHED
            </div>
            <h1 className="text-3xl font-extrabold tracking-wide text-[#F4F4F4] font-display">
              MATE SPRINT RESULTS
            </h1>
          </div>
          <button
            onClick={onExit}
            className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-sm text-[#F4F4F4] font-semibold border border-[#3A3A3A] transition cursor-pointer"
          >
            ← Modes
          </button>
        </div>

        <div className="bg-[#1A1A1A] p-6 rounded-3xl border border-[#2D2D2D] space-y-6 text-center">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#242424] p-4 rounded-2xl border border-[#333333]">
              <div className="text-4xl font-black text-[#A594F0] font-display">
                {score}
              </div>
              <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase mt-1">
                Solved
              </div>
            </div>
            <div className="bg-[#242424] p-4 rounded-2xl border border-[#333333]">
              <div className="text-4xl font-black text-[#FF6B6B] font-display">
                {strikes} / 3
              </div>
              <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase mt-1">
                Strikes
              </div>
            </div>
            <div className="bg-[#242424] p-4 rounded-2xl border border-[#333333]">
              <div className="text-4xl font-black text-[#AFF65B] font-display">
                {Math.max(bestRush, score)}
              </div>
              <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase mt-1">
                Best Sprint
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#222222] border border-[#333333] text-sm text-[#8A8A8A]">
            {strikes >= 3
              ? "Sprint ended after 3 strikes. Great effort!"
              : remainingSeconds <= 0
              ? "Time is up! Solid speed-mate drill."
              : "Incredible! You cleared all 20 mate-in-one compositions."}
          </div>

          <div className="flex gap-3">
            <button
              onClick={restartSprint}
              className="flex-1 py-3.5 rounded-2xl bg-[#A594F0] hover:bg-[#9381E2] text-[#0E0E0E] font-extrabold text-sm tracking-wider uppercase transition shadow-lg shadow-[#A594F0]/20 cursor-pointer"
            >
              Play Again ↻
            </button>
            <button
              onClick={onExit}
              className="flex-1 py-3.5 rounded-2xl bg-[#262626] hover:bg-[#333333] text-[#F4F4F4] font-bold text-sm tracking-wider uppercase border border-[#3A3A3A] transition cursor-pointer"
            >
              ← Return to Training
            </button>
          </div>
        </div>
      </div>
    );
  }

  const chess = new Chess(currentFen);
  const legalMoves = selectedSquare
    ? chess.moves({ square: selectedSquare, verbose: true }).map((m) => m.to)
    : [];

  return (
    <div className="max-w-[700px] mx-auto space-y-4 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold tracking-widest text-[#A594F0] uppercase">
            CHESS AGAINST THE CLOCK
          </div>
          <h1 className="text-3xl font-extrabold tracking-wide text-[#F4F4F4] font-display">
            MATE SPRINT
          </h1>
        </div>
        <button
          onClick={finishSprint}
          className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-sm text-[#F4F4F4] font-semibold border border-[#3A3A3A] transition cursor-pointer"
        >
          End Sprint
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1A1A1A] p-3 rounded-2xl border border-[#2D2D2D] text-center">
          <div className="text-3xl font-black text-[#A594F0] font-display">
            {formatTimer(remainingSeconds)}
          </div>
          <div className="text-[10px] font-semibold text-[#8A8A8A] uppercase mt-0.5">
            Time Left
          </div>
        </div>
        <div className="bg-[#1A1A1A] p-3 rounded-2xl border border-[#2D2D2D] text-center">
          <div className="text-3xl font-black text-[#AFF65B] font-display">
            {score}
          </div>
          <div className="text-[10px] font-semibold text-[#8A8A8A] uppercase mt-0.5">
            Solved
          </div>
        </div>
        <div className="bg-[#1A1A1A] p-3 rounded-2xl border border-[#2D2D2D] text-center">
          <div className="text-3xl font-black text-[#FF6B6B] font-display flex items-center justify-center gap-1">
            <span className={strikes >= 1 ? "text-[#FF6B6B]" : "text-[#444444]"}>●</span>
            <span className={strikes >= 2 ? "text-[#FF6B6B]" : "text-[#444444]"}>●</span>
            <span className={strikes >= 3 ? "text-[#FF6B6B]" : "text-[#444444]"}>●</span>
          </div>
          <div className="text-[10px] font-semibold text-[#8A8A8A] uppercase mt-0.5">
            Strikes ({strikes}/3)
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-xl font-black text-[#F4F4F4] font-display">
            {currentPuzzle.solverTurn === "w" ? "WHITE TO MOVE" : "BLACK TO MOVE"}
          </div>
          <div className="text-xs font-bold text-[#8A8A8A]">
            Puzzle {puzzleIndex + 1} of {puzzles.length}
          </div>
        </div>

        <div className="relative mx-auto max-w-[520px] aspect-square rounded-2xl overflow-hidden shadow-2xl bg-[#141414] border border-[#2D2D2D]">
          <PositionBoard
            fen={currentFen}
            selected={selectedSquare}
            legal={legalMoves}
            onSquare={handleSquareClick}
            flip={currentPuzzle.solverTurn === "b"}
          />

          {pendingPromotion && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-20">
              <div className="bg-[#1C1C1C] border border-[#3D3D3D] p-5 rounded-2xl shadow-2xl text-center space-y-4 max-w-[320px] w-full">
                <div className="text-sm font-bold text-[#F4F4F4] uppercase tracking-wider">
                  Promote Pawn To
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(["q", "r", "b", "n"] as const).map((pieceType) => (
                    <button
                      key={pieceType}
                      onClick={() => handleSelectPromotion(pieceType)}
                      className="p-3 rounded-xl bg-[#282828] hover:bg-[#383838] border border-[#444444] flex flex-col items-center justify-center transition cursor-pointer"
                      aria-label={`Promote to ${pieceType.toUpperCase()}`}
                    >
                      <div className="w-9 h-9">
                        <MatiksPiece
                          type={pieceType}
                          color={currentPuzzle.solverTurn}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-[#8A8A8A] uppercase mt-1">
                        {pieceType === "q"
                          ? "Queen"
                          : pieceType === "r"
                          ? "Rook"
                          : pieceType === "b"
                          ? "Bishop"
                          : "Knight"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-[#8A8A8A] font-medium pt-1">
          {statusNotice}
        </div>
      </div>
    </div>
  );
}
