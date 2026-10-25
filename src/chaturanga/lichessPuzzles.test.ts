import { describe, it, expect, beforeEach, vi } from "vitest";
import { Chess } from "chess.js";
import {
  prepareLichessPuzzle,
  parseUciMove,
  fetchLichessDailyPuzzle,
  getDailyCacheKey,
  LichessPuzzleRaw,
} from "./lichessPuzzles";

// Real recorded daily puzzle fixture from Lichess (ID: Mk8wu)
export const LICHESS_DAILY_FIXTURE: LichessPuzzleRaw = {
  game: {
    id: "J2qDTRwe",
    perf: { key: "classical", name: "Classical" },
    rated: true,
    players: [
      { name: "hazem999", id: "hazem999", color: "white", rating: 1832 },
      { name: "Herk", id: "herk", color: "black", rating: 1871 },
    ],
    pgn: "e4 c5 Bc4 e6 Bb5 a6 Ba4 b5 Bb3 c4 d4 Nf6 Bg5 Be7 f3 O-O g4 d5 e5 Nfd7 Be3 Nc6 Qe2 Bh4+ Kf1 cxb3 axb3 a5 Qg2 Be7 h4 b4 c3 Ba6+ Ne2 bxc3 bxc3 Qc7 Ke1 Rfb8 Nc1 Bb5 h5 a4 b4 Nb6 g5 Nc4 Bf2 Na7 g6 fxg6 hxg6 h6 Rh3 Be8 Qg4 Qd7 Na3 Nxa3 Rxa3 Nb5 Be3 Bg5 Bxg5 hxg5 Qh5 Kf8 Qh8+ Ke7 Qxg7+ Kd8 Qf6+ Kc8 g7 Bf7 Rh8+ Kb7 Rxa4",
  },
  puzzle: {
    id: "Mk8wu",
    rating: 2039,
    plays: 95786,
    initialPly: 78,
    solution: ["a8a4", "h8f8", "f7g8"],
    themes: ["middlegame", "short", "crushing", "hangingPiece", "defensiveMove"],
  },
};

describe("Lichess Puzzles Replay Semantics", () => {
  it("prepares puzzle after initialPly + 1 half-moves and sets up solver turn", () => {
    const prepared = prepareLichessPuzzle(LICHESS_DAILY_FIXTURE);

    expect(prepared.id).toBe("Mk8wu");
    expect(prepared.rating).toBe(2039);
    expect(prepared.themes).toContain("crushing");
    expect(prepared.initialPly).toBe(78);
    expect(prepared.setupMoveSan).toBe("Rxa4");

    // Total half-moves in game is 79 (0 to 78). Opponent setup move is at index 78.
    // The position after initialPly + 1 half-moves:
    expect(prepared.setupFen).toBe("rr5R/1k1q1bP1/4pQ2/1n1pP1p1/RP1P4/2P2P2/8/2N1K3 b - - 0 40");

    // Solver is Black
    expect(prepared.solverTurn).toBe("b");

    // Board in this position should indeed have black to move
    const testBoard = new Chess(prepared.setupFen);
    expect(testBoard.turn()).toBe("b");
  });

  it("asserts solution[0] is solver's move and opponent replies alternate correctly", () => {
    const prepared = prepareLichessPuzzle(LICHESS_DAILY_FIXTURE);
    const board = new Chess(prepared.setupFen);

    // Step 0: Solver plays solution[0] ("a8a4")
    const solverMove0 = parseUciMove(prepared.solution[0]);
    expect(solverMove0).toEqual({ from: "a8", to: "a4", promotion: undefined });
    const executed0 = board.move(solverMove0);
    expect(executed0).not.toBeNull();
    expect(executed0?.san).toBe("Rxa4");
    // Turn flips to opponent (white)
    expect(board.turn()).toBe("w");

    // Step 1: Opponent auto-reply is solution[1] ("h8f8")
    const oppMove1 = parseUciMove(prepared.solution[1]);
    expect(oppMove1).toEqual({ from: "h8", to: "f8", promotion: undefined });
    const executed1 = board.move(oppMove1);
    expect(executed1).not.toBeNull();
    expect(executed1?.san).toBe("Rf8");
    // Turn flips back to solver (black)
    expect(board.turn()).toBe("b");

    // Step 2: Solver plays solution[2] ("f7g8")
    const solverMove2 = parseUciMove(prepared.solution[2]);
    expect(solverMove2).toEqual({ from: "f7", to: "g8", promotion: undefined });
    const executed2 = board.move(solverMove2);
    expect(executed2).not.toBeNull();
    expect(executed2?.san).toBe("Bg8");

    // Solution sequence is complete
    expect(prepared.solution.length).toBe(3);
  });

  it("correctly parses promotion UCI move strings", () => {
    const parsed = parseUciMove("e7e8q");
    expect(parsed).toEqual({ from: "e7", to: "e8", promotion: "q" });

    const parsedKnight = parseUciMove("b2b1n");
    expect(parsedKnight).toEqual({ from: "b2", to: "b1", promotion: "n" });
  });

  it("throws descriptive error when PGN lacks required half-moves", () => {
    const invalidData: LichessPuzzleRaw = {
      game: { id: "short", pgn: "1. e4 e5" },
      puzzle: {
        id: "short-puz",
        rating: 1500,
        initialPly: 10,
        solution: ["d7d5"],
        themes: [],
      },
    };
    expect(() => prepareLichessPuzzle(invalidData)).toThrow(
      /PGN only has 2 half-moves, but puzzle requires initialPly 10 \+ 1/
    );
  });
});

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() {
    return Object.keys(this.store).length;
  }
  clear() {
    this.store = {};
  }
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

if (typeof globalThis.localStorage === "undefined") {
  globalThis.localStorage = new MockStorage();
}

describe("Lichess Daily Puzzle Caching & Rate Limiting", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("serves from localStorage cache on repeat calls without network access", async () => {
    const key = getDailyCacheKey();
    const fakePuzzle = {
      id: "cached-123",
      rating: 1900,
      themes: ["endgame"],
      initialPly: 20,
      solution: ["e1e8"],
      setupFen: "4r1k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1",
      solverTurn: "w" as const,
      gameId: "game-cached",
    };
    localStorage.setItem(key, JSON.stringify(fakePuzzle));

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await fetchLichessDailyPuzzle();
    expect(result.puzzle?.id).toBe("cached-123");
    expect(result.fromCache).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns a graceful offline message on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network offline"));

    const result = await fetchLichessDailyPuzzle(true);
    expect(result.puzzle).toBeNull();
    expect(result.error).toContain("offline");
  });

  it("handles 429 rate limit with backoff message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 429,
      ok: false,
    } as Response);

    const result = await fetchLichessDailyPuzzle(true);
    expect(result.puzzle).toBeNull();
    expect(result.error).toContain("429");
  });
});
