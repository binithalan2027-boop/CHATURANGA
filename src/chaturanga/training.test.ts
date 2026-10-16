import { it, expect } from "vitest";
import {
  PUZZLES,
  isPuzzleMate,
  recordAttempt,
  emptyProgress,
} from "./training";
it("all original puzzle solutions are legal checkmate", () => {
  for (const p of PUZZLES)
    expect(isPuzzleMate(p.fen, p.solution.from, p.solution.to)).toBe(true);
});
it("illegal attempts cannot pass", () =>
  expect(isPuzzleMate(PUZZLES[0].fen, "e1", "e5")).toBe(false));
it("records attempts without duplicate solved counts", () => {
  let p = recordAttempt(emptyProgress, "one", true);
  p = recordAttempt(p, "one", true);
  p = recordAttempt(p, "two", false);
  expect(p.solved).toEqual(["one"]);
  expect(p.correct).toBe(2);
  expect(p.attempts).toBe(3);
});
