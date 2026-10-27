import { useState, useEffect, useRef, useCallback } from "react";
import {
  generateQuestion,
  calculateAccuracy,
  MathQuestion,
  MissedQuestion,
  SpeedDuelDifficulty,
  SpeedDuelDuration,
} from "./speedDuelEngine";

interface SpeedDuelPracticeProps {
  onExit: () => void;
  onRecordScore?: (score: number) => void;
  bestScore?: number;
}

export default function SpeedDuelPractice({
  onExit,
  onRecordScore,
  bestScore = 0,
}: SpeedDuelPracticeProps) {
  // Session states: 'setup' | 'countdown' | 'active' | 'results' | 'retry_missed'
  const [phase, setPhase] = useState<
    "setup" | "countdown" | "active" | "results" | "retry_missed"
  >("setup");

  const [duration, setDuration] = useState<SpeedDuelDuration>(60);
  const [difficulty, setDifficulty] = useState<SpeedDuelDifficulty>("easy");

  // Countdown state
  const [countdownNum, setCountdownNum] = useState(3);

  // Active session state
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion>(() =>
    generateQuestion("easy"),
  );
  const [questionIndex, setQuestionIndex] = useState(1);
  const [inputVal, setInputVal] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const [missedQuestions, setMissedQuestions] = useState<MissedQuestion[]>([]);

  // Retry missed state
  const [retryQueue, setRetryQueue] = useState<MissedQuestion[]>([]);
  const [retryIndex, setRetryIndex] = useState(0);
  const [retryFixedCount, setRetryFixedCount] = useState(0);

  const deadlineRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear timer safely on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Start countdown before match
  const handleStartCountdown = () => {
    setPhase("countdown");
    setCountdownNum(3);
    const countTimer = setInterval(() => {
      setCountdownNum((prev) => {
        if (prev <= 1) {
          clearInterval(countTimer);
          startActiveSession();
          return 0;
        }
        return prev - 1;
      });
    }, 800);
  };

  const startActiveSession = () => {
    setPhase("active");
    setCorrectCount(0);
    setErrorCount(0);
    setQuestionIndex(1);
    setInputVal("");
    setMissedQuestions([]);

    const firstQ = generateQuestion(difficulty);
    setCurrentQuestion(firstQ);

    const now = Date.now();
    const deadline = now + duration * 1000;
    deadlineRef.current = deadline;
    setRemainingSeconds(duration);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      const leftMs = deadlineRef.current - Date.now();
      const leftSec = Math.max(0, Math.ceil(leftMs / 1000));
      setRemainingSeconds(leftSec);

      if (leftMs <= 0) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        finishSession();
      }
    }, 100);
  };

  const finishSession = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setPhase("results");
  }, []);

  // Sync high score when results phase entered
  useEffect(() => {
    if (phase === "results" && onRecordScore) {
      onRecordScore(correctCount);
    }
  }, [phase, correctCount, onRecordScore]);

  // Handle Answer Submission
  const handleSubmitAnswer = useCallback(() => {
    if (phase === "active") {
      // Reject if deadline has expired
      if (Date.now() >= deadlineRef.current) {
        finishSession();
        return;
      }

      const trimmed = inputVal.trim();
      if (!trimmed) return; // Blank input is ignored

      const parsed = parseInt(trimmed, 10);
      if (isNaN(parsed)) return;

      if (parsed === currentQuestion.answer) {
        setCorrectCount((c) => c + 1);
      } else {
        setErrorCount((e) => e + 1);
        setMissedQuestions((prev) => [
          ...prev,
          { question: currentQuestion, entered: trimmed },
        ]);
      }

      // Advance to next question immediately
      setInputVal("");
      setQuestionIndex((i) => i + 1);
      setCurrentQuestion((prev) => generateQuestion(difficulty, prev.prompt));
    } else if (phase === "retry_missed") {
      const trimmed = inputVal.trim();
      if (!trimmed) return;

      const currentItem = retryQueue[retryIndex];
      if (!currentItem) return;

      const parsed = parseInt(trimmed, 10);
      if (parsed === currentItem.question.answer) {
        setRetryFixedCount((c) => c + 1);
      }

      setInputVal("");
      if (retryIndex + 1 < retryQueue.length) {
        setRetryIndex((i) => i + 1);
      } else {
        // Retry complete, back to results
        setPhase("results");
      }
    }
  }, [phase, inputVal, currentQuestion, difficulty, finishSession, retryQueue, retryIndex]);

  // Keypad & keyboard input handling
  const handleDigitPress = useCallback((digit: string) => {
    setInputVal((prev) => (prev.length < 6 ? prev + digit : prev));
  }, []);

  const handleBackspace = useCallback(() => {
    setInputVal((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setInputVal("");
  }, []);

  // Physical keyboard listeners
  useEffect(() => {
    if (phase !== "active" && phase !== "retry_missed") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Delete" || e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleClear();
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSubmitAnswer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, handleDigitPress, handleBackspace, handleClear, handleSubmitAnswer]);

  // Start retry-missed drill
  const handleStartRetryMissed = () => {
    if (missedQuestions.length === 0) return;
    setRetryQueue([...missedQuestions]);
    setRetryIndex(0);
    setRetryFixedCount(0);
    setInputVal("");
    setPhase("retry_missed");
  };

  const accuracy = calculateAccuracy(correctCount, errorCount);

  // -------------------------------------------------------------
  // RENDER: Setup Screen
  // -------------------------------------------------------------
  if (phase === "setup") {
    return (
      <div className="max-w-[700px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#AFF65B] uppercase">
              QUICK MATHS · SOLO PRACTICE
            </div>
            <h1 className="text-3xl font-extrabold tracking-wide text-[#F4F4F4] font-display">
              SPEED DUEL
            </h1>
          </div>
          <button
            onClick={onExit}
            className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-sm text-[#F4F4F4] font-semibold border border-[#3A3A3A] transition"
          >
            ← Modes
          </button>
        </div>

        <div className="bg-[#1A1A1A] p-6 rounded-3xl border border-[#2D2D2D] space-y-6">
          <div>
            <label className="block text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider mb-2">
              SESSION DURATION
            </label>
            <div className="grid grid-cols-3 gap-3">
              {([30, 60, 120] as SpeedDuelDuration[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-3 rounded-2xl font-bold text-sm transition border ${
                    duration === d
                      ? "bg-[#66D4C2] text-[#0E0E0E] border-[#66D4C2] shadow-lg shadow-[#66D4C2]/20"
                      : "bg-[#262626] text-[#F4F4F4] border-[#363636] hover:bg-[#303030]"
                  }`}
                >
                  {d} SECONDS
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider mb-2">
              DIFFICULTY LEVEL
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["easy", "medium", "hard"] as SpeedDuelDifficulty[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`py-3 rounded-2xl font-bold text-sm uppercase transition border ${
                    difficulty === level
                      ? "bg-[#66D4C2] text-[#0E0E0E] border-[#66D4C2] shadow-lg shadow-[#66D4C2]/20"
                      : "bg-[#262626] text-[#F4F4F4] border-[#363636] hover:bg-[#303030]"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#8A8A8A] mt-2">
              {difficulty === "easy" && "Operands 1–12: addition, non-negative subtraction, multiplication, exact division."}
              {difficulty === "medium" && "Operands 1–30: faster mental maths with double digits."}
              {difficulty === "hard" && "Operands 1–99: high-intensity arithmetic for seasoned solvers."}
            </p>
          </div>

          {bestScore > 0 && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#232323] border border-[#333333]">
              <span className="text-xs text-[#8A8A8A] font-semibold uppercase">
                Your Personal Best
              </span>
              <span className="text-sm font-bold text-[#AFF65B]">
                {bestScore} solves
              </span>
            </div>
          )}

          <button
            onClick={handleStartCountdown}
            className="w-full py-4 rounded-2xl bg-[#AFF65B] hover:bg-[#9DE84A] text-[#0E0E0E] font-extrabold text-base tracking-wider uppercase transition shadow-lg shadow-[#AFF65B]/20 cursor-pointer"
          >
            START PRACTICE →
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Countdown Screen
  // -------------------------------------------------------------
  if (phase === "countdown") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="text-sm font-bold tracking-widest text-[#AFF65B] uppercase">
          GET READY
        </div>
        <div className="text-8xl font-black text-[#66D4C2] font-display animate-pulse">
          {countdownNum}
        </div>
        <div className="text-sm text-[#8A8A8A]">
          {difficulty.toUpperCase()} · {duration}S
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Results Screen
  // -------------------------------------------------------------
  if (phase === "results") {
    return (
      <div className="max-w-[700px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#AFF65B] uppercase">
              PRACTICE COMPLETE
            </div>
            <h1 className="text-3xl font-extrabold tracking-wide text-[#F4F4F4] font-display">
              SESSION RESULTS
            </h1>
          </div>
          <button
            onClick={onExit}
            className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-sm text-[#F4F4F4] font-semibold border border-[#3A3A3A] transition"
          >
            ← Modes
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2D2D2D] text-center">
            <div className="text-3xl font-black text-[#AFF65B] font-display">
              {correctCount}
            </div>
            <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase mt-1">
              Correct
            </div>
          </div>
          <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2D2D2D] text-center">
            <div className="text-3xl font-black text-[#FF6B6B] font-display">
              {errorCount}
            </div>
            <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase mt-1">
              Errors
            </div>
          </div>
          <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2D2D2D] text-center">
            <div className="text-3xl font-black text-[#F4F4F4] font-display">
              {accuracy}%
            </div>
            <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase mt-1">
              Accuracy
            </div>
          </div>
          <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2D2D2D] text-center">
            <div className="text-3xl font-black text-[#66D4C2] font-display">
              {duration}s
            </div>
            <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase mt-1">
              Duration
            </div>
          </div>
        </div>

        {/* Missed questions review */}
        {missedQuestions.length > 0 ? (
          <div className="bg-[#1A1A1A] p-5 rounded-3xl border border-[#2D2D2D] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F4F4F4] uppercase tracking-wider">
                Review Missed Questions ({missedQuestions.length})
              </h3>
              <button
                onClick={handleStartRetryMissed}
                className="px-3.5 py-1.5 rounded-xl bg-[#66D4C2] hover:bg-[#52C0AE] text-[#0E0E0E] text-xs font-bold transition shadow-sm"
              >
                Retry Missed Only ↺
              </button>
            </div>
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {missedQuestions.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#242424] border border-[#333333] text-sm"
                >
                  <span className="font-bold text-[#F4F4F4]">
                    {item.question.prompt.replace("= ?", "")}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="line-through text-[#FF6B6B] font-mono">
                      {item.entered}
                    </span>
                    <span className="text-[#AFF65B] font-bold font-mono">
                      = {item.question.answer}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#1A1A1A] p-6 rounded-3xl border border-[#2D2D2D] text-center space-y-2">
            <div className="text-2xl">🎯</div>
            <div className="text-base font-bold text-[#AFF65B]">
              Flawless Run!
            </div>
            <p className="text-xs text-[#8A8A8A]">
              You answered every question without a single error.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={startActiveSession}
            className="flex-1 py-3.5 rounded-2xl bg-[#AFF65B] hover:bg-[#9DE84A] text-[#0E0E0E] font-bold text-sm tracking-wider uppercase transition shadow-lg shadow-[#AFF65B]/20"
          >
            Play Again ↻
          </button>
          <button
            onClick={() => setPhase("setup")}
            className="flex-1 py-3.5 rounded-2xl bg-[#262626] hover:bg-[#333333] text-[#F4F4F4] font-bold text-sm tracking-wider uppercase border border-[#3A3A3A] transition"
          >
            Change Settings
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Retry Missed Drill Screen
  // -------------------------------------------------------------
  if (phase === "retry_missed") {
    const currentItem = retryQueue[retryIndex];
    if (!currentItem) {
      setPhase("results");
      return null;
    }

    return (
      <div className="max-w-[480px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#66D4C2] uppercase">
              RETRY MISSED QUESTIONS ({retryFixedCount} fixed)
            </div>
            <h1 className="text-2xl font-extrabold tracking-wide text-[#F4F4F4] font-display">
              QUESTION {retryIndex + 1} OF {retryQueue.length}
            </h1>
          </div>
          <button
            onClick={() => setPhase("results")}
            className="px-3 py-1.5 rounded-xl bg-[#262626] text-xs text-[#F4F4F4] font-semibold border border-[#3A3A3A]"
          >
            Back to Results
          </button>
        </div>

        <div className="bg-[#1A1A1A] p-6 rounded-3xl border border-[#2D2D2D] text-center space-y-4">
          <div className="text-xs font-bold text-[#8A8A8A] uppercase">
            Originally entered: <span className="line-through text-[#FF6B6B]">{currentItem.entered}</span>
          </div>

          <div className="text-5xl font-black text-[#F4F4F4] font-display py-2">
            {currentItem.question.prompt}
          </div>

          <div className="h-14 rounded-2xl bg-[#121212] border border-[#333333] flex items-center justify-center text-3xl font-mono font-bold text-[#66D4C2] tracking-wider">
            {inputVal || <span className="text-[#3A3A3A]">?</span>}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                onClick={() => handleDigitPress(num)}
                className="h-12 rounded-xl bg-[#262626] hover:bg-[#333333] active:bg-[#3D3D3D] text-[#F4F4F4] text-xl font-bold transition flex items-center justify-center border border-[#333333]"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#F4F4F4] text-lg font-bold transition flex items-center justify-center border border-[#333333]"
              aria-label="Backspace"
            >
              ⌫
            </button>
            <button
              onClick={() => handleDigitPress("0")}
              className="h-12 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#F4F4F4] text-xl font-bold transition flex items-center justify-center border border-[#333333]"
            >
              0
            </button>
            <button
              onClick={handleClear}
              className="h-12 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#F4F4F4] text-base font-bold transition flex items-center justify-center border border-[#333333]"
              aria-label="Clear"
            >
              C
            </button>
          </div>

          <button
            onClick={handleSubmitAnswer}
            className="w-full h-12 rounded-xl bg-[#AFF65B] hover:bg-[#9DE84A] text-[#0E0E0E] font-extrabold text-sm tracking-wider uppercase transition shadow-lg shadow-[#AFF65B]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            Check answer ↵
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Active Session Screen (Matches media_1793097497680_9e6058d2.jpg)
  // -------------------------------------------------------------
  return (
    <div className="max-w-[480px] mx-auto space-y-4 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold tracking-widest text-[#AFF65B] uppercase">
            QUICK MATHS · SOLO PRACTICE
          </div>
          <h1 className="text-3xl font-extrabold tracking-wide text-[#F4F4F4] font-display">
            SPEED DUEL
          </h1>
        </div>
        <button
          onClick={finishSession}
          className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-sm text-[#F4F4F4] font-semibold border border-[#3A3A3A] transition"
        >
          ← Modes
        </button>
      </div>

      {/* 3 Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1A1A1A] p-3.5 rounded-2xl border border-[#2D2D2D] text-center">
          <div className="text-3xl font-black text-[#F4F4F4] font-display tracking-tight">
            {remainingSeconds}S
          </div>
          <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase mt-0.5">
            Remaining
          </div>
        </div>
        <div className="bg-[#1A1A1A] p-3.5 rounded-2xl border border-[#2D2D2D] text-center">
          <div className="text-3xl font-black text-[#F4F4F4] font-display tracking-tight">
            {correctCount}
          </div>
          <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase mt-0.5">
            Correct
          </div>
        </div>
        <div className="bg-[#1A1A1A] p-3.5 rounded-2xl border border-[#2D2D2D] text-center">
          <div className="text-3xl font-black text-[#F4F4F4] font-display tracking-tight">
            {errorCount}
          </div>
          <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase mt-0.5">
            Errors
          </div>
        </div>
      </div>

      {/* Main Equation & Keypad Card */}
      <div className="bg-[#1A1A1A] p-5 rounded-3xl border border-[#2D2D2D] space-y-4">
        {/* Subtitle row */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#66D4C2] uppercase tracking-wider">
            {difficulty.toUpperCase()} · + - × ÷
          </span>
          <span className="text-[#8A8A8A] font-semibold">
            Question {questionIndex}
          </span>
        </div>

        {/* Large Equation */}
        <div className="text-center py-2">
          <div className="text-5xl font-black text-[#F4F4F4] font-display tracking-wider">
            {currentQuestion.prompt}
          </div>
        </div>

        {/* Input box */}
        <div className="h-14 rounded-2xl bg-[#121212] border border-[#333333] flex items-center justify-center text-3xl font-mono font-bold text-[#66D4C2] tracking-wider">
          {inputVal || <span className="text-[#3A3A3A]">?</span>}
        </div>

        {/* 3-Column Keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleDigitPress(num)}
              className="h-12 rounded-xl bg-[#262626] hover:bg-[#333333] active:bg-[#3D3D3D] text-[#F4F4F4] text-xl font-bold transition flex items-center justify-center border border-[#333333] cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#F4F4F4] text-lg font-bold transition flex items-center justify-center border border-[#333333] cursor-pointer"
            aria-label="Backspace"
          >
            ⌫
          </button>
          <button
            onClick={() => handleDigitPress("0")}
            className="h-12 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#F4F4F4] text-xl font-bold transition flex items-center justify-center border border-[#333333] cursor-pointer"
          >
            0
          </button>
          <button
            onClick={handleClear}
            className="h-12 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#F4F4F4] text-base font-bold transition flex items-center justify-center border border-[#333333] cursor-pointer"
            aria-label="Clear"
          >
            C
          </button>
        </div>

        {/* Lime Submit Button */}
        <button
          onClick={handleSubmitAnswer}
          className="w-full h-12 rounded-xl bg-[#AFF65B] hover:bg-[#9DE84A] active:bg-[#8BD838] text-[#0E0E0E] font-extrabold text-sm tracking-wider uppercase transition shadow-lg shadow-[#AFF65B]/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          Check answer ↵
        </button>

        <p className="text-center text-xs text-[#AFF65B]/80 font-medium">
          Type an answer, then press Enter.
        </p>
      </div>
    </div>
  );
}
