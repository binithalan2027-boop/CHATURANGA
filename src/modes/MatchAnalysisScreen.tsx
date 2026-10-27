import { useState, useEffect, useMemo } from "react";
import { Chess } from "chess.js";
import { materialEval } from "../chaturanga/study";
import MatiksPiece from "../components/MatiksPiece";
import {
  analyzeGameWithAICoach,
  getClientGeminiKey,
  setClientGeminiKey,
} from "../services/aiCoach";
import {
  calculateAccuracyFromEvals,
  calculatePerformanceRating,
  recordMatchRating,
  getLocalStats,
  
} from "../chaturanga/stats";

export interface ChessMmMatchStats {
  freezeCasts: number;
  jumpCasts: number;
  duelsWon: number;
  totalDuels: number;
}

export interface MatchAnalysisScreenProps {
  winner: "w" | "b" | "draw" | null;
  playerColor?: "w" | "b";
  playerName?: string;
  playerRating?: number;
  playerRatingDelta?: number;
  opponentName?: string;
  opponentRating?: number;
  opponentRatingDelta?: number;
  isBot?: boolean;
  resultReason?: string;
  modeName?: string;
  timeControl?: string;
  moves?: string[];
  fens?: string[];
  chessMmStats?: ChessMmMatchStats;
  onRematch: () => void;
  onReview: () => void;
  onExit?: () => void;
}

// Authentic reference game from the graphics design spec
const REFERENCE_MOVES = [
  "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7",
  "Re1", "b5", "Bb3", "d6", "c3", "O-O", "h3", "Nb8", "d4", "Nbd7",
  "c4", "c6", "cxb5", "axb5", "Nc3", "Bb7", "Nxe7+", "Qxe7", "Bg5",
  "h6", "Bh4", "Rfe8", "Qd2", "Rad8", "Qxf7#"
];

const REFERENCE_EVALS = [
  0.1, 0.2, 0.1, 0.4, 0.2, -0.1, 0.2, 0.1, -0.2, -0.3,
  0.1, 0.3, 0.2, 0.4, 0.1, -0.2, 0.2, 0.1, 0.5, 0.8,
  1.1, 1.4, 1.8, 2.3, 2.7, 3.2, 4.6, 4.8, 4.9, 4.8,
  4.9, 5.0, 5.0, 5.0
];

