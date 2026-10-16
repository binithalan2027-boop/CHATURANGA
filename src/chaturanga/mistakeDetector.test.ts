import { it, expect } from "vitest";
import { Chess } from "chess.js";
import { detectMistake } from "./mistakeDetector";
it("normalizes opposite-side scores to mover loss", () => {
  expect(
    detectMistake(
      new Chess().fen(),
      "d4",
      { cp: 40, best: "e2e4" },
      { cp: 200, best: "e7e5" },
      1,
    )?.loss,
  ).toBe(240);
});
it("does not create puzzles for small swings or invalid best moves", () => {
  expect(
    detectMistake(
      new Chess().fen(),
      "d4",
      { cp: 40, best: "e2e4" },
      { cp: -30, best: "e7e5" },
      1,
    ),
  ).toBeNull();
  expect(
    detectMistake(
      new Chess().fen(),
      "d4",
      { cp: 40, best: "a1a8" },
      { cp: 300, best: "e7e5" },
      1,
    ),
  ).toBeNull();
});
