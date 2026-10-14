import { describe, it, expect } from "vitest";
import { materialFromFen } from "./material";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("materialFromFen", () => {
  it("is level on the starting position", () => {
    expect(materialFromFen(START_FEN)).toEqual({ capturedByWhite: [], capturedByBlack: [], lead: 0 });
  });
  it("counts a captured pawn", () => {
    // After 1.e4 d5 2.exd5 Black is missing a pawn.
    const m = materialFromFen("rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2");
    expect(m.capturedByWhite).toEqual(["p"]);
    expect(m.capturedByBlack).toEqual([]);
    expect(m.lead).toBe(1);
  });
  it("weights a lost queen as nine and keeps order stable", () => {
    // White missing queen and a rook; Black missing two knights.
    const m = materialFromFen("r1bqkb1r/pppppppp/8/8/8/8/PPPPPPPP/1NB1KBNR w KQkq - 0 1");
    expect(m.capturedByBlack).toEqual(["r", "q"]);
    expect(m.capturedByWhite).toEqual(["n", "n"]);
    expect(m.lead).toBe(6 - 14);
  });
});
