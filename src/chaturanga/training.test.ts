import { describe, it, expect } from "vitest";
import {
  PUZZLES,
  isPuzzleMate,
  recordAttempt,
  emptyProgress,
  emptyProgressV2,
  migrateProgress,
  recordBankSolve,
  recordMathsScore,
  getBankProgressRatio,
  getAccuracyPercent,
} from "./training";

describe("Training Progress & Migration", () => {
  it("all original puzzle solutions are legal checkmate", () => {
    for (const p of PUZZLES) {
      expect(isPuzzleMate(p.fen, p.solution.from, p.solution.to)).toBe(true);
    }
  });

  it("illegal attempts cannot pass", () => {
    expect(isPuzzleMate(PUZZLES[0].fen, "e1", "e5")).toBe(false);
  });

  it("records attempts without duplicate solved counts", () => {
    let p = recordAttempt(emptyProgress, "one", true);
    p = recordAttempt(p, "one", true);
    p = recordAttempt(p, "two", false);
    expect(p.solved).toEqual(["one"]);
    expect(p.correct).toBe(2);
    expect(p.attempts).toBe(3);
  });

  it("safely migrates null or corrupt data to emptyProgressV2", () => {
    expect(migrateProgress(null)).toEqual(emptyProgressV2);
    expect(migrateProgress(undefined)).toEqual(emptyProgressV2);
    expect(migrateProgress("corrupted string")).toEqual(emptyProgressV2);
    expect(migrateProgress({ solved: "invalid" })).toEqual(emptyProgressV2);
  });

  it("migrates legacy v1 progress separating starter, daily and bank solved IDs", () => {
    const legacyV1 = {
      solved: [
        "back-rank", // starter ID
        "daily-2026-10-25", // daily ID
        "00008", // bank ID
        "lichess-bank:0000D", // bank ID with prefix
      ],
      attempts: 10,
      correct: 8,
      bestRush: 5,
    };

    const v2 = migrateProgress(legacyV1);
    expect(v2.version).toBe(2);
    expect(v2.starterSolved).toContain("back-rank");
    expect(v2.dailySolved).toContain("daily-2026-10-25");
    expect(v2.bankSolved).toContain("00008");
    expect(v2.bankSolved).toContain("0000D");
    expect(v2.attempts).toBe(10);
    expect(v2.correct).toBe(8);
    expect(v2.bestRush).toBe(5);
  });

  it("getBankProgressRatio clamps between 0 and 150 denominator without overflowing", () => {
    const fresh = emptyProgressV2;
    expect(getBankProgressRatio(fresh)).toEqual({
      solved: 0,
      total: 150,
      percent: 0,
    });

    const populated = {
      ...fresh,
      bankSolved: Array.from({ length: 45 }, (_, i) => `id-${i}`),
    };
    expect(getBankProgressRatio(populated)).toEqual({
      solved: 45,
      total: 150,
      percent: 30,
    });

    // Even if somehow bankSolved had >150 entries, it clamps to 150 (100%)
    const overflow = {
      ...fresh,
      bankSolved: Array.from({ length: 200 }, (_, i) => `id-${i}`),
    };
    expect(getBankProgressRatio(overflow)).toEqual({
      solved: 150,
      total: 150,
      percent: 100,
    });
  });

  it("getAccuracyPercent handles zero attempts safely and calculates accurate integer %", () => {
    expect(getAccuracyPercent(emptyProgressV2)).toBeNull();
    expect(getAccuracyPercent({ attempts: 10, correct: 7, solved: [], bestRush: 0 })).toBe(70);
    expect(getAccuracyPercent({ attempts: 3, correct: 1, solved: [], bestRush: 0 })).toBe(33);
  });

  it("recordBankSolve tracks assisted solve without breaking solve counts", () => {
    let p = emptyProgressV2;
    p = recordBankSolve(p, "00008", true, true); // assisted
    expect(p.bankSolved).toContain("00008");
    expect(p.byPuzzle["00008"].assisted).toBe(true);

    p = recordBankSolve(p, "0000D", true, false); // unassisted
    expect(p.bankSolved).toContain("0000D");
    expect(p.byPuzzle["0000D"].assisted).toBe(false);
  });

  it("recordMathsScore retains high score", () => {
    let p = emptyProgressV2;
    p = recordMathsScore(p, 14);
    expect(p.mathsBestScore).toBe(14);
    p = recordMathsScore(p, 10);
    expect(p.mathsBestScore).toBe(14); // doesn't decrease
    p = recordMathsScore(p, 22);
    expect(p.mathsBestScore).toBe(22);
  });
});
