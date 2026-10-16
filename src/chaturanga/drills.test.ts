import { describe, expect, it } from "vitest";
import {
  emptyStore, addPuzzles, dailyDrills, recordAttempt, drillStats, drillId,
} from "./drills";
import { MistakePuzzle } from "./mistakeDetector";

const mk = (ply: number, fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"): MistakePuzzle => ({
  fen: fen.replace("0 1", `0 ${ply}`), played: "e2e3", best: "e2e4", loss: 200, ply,
});

describe("drills", () => {
  it("adds puzzles and dedupes", () => {
    const s = emptyStore();
    expect(addPuzzles(s, [mk(3), mk(5)], "study", "2026-10-13")).toBe(2);
    expect(addPuzzles(s, [mk(3), mk(7)], "study", "2026-10-13")).toBe(1);
    expect(s.drills).toHaveLength(3);
  });
  it("daily set is unsolved-first with retry tail, capped", () => {
    const s = emptyStore();
    addPuzzles(s, [1, 2, 3, 4, 5, 6, 7].map((n) => mk(n)), "t", "2026-10-13");
    recordAttempt(s, drillId(mk(2)), false, "2026-10-13");
    const due = dailyDrills(s, 5);
    expect(due).toHaveLength(5);
    expect(due.map((d) => d.ply)).toEqual([1, 3, 4, 5, 6]); // failed ply 2 goes to retry tail
    recordAttempt(s, drillId(mk(1)), true, "2026-10-13");
    expect(dailyDrills(s, 5).map((d) => d.ply)).toEqual([3, 4, 5, 6, 7]); // fresh fills the day
    expect(dailyDrills(s, 6).map((d) => d.ply)).toEqual([3, 4, 5, 6, 7, 2]); // retry tail after fresh
  });
  it("stats track totals, due and streak", () => {
    const s = emptyStore();
    addPuzzles(s, [mk(1), mk(2)], "t", "2026-10-11");
    recordAttempt(s, drillId(mk(1)), true, "2026-10-11");
    recordAttempt(s, drillId(mk(2)), true, "2026-10-12");
    const st = drillStats(s, "2026-10-13");
    expect(st).toEqual({ total: 2, solved: 2, due: 0, streak: 2 });
  });
  it("streak survives an unfinished today", () => {
    const s = emptyStore();
    addPuzzles(s, [mk(1)], "t", "2026-10-12");
    recordAttempt(s, drillId(mk(1)), true, "2026-10-12");
    expect(drillStats(s, "2026-10-13").streak).toBe(1);
    expect(drillStats(s, "2026-10-14").streak).toBe(0);
  });
});