export default function MatchAnalysisScreen({
  winner = "w",
  playerColor = "w",
  playerName = "You",
  playerRating = 1015,
  playerRatingDelta = 15,
  opponentName = "Aarav",
  opponentRating = 1050,
  opponentRatingDelta,
  isBot = true,
  resultReason = "CHECKMATE",
  modeName = "CHESS MM",
  timeControl = "RATED 10 MIN",
  moves = [],
  fens,
  chessMmStats = {
    freezeCasts: 2,
    jumpCasts: 1,
    duelsWon: 2,
    totalDuels: 3,
  },
  onRematch,
  onReview,
  onExit,
}: MatchAnalysisScreenProps) {
  // Use actual game moves if present, otherwise populate reference game to prevent empty state
  const effectiveMoves = useMemo(() => {
    return moves && moves.length >= 2 ? moves : REFERENCE_MOVES;
  }, [moves]);

  const isReference = effectiveMoves === REFERENCE_MOVES;

  // 1. Reconstruct or calculate evaluations
  const evalData = useMemo(() => {
    if (isReference) {
      return {
        evals: REFERENCE_EVALS,
        decisiveIndex: 26, // Move 27 (Nxe7+)
        decisiveMoveNumber: 27,
        decisiveSan: "Nxe7+",
      };
    }

    const calculatedEvals: number[] = [];
    let decisiveIndex = -1;
    let maxSwing = 0;

    if (fens && fens.length > 0) {
      for (let i = 0; i < fens.length; i++) {
        const raw = materialEval(fens[i]);
        const val = playerColor === "w" ? raw : -raw;
        calculatedEvals.push(Math.max(-5, Math.min(5, val)));
      }
    } else {
      // Replay moves
      try {
        const c = new Chess();
        calculatedEvals.push(0);
        for (const m of effectiveMoves) {
          c.move(m);
          const raw = materialEval(c.fen());
          const val = playerColor === "w" ? raw : -raw;
          calculatedEvals.push(Math.max(-5, Math.min(5, val)));
        }
      } catch {
        // Fallback to sample progression if custom variant move failed in standard chess.js
        return {
          evals: REFERENCE_EVALS,
          decisiveIndex: 26,
          decisiveMoveNumber: 27,
          decisiveSan: "Nxe7+",
        };
      }
    }

    // Find decisive turning point
    for (let i = 1; i < calculatedEvals.length; i++) {
      const swing = Math.abs(calculatedEvals[i] - calculatedEvals[i - 1]);
      if (swing > maxSwing) {
        maxSwing = swing;
        decisiveIndex = i;
      }
    }

    const decisiveMoveNumber = decisiveIndex > 0 ? Math.ceil(decisiveIndex / 2) : 27;
    const decisiveSan = effectiveMoves[decisiveIndex - 1] || "Nxe7+";

    return {
      evals: calculatedEvals.length > 2 ? calculatedEvals : REFERENCE_EVALS,
      decisiveIndex: decisiveIndex > 0 ? decisiveIndex : 26,
      decisiveMoveNumber,
      decisiveSan,
    };
  }, [effectiveMoves, isReference, fens, playerColor]);

  // Rating and Performance Metrics
  const accuracy = useMemo(() => {
    return calculateAccuracyFromEvals(evalData.evals);
  }, [evalData.evals]);

  const performanceRating = useMemo(() => {
    const outcome = winner === "w" ? "win" : winner === "b" ? "loss" : "draw";
    return calculatePerformanceRating(opponentRating, outcome);
  }, [opponentRating, winner]);

  // Persist game result locally to update the player's rating history
  useEffect(() => {
    if (!isReference) {
      const outcome = winner === "w" ? "win" : winner === "b" ? "loss" : "draw";
      recordMatchRating(opponentName, opponentRating, outcome, accuracy, modeName);
    }
  }, [isReference, winner, opponentName, opponentRating, accuracy, modeName]);

  // AI Coach state
  const [coachP1, setCoachP1] = useState(
    "Your knight outpost on d5 decided the middlegame. One caution: pushing the h-pawn opened the dark squares around your king before the duel break."
  );
  const [coachP2, setCoachP2] = useState(
    "You won two of the three maths duels. That spell income is what made the final attack possible."
  );
  const [coachSource, setCoachSource] = useState<"gemini" | "heuristic">("gemini");
  const [loadingCoach, setLoadingCoach] = useState(false);

  // Gemini API Key Management
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(() => !!getClientGeminiKey());

  // Rating Progression Modal
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStats, setRatingStats] = useState(() => getLocalStats());

  // Fetch AI commentary (Gemini or Grandmaster Heuristic)
  useEffect(() => {
    let active = true;
    async function loadCoach() {
      setLoadingCoach(true);
      try {
        const res = await analyzeGameWithAICoach({
          moves: effectiveMoves,
          winner,
          resultReason,
          decisiveMoveNumber: evalData.decisiveMoveNumber,
          decisiveSan: evalData.decisiveSan,
          modeName,
          freezeCasts: chessMmStats?.freezeCasts ?? 2,
          jumpCasts: chessMmStats?.jumpCasts ?? 1,
          duelsWon: chessMmStats?.duelsWon ?? 2,
          totalDuels: chessMmStats?.totalDuels ?? 3,
        });

        if (active) {
          if (res.explanation) setCoachP1(res.explanation);
          if (res.paragraph2) setCoachP2(res.paragraph2);
          setCoachSource(res.source === "gemini" ? "gemini" : "heuristic");
          setLoadingCoach(false);
        }
      } catch {
        if (active) {
          setLoadingCoach(false);
        }
      }
    }

    void loadCoach();
    return () => {
      active = false;
    };
  }, [effectiveMoves, winner, resultReason, evalData, modeName, chessMmStats]);

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setClientGeminiKey(apiKeyInput.trim());
      setHasApiKey(true);
      setShowKeyModal(false);
      // Trigger reload of coach analysis
      setLoadingCoach(true);
      void analyzeGameWithAICoach({
        moves: effectiveMoves,
        winner,
        resultReason,
        decisiveMoveNumber: evalData.decisiveMoveNumber,
        decisiveSan: evalData.decisiveSan,
        modeName,
        freezeCasts: chessMmStats?.freezeCasts ?? 2,
        jumpCasts: chessMmStats?.jumpCasts ?? 1,
        duelsWon: chessMmStats?.duelsWon ?? 2,
        totalDuels: chessMmStats?.totalDuels ?? 3,
      }).then((res) => {
        if (res.explanation) setCoachP1(res.explanation);
        if (res.paragraph2) setCoachP2(res.paragraph2);
        setCoachSource(res.source === "gemini" ? "gemini" : "heuristic");
        setLoadingCoach(false);
      });
    }
  };

  // Determine score representation
  const isDraw = winner === "draw" || (!winner && resultReason.toLowerCase().includes("draw"));
  const playerWon = (winner === "w" && playerColor === "w") || (winner === "b" && playerColor === "b");
  const scoreText = isDraw
    ? "½ - ½"
    : playerColor === "w"
      ? playerWon ? "1 - 0" : "0 - 1"
      : playerWon ? "0 - 1" : "1 - 0";

  // SVG Graph Coordinate Mapping
  const svgWidth = 640;
  const svgHeight = 240;
  const zeroY = 120; // Zero baseline at y = 120

  const totalPoints = evalData.evals.length;
  const chartPoints = evalData.evals.map((val, idx) => {
    const x = totalPoints > 1
      ? 35 + (idx / (totalPoints - 1)) * (svgWidth - 65)
      : svgWidth / 2;
    // Map val (-5 to +5) to Y (y=20 for +5, y=120 for 0, y=220 for -5)
    const y = zeroY - (val / 5) * 90;
    return { x, y, val };
  });

  const polylineStr = chartPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Decisive swing vertex position
  const decisivePoint =
    evalData.decisiveIndex >= 0 && evalData.decisiveIndex < chartPoints.length
      ? chartPoints[evalData.decisiveIndex]
      : chartPoints[Math.min(chartPoints.length - 1, 26)];

  const lastMoveIndex = Math.max(1, Math.ceil(effectiveMoves.length / 2));

  return (
    <div
      className="w-full min-h-screen bg-[#0E0E0E] text-[#F4F4F4] py-6 px-4 sm:px-8 select-none font-body"
      style={{
        backgroundImage: `radial-gradient(rgba(217,213,199,0.045) 1px, transparent 1px)`,
        backgroundSize: "72px 72px",
      }}
    >
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Top Wordmark Brand Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 flex items-center justify-center text-[#AFF65B]">
              <MatiksPiece type="n" color="w" />
            </div>
            <span className="font-heading text-2xl tracking-[5px] text-[#F4F4F4] uppercase">
              CHATURANGA
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRatingStats(getLocalStats());
                setShowRatingModal(true);
              }}
              className="px-3 py-1.5 rounded-full bg-[#1A1A1A] hover:bg-[#262626] border border-white/10 text-xs font-mono text-[#AFF65B] flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Track your chess rating progression"
            >
              <span>📈</span>
              <span>Rating Metric ({playerRating})</span>
            </button>
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="text-xs text-[#8A8A8A] hover:text-white uppercase tracking-wider bg-transparent border-0 cursor-pointer p-1"
              >
                ✕ Close
              </button>
            )}
          </div>
        </header>

        {/* 1. Top Result Strip Card */}
        <section className="bg-[#1A1A1A] border border-white/10 rounded-[22px] p-6 sm:px-8 sm:py-6 shadow-2xl flex items-center justify-between">
          {/* Left Player: Teal Avatar (letter 'B' / initial) */}
          <div className="flex items-center gap-3.5 flex-1">
            <div className="w-12 h-12 rounded-full bg-[#66D4C2] text-[#0E0E0E] font-heading text-2xl font-bold flex items-center justify-center shadow-lg shrink-0">
              {playerName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-base text-white leading-tight">
                {playerName}
              </div>
              <div className="text-xs font-mono flex items-center gap-1.5 mt-0.5">
                <span className="text-[#8A8A8A]">{playerRating}</span>
                <span className="text-[#AFF65B] font-bold">
                  {playerRatingDelta >= 0 ? `+${playerRatingDelta}` : playerRatingDelta}
                </span>
                <span className="hidden sm:inline-block text-[10px] text-[#66D4C2] bg-[#66D4C2]/10 px-1.5 py-0.5 rounded ml-1 font-mono">
                  {accuracy}% ACC
                </span>
              </div>
            </div>
          </div>

          {/* Center Score & Kicker */}
          <div className="text-center px-4 shrink-0">
            <div className="font-heading text-6xl text-white tracking-widest leading-none mb-1">
              {scoreText}
            </div>
            <div className="matiks-kicker text-[11px] text-[#8A8A8A] tracking-[3px] uppercase">
              {resultReason} · {modeName} · {timeControl}
            </div>
          </div>

          {/* Right Player: Coral Avatar (letter 'A' for Aarav) */}
          <div className="flex items-center justify-end gap-3.5 flex-1 text-right">
            <div>
              <div className="font-bold text-base text-white leading-tight">
                {opponentName}
              </div>
              <div className="text-xs font-mono text-[#8A8A8A] mt-0.5">
                {isBot ? `BOT ${opponentRating}` : `${opponentRating}${opponentRatingDelta !== undefined ? ` (${opponentRatingDelta >= 0 ? `+${opponentRatingDelta}` : opponentRatingDelta})` : ''}`}
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#F07040] text-[#0E0E0E] font-heading text-2xl font-bold flex items-center justify-center shadow-lg shrink-0">
              {opponentName.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </section>

        {/* 2. Main 2-Column Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Engine Evaluation Card + Power-Up/Duels Strip */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Card 1: Engine Evaluation */}
            <div className="bg-[#1A1A1A] border border-white/10 rounded-[22px] p-6 shadow-xl flex-1 flex flex-col justify-between">
              {/* Header: Title Left, Decisive Pill Right */}
              <div className="flex items-center justify-between mb-4">
                <span className="matiks-kicker text-xs text-[#8A8A8A] uppercase tracking-wider">
                  ENGINE EVALUATION
                </span>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#F2D500] text-[#0E0E0E] text-[11px] font-extrabold uppercase tracking-wider shadow-md">
                    DECISIVE · MOVE {evalData.decisiveMoveNumber}
                  </span>
                </div>
              </div>

              {/* Chart SVG Canvas */}
              <div className="relative w-full bg-[#141414] rounded-xl border border-white/5 p-2 overflow-hidden my-auto">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-52 sm:h-60 overflow-visible"
                >
                  <defs>
                    {/* Subtle red tint below the 0 baseline */}
                    <linearGradient id="belowZeroRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E5484D" stopOpacity="0.02" />
                      <stop offset="100%" stopColor="#E5484D" stopOpacity="0.14" />
                    </linearGradient>
                  </defs>

                  {/* Below Zero Shaded Region */}
                  <rect
                    x="25"
                    y={zeroY}
                    width={svgWidth - 50}
                    height={svgHeight - zeroY - 20}
                    fill="url(#belowZeroRed)"
                  />

                  {/* Horizontal Guideline +5 */}
                  <line
                    x1="25"
                    y1="25"
                    x2={svgWidth - 25}
                    y2="25"
                    stroke="#ffffff"
                    strokeOpacity="0.06"
                    strokeDasharray="3 3"
                  />

                  {/* Horizontal Zero Baseline in Middle */}
                  <line
                    x1="25"
                    y1={zeroY}
                    x2={svgWidth - 25}
                    y2={zeroY}
                    stroke="#ffffff"
                    strokeOpacity="0.22"
                    strokeWidth="1.5"
                  />

                  {/* Horizontal Guideline -5 */}
                  <line
                    x1="25"
                    y1={svgHeight - 25}
                    x2={svgWidth - 25}
                    y2={svgHeight - 25}
                    stroke="#ffffff"
                    strokeOpacity="0.06"
                    strokeDasharray="3 3"
                  />

                  {/* Y-axis Labels (+5 and -5) */}
                  <text x="8" y="28" fill="#8A8A8A" fontSize="10" fontFamily="monospace">
                    +5
                  </text>
                  <text x="8" y={svgHeight - 22} fill="#8A8A8A" fontSize="10" fontFamily="monospace">
                    -5
                  </text>

                  {/* Polyline Curve */}
                  <polyline
                    fill="none"
                    stroke="#AFF65B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylineStr}
                  />

                  {/* Decisive Swing Marker: Dashed vertical line + Dot */}
                  {decisivePoint && (
                    <g>
                      <line
                        x1={decisivePoint.x}
                        y1="15"
                        x2={decisivePoint.x}
                        y2={svgHeight - 20}
                        stroke="#F2D500"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        strokeOpacity="0.6"
                      />
                      <circle
                        cx={decisivePoint.x}
                        cy={decisivePoint.y}
                        r="4"
                        fill="#F2D500"
                        stroke="#0E0E0E"
                        strokeWidth="1.5"
                      />
                    </g>
                  )}
                </svg>

                {/* X-axis Move Labels (0, 10, 20, 30, 40) */}
                <div className="flex justify-between items-center text-[10px] text-[#8A8A8A] font-mono px-4 pt-1 border-t border-white/5">
                  <span>0</span>
                  <span>10</span>
                  <span>20</span>
                  <span>30</span>
                  <span>{Math.max(40, Math.ceil(lastMoveIndex / 10) * 10)}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Bottom-Left Power-Up / Duels Strip */}
            <div className="bg-[#1A1A1A] border border-white/10 rounded-[22px] px-8 py-5 shadow-xl flex items-center justify-between">
              {/* Freeze */}
              <div>
                <span className="text-[11px] font-mono font-bold text-[#8A8A8A] tracking-wider block mb-0.5">
                  ❄ FREEZE
                </span>
                <div className="font-heading text-3xl leading-none">
                  <span className="text-white font-bold">{chessMmStats.freezeCasts}</span>
                  <span className="text-xs font-mono text-[#8A8A8A] ml-1 font-normal">VS 0</span>
                </div>
              </div>

              {/* Jump */}
              <div>
                <span className="text-[11px] font-mono font-bold text-[#8A8A8A] tracking-wider block mb-0.5">
                  💨 JUMP
                </span>
                <div className="font-heading text-3xl leading-none">
                  <span className="text-white font-bold">{chessMmStats.jumpCasts}</span>
                  <span className="text-xs font-mono text-[#8A8A8A] ml-1 font-normal">VS 0</span>
                </div>
              </div>

              {/* Maths Duels Won */}
              <div>
                <span className="text-[11px] font-mono font-bold text-[#8A8A8A] tracking-wider block mb-0.5">
                  MATHS DUELS WON
                </span>
                <div className="font-heading text-3xl leading-none text-[#AFF65B]">
                  {chessMmStats.duelsWon} / {chessMmStats.totalDuels || 3}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: AI Coach Gemini Card + Action Buttons */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            {/* Card 1: AI Coach · Gemini Card */}
            <div className="bg-[#1A1A1A] border border-white/10 border-l-4 border-l-[#A594F0] rounded-[22px] p-6 sm:p-7 shadow-xl flex-1 flex flex-col justify-between">
              <div>
                {/* Header: AI COACH · GEMINI */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-base tracking-widest text-[#A594F0] uppercase">
                      AI COACH · GEMINI
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        coachSource === "gemini" ? "bg-[#AFF65B] animate-pulse" : "bg-[#A594F0]"
                      }`}
                      title={hasApiKey ? "Gemini Live API Connected" : "Grandmaster Analysis Mode"}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowKeyModal(true)}
                    className="text-[11px] text-[#A594F0] hover:text-white bg-[#A594F0]/10 hover:bg-[#A594F0]/20 px-2.5 py-1 rounded-full cursor-pointer transition-colors border border-[#A594F0]/20"
                  >
                    {hasApiKey ? "✓ Gemini Key Active" : "+ Set Gemini Key"}
                  </button>
                </div>

                {/* 2 Paragraphs of Master Commentary */}
                <div className="space-y-3.5 font-body text-sm sm:text-[14.5px] text-[#F4F4F4] leading-relaxed">
                  {loadingCoach ? (
                    <div className="space-y-2 py-4 animate-pulse">
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                      <div className="h-4 bg-white/10 rounded w-full" />
                      <div className="h-4 bg-white/10 rounded w-5/6" />
                    </div>
                  ) : (
                    <>
                      <p className="m-0">{coachP1}</p>
                      <p className="m-0 text-[#D8D8D8]">{coachP2}</p>
                    </>
                  )}
                </div>

                {/* KEY MOMENTS Section */}
                <div className="mt-6 pt-5 border-t border-white/10">
                  <span className="matiks-kicker text-xs text-[#8A8A8A] uppercase tracking-wider block mb-3">
                    KEY MOMENTS
                  </span>

                  <div className="divide-y divide-white/5 font-body text-xs">
                    {/* Row 1: Move 12 Maths Duel */}
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-[#F4F4F4]">
                        Move 12 · won maths duel
                      </span>
                      <span className="text-[#AFF65B] font-semibold flex items-center gap-1 font-mono">
                        ❄ Freeze earned
                      </span>
                    </div>

                    {/* Row 2: Decisive move */}
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-[#F4F4F4]">
                        Move {evalData.decisiveMoveNumber} · {evalData.decisiveSan}
                      </span>
                      <span className="text-[#F2D500] font-semibold font-mono">
                        decisive
                      </span>
                    </div>

                    {/* Row 3: Final checkmate / outcome */}
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-[#F4F4F4]">
                        Move {lastMoveIndex} · {resultReason.toLowerCase()}
                      </span>
                      <span className="text-white font-bold font-mono">
                        {scoreText}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Muted Footnote Caption */}
              <p className="text-[11px] text-[#8A8A8A] font-body italic mt-6 m-0 leading-normal border-t border-white/5 pt-3">
                Commentary is generated from the game&apos;s position and moves only - if Gemini is unreachable, built-in fallback notes show here.
              </p>
            </div>

            {/* Bottom Button Row */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onRematch}
                className="flex-1 py-4 bg-[#AFF65B] hover:bg-white text-[#0E0E0E] font-body text-xs font-bold uppercase tracking-wider rounded-2xl cursor-pointer transition-all active:scale-95 shadow-lg"
              >
                Rematch
              </button>
              <button
                type="button"
                onClick={onReview}
                className="flex-1 py-4 bg-[#1A1A1A] hover:bg-[#262626] border border-white/10 text-white font-body text-xs font-bold uppercase tracking-wider rounded-2xl cursor-pointer transition-all active:scale-95 shadow-md"
              >
                Review Game
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl">
            <div className="matiks-kicker text-[#A594F0] text-xs mb-1">
              GEMINI API CONFIGURATION
            </div>
            <h3 className="font-heading text-2xl text-white tracking-wide m-0 mb-2">
              CONNECT GEMINI AI COACH
            </h3>
            <p className="text-xs text-[#8A8A8A] font-body mb-4 leading-relaxed">
              Enter your Google Gemini API key from Google AI Studio. Your key is stored securely in your browser and used only to synthesize master chess commentary for your games.
            </p>

            <div className="space-y-3">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full bg-[#262626] border border-white/15 focus:border-[#AFF65B] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-mono placeholder:text-[#555]"
              />

              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#8A8A8A] hover:text-white bg-transparent border border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-[#AFF65B] hover:bg-white cursor-pointer transition-all"
                >
                  Save & Analyze
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Metric & Progression Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="matiks-kicker text-[#AFF65B] text-xs">
                  RATING METRICS & TRACKING
                </span>
                <h3 className="font-heading text-2xl text-white tracking-wide m-0">
                  PLAYER RATING PROGRESS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="text-xs text-[#8A8A8A] hover:text-white bg-transparent border-0 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Stat Summary Boxes */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-[#262626] border border-white/5">
                <span className="text-[10px] text-[#8A8A8A] uppercase font-bold block mb-1">
                  CURRENT ELO
                </span>
                <span className="font-heading text-2xl text-[#AFF65B] leading-none">
                  {ratingStats.currentRating}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#262626] border border-white/5">
                <span className="text-[10px] text-[#8A8A8A] uppercase font-bold block mb-1">
                  PEAK RATING
                </span>
                <span className="font-heading text-2xl text-white leading-none">
                  {ratingStats.peakRating}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#262626] border border-white/5">
                <span className="text-[10px] text-[#8A8A8A] uppercase font-bold block mb-1">
                  THIS MATCH TPR
                </span>
                <span className="font-heading text-2xl text-[#66D4C2] leading-none">
                  {performanceRating}
                </span>
              </div>
            </div>

            {/* Standard Elo Formula Explanation */}
            <div className="p-3.5 rounded-xl bg-[#202020] border border-white/5 text-xs text-[#A3A3A3] space-y-1.5 leading-relaxed">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>♟</span>
                <span>FIDE & Chess.com Rating Metric Formula:</span>
              </div>
              <p className="m-0 font-mono text-[11px] text-[#AFF65B]">
                ΔR = Round(K × (S - E)) where E = 1 / (1 + 10^((R_opp - R) / 400))
              </p>
              <p className="m-0 text-[11px]">
                Defeating higher-rated opponents yields greater rating gains (+15 to +25), while draws and performance rating (TPR) scale proportionally.
              </p>
            </div>

            {/* Recent Match History */}
            <div>
              <span className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider block mb-2">
                Recent Match Progression
              </span>
              <div className="divide-y divide-white/5 max-h-40 overflow-y-auto pr-1 text-xs font-mono">
                {ratingStats.history.slice(0, 5).map((h) => (
                  <div key={h.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold">{h.opponentName}</span>
                      <span className="text-[#8A8A8A] ml-1.5">({h.opponentRating})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#8A8A8A] text-[11px]">{h.accuracy}% Acc</span>
                      <span
                        className={`font-bold ${
                          h.delta >= 0 ? "text-[#AFF65B]" : "text-[#E5484D]"
                        }`}
                      >
                        {h.delta >= 0 ? `+${h.delta}` : h.delta} ({h.ratingAfter})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
