import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { positionNotes } from "./positionNotes";
import { explainWithAICoach } from "../services/aiCoach";

export function readableSuggestion(fen: string, best: string) {
  try {
    const c = new Chess(fen);
    const m = c.move({
      from: best.slice(0, 2),
      to: best.slice(2, 4),
      promotion: best[4],
    });
    return `${m.color === "w" ? "White" : "Black"}: ${m.san} (${m.from} to ${m.to}).`;
  } catch {
    return "No legal engine suggestion is available.";
  }
}

export default function AnalysisCoach({
  fen,
  previousFen,
  san,
  best,
  evaluation,
}: {
  fen: string;
  previousFen?: string;
  san?: string;
  best: string;
  evaluation: string;
}) {
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiSource, setAiSource] = useState<string>("heuristic");

  // Auto-fetch or refresh when position or candidate move updates
  useEffect(() => {
    let cancelled = false;
    setLoadingAi(true);

    const timer = setTimeout(() => {
      explainWithAICoach({
        fen,
        previousFen,
        san,
        bestMove: best ? readableSuggestion(fen, best) : undefined,
        evaluation,
      }).then((res) => {
        if (!cancelled) {
          setAiExplanation(res.explanation);
          setAiSource(res.source);
          setLoadingAi(false);
        }
      });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fen, previousFen, san, best, evaluation]);

  return (
    <div className="flex flex-col gap-3">
      {/* AI Grandmaster Coach Bubble */}
      <div className="p-4 rounded-xl bg-[#262626] border border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#AFF65B] animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest text-[#AFF65B] uppercase font-body">
              {aiSource === "gemini" ? "GEMINI AI COACH" : "POSITION COACH"}
            </span>
          </div>
          {loadingAi && (
            <span className="text-[10px] text-[#8A8A8A] font-body italic">
              Analyzing…
            </span>
          )}
        </div>
        <p className="text-xs text-[#F4F4F4] leading-relaxed m-0 font-body">
          {aiExplanation || "Evaluating tactical structure and center control…"}
        </p>
      </div>

      {/* Heuristic Position Notes */}
      <div className="p-3 rounded-lg bg-[#161616] border border-white/5 space-y-1.5 text-xs text-[#8A8A8A]">
        {positionNotes(fen, previousFen, san).map((n, i) => (
          <p key={i} className="m-0 leading-normal">• {n}</p>
        ))}
        {best && (
          <p className="m-0 text-[#AFF65B] font-mono pt-1">
            Engine candidate: {readableSuggestion(fen, best)} ({evaluation})
          </p>
        )}
      </div>
    </div>
  );
}
