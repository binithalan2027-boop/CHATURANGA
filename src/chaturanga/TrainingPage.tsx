import { useState, useEffect } from "react";
import { Chess, Square } from "chess.js";
import {
  PUZZLES,
  isPuzzleMate,
  TrainingProgressV2,
  migrateProgress,
  recordBankSolve,
  recordMathsScore,
  getBankProgressRatio,
  getAccuracyPercent,
} from "./training";
import {
  fetchLichessDailyPuzzle,
  parseUciMove,
  PreparedLichessPuzzle,
} from "./lichessPuzzles";
import PositionBoard from "./PositionBoard";
import MatiksPiece from "../components/MatiksPiece";
import PuzzlePracticeSession from "./PuzzlePracticeSession";
import MateSprintSession from "./MateSprintSession";
import SpeedDuelPractice from "./SpeedDuelPractice";

type TrainingView =
  | "hub"
  | "puzzle_practice"
  | "mate_sprint"
  | "speed_duel"
  | "daily_puzzle"
  | "starter_triad";

export default function TrainingPage({ onExit }: { onExit: () => void }) {
  const [currentView, setCurrentView] = useState<TrainingView>("hub");
  const [selectedPattern, setSelectedPattern] = useState<string>("All 150");

  // Local storage progress migration & state
  const [progress, setProgress] = useState<TrainingProgressV2>(() => {
    try {
      const v2 = localStorage.getItem("chaturanga-training-v2");
      if (v2) return migrateProgress(JSON.parse(v2));

      const v1 = localStorage.getItem("chaturanga-training-v1");
      if (v1) return migrateProgress(JSON.parse(v1));

      return migrateProgress(null);
    } catch {
      return migrateProgress(null);
    }
  });

  // Save progress safely on change
  useEffect(() => {
    try {
      localStorage.setItem("chaturanga-training-v2", JSON.stringify(progress));
      // Keep v1 compatible copy
      localStorage.setItem(
        "chaturanga-training-v1",
        JSON.stringify({
          solved: progress.solved,
          attempts: progress.attempts,
          correct: progress.correct,
          bestRush: progress.bestRush,
          byPuzzle: progress.byPuzzle,
        }),
      );
    } catch {
      // Storage error ignored
    }
  }, [progress]);

  // Lichess Daily Puzzle state (Preserved as secondary bonus)
  const [lichessPuzzle, setLichessPuzzle] =
    useState<PreparedLichessPuzzle | null>(null);
  const [loadingLichess, setLoadingLichess] = useState(false);
  const [lichessError, setLichessError] = useState<string | null>(null);
  const [dailyFen, setDailyFen] = useState("");
  const [dailyStep, setDailyStep] = useState(0);
  const [dailySelected, setDailySelected] = useState<Square | null>(null);
  const [dailyNotice, setDailyNotice] = useState("");
  const [dailySolved, setDailySolved] = useState(false);
  const [dailyOpponentReplying, setDailyOpponentReplying] = useState(false);

  // Starter Triad state (Preserved)
  const [starterIndex, setStarterIndex] = useState(0);
  const [starterFen, setStarterFen] = useState(PUZZLES[0].fen);
  const [starterSelected, setStarterSelected] = useState<Square | null>(null);
  const [starterSolved, setStarterSolved] = useState(false);
  const [starterNotice, setStarterNotice] = useState("");

  // Fetch Lichess daily puzzle on mount
  useEffect(() => {
    let active = true;
    setLoadingLichess(true);
    fetchLichessDailyPuzzle(false).then((res) => {
      if (!active) return;
      if (res.puzzle) {
        setLichessPuzzle(res.puzzle);
        setDailyFen(res.puzzle.setupFen);
        setLichessError(null);
      } else {
        setLichessError(res.error || "Could not load Lichess daily puzzle.");
      }
      setLoadingLichess(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleRetryDailyFetch = () => {
    setLoadingLichess(true);
    setLichessError(null);
    fetchLichessDailyPuzzle(true).then((res) => {
      if (res.puzzle) {
        setLichessPuzzle(res.puzzle);
        setDailyFen(res.puzzle.setupFen);
        setLichessError(null);
      } else {
        setLichessError(res.error || "Could not load Lichess daily puzzle.");
      }
      setLoadingLichess(false);
    });
  };

  const handleRecordBankSolve = (
    bankId: string,
    correct: boolean,
    assisted = false,
  ) => {
    setProgress((prev) => recordBankSolve(prev, bankId, correct, assisted));
  };

  const handleRecordMathsScore = (score: number) => {
    setProgress((prev) => recordMathsScore(prev, score));
  };

  const handleRecordRush = (score: number) => {
    setProgress((prev) => ({
      ...prev,
      bestRush: Math.max(prev.bestRush, score),
    }));
  };

  // Launch puzzle practice pre-filtered by pattern chip
  const handleLaunchPattern = (pattern: string) => {
    setSelectedPattern(pattern);
    setCurrentView("puzzle_practice");
  };

  // Daily puzzle move handler
  const handleDailySquare = (sq: Square) => {
    if (!lichessPuzzle || dailySolved || dailyOpponentReplying) return;

    const c = new Chess(dailyFen);
    const legal = dailySelected
      ? c.moves({ square: dailySelected, verbose: true }).map((m) => m.to)
      : [];

    if (dailySelected && legal.includes(sq)) {
      let promo: "q" | "r" | "b" | "n" | undefined = undefined;
      if (
        c.get(dailySelected)?.type === "p" &&
        (sq[1] === "1" || sq[1] === "8")
      ) {
        promo = "q";
      }
      const moveUci = `${dailySelected}${sq}${promo || ""}`;
      const expectedUci = lichessPuzzle.solution[dailyStep];

      const isCorrect = moveUci.toLowerCase() === expectedUci.toLowerCase();

      if (isCorrect) {
        c.move({ from: dailySelected, to: sq, promotion: promo });
        const nextFen = c.fen();
        setDailyFen(nextFen);
        setDailySelected(null);

        const nextStep = dailyStep + 1;
        if (nextStep >= lichessPuzzle.solution.length) {
          setDailySolved(true);
          setDailyNotice("Daily puzzle solved! Outstanding calculation.");
          setProgress((prev) => ({
            ...prev,
            dailySolved: Array.from(
              new Set([...prev.dailySolved, `daily-${lichessPuzzle.id}`]),
            ),
          }));
        } else {
          setDailyStep(nextStep);
          setDailyNotice("Correct! Opponent replying…");
          setDailyOpponentReplying(true);
          setTimeout(() => {
            const oppUci = lichessPuzzle.solution[nextStep];
            const oppParsed = parseUciMove(oppUci);
            const replyBoard = new Chess(nextFen);
            replyBoard.move(oppParsed);
            setDailyFen(replyBoard.fen());
            setDailyStep(nextStep + 1);
            setDailyOpponentReplying(false);
            setDailyNotice("Your turn — find the continuation!");
          }, 350);
        }
      } else {
        setDailyNotice("Not the winning move. Calculate again!");
        setDailySelected(null);
      }
      return;
    }

    setDailySelected(c.get(sq)?.color === c.turn() ? sq : null);
  };

  // Starter triad move handler
  const handleStarterSquare = (sq: Square) => {
    if (starterSolved) return;
    const puzzle = PUZZLES[starterIndex];
    const c = new Chess(starterFen);
    const legal = starterSelected
      ? c.moves({ square: starterSelected, verbose: true }).map((m) => m.to)
      : [];

    if (starterSelected && legal.includes(sq)) {
      const correct = isPuzzleMate(starterFen, starterSelected, sq);
      if (correct) {
        c.move({ from: starterSelected, to: sq, promotion: "q" });
        setStarterFen(c.fen());
        setStarterSolved(true);
        setStarterNotice("Checkmate! Flawlessly spotted.");
        setProgress((prev) => ({
          ...prev,
          starterSolved: Array.from(
            new Set([...prev.starterSolved, puzzle.id]),
          ),
        }));
      } else {
        setStarterNotice("Legal move, but not mate. Calculate again!");
      }
      setStarterSelected(null);
      return;
    }

    setStarterSelected(c.get(sq)?.color === c.turn() ? sq : null);
  };

  const handleChooseStarter = (idx: number) => {
    setStarterIndex(idx);
    setStarterFen(PUZZLES[idx].fen);
    setStarterSelected(null);
    setStarterSolved(false);
    setStarterNotice("");
  };

  // -------------------------------------------------------------------------
  // VIEW: Active Modes
  // -------------------------------------------------------------------------
  if (currentView === "puzzle_practice") {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0E0E0E] text-[#F4F4F4] font-body p-4 lg:p-8">
        <PuzzlePracticeSession
          onExit={() => setCurrentView("hub")}
          onRecordSolve={handleRecordBankSolve}
          initialTheme={selectedPattern}
        />
      </div>
    );
  }

  if (currentView === "mate_sprint") {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0E0E0E] text-[#F4F4F4] font-body p-4 lg:p-8">
        <MateSprintSession
          onExit={() => setCurrentView("hub")}
          bestRush={progress.bestRush}
          onRecordRush={handleRecordRush}
        />
      </div>
    );
  }

  if (currentView === "speed_duel") {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0E0E0E] text-[#F4F4F4] font-body p-4 lg:p-8">
        <SpeedDuelPractice
          onExit={() => setCurrentView("hub")}
          onRecordScore={handleRecordMathsScore}
          bestScore={progress.mathsBestScore}
        />
      </div>
    );
  }

  if (currentView === "daily_puzzle" && lichessPuzzle) {
    const dailyChess = new Chess(dailyFen);
    const legalMoves = dailySelected
      ? dailyChess.moves({ square: dailySelected, verbose: true }).map((m) => m.to)
      : [];

    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0E0E0E] text-[#F4F4F4] font-body p-4 lg:p-8 max-w-[800px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#AFF65B] uppercase">
              DAILY BONUS PUZZLE
            </div>
            <h1 className="text-3xl font-extrabold tracking-wide text-[#F4F4F4] font-display">
              LICHESS DAILY · {lichessPuzzle.id}
            </h1>
          </div>
          <button
            onClick={() => setCurrentView("hub")}
            className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-sm text-[#F4F4F4] font-semibold border border-[#3A3A3A] transition cursor-pointer"
          >
            ← Modes
          </button>
        </div>

        <div className="relative mx-auto max-w-[520px] aspect-square rounded-2xl overflow-hidden shadow-2xl bg-[#141414] border border-[#2D2D2D]">
          <PositionBoard
            fen={dailyFen}
            selected={dailySelected}
            legal={legalMoves}
            onSquare={handleDailySquare}
            flip={lichessPuzzle.solverTurn === "b"}
          />
        </div>

        <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2D2D2D] flex items-center justify-between text-sm">
          <span className="font-semibold text-[#8A8A8A]">
            {dailyNotice || "Find the best sequence for this position."}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setDailyFen(lichessPuzzle.setupFen);
                setDailyStep(0);
                setDailySelected(null);
                setDailySolved(false);
                setDailyNotice("");
              }}
              className="px-3 py-1.5 rounded-xl bg-[#262626] text-xs font-bold text-[#F4F4F4] border border-[#3A3A3A]"
            >
              Reset ↺
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "starter_triad") {
    const puzzle = PUZZLES[starterIndex];
    const c = new Chess(starterFen);
    const legalMoves = starterSelected
      ? c.moves({ square: starterSelected, verbose: true }).map((m) => m.to)
      : [];

    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0E0E0E] text-[#F4F4F4] font-body p-4 lg:p-8 max-w-[800px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#F2D500] uppercase">
              CLASSIC STARTER TRIAD
            </div>
            <h1 className="text-3xl font-extrabold tracking-wide text-[#F4F4F4] font-display">
              {puzzle.name.toUpperCase()}
            </h1>
          </div>
          <button
            onClick={() => setCurrentView("hub")}
            className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-sm text-[#F4F4F4] font-semibold border border-[#3A3A3A] transition cursor-pointer"
          >
            ← Modes
          </button>
        </div>

        <div className="flex gap-2">
          {PUZZLES.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => handleChooseStarter(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                starterIndex === idx
                  ? "bg-[#F2D500] text-[#0E0E0E] border-[#F2D500]"
                  : "bg-[#262626] text-[#8A8A8A] border-[#363636]"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="relative mx-auto max-w-[520px] aspect-square rounded-2xl overflow-hidden shadow-2xl bg-[#141414] border border-[#2D2D2D]">
          <PositionBoard
            fen={starterFen}
            selected={starterSelected}
            legal={legalMoves}
            onSquare={handleStarterSquare}
          />
        </div>

        <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2D2D2D] flex items-center justify-between text-sm">
          <span className="font-semibold text-[#8A8A8A]">
            {starterNotice || puzzle.hint}
          </span>
          <button
            onClick={() => handleChooseStarter(starterIndex)}
            className="px-3 py-1.5 rounded-xl bg-[#262626] text-xs font-bold text-[#F4F4F4] border border-[#3A3A3A]"
          >
            Reset ↺
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // VIEW: Training Hub (Matches media_1793097522190_f737b6b4.jpg on desktop & media_1793097512367_f1471d75.jpg on phone)
  // -------------------------------------------------------------------------
  const { solved: bankSolvedCount, total: bankTotalCount } =
    getBankProgressRatio(progress);
  const accuracyPct = getAccuracyPercent(progress);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0E0E0E] text-[#F4F4F4] font-body p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#AFF65B] uppercase mb-1">
              CHESS, MATHS &amp; SHARPER MOVES
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-wide text-[#F4F4F4] font-display m-0">
              TRAINING
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-[#1F1F1F] text-xs font-semibold text-[#8A8A8A] border border-[#2E2E2E]">
              Progress stays on this device
            </span>
            <button
              onClick={onExit}
              className="btn-raised py-2 px-4 text-xs font-semibold rounded-full cursor-pointer"
            >
              ← Return to Hub
            </button>
          </div>
        </div>

        {/* Section: CHOOSE YOUR MODE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#F4F4F4] font-display tracking-wider m-0">
              CHOOSE YOUR MODE
            </h2>
            <span className="text-xs font-semibold text-[#8A8A8A]">
              Tap to practise →
            </span>
          </div>

          {/* 3 Main Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Yellow Bento: PUZZLE PRACTICE */}
            <button
              onClick={() => {
                setSelectedPattern("All 150");
                setCurrentView("puzzle_practice");
              }}
              className="w-full text-left p-6 rounded-3xl bg-[#F2D500] text-[#1A1A1A] hover:-translate-y-1 motion-reduce:transform-none motion-reduce:hover:ring-2 motion-reduce:hover:ring-white transition duration-200 shadow-xl flex flex-col justify-between min-h-[140px] md:min-h-[260px] cursor-pointer group border-0 focus:outline-none focus:ring-4 focus:ring-[#F2D500]/50"
              aria-label="Puzzle Practice: 150 puzzles offline bank"
            >
              <div className="flex items-start justify-between w-full">
                <div>
                  <div className="text-[11px] font-bold tracking-widest text-[#1A1A1A]/70 uppercase mb-1">
                    150 PUZZLES · OFFLINE BANK
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-black tracking-wide font-display text-[#1A1A1A] m-0">
                    PUZZLE PRACTICE
                  </h3>
                </div>
                {/* On phone: Knight sits on the right */}
                <div className="w-14 h-14 md:hidden flex-shrink-0">
                  <MatiksPiece type="n" color="w" customColor="#FFFFFF" />
                </div>
              </div>

              {/* On desktop: Knight graphic centered */}
              <div className="hidden md:flex items-center justify-center py-4 my-auto">
                <div className="w-20 h-20 filter drop-shadow-md">
                  <MatiksPiece type="n" color="w" customColor="#FFFFFF" />
                </div>
              </div>

              <div className="flex items-center justify-between w-full pt-2">
                <span className="text-xs font-semibold text-[#1A1A1A]/90">
                  Untimed · Choose a theme
                </span>
                <div className="w-9 h-9 rounded-full bg-black/90 flex items-center justify-center text-white text-base font-bold shadow-md group-hover:scale-105 transition">
                  ↗
                </div>
              </div>
            </button>

            {/* 2. Lavender Bento: MATE SPRINT */}
            <button
              onClick={() => setCurrentView("mate_sprint")}
              className="w-full text-left p-6 rounded-3xl bg-[#A594F0] text-[#1A1A1A] hover:-translate-y-1 motion-reduce:transform-none motion-reduce:hover:ring-2 motion-reduce:hover:ring-white transition duration-200 shadow-xl flex flex-col justify-between min-h-[140px] md:min-h-[260px] cursor-pointer group border-0 focus:outline-none focus:ring-4 focus:ring-[#A594F0]/50"
              aria-label="Mate Sprint: 3 min, 3 mistakes ends run"
            >
              <div className="flex items-start justify-between w-full">
                <div>
                  <div className="text-[11px] font-bold tracking-widest text-[#1A1A1A]/70 uppercase mb-1">
                    CHESS AGAINST THE CLOCK
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-black tracking-wide font-display text-[#1A1A1A] m-0">
                    MATE SPRINT
                  </h3>
                </div>
                {/* On phone: Crown + 3:00 on right */}
                <div className="flex items-center gap-1 md:hidden">
                  <div className="w-6 h-6">
                    <MatiksPiece type="q" color="w" customColor="#FFFFFF" />
                  </div>
                  <span className="text-2xl font-black font-display text-[#1A1A1A]">
                    3:00
                  </span>
                </div>
              </div>

              {/* On desktop: Crown + 3:00 centered */}
              <div className="hidden md:flex items-center justify-center gap-3 py-4 my-auto">
                <div className="w-16 h-16 filter drop-shadow-md">
                  <MatiksPiece type="q" color="w" customColor="#FFFFFF" />
                </div>
                <span className="text-5xl font-black font-display text-[#1A1A1A] tracking-wider">
                  3:00
                </span>
              </div>

              <div className="flex items-center justify-between w-full pt-2">
                <span className="text-xs font-semibold text-[#1A1A1A]/90">
                  3 min · 3 mistakes ends the run
                </span>
                <span className="text-[11px] font-bold text-[#1A1A1A]/80">
                  Best: {progress.bestRush}
                </span>
              </div>
            </button>

            {/* 3. Teal Bento: SPEED DUEL */}
            <button
              onClick={() => setCurrentView("speed_duel")}
              className="w-full text-left p-6 rounded-3xl bg-[#66D4C2] text-[#1A1A1A] hover:-translate-y-1 motion-reduce:transform-none motion-reduce:hover:ring-2 motion-reduce:hover:ring-white transition duration-200 shadow-xl flex flex-col justify-between min-h-[140px] md:min-h-[260px] cursor-pointer group border-0 focus:outline-none focus:ring-4 focus:ring-[#66D4C2]/50"
              aria-label="Speed Duel: Quick maths solo practice"
            >
              <div className="flex items-start justify-between w-full">
                <div>
                  <div className="text-[11px] font-bold tracking-widest text-[#1A1A1A]/70 uppercase mb-1">
                    QUICK MATHS · SOLO PRACTICE
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-black tracking-wide font-display text-[#1A1A1A] m-0">
                    SPEED DUEL
                  </h3>
                </div>
                {/* On phone: 7 × 8 on right */}
                <div className="text-3xl font-black font-display text-[#1A1A1A] md:hidden">
                  7 × 8
                </div>
              </div>

              {/* On desktop: 7 × 8 centered */}
              <div className="hidden md:flex items-center justify-center py-4 my-auto">
                <span className="text-6xl font-black font-display text-[#1A1A1A] tracking-wider">
                  7 × 8
                </span>
              </div>

              <div className="flex items-center justify-between w-full pt-2">
                <span className="text-xs font-semibold text-[#1A1A1A]/90">
                  Timer · Errors · Review misses
                </span>
                <div className="w-9 h-9 rounded-full bg-black/90 flex items-center justify-center text-white text-base font-bold shadow-md group-hover:scale-105 transition">
                  ↗
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Secondary Cards: PICK A PATTERN & YOUR PRACTICE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: PICK A PATTERN */}
          <div className="bg-[#1A1A1A] p-6 rounded-3xl border border-[#2D2D2D] space-y-4">
            <div>
              <div className="text-xs font-bold tracking-widest text-[#AFF65B] uppercase mb-1">
                PICK A PATTERN
              </div>
              <h3 className="text-2xl font-black text-[#F4F4F4] font-display tracking-wide m-0">
                WHAT WILL YOU SPOT TODAY?
              </h3>
            </div>

            {/* Pattern chips */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {[
                { label: "All 150", theme: "All 150" },
                { label: "Mate", theme: "Mate" },
                { label: "Fork", theme: "Fork" },
                { label: "Pin", theme: "Pin" },
                { label: "Endgame", theme: "Endgame" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleLaunchPattern(item.theme)}
                  className="px-4 py-2.5 rounded-xl bg-[#262626] hover:bg-[#333333] active:bg-[#3D3D3D] text-[#F4F4F4] text-xs font-bold border border-[#363636] transition cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-[#8A8A8A] pt-1 m-0">
              Lichess open database · CC0 · Included locally
            </p>
          </div>

          {/* Card 2: YOUR PRACTICE */}
          <div className="bg-[#1A1A1A] p-6 rounded-3xl border border-[#2D2D2D] space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-[#F4F4F4] font-display tracking-wide m-0">
                  YOUR PRACTICE
                </h3>
                <span className="text-xs font-semibold text-[#8A8A8A]">
                  On this device
                </span>
              </div>

              {/* 3 Metric Columns */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-3xl font-black text-[#F4F4F4] font-display">
                    {bankSolvedCount}/{bankTotalCount}
                  </div>
                  <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase mt-0.5">
                    Unique solved
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#F4F4F4] font-display">
                    {accuracyPct !== null ? `${accuracyPct}%` : "—"}
                  </div>
                  <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase mt-0.5">
                    Accuracy
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#F4F4F4] font-display">
                    {progress.mathsBestScore}
                  </div>
                  <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase mt-0.5">
                    Maths best
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="w-full h-2 rounded-full bg-[#262626] overflow-hidden">
                <div
                  className="h-full bg-[#AFF65B] transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.round((bankSolvedCount / bankTotalCount) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Practice Opportunities (Preserved Secondary Features) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Daily Puzzle Banner */}
          <div className="bg-[#1A1A1A] p-5 rounded-3xl border border-[#2D2D2D] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold tracking-widest text-[#AFF65B] uppercase">
                DAILY BONUS
              </div>
              <h4 className="text-lg font-bold text-[#F4F4F4] mt-0.5">
                {lichessPuzzle
                  ? `Daily Challenge #${lichessPuzzle.id}`
                  : "Daily Lichess Puzzle"}
              </h4>
              <p className="text-xs text-[#8A8A8A] mt-1 m-0">
                {loadingLichess
                  ? "Fetching today's challenge..."
                  : lichessError
                  ? "Offline — retry whenever connection restores."
                  : `Rating ${lichessPuzzle?.rating || "—"} · Live daily sync`}
              </p>
            </div>
            {lichessPuzzle ? (
              <button
                onClick={() => setCurrentView("daily_puzzle")}
                className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-xs font-bold text-[#AFF65B] border border-[#3A3A3A] transition cursor-pointer"
              >
                Play Daily →
              </button>
            ) : (
              <button
                onClick={handleRetryDailyFetch}
                className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-xs font-bold text-[#F4F4F4] border border-[#3A3A3A] transition cursor-pointer"
              >
                Retry Fetch ↺
              </button>
            )}
          </div>

          {/* Starter Compositions Banner */}
          <div className="bg-[#1A1A1A] p-5 rounded-3xl border border-[#2D2D2D] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold tracking-widest text-[#F2D500] uppercase">
                FOUNDATIONS
              </div>
              <h4 className="text-lg font-bold text-[#F4F4F4] mt-0.5">
                Classic Starter Triad
              </h4>
              <p className="text-xs text-[#8A8A8A] mt-1 m-0">
                3 hand-crafted mate-in-one checkmate compositions.
              </p>
            </div>
            <button
              onClick={() => setCurrentView("starter_triad")}
              className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-xs font-bold text-[#F2D500] border border-[#3A3A3A] transition cursor-pointer"
            >
              Practice Triad →
            </button>
          </div>
        </div>

        {/* Prototype Footer Note */}
        <div className="text-center text-xs text-[#555555] pt-4">
          DESIGN PROTOTYPE · Not live · Session numbers are illustrative · Proposed practice defaults
        </div>
      </div>
    </div>
  );
}
