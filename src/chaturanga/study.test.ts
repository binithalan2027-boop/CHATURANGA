import { it, expect } from "vitest";
import { parsePgn, fromFen, studyMove, materialEval } from "./study";
import { Chess } from "chess.js";
it("roundtrips legal PGN into replay snapshots", () => {
  const s = parsePgn("1. e4 e5 2. Nf3 Nc6 *");
  expect(s.fens.length).toBe(5);
  expect(new Chess(s.fens[4]).get("c6")?.type).toBe("n");
  expect(parsePgn(s.pgn).sans).toEqual(s.sans);
});
it("branches from viewed position without future moves", () => {
  const s = studyMove(parsePgn("1. e4 e5 2. Nf3 Nc6 *"), 2, "b1", "c3");
  expect(s.sans).toEqual(["e4", "e5", "Nc3"]);
});
it("rejects illegal PGN and FEN without modifying original", () => {
  expect(() => parsePgn("1. e5")).toThrow();
  expect(() => fromFen("bad")).toThrow();
});
it("computes material heuristic rather than claiming engine eval", () =>
  expect(materialEval(new Chess().fen())).toBe(0));
import { LIBRARY } from "./library";
it("replays sourced historical game legally through all 136 plies", () => {
  const game = parsePgn(LIBRARY[0].pgn);
  expect(game.sans).toHaveLength(136);
  expect(game.headers.Result).toBe("0-1");
  expect(game.sans[game.sans.length - 1]).toBe("Kd5");
});
import { OPENINGS } from "./openings";
it("opening starter lines all produce legal boards", () => {
  for (const o of OPENINGS)
    expect(parsePgn(o.moves).sans.length).toBeGreaterThan(0);
});
