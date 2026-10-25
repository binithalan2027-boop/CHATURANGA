import { useState, useEffect, useRef } from "react";
import { Chess, Square } from "chess.js";
import {
  PUZZLES,
  isPuzzleMate,
  recordAttempt,
  emptyProgress,
  TrainingProgress,
} from "./training";
import {
  fetchLichessDailyPuzzle,
  parseUciMove,
  PreparedLichessPuzzle,
} from "./lichessPuzzles";
import PositionBoard from "./PositionBoard";
import { usePreferences } from "./preferences";

export default function TrainingPage({ onExit }: { onExit: () => void }) {
  const { prefs } = usePreferences();
  const startIndex = Math.max(
    0,
    PUZZLES.findIndex(
      (p) => p.id === localStorage.getItem("chaturanga-next-puzzle"),
    ),
  );
  const [index, setIndex] = useState(startIndex);
  const [fen, setFen] = useState(PUZZLES[startIndex].fen);
  const [selected, setSelected] = useState<Square | null>(null);
  const [notice, setNotice] = useState("");
  const [solved, setSolved] = useState(false);
  const [rush, setRush] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);

  // Lichess Daily Puzzle state
  const [lichessPuzzle, setLichessPuzzle] = useState<PreparedLichessPuzzle | null>(null);
  const [loadingLichess, setLoadingLichess] = useState(false);
  const [lichessError, setLichessError] = useState<string | null>(null);
  const [isLichessMode, setIsLichessMode] = useState(false);
  const [lichessStep, setLichessStep] = useState(0);
  const [isOpponentReplying, setIsOpponentReplying] = useState(false);

  const [progress, setProgress] = useState<TrainingProgress>(() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem("chaturanga-training-v1") || "null",
        ) || emptyProgress
      );
    } catch {
      return emptyProgress;
    }
  });

  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (nextTimer.current) clearTimeout(nextTimer.current);
    },
    [],
  );

  // Fetch Lichess daily puzzle on mount (uses cached data if visited today)
  useEffect(() => {
    let active = true;
    setLoadingLichess(true);
    fetchLichessDailyPuzzle(false).then((res) => {
      if (!active) return;
      if (res.puzzle) {
        setLichessPuzzle(res.puzzle);
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

  const handleRetryLichess = () => {
    setLoadingLichess(true);
    setLichessError(null);
    fetchLichessDailyPuzzle(true).then((res) => {
      if (res.puzzle) {
        setLichessPuzzle(res.puzzle);
        setLichessError(null);
      } else {
        setLichessError(res.error || "Could not load Lichess daily puzzle.");
      }
      setLoadingLichess(false);
    });
  };

  const c = new Chess(fen);
  const puzzle = PUZZLES[index];
  const legal = selected
    ? c.moves({ square: selected, verbose: true }).map((m) => m.to)
    : [];

  useEffect(() => {
    localStorage.setItem("chaturanga-training-v1", JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (rush && (now >= deadline || strikes >= 3)) {
      setRush(false);
      setNotice(
        `Sprint complete: ${score} solves. Outstanding effort!`,
      );
      setProgress((p) => ({ ...p, bestRush: Math.max(p.bestRush, score) }));
    }
  }, [now, deadline, strikes, rush, score]);

  const choose = (i: number) => {
    if (nextTimer.current) {
      clearTimeout(nextTimer.current);
      nextTimer.current = null;
    }
    setIsLichessMode(false);
    setIndex(i);
    setFen(PUZZLES[i].fen);
    setSelected(null);
    setSolved(false);
    setNotice("");
  };

  const playLichess = () => {
    if (!lichessPuzzle) return;
    if (nextTimer.current) {
      clearTimeout(nextTimer.current);
      nextTimer.current = null;
    }
    setRush(false);
    setIsLichessMode(true);
    setFen(lichessPuzzle.setupFen);
    setLichessStep(0);
    setSelected(null);
    setSolved(false);
    setNotice("");
  };

  const click = (sq: Square) => {
    if (solved || isOpponentReplying) return;

    if (isLichessMode && lichessPuzzle) {
      if (selected && legal.includes(sq)) {
        let promo = undefined;
        if (c.get(selected)?.type === "p" && (sq[1] === "1" || sq[1] === "8")) {
          promo = "q";
        }
        const moveUci = `${selected}${sq}${promo || ""}`;
        const expectedUci = lichessPuzzle.solution[lichessStep];

        const isCorrect = moveUci.toLowerCase() === expectedUci.toLowerCase();

        if (isCorrect) {
          c.move({ from: selected, to: sq, promotion: promo });
          const nextFen = c.fen();
          setFen(nextFen);
          setSelected(null);

          const nextStep = lichessStep + 1;
          if (nextStep >= lichessPuzzle.solution.length) {
            setSolved(true);
            setNotice("Puzzle solved! Flawless tactical calculation.");
            setProgress((p) => recordAttempt(p, `lichess:${lichessPuzzle.id}`, true));
          } else {
            setLichessStep(nextStep);
            setNotice("Correct! Opponent replying…");
            setIsOpponentReplying(true);
            setTimeout(() => {
              const oppUci = lichessPuzzle.solution[nextStep];
              const oppParsed = parseUciMove(oppUci);
              const replyBoard = new Chess(nextFen);
              replyBoard.move(oppParsed);
              setFen(replyBoard.fen());
              setLichessStep(nextStep + 1);
              setIsOpponentReplying(false);
              setNotice("Your turn — find the continuation!");
            }, 450);
          }
        } else {
          setProgress((p) => recordAttempt(p, `lichess:${lichessPuzzle.id}`, false));
          setNotice("Not the winning move. Calculate again!");
          setSelected(null);
        }
        return;
      }
      setSelected(c.get(sq)?.color === c.turn() ? sq : null);
      return;
    }

    if (selected && legal.includes(sq)) {
      const correct = isPuzzleMate(fen, selected, sq);
      setProgress((p) => recordAttempt(p, puzzle.id, correct));
      if (correct) {
        c.move({ from: selected, to: sq, promotion: "q" });
        setFen(c.fen());
        setSolved(true);
        setNotice("Checkmate! Flawlessly spotted.");
        if (rush) setScore((s) => s + 1);
        if (rush || prefs.puzzleAutoAdvance) {
          nextTimer.current = setTimeout(
            () => choose((index + 1) % PUZZLES.length),
            700,
          );
        }
      } else {
        setNotice("Legal move, but not mate. Calculate again!");
        if (rush) setStrikes((s) => s + 1);
      }
      setSelected(null);
      return;
    }
    setSelected(c.get(sq)?.color === c.turn() ? sq : null);
  };

  const handleReset = () => {
    if (isLichessMode && lichessPuzzle) {
      setFen(lichessPuzzle.setupFen);
      setLichessStep(0);
      setSelected(null);
      setSolved(false);
      setNotice("");
    } else {
      choose(index);
    }
  };

  const handleHint = () => {
    if (isLichessMode && lichessPuzzle) {
      const currentUci = lichessPuzzle.solution[lichessStep];
      const fromSq = currentUci.slice(0, 2);
      const themes = lichessPuzzle.themes.slice(0, 3).join(", ");
      setNotice(`Hint: Focus on the piece on ${fromSq}. Themes: ${themes || "tactics"}.`);
    } else {
      setNotice(puzzle.hint);
    }
  };

  const secondsRemaining = Math.max(
    0,
    Math.min(180, Math.ceil((deadline - now) / 1000)),
  );

  const isLichessSolved = Boolean(
    lichessPuzzle && progress.solved.includes(`lichess:${lichessPuzzle.id}`)
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0E0E0E] text-[#F4F4F4] font-body p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <span className="matiks-kicker block mb-1">
              TRAIN YOUR MIND · CALCULATION & PATTERNS
            </span>
            <h1 className="matiks-headline text-4xl lg:text-5xl text-[#F4F4F4] m-0">
              TACTICAL TRAINING
            </h1>
            <p className="text-sm text-[#8A8A8A] mt-2 mb-0 max-w-xl">
              Sharpen checkmate pattern recognition, solve under timed sprint pressure, and measure your tactical consistency.
            </p>
          </div>
          <button
            onClick={onExit}
            className="btn-raised py-2.5 px-4 text-xs"
          >
            Back to Home
          </button>
        </div>

        {/* 4 Bento Training Hub Cards matching 04-web-training.svg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Mate Sprint Bento (Yellow) */}
          <div
            onClick={() => {
              choose(0);
              setScore(0);
              setStrikes(0);
              setDeadline(Date.now() + 180000);
              setRush(true);
            }}
            className="bento-card bento-yellow p-6 cursor-pointer flex flex-col justify-between min-h-[190px]"
          >
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#0E0E0E]/70 uppercase block mb-1">
                SPRINT MODE
              </span>
              <h3 className="font-heading text-3xl tracking-wide text-[#0E0E0E] m-0">
                MATE SPRINT
              </h3>
              <p className="text-xs font-body text-[#0E0E0E]/80 mt-2 mb-0">
                Find checkmate under pressure. 3 minutes, max 3 mistakes.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#0E0E0E]">
                Best: {progress.bestRush} solved
              </span>
              <span className="py-1 px-3 rounded-full bg-[#0E0E0E] text-[#F2D500] text-[11px] font-bold">
                {rush ? "Active..." : "Start Sprint →"}
              </span>
            </div>
          </div>

          {/* Mind Gate Bento (Lavender) */}
          <div className="bento-card bento-lavender p-6 flex flex-col justify-between min-h-[190px]">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#0E0E0E]/70 uppercase block mb-1">
                COGNITIVE DISCIPLINE
              </span>
              <h3 className="font-heading text-3xl tracking-wide text-[#0E0E0E] m-0">
                MIND GATE
              </h3>
              <p className="text-xs font-body text-[#0E0E0E]/80 mt-2 mb-0">
                Solve before your move. Calculate the full tactical sequence before moving pieces.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#0E0E0E]/80">
              Instinct & Verification
            </span>
          </div>

          {/* Speed Duel Bento (Teal) */}
          <div className="bento-card bento-teal p-6 flex flex-col justify-between min-h-[190px]">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#0E0E0E]/70 uppercase block mb-1">
                DUAL COGNITION
              </span>
              <h3 className="font-heading text-3xl tracking-wide text-[#0E0E0E] m-0">
                SPEED DUEL
              </h3>
              <p className="text-xs font-body text-[#0E0E0E]/80 mt-2 mb-0">
                Maths against the clock paired with on-board tactical vision.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#0E0E0E]/80">
              High-Tempo Training
            </span>
          </div>

          {/* Your Practice Stats (Charcoal) */}
          <div className="bento-card bento-charcoal p-6 flex flex-col justify-between min-h-[190px]">
            <div>
              <span className="matiks-kicker text-[10px] block mb-1">
                LOCAL PROGRESS
              </span>
              <h3 className="font-heading text-3xl tracking-wide text-[#F4F4F4] m-0">
                YOUR PRACTICE
              </h3>
              <p className="text-xs font-body text-[#8A8A8A] mt-2 mb-0">
                {progress.solved.length}/{PUZZLES.length} puzzles cleared · {progress.attempts > 0 ? Math.round((progress.correct / progress.attempts) * 100) : 0}% accuracy
              </p>
            </div>
            <div className="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#AFF65B] h-full rounded-full"
                style={{
                  width: `${(progress.solved.length / PUZZLES.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Puzzle Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Board Column */}
          <section className="lg:col-span-7 flex flex-col items-center">
            
            {/* Board Header / Status */}
            <div className="w-full max-w-[640px] flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-xl text-[#F4F4F4] block">
                    {isLichessMode && lichessPuzzle
                      ? `Daily Puzzle #${lichessPuzzle.id}`
                      : puzzle.name}
                  </span>
                  {isLichessMode && (
                    <span className="text-[10px] font-mono text-[#AFF65B] px-2 py-0.5 rounded bg-[#AFF65B]/10 border border-[#AFF65B]/20">
                      Puzzle from Lichess
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#8A8A8A]">
                  {isLichessMode && lichessPuzzle
                    ? `${lichessPuzzle.solverTurn === "w" ? "White" : "Black"} to move · Rating ${lichessPuzzle.rating}`
                    : `White to move · ${puzzle.goal}`}
                </span>
              </div>
              {rush && (
                <div className="flex items-center gap-2 bg-[#262626] border border-white/10 px-3 py-1 rounded-full">
                  <span className="text-xs font-mono font-bold text-[#F2D500]">
                    ⏱ {secondsRemaining}s
                  </span>
                  <span className="text-xs text-[#8A8A8A]">·</span>
                  <span className="text-xs font-bold text-[#AFF65B]">
                    ★ {score}
                  </span>
                  <span className="text-xs text-[#8A8A8A]">·</span>
                  <span className="text-xs text-[#E5484D]">
                    {"✕".repeat(strikes) || "0 errors"}
                  </span>
                </div>
              )}
            </div>

            {/* Position Board Component (Matiks Pieces) */}
            <div className="w-full max-w-[640px]">
              <PositionBoard
                fen={fen}
                selected={selected}
                legal={legal}
                onSquare={click}
                flip={isLichessMode && lichessPuzzle?.solverTurn === "b"}
              />
            </div>

            {/* Controls Bar */}
            <div className="w-full max-w-[640px] flex items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleHint}
                  className="btn-raised py-2.5 px-4 text-xs"
                >
                  💡 Hint
                </button>
                <button
                  onClick={handleReset}
                  className="btn-raised py-2.5 px-4 text-xs"
                >
                  ↻ Reset
                </button>
              </div>

              {isLichessMode ? (
                <button
                  onClick={() => choose(0)}
                  className="btn-raised py-2.5 px-4 text-xs font-semibold"
                >
                  ‹ Return to Local Bank
                </button>
              ) : (
                <button
                  onClick={() => choose((index + 1) % PUZZLES.length)}
                  className="btn-lime py-2.5 px-5 text-xs font-semibold"
                >
                  Next Puzzle →
                </button>
              )}
            </div>

            {notice && (
              <div className="w-full max-w-[640px] mt-3 p-3 rounded-xl bg-[#1A1A1A] border border-white/5 text-center text-xs font-semibold text-[#AFF65B]">
                {notice}
              </div>
            )}
          </section>

          {/* Right Sidebar */}
          <aside className="lg:col-span-5 flex flex-col gap-5">
            
            {/* Daily Puzzle from Lichess Bento Card */}
            <div
              className={`bento-card p-6 flex flex-col justify-between transition-all ${
                isLichessMode
                  ? "bg-[#1E1E1E] border border-[#AFF65B]/40 shadow-[0_0_24px_rgba(175,246,91,0.08)]"
                  : "bento-charcoal"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="matiks-kicker text-[10px]">
                    PUZZLE FROM LICHESS
                  </span>
                  {isLichessSolved && (
                    <span className="text-[11px] font-bold text-[#AFF65B] bg-[#AFF65B]/10 px-2 py-0.5 rounded-full border border-[#AFF65B]/30">
                      ✓ Solved Today
                    </span>
                  )}
                </div>

                <h3 className="font-heading text-2xl text-[#F4F4F4] m-0 mb-2">
                  DAILY TACTICAL PUZZLE
                </h3>

                {loadingLichess && (
                  <div className="py-4 text-center">
                    <span className="text-xs text-[#8A8A8A] italic animate-pulse">
                      Fetching daily puzzle from Lichess…
                    </span>
                  </div>
                )}

                {lichessError && !loadingLichess && (
                  <div className="p-3 rounded-xl bg-[#262626] border border-white/5 space-y-2 mb-3">
                    <p className="text-xs text-[#F2D500] m-0 leading-relaxed">
                      {lichessError}
                    </p>
                    <button
                      onClick={handleRetryLichess}
                      disabled={loadingLichess}
                      className="btn-raised py-1.5 px-3 text-[11px] w-full"
                    >
                      ↻ Retry Lichess
                    </button>
                  </div>
                )}

                {lichessPuzzle && !loadingLichess && (
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#262626] border border-white/5">
                      <span className="text-xs text-[#8A8A8A]">Puzzle Rating</span>
                      <span className="font-mono text-sm font-bold text-[#AFF65B]">
                        {lichessPuzzle.rating}
                      </span>
                    </div>

                    {lichessPuzzle.themes.length > 0 && (
                      <div>
                        <span className="text-[10px] text-[#8A8A8A] uppercase tracking-wider block mb-1.5">
                          Themes
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {lichessPuzzle.themes.slice(0, 4).map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded bg-[#1F1F1F] text-[#D4D4D4] text-[10px] font-mono border border-white/10"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-2">
                {lichessPuzzle && (
                  <button
                    onClick={playLichess}
                    className={`w-full py-2.5 text-xs font-bold rounded-lg transition-all ${
                      isLichessMode
                        ? "bg-[#AFF65B] text-[#0E0E0E]"
                        : "btn-lime"
                    }`}
                  >
                    {isLichessMode ? "★ Active on Board" : "Solve Daily Puzzle →"}
                  </button>
                )}
                <span className="text-[10px] text-[#8A8A8A] text-center block">
                  Free public tactical puzzle via Lichess API
                </span>
              </div>
            </div>

            {/* Sprint Launcher or Solver Info */}
            <div className="bento-card bento-charcoal p-6">
              <span className="matiks-kicker text-[10px] block mb-2">
                {rush ? "ACTIVE SPRINT" : "TRAINING MODE"}
              </span>
              <h3 className="font-heading text-2xl text-[#F4F4F4] m-0 mb-2">
                {rush ? "RUSH AGAINST THE CLOCK" : "SOLVE AT YOUR PACE"}
              </h3>
              {rush ? (
                <div className="space-y-3">
                  <p className="text-xs text-[#8A8A8A] m-0">
                    Find any legal checkmate as fast as possible. 3 strikes and the sprint ends.
                  </p>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#262626]">
                    <span className="text-xs text-[#8A8A8A]">Current Score:</span>
                    <span className="font-heading text-xl text-[#AFF65B]">{score} solves</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-[#8A8A8A] m-0">
                    Original mate-in-one tactical compositions. Find any legal checkmate, not only one pre-configured path.
                  </p>
                  <button
                    onClick={() => {
                      choose(0);
                      setScore(0);
                      setStrikes(0);
                      setDeadline(Date.now() + 180000);
                      setRush(true);
                    }}
                    className="btn-lime w-full py-3 text-xs font-semibold"
                  >
                    Start 3-Minute Practice Sprint
                  </button>
                </div>
              )}
            </div>

            {/* Puzzle Bank Browser */}
            <div className="bento-card bento-charcoal p-6 flex flex-col max-h-[360px]">
              <span className="matiks-kicker text-[10px] block mb-2">
                AVAILABLE COMPOSITIONS ({PUZZLES.length})
              </span>
              <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
                {PUZZLES.map((p, i) => {
                  const isDone = progress.solved.includes(p.id);
                  const isCurrent = index === i;
                  return (
                    <button
                      key={p.id}
                      onClick={() => choose(i)}
                      className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between text-xs cursor-pointer border transition-colors ${
                        isCurrent
                          ? "bg-[#262626] border-[#AFF65B] text-[#AFF65B] font-semibold"
                          : "bg-[#161616] hover:bg-[#222222] border-white/5 text-[#F4F4F4]"
                      }`}
                    >
                      <span>
                        {i + 1}. {p.name}
                      </span>
                      {isDone && (
                        <span className="text-[#AFF65B] font-bold">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
