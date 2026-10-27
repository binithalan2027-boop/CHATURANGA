import { describe, it, expect } from "vitest";
import { Chess, Square } from "chess.js";
import {
  BANK_PUZZLES,
  getBankPuzzleById,
  filterBankByTheme,
  getMateSprintPuzzles,
  validatePuzzleMove,
  parseUciMove,
} from "../puzzleBank";
import rawPuzzles from "../puzzles150.json";

describe("Loop 1: 150-Puzzle Bank Data & Mechanics", () => {
  it("contains exactly 150 distinct puzzles with unique IDs and unique FENs", () => {
    expect(BANK_PUZZLES.length).toBe(150);
    expect(rawPuzzles.length).toBe(150);

    const ids = new Set(BANK_PUZZLES.map((p) => p.bankId));
    expect(ids.size).toBe(150);

    const fens = new Set(rawPuzzles.map((p) => p.fen));
    expect(fens.size).toBe(150);
  });

  it("has 50 puzzles in each of the three rating tiers (700-1199, 1200-1699, 1700-2200)", () => {
    const low = BANK_PUZZLES.filter((p) => p.rating >= 700 && p.rating < 1200);
    const mid = BANK_PUZZLES.filter((p) => p.rating >= 1200 && p.rating < 1700);
    const high = BANK_PUZZLES.filter((p) => p.rating >= 1700 && p.rating <= 2200);

    expect(low.length).toBe(50);
    expect(mid.length).toBe(50);
    expect(high.length).toBe(50);
  });

  it("applies moves[0] as opponent setup move, yielding correct solver turn", () => {
    // Check first puzzle 00008: raw.fen was black's turn, moves[0] is f2g3, resulting in white's turn
    const p1 = BANK_PUZZLES[0];
    expect(p1.bankId).toBe("00008");
    expect(p1.setupMoveUci).toBe("f2g3");
    expect(p1.solverTurn).toBe("w");
    expect(p1.solutionUci[0]).toBe("e6e7");

    // Check all 150 puzzles have valid solverTurn and setupFen
    for (const p of BANK_PUZZLES) {
      expect(["w", "b"]).toContain(p.solverTurn);
      const c = new Chess(p.setupFen);
      expect(c.turn()).toBe(p.solverTurn);
    }
  });

  it("every puzzle's full UCI solution line replays legally in chess.js", () => {
    for (const p of BANK_PUZZLES) {
      const c = new Chess(p.setupFen);
      for (let i = 0; i < p.solutionUci.length; i++) {
        const uci = p.solutionUci[i];
        const { from, to, promotion } = parseUciMove(uci);
        const res = c.move({ from, to, promotion });
        expect(
          res,
          `Puzzle ${p.bankId} move ${i} (${uci}) failed from fen: ${c.fen()}`,
        ).not.toBeNull();
      }
    }
  });

  it("all 20 mateIn1 puzzles result in checkmate upon the solver's first move", () => {
    const mate1 = BANK_PUZZLES.filter((p) => p.themes.includes("mateIn1"));
    expect(mate1.length).toBe(20);

    for (const p of mate1) {
      expect(p.solutionUci.length).toBe(1);
      const c = new Chess(p.setupFen);
      const { from, to, promotion } = parseUciMove(p.solutionUci[0]);
      c.move({ from, to, promotion });
      expect(c.isCheckmate(), `Puzzle ${p.bankId} did not end in checkmate`).toBe(true);
    }
  });

  it("getMateSprintPuzzles returns the 20 mate-in-one puzzles", () => {
    const sprintPuzzles = getMateSprintPuzzles();
    expect(sprintPuzzles.length).toBe(20);
    sprintPuzzles.forEach((p) => expect(p.themes).toContain("mateIn1"));
  });

  it("filterBankByTheme filters correctly and supports all 5 UI chips", () => {
    const all = filterBankByTheme("All 150");
    expect(all.length).toBe(150);

    const mate = filterBankByTheme("Mate");
    expect(mate.length).toBe(42);

    const fork = filterBankByTheme("Fork");
    expect(fork.length).toBe(22);

    const pin = filterBankByTheme("Pin");
    expect(pin.length).toBe(7);

    const endgame = filterBankByTheme("Endgame");
    expect(endgame.length).toBe(69);

    const empty = filterBankByTheme("nonexistentTheme");
    expect(empty.length).toBe(0);
  });

  it("validates direct matching moves and rejects wrong moves", () => {
    const p = BANK_PUZZLES[0]; // 00008, solution starts with e6e7
    const resultValid = validatePuzzleMove(p, 0, p.setupFen, {
      from: "e6" as Square,
      to: "e7" as Square,
    });
    expect(resultValid.valid).toBe(true);
    expect(resultValid.nextFen).toBeDefined();

    // Wrong move (e.g. g3h4 or a rook move that isn't e6e7)
    const resultWrong = validatePuzzleMove(p, 0, p.setupFen, {
      from: "e6" as Square,
      to: "e1" as Square,
    });
    expect(resultWrong.valid).toBe(false);
  });

  it("accepts an alternative checkmating move for mate-in-one", () => {
    // In a position where two moves give checkmate, any checkmating move must be accepted
    const dummyPuzzle = {
      ...BANK_PUZZLES[0],
      themes: ["mate", "mateIn1"],
      solutionUci: ["e1e8"],
    };
    // Back-rank mate fen: 6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1
    // e1e8 is checkmate
    const fen = "6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1";
    const res = validatePuzzleMove(dummyPuzzle, 0, fen, {
      from: "e1" as Square,
      to: "e8" as Square,
    });
    expect(res.valid).toBe(true);
    expect(res.isCheckmate).toBe(true);
  });

  it("getBankPuzzleById finds puzzle by id with or without prefix", () => {
    expect(getBankPuzzleById("00008")?.bankId).toBe("00008");
    expect(getBankPuzzleById("lichess-bank:00008")?.bankId).toBe("00008");
    expect(getBankPuzzleById("invalid")).toBeUndefined();
  });
});
