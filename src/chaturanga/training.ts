import { Chess, Square } from "chess.js";

// Original 3 starter compositions (Classic Starter Triad)
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
  version?: 2;
  byPuzzle?: Record<
    string,
    { attempts: number; correct: number; assisted?: boolean }
  >;
  solved: string[];
  bankSolved?: string[];
  starterSolved?: string[];
  dailySolved?: string[];
  mathsBestScore?: number;
  attempts: number;
  correct: number;
  bestRush: number;
}

export interface TrainingProgressV2 {
  version: 2;
  bankSolved: string[];
  starterSolved: string[];
  dailySolved: string[];
  solved: string[];
  mathsBestScore: number;
  bestRush: number;
  attempts: number;
  correct: number;
  byPuzzle: Record<
    string,
    { attempts: number; correct: number; assisted?: boolean }
  >;
}

export const emptyProgress: TrainingProgress = {
  solved: [],
  attempts: 0,
  correct: 0,
  bestRush: 0,
};

export const emptyProgressV2: TrainingProgressV2 = {
  version: 2,
  bankSolved: [],
  starterSolved: [],
  dailySolved: [],
  solved: [],
  mathsBestScore: 0,
  bestRush: 0,
  attempts: 0,
  correct: 0,
  byPuzzle: {},
};

const STARTER_IDS = new Set(PUZZLES.map((p) => p.id));

/**
 * Migrates any stored progress (v1, corrupted, or empty) into TrainingProgressV2.
 * Segregates bank solved, starter solved, and daily solved so the local bank denominator (150)
 * is never exceeded by starter or daily solves.
 */
export function migrateProgress(stored: unknown): TrainingProgressV2 {
  if (!stored || typeof stored !== "object") {
    return { ...emptyProgressV2 };
  }

  const s = stored as Record<string, any>;

  const bankSolvedSet = new Set<string>();
  const starterSolvedSet = new Set<string>();
  const dailySolvedSet = new Set<string>();

  // If already v2 arrays exist:
  if (Array.isArray(s.bankSolved)) {
    s.bankSolved.forEach((id: unknown) => {
      if (typeof id === "string") bankSolvedSet.add(id);
    });
  }
  if (Array.isArray(s.starterSolved)) {
    s.starterSolved.forEach((id: unknown) => {
      if (typeof id === "string") starterSolvedSet.add(id);
    });
  }
  if (Array.isArray(s.dailySolved)) {
    s.dailySolved.forEach((id: unknown) => {
      if (typeof id === "string") dailySolvedSet.add(id);
    });
  }

  // Handle legacy v1 solved array
  if (Array.isArray(s.solved)) {
    for (const rawId of s.solved) {
      if (typeof rawId !== "string") continue;
      const id = rawId.replace(/^lichess-bank:/, "");
      if (STARTER_IDS.has(id)) {
        starterSolvedSet.add(id);
      } else if (
        id.startsWith("daily-") ||
        id.startsWith("chaturanga-lichess-daily-")
      ) {
        dailySolvedSet.add(id);
      } else {
        // Bank ID or arbitrary puzzle ID
        bankSolvedSet.add(id);
      }
    }
  }

  const bankSolved = Array.from(bankSolvedSet);
  const starterSolved = Array.from(starterSolvedSet);
  const dailySolved = Array.from(dailySolvedSet);
  const solved = Array.from(
    new Set([...bankSolved, ...starterSolved, ...dailySolved]),
  );

  const attempts = typeof s.attempts === "number" && s.attempts >= 0 ? s.attempts : 0;
  const correct = typeof s.correct === "number" && s.correct >= 0 ? s.correct : 0;
  const bestRush = typeof s.bestRush === "number" && s.bestRush >= 0 ? s.bestRush : 0;
  const mathsBestScore =
    typeof s.mathsBestScore === "number" && s.mathsBestScore >= 0
      ? s.mathsBestScore
      : 0;

  const byPuzzle: Record<string, { attempts: number; correct: number; assisted?: boolean }> = {};
  if (s.byPuzzle && typeof s.byPuzzle === "object") {
    for (const [k, v] of Object.entries(s.byPuzzle)) {
      if (v && typeof v === "object") {
        const item = v as Record<string, any>;
        byPuzzle[k] = {
          attempts: typeof item.attempts === "number" ? Math.max(0, item.attempts) : 0,
          correct: typeof item.correct === "number" ? Math.max(0, item.correct) : 0,
          assisted: Boolean(item.assisted),
        };
      }
    }
  }

  return {
    version: 2,
    bankSolved,
    starterSolved,
    dailySolved,
    solved,
    mathsBestScore,
    bestRush,
    attempts,
    correct,
    byPuzzle,
  };
}

