import { Chess, Square } from "chess.js";
// Small original compositions, not a copied puzzle database.
export const PUZZLES = [
  {
    id: "back-rank",
    name: "Back-rank finish",
    fen: "6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1",
    goal: "Find checkmate in one.",
    hint: "The rook can use the open file and the eighth rank.",
    solution: { from: "e1" as Square, to: "e8" as Square },
  },
  {
    id: "queen-net",
    name: "A close-knit finish",
    fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1",
    goal: "Find checkmate in one.",
    hint: "Your king guards g7. Bring the queen closer.",
    solution: { from: "g6" as Square, to: "g7" as Square },
  },
  {
    id: "rook-net",
    name: "King and rook teamwork",
    fen: "7k/5K1p/6R1/8/8/8/8/8 w - - 0 1",
    goal: "Find checkmate in one.",
    hint: "Cut off the final rank while your king guards the escape squares.",
    solution: { from: "g6" as Square, to: "g8" as Square },
  },
];
export function isPuzzleMate(fen: string, from: Square, to: Square): boolean {
  try {
    const c = new Chess(fen);
    c.move({ from, to, promotion: "q" });
    return c.isCheckmate();
  } catch {
    return false;
  }
}
export interface TrainingProgress {
  byPuzzle?: Record<string, { attempts: number; correct: number }>;
  solved: string[];
  attempts: number;
  correct: number;
  bestRush: number;
}
export const emptyProgress: TrainingProgress = {
  solved: [],
  attempts: 0,
  correct: 0,
  bestRush: 0,
};
export function recordAttempt(
  progress: TrainingProgress,
  id: string,
  correct: boolean,
): TrainingProgress {
  return {
    ...progress,
    byPuzzle: {
      ...progress.byPuzzle,
      [id]: {
        attempts: (progress.byPuzzle?.[id]?.attempts || 0) + 1,
        correct: (progress.byPuzzle?.[id]?.correct || 0) + (correct ? 1 : 0),
      },
    },
    attempts: progress.attempts + 1,
    correct: progress.correct + (correct ? 1 : 0),
    solved: correct
      ? Array.from(new Set([...progress.solved, id]))
      : progress.solved,
  };
}

export function practiceSuggestion(progress: TrainingProgress): {
  id: string;
  reason: string;
} {
  const missed = PUZZLES.map((p) => ({ p, stats: progress.byPuzzle?.[p.id] }))
    .filter((x) => x.stats && x.stats.attempts > x.stats.correct)
    .sort(
      (a, b) =>
        b.stats!.attempts -
        b.stats!.correct -
        (a.stats!.attempts - a.stats!.correct),
    );
  if (missed.length)
    return {
      id: missed[0].p.id,
      reason: `${missed[0].stats!.attempts - missed[0].stats!.correct} unsuccessful attempts on this device. Revisit the pattern without a timer.`,
    };
  const next = PUZZLES.find((p) => !progress.solved.includes(p.id));
  return {
    id: (next || PUZZLES[0]).id,
    reason: next
      ? "An unsolved composition from your local practice bank."
      : "You have solved this starter bank. Repeat for practice, not a new rating.",
  };
}
