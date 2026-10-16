import { describe, it, expect } from "vitest";
import {
  fogInitial,
  fogFromFen,
  fogFen,
  fogPlay,
  fogLegalMoves,
  fogMovesFrom,
  fogView,
  fogAttacks,
  parseSquare,
  squareName,
  sq,
} from "./fogRules";

const play = (fen: string | null, uci: string) => {
  const s = fen ? fogFromFen(fen) : fogInitial();
  return fogPlay(s, {
    from: parseSquare(uci.slice(0, 2)),
    to: parseSquare(uci.slice(2, 4)),
    promotion: (uci[4] as "q" | "r" | "b" | "n" | undefined) ?? undefined,
  });
};

describe("fog engine", () => {
  it("has 20 opening moves like standard chess", () => {
    expect(fogLegalMoves(fogInitial())).toHaveLength(20);
  });
  it("serialises to FEN and back losslessly", () => {
    const s = play(fogFen(play(null, "e2e4")), "e7e5");
    expect(fogFen(fogFromFen(fogFen(s)))).toBe(fogFen(s));
  });
  it("allows moving the king onto an attacked square (no check concept)", () => {
    // Black queen on d8 attacks e7... construct: white king e2 with black rook e8 attacking file.
    const s = fogFromFen("4r3/8/8/8/8/8/4K3/8 w - - 0 1");
    const moves = fogMovesFrom(s, parseSquare("e2")).map((m) => squareName(m.to));
    expect(moves).toContain("e3"); // straight into the rook's file: legal here
  });
  it("king capture produces the win result", () => {
    const s = fogFromFen("8/8/8/8/8/8/4k3/4R3 w - - 0 1");
    const next = fogPlay(s, { from: parseSquare("e1"), to: parseSquare("e2"), promotion: undefined });
    expect(next.result).toBe("White wins by capturing the king");
  });
  it("castles with rights and rejects castling through attack", () => {
    const ok = fogFromFen("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    const moves = fogMovesFrom(ok, parseSquare("e1")).map((m) => squareName(m.to));
    expect(moves).toContain("g1");
    expect(moves).toContain("c1");
    const attacked = fogFromFen("r3k2r/8/8/8/8/8/5r2/R3K2R w KQkq - 0 1");
    const blocked = fogMovesFrom(attacked, parseSquare("e1")).map((m) => squareName(m.to));
    expect(blocked).not.toContain("g1"); // rook on f2 covers the f1 transit square
    expect(blocked).toContain("c1"); // queenside path is not attacked
  });
  it("supports en passant and promotion", () => {
    const after = play(fogFen(play(null, "e2e4")), "a7a6");
    const s2 = play(fogFen(after), "e4e5");
    const s3 = fogPlay(s2, { from: parseSquare("d7"), to: parseSquare("d5"), promotion: undefined });
    const ep = fogMovesFrom(s3, parseSquare("e5")).find((m) => squareName(m.to) === "d6");
    expect(ep).toBeTruthy();
    const s4 = fogPlay(s3, ep!);
    expect(s4.board[parseSquare("d5")]).toBeNull();
    const promo = fogFromFen("8/2P5/8/8/8/8/k6K/8 w - - 0 1");
    const moves = fogMovesFrom(promo, parseSquare("c7"));
    expect(moves).toHaveLength(4);
    const q = fogPlay(promo, moves.find((m) => m.promotion === "q")!);
    expect(q.board[parseSquare("c8")]).toBe("Q");
  });
  it("declares draw when a side has no moves", () => {
    // Black king and pawns are mutually boxed in; only the black queen can move.
    const pre = fogFromFen("7K/7q/8/8/8/8/pp6/kp5R w - - 0 1");
    const next = fogPlay(pre, { from: parseSquare("h1"), to: parseSquare("h7"), promotion: undefined });
    expect(next.result).toBe("Draw - no moves available");
  });
});

describe("fog projection", () => {
  it("hides far enemy pieces and reveals visible ones", () => {
    const s = fogInitial();
    const v = fogView(s, "w");
    const squares = new Set(v.pieces.map((p) => p.square));
    // White sees own back rank + pawns, and (via knight/pawn attacks) rank 3 squares.
    expect(squares.has(parseSquare("e1"))).toBe(true);
    expect(squares.has(parseSquare("e8"))).toBe(false); // black king hidden
    expect(squares.has(parseSquare("e7"))).toBe(false); // black pawn hidden
    expect(v.fog.length).toBeGreaterThan(0);
    expect(v.fog).not.toContain(parseSquare("e2"));
  });
  it("reveals enemy pieces on attacked squares", () => {
    // White rook e1, black king e8: rook attacks down the file.
    const s = fogFromFen("4k3/8/8/8/8/8/8/4R3 w - - 0 1");
    const v = fogView(s, "w");
    expect(v.pieces.some((p) => p.piece === "k")).toBe(true);
    expect(fogAttacks(s, "w").has(parseSquare("e8"))).toBe(true);
  });
  it("visibility includes pawn pushes but not fogged blockers' squares", () => {
    const s = fogInitial();
    const v = fogView(s, "w");
    const set = new Set(v.pieces.map((p) => p.square));
    expect(set.has(sq(4, 3))).toBe(false); // e4 empty but visible (not a piece)
    expect(v.fog).not.toContain(sq(4, 3)); // e4 visible via pawn double push
    expect(v.fog).toContain(sq(4, 4)); // e5 hidden
  });
});
