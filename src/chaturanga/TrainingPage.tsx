import { useState, useEffect, useRef } from "react";
import { Chess, Square } from "chess.js";
import {
  PUZZLES,
  isPuzzleMate,
  recordAttempt,
  emptyProgress,
  TrainingProgress,
} from "./training";
import PositionBoard from "./PositionBoard";
import { usePreferences } from "./preferences";
export default function TrainingPage({ onExit }: { onExit: () => void }) {
  const { open } = usePreferences();
  const [index, setIndex] = useState(0),
    [fen, setFen] = useState(PUZZLES[0].fen),
    [selected, setSelected] = useState<Square | null>(null),
    [notice, setNotice] = useState(""),
    [solved, setSolved] = useState(false),
    [rush, setRush] = useState(false),
    [deadline, setDeadline] = useState(0),
    [now, setNow] = useState(Date.now()),
    [score, setScore] = useState(0),
    [strikes, setStrikes] = useState(0),
    [progress, setProgress] = useState<TrainingProgress>(() => {
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
  const c = new Chess(fen),
    puzzle = PUZZLES[index],
    legal = selected
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
        `Sprint complete: ${score} solves. This small practice bank is not a rated Puzzle Rush service.`,
      );
      setProgress((p) => ({ ...p, bestRush: Math.max(p.bestRush, score) }));
    }
  }, [now, deadline, strikes, rush, score]);
  const choose = (i: number) => {
    if (nextTimer.current) {
      clearTimeout(nextTimer.current);
      nextTimer.current = null;
    }
    setIndex(i);
    setFen(PUZZLES[i].fen);
    setSelected(null);
    setSolved(false);
    setNotice("");
  };
  const click = (sq: Square) => {
    if (solved) return;
    if (selected && legal.includes(sq)) {
      const correct = isPuzzleMate(fen, selected, sq);
      setProgress((p) => recordAttempt(p, puzzle.id, correct));
      if (correct) {
        c.move({ from: selected, to: sq, promotion: "q" });
        setFen(c.fen());
        setSolved(true);
        setNotice("Checkmate. Nicely seen.");
        if (rush) {
          setScore((s) => s + 1);
          nextTimer.current = setTimeout(
            () => choose((index + 1) % PUZZLES.length),
            600,
          );
        }
      } else {
        setNotice("Legal move, but not mate. Try again.");
        if (rush) setStrikes((s) => s + 1);
      }
      setSelected(null);
      return;
    }
    setSelected(c.get(sq)?.color === c.turn() ? sq : null);
  };
  return (
    <div className="courtyard play-workspace">
      <header className="court-header">
        <div className="court-brand">
          ♞
          <span>
            Training<small>Small patterns. Better instincts.</small>
          </span>
        </div>
        <div className="court-header-actions">
          <button onClick={open}>⚙ Settings</button>
          <button onClick={onExit}>Back home</button>
        </div>
      </header>
      <main className="court-match">
        <section className="board-column">
          <div className="match-heading">
            <div>
              <div className="eyebrow">ORIGINAL COMPOSITIONS · MATE IN ONE</div>
              <h1>{puzzle.name}</h1>
            </div>
          </div>
          <div className="study-status">White to move · {puzzle.goal}</div>
          <PositionBoard
            fen={fen}
            selected={selected}
            legal={legal}
            onSquare={click}
          />
          <div className="replay-bar">
            <button onClick={() => setNotice(puzzle.hint)}>Hint</button>
            <button onClick={() => choose(index)}>Reset</button>
            <button onClick={() => choose((index + 1) % PUZZLES.length)}>
              Next puzzle
            </button>
          </div>
        </section>
        <aside className="court-sidebar">
          <section className="court-panel">
            <h2>{rush ? "Practice sprint" : "Solve at your own pace"}</h2>
            {rush ? (
              <p>
                {Math.max(0, Math.min(180, Math.ceil((deadline - now) / 1000)))}{" "}
                seconds · {score} solves · {strikes}/3 mistakes
              </p>
            ) : (
              <>
                <p>
                  Three original mate-in-one compositions. Find any legal
                  checkmate, not only one hardcoded square.
                </p>
                <button
                  className="primary"
                  onClick={() => {
                    choose(0);
                    setScore(0);
                    setStrikes(0);
                    setDeadline(Date.now() + 180000);
                    setRush(true);
                  }}
                >
                  Start 3-minute practice sprint
                </button>
              </>
            )}
            <p role="status">{notice}</p>
          </section>
          <section className="court-panel">
            <h2>Your practice</h2>
            <p>
              {progress.solved.length}/{PUZZLES.length} compositions solved ·{" "}
              {progress.correct}/{progress.attempts} correct attempts
            </p>
            <p>
              Best local sprint: {progress.bestRush}. Stored only on this
              device.
            </p>
            <div className="training-list">
              {PUZZLES.map((p, i) => (
                <button key={p.id} onClick={() => choose(i)}>
                  {progress.solved.includes(p.id) ? "✓ " : ""}
                  {p.name}
                </button>
              ))}
            </div>
          </section>
          <section className="court-panel">
            <h2>What comes next</h2>
            <p>
              This is a working starter practice bank. Rated/adaptive puzzles
              and two-player puzzle battles need a larger verified puzzle source
              and an online service. Repeated sprint compositions are practice,
              not a competitive rating.
            </p>
          </section>
        </aside>
      </main>
    </div>
  );
}
