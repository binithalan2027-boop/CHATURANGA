import { describe, it, expect } from "vitest";
import { diffGlides, type GlidePiece } from "./pieceGlide";

const W = (role: string): GlidePiece => ({ color: "white", role });
const B = (role: string): GlidePiece => ({ color: "black", role });
const empty = () => Array<GlidePiece | null>(64).fill(null);
const sq = (name: string) => (8 - Number(name[1])) * 8 + (name.charCodeAt(0) - 97);

describe("diffGlides", () => {
  it("tracks a quiet move", () => {
    const a = empty(), b = empty();
    a[sq("e2")] = W("pawn");
    b[sq("e4")] = W("pawn");
    expect(diffGlides(a, b)).toEqual([{ from: sq("e2"), to: sq("e4"), piece: W("pawn") }]);
  });
  it("tracks a capture and ignores the captured piece", () => {
    const a = empty(), b = empty();
    a[sq("e4")] = W("pawn");
    a[sq("d5")] = B("pawn");
    b[sq("d5")] = W("pawn");
    expect(diffGlides(a, b)).toEqual([{ from: sq("e4"), to: sq("d5"), piece: W("pawn") }]);
  });
  it("tracks both pieces in castling", () => {
    const a = empty(), b = empty();
    a[sq("e1")] = W("king"); a[sq("h1")] = W("rook");
    b[sq("g1")] = W("king"); b[sq("f1")] = W("rook");
    expect(diffGlides(a, b)).toEqual([
      { from: sq("h1"), to: sq("f1"), piece: W("rook") },
      { from: sq("e1"), to: sq("g1"), piece: W("king") },
    ]);
  });
  it("tracks a promotion from the pawn's square", () => {
    const a = empty(), b = empty();
    a[sq("a7")] = W("pawn");
    b[sq("a8")] = W("queen");
    expect(diffGlides(a, b)).toEqual([{ from: sq("a7"), to: sq("a8"), piece: W("queen") }]);
  });
  it("tracks en passant without gliding the captured pawn", () => {
    const a = empty(), b = empty();
    a[sq("e5")] = W("pawn"); a[sq("d5")] = B("pawn");
    b[sq("d6")] = W("pawn");
    expect(diffGlides(a, b)).toEqual([{ from: sq("e5"), to: sq("d6"), piece: W("pawn") }]);
  });
  it("returns nothing for a pocket drop and for no change", () => {
    const a = empty(), b = empty();
    b[sq("e4")] = W("knight");
    expect(diffGlides(a, b)).toEqual([]);
    expect(diffGlides(b, b)).toEqual([]);
  });
});
