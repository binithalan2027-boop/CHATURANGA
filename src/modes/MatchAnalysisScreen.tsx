import { useState, useEffect, useMemo } from "react";
import { Chess } from "chess.js";
import { materialEval } from "../chaturanga/study";
import { positionNotes } from "../chaturanga/positionNotes";
import { explainWithAICoach } from "../services/aiCoach";

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

export default function MatchAnalysisScreen({
  winner,
  playerColor = "w",
  playerName = "You",
  playerRating = 1200,
  playerRatingDelta,
  opponentName = "Aarav",
  opponentRating = 1050,
  opponentRatingDelta,
  isBot = true,
  resultReason = "CHECKMATE",
  modeName = "STANDARD CHESS",
  timeControl = "10 MIN",
  moves = [],
  fens,
  chessMmStats,
  onRematch,
  onReview,
  onExit,
}: MatchAnalysisScreenProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "statistics" | "coach">("overview");
  const [coachText, setCoachText] = useState<string>("");
  const [coachSource, setCoachSource] = useState<"gemini" | "heuristic">("heuristic");
  const [loadingCoach, setLoadingCoach] = useState(true);

  // 1. Reconstruct FEN history if not provided directly
  const gameFens = useMemo(() => {
    if (fens && fens.length > 0) return fens;
    const list: string[] = [];
    try {
      const c = new Chess();
      list.push(c.fen());
      for (const m of moves) {
        c.move(m);
        list.push(c.fen());
      }
    } catch {
      // fallback
    }
    return list;
  }, [fens, moves]);

  // 2. Compute evaluation curve (Stockfish pawns or material balance)
  const evalData = useMemo(() => {
    if (gameFens.length <= 1) {
      // If no moves played, return neutral baseline
      return { evals: [0], decisiveIndex: -1, maxSwing: 0 };
    }

    const evals = gameFens.map((fen) => {
      const raw = materialEval(fen);
      // Perspective: positive means advantage for playerColor
      const perspective = playerColor === "w" ? raw : -raw;
      // Clamp between -5 and +5 pawns
      return Math.max(-5, Math.min(5, perspective));
    });

    let maxSwing = 0;
    let decisiveIndex = -1;
    for (let i = 1; i < evals.length; i++) {
      const swing = Math.abs(evals[i] - evals[i - 1]);
      if (swing > maxSwing) {
        maxSwing = swing;
        decisiveIndex = i;
      }
    }

    return { evals, decisiveIndex, maxSwing };
  }, [gameFens, playerColor]);

  // 3. Request Gemini AI Coach commentary (falls back to positionNotes)
  useEffect(() => {
    let active = true;
    async function loadCoach() {
      setLoadingCoach(true);
      const lastFen = gameFens[gameFens.length - 1] || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const prevFen = gameFens.length > 1 ? gameFens[gameFens.length - 2] : undefined;
      const lastSan = moves.length > 0 ? moves[moves.length - 1] : undefined;

      try {
        const res = await explainWithAICoach({
          fen: lastFen,
          previousFen: prevFen,
          san: lastSan,
        });

        if (active) {
          if (res.available && res.source === "gemini") {
            setCoachText(res.explanation);
            setCoachSource("gemini");
          } else {
            // Heuristic fallback
            const notes = positionNotes(lastFen, prevFen, lastSan);
            setCoachText(
              notes.length > 0
                ? notes.slice(0, 2).join(" ")
                : "A well-contested game with decisive tactical moments in the middlegame."
            );
            setCoachSource("heuristic");
          }
          setLoadingCoach(false);
        }
      } catch {
        if (active) {
          const notes = positionNotes(lastFen, prevFen, lastSan);
          setCoachText(
            notes.length > 0
              ? notes.slice(0, 2).join(" ")
              : "Review key piece activations and pawn structure in the middlegame."
          );
          setCoachSource("heuristic");
          setLoadingCoach(false);
        }
      }
    }

    void loadCoach();
    return () => {
      active = false;
    };
  }, [gameFens, moves]);

  // Determine score representation
  const isDraw = winner === "draw" || (!winner && resultReason.toLowerCase().includes("draw"));
  const playerWon = (winner === "w" && playerColor === "w") || (winner === "b" && playerColor === "b");

  const scoreText = isDraw
    ? "½ - ½"
    : playerColor === "w"
      ? playerWon ? "1 - 0" : "0 - 1"
      : playerWon ? "0 - 1" : "1 - 0";

  // SVG Graph parameters
  const svgWidth = 680;
  const svgHeight = 200;
  const zeroY = svgHeight / 2; // y = 100 is 0 pawns
  const points = evalData.evals.map((val, idx) => {
    const x = evalData.evals.length > 1
      ? (idx / (evalData.evals.length - 1)) * (svgWidth - 60) + 30
      : svgWidth / 2;
    // val ranges from -5 to +5. Top is +5 (y = 20), bottom is -5 (y = 180)
    const y = zeroY - (val / 5) * 80;
    return { x, y, val };
  });

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Decisive move calculation
  const decisivePoint =
    evalData.decisiveIndex > 0 && evalData.maxSwing >= 0.6
      ? points[evalData.decisiveIndex]
      : null;
  const decisiveMoveNumber = decisivePoint
    ? Math.ceil(evalData.decisiveIndex / 2)
    : null;

  return (
    <div
      className="w-full min-h-screen bg-[#0E0E0E] text-[#F4F4F4] py-8 px-4 sm:px-6 lg:px-8 select-none"
      style={{
        backgroundImage: `radial-gradient(rgba(217,213,199,0.045) 1px, transparent 1px)`,
        backgroundSize: "72px 72px",
      }}
    >
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* Navigation / Back header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onExit || onReview}
            className="flex items-center gap-1.5 text-xs text-[#8A8A8A] hover:text-[#AFF65B] font-body uppercase tracking-wider bg-transparent border-0 cursor-pointer p-0"
          >
            ← Back to Board
          </button>
          <span className="matiks-kicker text-[#AFF65B] text-xs">
            GAME REPORT & ANALYSIS
          </span>
        </div>

        {/* 1. Result Strip Card */}
        <section className="bg-[#1A1A1A] border border-white/10 rounded-[22px] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Result Kicker */}
          <div className="text-center mb-5">
            <span className="matiks-kicker text-xs tracking-widest text-[#AFF65B] uppercase block">
              {resultReason} · {modeName} · {timeControl}
            </span>
          </div>

          {/* Players + Big Bebas Score */}
          <div className="flex items-center justify-between gap-4">
            {/* Player 1 (User: Teal Avatar) */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-full bg-[#66D4C2] text-[#0E0E0E] font-heading text-xl font-bold flex items-center justify-center shadow-lg shrink-0">
                {playerName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-base text-white truncate">{playerName}</div>
                <div className="text-xs font-mono flex items-center gap-1.5">
                  <span className="text-[#8A8A8A]">{playerRating}</span>
                  {playerRatingDelta !== undefined && (
                    <span
                      className={`font-bold ${
                        playerRatingDelta >= 0 ? "text-[#AFF65B]" : "text-[#E5484D]"
                      }`}
                    >
                      {playerRatingDelta >= 0 ? `+${playerRatingDelta}` : playerRatingDelta}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Score */}
            <div className="font-heading text-5xl sm:text-6xl text-white tracking-wider shrink-0 px-2">
              {scoreText}
            </div>

            {/* Player 2 (Opponent: Coral Avatar) */}
            <div className="flex items-center justify-end gap-3 flex-1 text-right">
              <div className="min-w-0">
                <div className="font-bold text-base text-white truncate">{opponentName}</div>
                <div className="text-xs font-mono flex items-center justify-end gap-1.5">
                  {isBot ? (
                    <span className="text-[#8A8A8A] uppercase font-bold">BOT {opponentRating}</span>
                  ) : (
                    <>
                      <span className="text-[#8A8A8A]">{opponentRating}</span>
                      {opponentRatingDelta !== undefined && (
                        <span
                          className={`font-bold ${
                            opponentRatingDelta >= 0 ? "text-[#AFF65B]" : "text-[#E5484D]"
                          }`}
                        >
                          {opponentRatingDelta >= 0 ? `+${opponentRatingDelta}` : opponentRatingDelta}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#F07040] text-[#0E0E0E] font-heading text-xl font-bold flex items-center justify-center shadow-lg shrink-0">
                {opponentName.slice(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </section>

        {/* 2. Tabs Row */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-1">
          {(["overview", "statistics", "coach"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 rounded-t-xl font-body text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
                activeTab === tab
                  ? "border-[#AFF65B] text-[#AFF65B] bg-[#1A1A1A]/60"
                  : "border-transparent text-[#8A8A8A] hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content: OVERVIEW (primary spec view) */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 3. Engine Evaluation Graph Card */}
            <section className="bg-[#1A1A1A] border border-white/10 rounded-[22px] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="matiks-kicker text-[#AFF65B] text-[11px]">
                    ENGINE EVALUATION
                  </div>
                  <h3 className="font-heading text-xl text-white tracking-wide m-0">
                    MOVE-BY-MOVE ADVANTAGE
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-[#AFF65B]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#AFF65B]" />
                    {playerName} (+adv)
                  </span>
                  <span className="flex items-center gap-1.5 text-[#E5484D]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E5484D]" />
                    {opponentName}
                  </span>
                </div>
              </div>

              {/* Responsive SVG Polyline Chart */}
              <div className="relative w-full bg-[#141414] rounded-xl border border-white/5 p-2 overflow-hidden">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-44 sm:h-52 overflow-visible"
                >
                  <defs>
                    {/* Upper region gradient (Player advantage) */}
                    <linearGradient id="eval-green-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#AFF65B" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#AFF65B" stopOpacity="0.0" />
                    </linearGradient>
                    {/* Lower region gradient (Opponent advantage) */}
                    <linearGradient id="eval-red-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E5484D" stopOpacity="0.0" />
                      <stop offset="100%" stopColor="#E5484D" stopOpacity="0.18" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {/* +5.0 top line */}
                  <line
                    x1="25"
                    y1="20"
                    x2={svgWidth - 25}
                    y2="20"
                    stroke="#ffffff"
                    strokeOpacity="0.06"
                    strokeDasharray="3 3"
                  />
                  {/* Zero Baseline (in the middle: above zero = you are better) */}
                  <line
                    x1="25"
                    y1={zeroY}
                    x2={svgWidth - 25}
                    y2={zeroY}
                    stroke="#ffffff"
                    strokeOpacity="0.25"
                    strokeWidth="1.5"
                  />
                  {/* -5.0 bottom line */}
                  <line
                    x1="25"
                    y1={svgHeight - 20}
                    x2={svgWidth - 25}
                    y2={svgHeight - 20}
                    stroke="#ffffff"
                    strokeOpacity="0.06"
                    strokeDasharray="3 3"
                  />

                  {/* Axis labels */}
                  <text x="6" y="24" fill="#8A8A8A" fontSize="10" fontFamily="monospace">
                    +5
                  </text>
                  <text x="12" y={zeroY + 3} fill="#8A8A8A" fontSize="10" fontFamily="monospace">
                    0
                  </text>
                  <text x="6" y={svgHeight - 16} fill="#8A8A8A" fontSize="10" fontFamily="monospace">
                    -5
                  </text>

                  {/* Polyline Curve */}
                  {points.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#AFF65B"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={polylinePoints}
                    />
                  )}

                  {/* Decisive Swing Marker (yellow vertical dashed line + pill) */}
                  {decisivePoint && decisiveMoveNumber && (
                    <g>
                      <line
                        x1={decisivePoint.x}
                        y1="10"
                        x2={decisivePoint.x}
                        y2={svgHeight - 10}
                        stroke="#F2D500"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                      />
                      {/* Circle at decisive swing vertex */}
                      <circle
                        cx={decisivePoint.x}
                        cy={decisivePoint.y}
                        r="4.5"
                        fill="#F2D500"
                        stroke="#0E0E0E"
                        strokeWidth="1.5"
                      />
                    </g>
                  )}
                </svg>

                {/* Floating Decisive Pill if found */}
                {decisivePoint && decisiveMoveNumber && (
                  <div
                    className="absolute top-2 transform -translate-x-1/2 pointer-events-none"
                    style={{ left: `${(decisivePoint.x / svgWidth) * 100}%` }}
                  >
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F2D500] text-[#0E0E0E] text-[10px] font-extrabold uppercase tracking-wider shadow-md whitespace-nowrap">
                      DECISIVE · MOVE {decisiveMoveNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* Move counter caption */}
              <div className="flex justify-between items-center text-[11px] text-[#8A8A8A] font-mono mt-2 px-1">
                <span>Start</span>
                <span>Move {Math.max(1, Math.ceil(moves.length / 2))}</span>
              </div>
            </section>

            {/* 4. Chess MM Card (Only rendered for Chess MM mode) */}
            {chessMmStats && (
              <section className="bg-[#1A1A1A] border border-white/10 rounded-[22px] p-6 shadow-xl">
                <div className="matiks-kicker text-[#AFF65B] text-[11px] mb-1">
                  CHESS MM POWER-UP DECK
                </div>
                <h3 className="font-heading text-xl text-white tracking-wide m-0 mb-4">
                  SPELLCASTING & ARITHMETIC
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#262626] rounded-xl p-4 border border-white/5">
                    <span className="text-[10px] text-[#8A8A8A] uppercase font-bold tracking-wider block mb-1">
                      Freeze Spells Cast
                    </span>
                    <div className="font-heading text-3xl text-[#AFF65B] leading-none">
                      {chessMmStats.freezeCasts}
                    </div>
                  </div>

                  <div className="bg-[#262626] rounded-xl p-4 border border-white/5">
                    <span className="text-[10px] text-[#8A8A8A] uppercase font-bold tracking-wider block mb-1">
                      Jump Spells Cast
                    </span>
                    <div className="font-heading text-3xl text-[#66D4C2] leading-none">
                      {chessMmStats.jumpCasts}
                    </div>
                  </div>

                  <div className="bg-[#262626] rounded-xl p-4 border border-white/5">
                    <span className="text-[10px] text-[#8A8A8A] uppercase font-bold tracking-wider block mb-1">
                      Maths Duels Won
                    </span>
                    <div className="font-heading text-3xl text-white leading-none">
                      {chessMmStats.duelsWon}
                      <span className="text-sm text-[#8A8A8A] font-body ml-1">
                        / {chessMmStats.totalDuels || chessMmStats.duelsWon}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 5. AI Coach Card (Gemini with heuristic fallback) */}
            <section className="bg-[#1A1A1A] border border-white/10 border-l-4 border-l-[#A594F0] rounded-[22px] p-6 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-xs tracking-widest text-[#A594F0] uppercase">
                    AI COACH · GEMINI
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#A594F0]/15 text-[#A594F0] text-[10px] font-mono">
                    {coachSource === "gemini" ? "LIVE MODEL" : "BUILT-IN ANALYSIS"}
                  </span>
                </div>
              </div>

              {/* Coach commentary in plain English */}
              <div className="font-body text-sm sm:text-base text-[#F4F4F4] leading-relaxed my-3">
                {loadingCoach ? (
                  <span className="text-[#8A8A8A] italic">Synthesizing master commentary...</span>
                ) : (
                  coachText
                )}
              </div>

              {/* Key Moments for Desktop */}
              {moves.length >= 2 && (
                <div className="hidden sm:block mt-4 pt-4 border-t border-white/5">
                  <span className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider block mb-2">
                    Key Moments
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-[#262626] flex justify-between">
                      <span className="text-[#8A8A8A]">Opening:</span>
                      <span className="text-white font-bold">{moves[0]} {moves[1] || ""}</span>
                    </div>
                    {decisiveMoveNumber && (
                      <div className="p-2 rounded bg-[#262626] flex justify-between">
                        <span className="text-[#F2D500]">Decisive turn:</span>
                        <span className="text-[#F2D500] font-bold">Move {decisiveMoveNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Design Spec Required Caption */}
              <p className="text-[11px] text-[#8A8A8A] font-body italic mt-4 m-0 leading-normal">
                Commentary is generated from the game&apos;s position and moves only - if Gemini is unreachable, built-in fallback notes show here.
              </p>
            </section>
          </div>
        )}

        {/* Tab Content: STATISTICS */}
        {activeTab === "statistics" && (
          <div className="bg-[#1A1A1A] border border-white/10 rounded-[22px] p-6 shadow-xl space-y-4 font-body text-xs">
            <h3 className="font-heading text-xl text-white tracking-wide m-0">MATCH STATISTICS</h3>
            <div className="divide-y divide-white/5">
              <div className="py-2.5 flex justify-between">
                <span className="text-[#8A8A8A]">Total Plies</span>
                <span className="font-mono font-bold text-white">{moves.length} moves</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#8A8A8A]">Game Verdict</span>
                <span className="font-mono font-bold text-[#AFF65B]">{resultReason}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#8A8A8A]">Time Control</span>
                <span className="font-mono text-white">{timeControl}</span>
              </div>
              {decisiveMoveNumber && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#8A8A8A]">Turning Point</span>
                  <span className="font-mono font-bold text-[#F2D500]">Move {decisiveMoveNumber}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: COACH */}
        {activeTab === "coach" && (
          <div className="bg-[#1A1A1A] border border-white/10 border-l-4 border-l-[#A594F0] rounded-[22px] p-6 shadow-xl space-y-3 font-body">
            <span className="font-heading text-xs tracking-widest text-[#A594F0] uppercase">
              DEEP GRANDMASTER ADVICE
            </span>
            <p className="text-sm text-white leading-relaxed">
              {coachText || "Analyze pawn structures and open lines to strengthen tactical conversion in future matches."}
            </p>
            <p className="text-[11px] text-[#8A8A8A] italic">
              Powered by Google Gemini interactions API when GEMINI_API_KEY is available in server environment.
            </p>
          </div>
        )}

        {/* 6. Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onRematch}
            className="w-full sm:flex-1 py-3.5 bg-[#AFF65B] hover:bg-white text-black font-body text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-95 shadow-lg"
          >
            Rematch
          </button>
          <button
            type="button"
            onClick={onReview}
            className="w-full sm:flex-1 py-3.5 bg-[#262626] hover:bg-[#333] text-white font-body text-xs font-semibold uppercase tracking-wider rounded-xl border border-white/10 cursor-pointer transition-all active:scale-95"
          >
            Review Game
          </button>
        </div>
      </div>
    </div>
  );
}