export function recordAttempt(
  progress: TrainingProgress | TrainingProgressV2,
  id: string,
  correct: boolean,
): TrainingProgress {
  const cleanId = id.replace(/^lichess-bank:/, "");
  const p = migrateProgress(progress);

  const isStarter = STARTER_IDS.has(cleanId);
  const isDaily =
    cleanId.startsWith("daily-") || cleanId.startsWith("chaturanga-lichess-daily-");

  const newBankSolved =
    correct && !isStarter && !isDaily
      ? Array.from(new Set([...p.bankSolved, cleanId]))
      : p.bankSolved;
  const newStarterSolved =
    correct && isStarter
      ? Array.from(new Set([...p.starterSolved, cleanId]))
      : p.starterSolved;
  const newDailySolved =
    correct && isDaily
      ? Array.from(new Set([...p.dailySolved, cleanId]))
      : p.dailySolved;
  const newSolved = Array.from(
    new Set([...newBankSolved, ...newStarterSolved, ...newDailySolved]),
  );

  return {
    ...p,
    bankSolved: newBankSolved,
    starterSolved: newStarterSolved,
    dailySolved: newDailySolved,
    solved: newSolved,
    byPuzzle: {
      ...p.byPuzzle,
      [cleanId]: {
        attempts: (p.byPuzzle?.[cleanId]?.attempts || 0) + 1,
        correct: (p.byPuzzle?.[cleanId]?.correct || 0) + (correct ? 1 : 0),
        assisted: p.byPuzzle?.[cleanId]?.assisted || false,
      },
    },
    attempts: p.attempts + 1,
    correct: p.correct + (correct ? 1 : 0),
  };
}

export function recordBankSolve(
  progress: TrainingProgressV2,
  bankId: string,
  correct: boolean,
  assisted = false,
): TrainingProgressV2 {
  const cleanId = bankId.replace(/^lichess-bank:/, "");
  const newBankSolved = correct
    ? Array.from(new Set([...progress.bankSolved, cleanId]))
    : progress.bankSolved;
  const newSolved = Array.from(
    new Set([...newBankSolved, ...progress.starterSolved, ...progress.dailySolved]),
  );

  return {
    ...progress,
    bankSolved: newBankSolved,
    solved: newSolved,
    byPuzzle: {
      ...progress.byPuzzle,
      [cleanId]: {
        attempts: (progress.byPuzzle?.[cleanId]?.attempts || 0) + 1,
        correct: (progress.byPuzzle?.[cleanId]?.correct || 0) + (correct ? 1 : 0),
        assisted: (progress.byPuzzle?.[cleanId]?.assisted || false) || assisted,
      },
    },
    attempts: progress.attempts + 1,
    correct: progress.correct + (correct ? 1 : 0),
  };
}

export function recordMathsScore(
  progress: TrainingProgressV2,
  score: number,
): TrainingProgressV2 {
  return {
    ...progress,
    mathsBestScore: Math.max(progress.mathsBestScore || 0, score),
  };
}

export function getBankProgressRatio(progress: TrainingProgressV2): {
  solved: number;
  total: number;
  percent: number;
} {
  const total = 150;
  const solved = Math.min(total, Math.max(0, progress.bankSolved.length));
  const percent = Math.min(100, Math.max(0, Math.round((solved / total) * 100)));
  return { solved, total, percent };
}

export function getAccuracyPercent(
  progress: TrainingProgress | TrainingProgressV2,
): number | null {
  if (!progress.attempts || progress.attempts <= 0) return null;
  const pct = Math.round((progress.correct / progress.attempts) * 100);
  return Math.min(100, Math.max(0, pct));
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
