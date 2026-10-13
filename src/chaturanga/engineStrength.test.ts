import { it, expect } from "vitest";
import { strengthOptions, beginnerProbability } from "./engineStrength";
it("does not pretend unsupported strengths are Stockfish Elo", () => {
  expect(() => strengthOptions(1)).toThrow();
  expect(() => strengthOptions(3191)).toThrow();
  expect(strengthOptions(1320)[1]).toContain("1320");
  expect(strengthOptions(null)[0]).toContain("false");
});
it("beginner assistance falls with the selected practice level", () => {
  expect(beginnerProbability(1)).toBeGreaterThan(beginnerProbability(1300));
});
