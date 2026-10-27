import { useState, useEffect, useRef, useCallback } from "react";
import { Chess, Square } from "chess.js";
import {
  PreparedBankPuzzle,
  filterBankByTheme,
  validatePuzzleMove,
  parseUciMove,
} from "./puzzleBank";
import PositionBoard from "./PositionBoard";
import MatiksPiece from "../components/MatiksPiece";

interface PuzzlePracticeProps {
  onExit: () => void;
  onRecordSolve: (bankId: string, correct: boolean, assisted: boolean) => void;
  initialTheme?: string;
}

export default function PuzzlePracticeSession({
  onExit,
  onRecordSolve,
  initialTheme = "All 150",
}: PuzzlePracticeProps) {
  const [selectedTheme, setSelectedTheme] = useState(initialTheme);
  const [matchingPuzzles, setMatchingPuzzles] = useState<PreparedBankPuzzle[]>(
    () => filterBankByTheme(initialTheme),
  );

  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const currentPuzzle = matchingPuzzles[puzzleIndex] || matchingPuzzles[0];

  // Board and puzzle solving state
  const [currentFen, setCurrentFen] = useState<string>(() =>
    currentPuzzle ? currentPuzzle.setupFen : "8/8/8/8/8/8/8/8 w - - 0 1",
  );
  const [solutionStep, setSolutionStep] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [hintSquare, setHintSquare] = useState<Square | null>(null);
  const [hasUsedHint, setHasUsedHint] = useState(false);
  const [isOpponentReplying, setIsOpponentReplying] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [statusNotice, setStatusNotice] = useState("Find the best continuation.");

  // Session stats
  const [sessionSolvedCount, setSessionSolvedCount] = useState(0);
  const [sessionErrorCount, setSessionErrorCount] = useState(0);

  // Promotion pending state
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  const opponentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When theme changes, re-filter puzzles
  useEffect(() => {
    const list = filterBankByTheme(selectedTheme);
    setMatchingPuzzles(list);
    setPuzzleIndex(0);
  }, [selectedTheme]);

  // When current puzzle changes, reset board state
  useEffect(() => {
    if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);

    if (currentPuzzle) {
      setCurrentFen(currentPuzzle.setupFen);
      setSolutionStep(0);
      setSelectedSquare(null);
      setHintSquare(null);
      setHasUsedHint(false);
      setIsOpponentReplying(false);
      setIsSolved(false);
      setStatusNotice("Find the best continuation.");
      setPendingPromotion(null);
    }
  }, [currentPuzzle]);

  useEffect(() => {
    return () => {
      if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
    };
  }, []);

  const chess = new Chess(currentFen);
  const legalMoves = selectedSquare
    ? chess.moves({ square: selectedSquare, verbose: true }).map((m) => m.to)
    : [];

  const handleNextPuzzle = useCallback(() => {
    if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
    if (matchingPuzzles.length === 0) return;
    setPuzzleIndex((prev) => (prev + 1) % matchingPuzzles.length);
  }, [matchingPuzzles.length]);

  const handleSkipPuzzle = () => {
    handleNextPuzzle();
  };

  const handleShowHint = () => {
    if (isSolved || !currentPuzzle || isOpponentReplying) return;
    const nextExpectedUci = currentPuzzle.solutionUci[solutionStep];
    if (nextExpectedUci) {
      const fromSq = nextExpectedUci.slice(0, 2) as Square;
      setHintSquare(fromSq);
      setHasUsedHint(true);
      setStatusNotice(`Hint: Look at the piece on ${fromSq.toUpperCase()}.`);
    }
  };

  // Execute solver move
  const executeSolverMove = useCallback(
    (from: Square, to: Square, promotionPiece?: string) => {
      if (!currentPuzzle || isSolved || isOpponentReplying) return;

      const validation = validatePuzzleMove(currentPuzzle, solutionStep, currentFen, {
        from,
        to,
        promotion: promotionPiece,
      });

      if (validation.valid && validation.nextFen) {
        // Correct move!
        const nextPlyIndex = solutionStep + 1;
        setCurrentFen(validation.nextFen);
        setSelectedSquare(null);
        setHintSquare(null);

        // Check if there are opponent replies or if puzzle is completed
        if (nextPlyIndex >= currentPuzzle.solutionUci.length || validation.isCheckmate) {
          // Solved!
          setIsSolved(true);
          setStatusNotice(
            validation.isCheckmate
              ? "Checkmate! Brilliant finish."
              : "Solved! Outstanding tactic.",
          );
          setSessionSolvedCount((c) => c + 1);
          onRecordSolve(currentPuzzle.bankId, true, hasUsedHint);
        } else {
          // Scripted opponent reply move
          setSolutionStep(nextPlyIndex);
          setIsOpponentReplying(true);
          setStatusNotice("Opponent is replying...");

          opponentTimerRef.current = setTimeout(() => {
            const opponentUci = currentPuzzle.solutionUci[nextPlyIndex];
            if (opponentUci) {
              const c = new Chess(validation.nextFen!);
              const { from: oppFrom, to: oppTo, promotion: oppPromo } =
                parseUciMove(opponentUci);
              c.move({ from: oppFrom, to: oppTo, promotion: oppPromo });
              setCurrentFen(c.fen());
              setSolutionStep(nextPlyIndex + 1);
              setIsOpponentReplying(false);
              setStatusNotice("Your turn to continue.");
            }
          }, 350);
        }
      } else {
        // Legal move on the board, but incorrect puzzle continuation
        setSessionErrorCount((e) => e + 1);
        setStatusNotice("Not quite right. Try another move.");
        setSelectedSquare(null);
      }
    },
    [
      currentPuzzle,
      solutionStep,
      currentFen,
      isSolved,
      isOpponentReplying,
      hasUsedHint,
      onRecordSolve,
    ],
  );

  const handleSquareClick = (sq: Square) => {
    if (isSolved || isOpponentReplying || !currentPuzzle) return;

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

    // Check if legal move
    const moves = chess.moves({ square: selectedSquare, verbose: true });
    const match = moves.find((m) => m.to === sq);

    if (match) {
      // Check if move is a promotion
      const piece = chess.get(selectedSquare);
      const isPawn = piece?.type === "p";
      const isPromotionRank =
        (sq[1] === "8" && chess.turn() === "w") ||
        (sq[1] === "1" && chess.turn() === "b");

      if (isPawn && isPromotionRank) {
        setPendingPromotion({ from: selectedSquare, to: sq });
        return;
      }

      executeSolverMove(selectedSquare, sq);
    } else {
      // Retarget to another piece of own color
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
    executeSolverMove(from, to, pieceType);
  };

  // Keyboard shortcut listener: Enter / Space triggers Next puzzle when solved
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSolved && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        handleNextPuzzle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSolved, handleNextPuzzle]);

  // Handle empty filter state cleanly
  if (!currentPuzzle || matchingPuzzles.length === 0) {
    return (
      <div className="max-w-[700px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#AFF65B] uppercase">
              LICHESS PUZZLE BANK
            </div>
            <h1 className="text-3xl font-extrabold tracking-wide text-[#F4F4F4] font-display">
              PUZZLE PRACTICE
            </h1>
          </div>
          <button
            onClick={onExit}
            className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-sm text-[#F4F4F4] font-semibold border border-[#3A3A3A] transition"
          >
            ← Modes
          </button>
        </div>

        <div className="bg-[#1A1A1A] p-8 rounded-3xl border border-[#2D2D2D] text-center space-y-4">
          <div className="text-4xl">🔍</div>
          <h2 className="text-xl font-bold text-[#F4F4F4]">
            No puzzles found for &quot;{selectedTheme}&quot;
          </h2>
          <p className="text-sm text-[#8A8A8A] max-w-[400px] mx-auto">
            There are no offline puzzles tagged with this pattern. Select another theme or reset to all 150 puzzles.
          </p>
          <button
            onClick={() => setSelectedTheme("All 150")}
            className="px-5 py-2.5 rounded-xl bg-[#AFF65B] hover:bg-[#9DE84A] text-[#0E0E0E] font-bold text-sm transition shadow-lg shadow-[#AFF65B]/20"
          >
            Reset to All 150 Puzzles
          </button>
        </div>
      </div>
    );
  }

  const solverSideText =
    currentPuzzle.solverTurn === "w" ? "WHITE TO MOVE" : "BLACK TO MOVE";

  return (
    <div className="max-w-[1300px] mx-auto space-y-4 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold tracking-widest text-[#AFF65B] uppercase">
            LICHESS PUZZLE BANK
          </div>
          <h1 className="text-3xl font-extrabold tracking-wide text-[#F4F4F4] font-display">
            PUZZLE PRACTICE
          </h1>
        </div>
        <button
          onClick={onExit}
          className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-sm text-[#F4F4F4] font-semibold border border-[#3A3A3A] transition cursor-pointer"
        >
          ← Modes
        </button>
      </div>

      {/* Main 2-Column Grid (Desktop) / Stack (Phone) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left Column: Board & Primary Controls */}
        <div className="space-y-3">
          {/* Header directly above board (Matches media_1793097506807_68723948.jpg) */}
          <div className="flex items-center justify-between px-1">
            <div className="text-2xl font-black text-[#F4F4F4] font-display tracking-wider">
              {solverSideText}
            </div>
            <div className="px-3.5 py-1 rounded-full bg-[#1F1F1F] text-xs font-bold text-[#8A8A8A] border border-[#2E2E2E]">
              {puzzleIndex + 1} / {matchingPuzzles.length}
            </div>
          </div>

          {/* Mobile-only metrics above board (Matches graphics spec: on phone, score/errors above board) */}
          <div className="grid grid-cols-3 gap-2 lg:hidden">
            <div className="bg-[#1A1A1A] p-2.5 rounded-2xl border border-[#2D2D2D] text-center">
              <div className="text-xl font-black text-[#F4F4F4] font-display">∞</div>
              <div className="text-[9px] font-semibold text-[#8A8A8A] uppercase">Untimed</div>
            </div>
            <div className="bg-[#1A1A1A] p-2.5 rounded-2xl border border-[#2D2D2D] text-center">
              <div className="text-xl font-black text-[#AFF65B] font-display">{sessionSolvedCount}</div>
              <div className="text-[9px] font-semibold text-[#8A8A8A] uppercase">Solved</div>
            </div>
            <div className="bg-[#1A1A1A] p-2.5 rounded-2xl border border-[#2D2D2D] text-center">
              <div className="text-xl font-black text-[#FF6B6B] font-display">{sessionErrorCount}</div>
              <div className="text-[9px] font-semibold text-[#8A8A8A] uppercase">Errors</div>
            </div>
          </div>

          {/* Chessboard Container */}
          <div className="relative mx-auto max-w-[560px] aspect-square rounded-2xl overflow-hidden shadow-2xl bg-[#141414] border border-[#2D2D2D]">
            <PositionBoard
              fen={currentFen}
              selected={selectedSquare}
              legal={legalMoves}
              onSquare={handleSquareClick}
              flip={currentPuzzle.solverTurn === "b"}
            />

            {/* Hint Indicator Overlay */}
            {hintSquare && (
              <div
                className="absolute inset-0 pointer-events-none"
                aria-hidden="true"
              />
            )}

            {/* Accessible Promotion Modal */}
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

          {/* Status notice & primary bottom controls */}
          <div className="space-y-3 pt-1">
            <div
              className={`text-sm font-semibold transition px-1 ${
                isSolved
                  ? "text-[#AFF65B]"
                  : statusNotice.includes("Not quite")
                  ? "text-[#FF6B6B]"
                  : "text-[#8A8A8A]"
              }`}
            >
              {statusNotice}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleShowHint}
                disabled={isSolved || isOpponentReplying}
                className="px-4 py-2.5 rounded-xl bg-[#262626] hover:bg-[#333333] disabled:opacity-40 text-sm font-bold text-[#F4F4F4] border border-[#3A3A3A] transition cursor-pointer"
              >
                Hint
              </button>
              <button
                onClick={handleSkipPuzzle}
                className="px-4 py-2.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-sm font-bold text-[#F4F4F4] border border-[#3A3A3A] transition cursor-pointer"
              >
                Skip →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Session card & Tactics details (Matches media_1793097506807_68723948.jpg) */}
        <div className="bg-[#1A1A1A] p-5 rounded-3xl border border-[#2D2D2D] space-y-6">
          {/* Kicker */}
          <div className="text-xs font-bold tracking-widest text-[#AFF65B] uppercase">
            YOUR SESSION
          </div>

          {/* 3 Metric Tiles Row */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[#242424] p-3 rounded-2xl border border-[#333333] text-center">
              <div className="text-2xl font-black text-[#F4F4F4] font-display">
                ∞
              </div>
              <div className="text-[10px] font-semibold text-[#8A8A8A] uppercase mt-0.5">
                Untimed
              </div>
            </div>
            <div className="bg-[#242424] p-3 rounded-2xl border border-[#333333] text-center">
              <div className="text-2xl font-black text-[#AFF65B] font-display">
                {sessionSolvedCount}
              </div>
              <div className="text-[10px] font-semibold text-[#8A8A8A] uppercase mt-0.5">
                Solved
              </div>
            </div>
            <div className="bg-[#242424] p-3 rounded-2xl border border-[#333333] text-center">
              <div className="text-2xl font-black text-[#FF6B6B] font-display">
                {sessionErrorCount}
              </div>
              <div className="text-[10px] font-semibold text-[#8A8A8A] uppercase mt-0.5">
                Errors
              </div>
            </div>
          </div>

          {/* TACTICS THEMES SECTION */}
          <div className="space-y-3 pt-1">
            <h2 className="text-xl font-extrabold text-[#F4F4F4] font-display tracking-wider">
              MIXED TACTICS
            </h2>
            <div className="flex flex-wrap gap-2">
              {currentPuzzle.themes.map((th) => (
                <span
                  key={th}
                  className="px-3 py-1 rounded-full bg-[#262626] text-xs font-semibold text-[#D0D0D0] border border-[#3A3A3A]"
                >
                  {th}
                </span>
              ))}
            </div>
          </div>

          {/* METADATA */}
          <div className="space-y-1 text-xs text-[#8A8A8A] border-t border-[#292929] pt-4">
            <div>
              Lichess puzzle {currentPuzzle.bankId} · Rating {currentPuzzle.rating}
            </div>
            <div>
              150 distinct puzzles. Daily puzzle remains a separate bonus in the app.
            </div>
          </div>

          {/* Big Lime Next Button */}
          <button
            onClick={handleNextPuzzle}
            className="w-full py-3.5 rounded-2xl bg-[#AFF65B] hover:bg-[#9DE84A] text-[#0E0E0E] font-extrabold text-sm tracking-wider uppercase transition shadow-lg shadow-[#AFF65B]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            Next puzzle →
          </button>
        </div>
      </div>
    </div>
  );
}
