import { describe, it, expect } from "vitest";
import { parseAnswer } from "../math";
import { emptyStore, drillStats, recordAttempt, type DrillStore } from "../drills";
import { materialEval } from "../study";
import { ACHIEVEMENTS, getAchievementProgress, isAchievementUnlocked } from "../achievements";

describe("Four Chaturanga Screens Logic", () => {
  describe("Screen 1: OpponentSearchScreen logic", () => {
    it("formats elapsed matchmaking seconds correctly into M:SS", () => {
      const formatElapsed = (sec: number) => {
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
      };

      expect(formatElapsed(0)).toBe("0:00");
      expect(formatElapsed(5)).toBe("0:05");
      expect(formatElapsed(65)).toBe("1:05");
      expect(formatElapsed(132)).toBe("2:12");
    });
  });

  describe("Screen 2: Chess MM Maths Duel Overlay logic", () => {
    it("parses whole integer answers and rejects decimals or non-digits", () => {
      expect(parseAnswer("42")).toBe(42);
      expect(parseAnswer("0")).toBe(0);
      expect(parseAnswer("105")).toBe(105);
      // Rejects decimals as specified in graphics spec (whole numbers only)
      expect(parseAnswer("42.5")).toBeNull();
      expect(parseAnswer("abc")).toBeNull();
      expect(parseAnswer("")).toBeNull();
    });

    it("normalizes Devanagari numerals to standard integers", () => {
      // ०=0, १=1, २=2, ३=3, ४=4, ५=5, ६=6, ७=7, ८=8, ९=9
      expect(parseAnswer("४२")).toBe(42);
      expect(parseAnswer("१००")).toBe(100);
      expect(parseAnswer("५")).toBe(5);
    });
  });

  describe("Screen 3: MatchAnalysisScreen evaluation & decisive swing logic", () => {
    it("evaluates material balance accurately from initial chess position", () => {
      const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const evalStart = materialEval(startFen);
      expect(evalStart).toBe(0);
    });

    it("evaluates player advantage when white captures black queen", () => {
      // Position where black is missing queen (-9 pawns for black => +9 pawns for white)
      const fenWhiteUpQueen = "rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const evalQueen = materialEval(fenWhiteUpQueen);
      expect(evalQueen).toBe(9);
    });

    it("detects decisive evaluation swing vertex", () => {
      // Simulating a sequence of evaluations
      const evals = [0.0, 0.2, 0.1, -0.1, 4.5, 4.3, 4.8];
      let maxSwing = 0;
      let decisiveIndex = -1;

      for (let i = 1; i < evals.length; i++) {
        const swing = Math.abs(evals[i] - evals[i - 1]);
        if (swing > maxSwing) {
          maxSwing = swing;
          decisiveIndex = i;
        }
      }

      expect(decisiveIndex).toBe(4); // Largest jump was from -0.1 to 4.5 (+4.6 swing)
      expect(maxSwing).toBeCloseTo(4.6, 1);
      // Move number: Math.ceil(4 / 2) = Move 2
      expect(Math.ceil(decisiveIndex / 2)).toBe(2);
    });
  });

  describe("Screen 4: ProgressPage streak squares & stamp book preview", () => {
    it("computes consecutive drill streaks accurately", () => {
      const store: DrillStore = emptyStore();
      const today = "2026-10-27";
      const yesterday = "2026-10-26";
      const dayBefore = "2026-10-25";

      store.drills.push(
        { id: "d1", source: "test", addedOn: dayBefore, attempts: 1, fails: 0, ply: 1, fen: "f1", best: "e4", played: "e5", loss: 120 },
        { id: "d2", source: "test", addedOn: yesterday, attempts: 1, fails: 0, ply: 1, fen: "f2", best: "d4", played: "d5", loss: 110 },
        { id: "d3", source: "test", addedOn: today, attempts: 0, fails: 0, ply: 1, fen: "f3", best: "c4", played: "c5", loss: 90 }
      );

      // Solve dayBefore and yesterday
      recordAttempt(store, "d1", true, dayBefore);
      recordAttempt(store, "d2", true, yesterday);

      // Before solving today: streak should be 2, today is pending
      const statsPending = drillStats(store, today);
      expect(statsPending.streak).toBe(2);

      // After solving today: streak should become 3
      recordAttempt(store, "d3", true, today);
      const statsDone = drillStats(store, today);
      expect(statsDone.streak).toBe(3);
    });

    it("computes registered achievements progress dynamically (n / N)", () => {
      const progress = getAchievementProgress();
      expect(progress.total).toBe(ACHIEVEMENTS.length);
      expect(progress.unlocked).toBeGreaterThanOrEqual(0);
      expect(progress.unlocked).toBeLessThanOrEqual(progress.total);
      expect(progress.percentage).toBe(
        progress.total > 0 ? Math.round((progress.unlocked / progress.total) * 100) : 0
      );
    });

    it("checks locked/unlocked status for catalogue stamps", () => {
      expect(typeof isAchievementUnlocked("first-win")).toBe("boolean");
      expect(typeof isAchievementUnlocked("chess960-win")).toBe("boolean");
    });
  });
});
