import { it, expect } from "vitest";
import { Chess } from "chess.js";
import { positionNotes } from "./positionNotes";
import { practiceSuggestion, emptyProgress, recordAttempt } from "./training";
it("explains a capture from a legal move, without a quality claim", () => {
  const c = new Chess();
  c.move("e4");
  c.move("d5");
  const before = c.fen();
  c.move("exd5");
  expect(positionNotes(c.fen(), before, "exd5")[0]).toContain(
    "captured a pawn on d5",
  );
});
it("describes checkmate and stalemate accurately", () => {
  expect(positionNotes("7k/6Q1/5K2/8/8/8/8/8 b - - 0 1")[0]).toContain(
    "checkmate",
  );
  expect(positionNotes("7k/5K2/6Q1/8/8/8/8/8 b - - 0 1")[0]).toContain(
    "stalemate",
  );
});
it("does not invent a weakness for a new visitor", () =>
  expect(practiceSuggestion(emptyProgress).reason).toContain("unsolved"));
it("recommends an actually missed pattern", () =>
  expect(
    practiceSuggestion(recordAttempt(emptyProgress, "rook-net", false)).id,
  ).toBe("rook-net"));
it("respects older progress without per-pattern statistics", () =>
  expect(
    practiceSuggestion({ ...emptyProgress, solved: ["back-rank"] }).id,
  ).toBe("queen-net"));
import { findOpening } from "./openingLookup";
import { rematchDecision } from "./rematchPolicy";
import { readableSuggestion } from "./AnalysisCoach";
it("looks up a named opening by legal positions", () => {
  const c = new Chess();
  c.move("e4");
  c.move("c5");
  expect(findOpening([c.fen()])?.name).toContain("Sicilian");
});
it("rematch preference defaults to asking", () => {
  expect(rematchDecision(false)).toBe("ask");
  expect(rematchDecision(true)).toBe("decline");
});
it("translates engine UCI to legal SAN", () =>
  expect(readableSuggestion(new Chess().fen(), "e2e4")).toContain("e4"));
