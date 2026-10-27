import { useState, useEffect } from "react";
import { parseAnswer } from "../chaturanga/math";
import type { MathQuestion } from "./MathChessMode";

interface MathDuelOverlayProps {
  question: MathQuestion;
  questionIndex: number;
  totalQuestions?: number;
  playerScore: number;
  botScore?: number;
  duelTimer?: number;
  playerName?: string;
  playerRating?: number;
  botName?: string;
  botRating?: number;
  freezeCharges?: number;
  jumpCharges?: number;
  onAnswer: (val: number) => void;
  questionResults?: boolean[];
}

export default function MathDuelOverlay({
  question,
  questionIndex,
  totalQuestions = 10,
  playerScore,
  botScore = 0,
  duelTimer = 20,
  playerName = "You",
  playerRating = 1200,
  botName = "Aarav",
  botRating = 1050,
  freezeCharges = 2,
  jumpCharges = 1,
  onAnswer,
  questionResults = [],
}: MathDuelOverlayProps) {
  const [inputVal, setInputVal] = useState("");

  // Clear input when question changes
  useEffect(() => {
    setInputVal("");
  }, [questionIndex]);

  const handleSubmit = (valStr = inputVal) => {
    const parsed = parseAnswer(valStr);
    if (parsed === null) return;
    onAnswer(parsed);
    setInputVal("");
  };

  const handleKeypadPress = (k: string) => {
    if (k === "C") {
      setInputVal("");
    } else if (k === "DEL") {
      setInputVal((prev) => prev.slice(0, -1));
    } else if (/^\d$/.test(k)) {
      if (inputVal.length < 8) {
        const next = inputVal + k;
        setInputVal(next);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl bg-[#1A1A1A] border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col justify-between select-none animate-in fade-in zoom-in-95 duration-200">
      {/* Header: Players, CLOCKS PAUSED pill, duel timer */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 gap-2">
        {/* Left: Player (Teal Avatar) */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#66D4C2] text-[#0E0E0E] font-bold text-xs flex items-center justify-center shadow-md">
            {playerName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-sm text-[#F4F4F4] leading-tight">{playerName}</div>
            <div className="text-[11px] text-[#8A8A8A] font-mono">{playerRating}</div>
          </div>
        </div>

        {/* Center: CLOCKS PAUSED pill + Duel countdown */}
        <div className="flex flex-col items-center">
          <span className="px-2.5 py-0.5 rounded-full bg-[#F2D500] text-[#0E0E0E] text-[10px] font-extrabold uppercase tracking-wider shadow-sm mb-1">
            CLOCKS PAUSED
          </span>
          <span className="font-heading text-xl text-[#AFF65B] tracking-wider leading-none">
            {duelTimer}S
          </span>
        </div>

        {/* Right: Bot (Coral Avatar) */}
        <div className="flex items-center gap-2.5 text-right">
          <div>
            <div className="font-bold text-sm text-[#F4F4F4] leading-tight">{botName}</div>
            <div className="text-[11px] text-[#8A8A8A] font-mono">{botRating}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#F07040] text-[#0E0E0E] font-bold text-xs flex items-center justify-center shadow-md">
            {botName.slice(0, 1).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Score Row & 10 Question Pips */}
      <div className="flex items-center justify-between py-3">
        <span className="font-heading text-3xl text-[#AFF65B] tracking-wide leading-none w-10 text-left">
          {playerScore}
        </span>

        {/* 10 Pips Row */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {Array.from({ length: totalQuestions }).map((_, i) => {
            const isDone = i < questionIndex;
            const isCurrent = i === questionIndex;
            const wasCorrect = questionResults[i];

            return (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  isCurrent
                    ? "border-2 border-[#AFF65B] bg-transparent scale-125 shadow-[0_0_8px_rgba(175,246,91,0.5)]"
                    : isDone
                      ? wasCorrect
                        ? "bg-[#AFF65B]"
                        : "bg-[#E5484D]"
                      : "bg-[#262626] border border-white/5"
                }`}
              />
            );
          })}
        </div>

        <span className="font-heading text-3xl text-[#8A8A8A] tracking-wide leading-none w-10 text-right">
          {botScore}
        </span>
      </div>

      {/* Centre: Kicker & Question in Large Bebas Neue */}
      <div className="my-3 text-center">
        <span className="matiks-kicker text-[#AFF65B] block mb-1">
          MATHS DUEL · QUESTION {questionIndex + 1} OF {totalQuestions}
        </span>
        <div className="font-heading text-6xl sm:text-7xl lg:text-8xl text-white tracking-wider my-2 leading-none">
          {question.question} = ?
        </div>
      </div>

      {/* Answer Field with Raised Surface and Lime Caret */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="w-full max-w-sm mx-auto mb-3"
      >
        <div className="relative bg-[#262626] border-2 border-white/10 focus-within:border-[#AFF65B] rounded-2xl px-4 py-2 flex items-center shadow-inner">
          <input
            type="text"
            inputMode="numeric"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Answer"
            autoFocus
            className="w-full bg-transparent text-right font-heading text-4xl sm:text-5xl text-[#AFF65B] tracking-wider outline-none placeholder:text-[#555] caret-[#AFF65B]"
          />
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="hidden sm:inline-block ml-3 px-4 py-2 bg-[#AFF65B] hover:bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Enter
          </button>
        </div>
        {/* Desktop keyboard hint */}
        <p className="hidden sm:block text-[11px] text-[#888] font-body text-center mt-2 m-0">
          Type your answer · Enter to submit · whole numbers only
        </p>
      </form>

      {/* Phone layout on-screen Integer Keypad (1-9, C, 0, DEL - no decimal key!) */}
      <div className="sm:hidden w-full max-w-xs mx-auto grid grid-cols-3 gap-2 my-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "DEL"].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              if (k === "DEL" && inputVal.length === 0) return;
              handleKeypadPress(k);
            }}
            className={`py-3 rounded-xl font-heading text-2xl tracking-wide flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md ${
              k === "C"
                ? "bg-[#262626] text-[#E5484D] border border-red-500/20"
                : k === "DEL"
                  ? "bg-[#262626] text-white border border-white/10"
                  : "bg-[#262626] text-white hover:bg-[#333] border border-white/5 active:bg-[#AFF65B] active:text-black"
            }`}
          >
            {k === "DEL" ? "⌫" : k}
          </button>
        ))}
      </div>

      {/* Submit button on phone */}
      <div className="sm:hidden mt-2">
        <button
          type="button"
          disabled={!inputVal.trim()}
          onClick={() => handleSubmit()}
          className="w-full py-3 bg-[#AFF65B] text-black font-bold text-sm uppercase tracking-wider rounded-xl transition-all disabled:opacity-30 cursor-pointer shadow-lg active:scale-95"
        >
          Submit Answer
        </button>
      </div>

      {/* Footer: Spell recharge note with charges */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#8A8A8A] font-body flex-wrap gap-2">
        <span>Winner recharges the spell deck</span>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#262626] text-[#AFF65B] font-mono text-[11px] font-bold">
            Freeze: {freezeCharges}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#262626] text-[#66D4C2] font-mono text-[11px] font-bold">
            Jump: {jumpCharges}
          </span>
        </div>
      </div>
    </div>
  );
}
