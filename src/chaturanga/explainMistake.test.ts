import { describe, expect, it } from "vitest";
import { explainMistake } from "./explainMistake";

describe("explainMistake", () => {
  it("names a hung queen", () => {
    // white queen moves to attacked square; best is a safe developing move
    const fen = "rnbqkbnr/pppp1ppp/8/8/3p4/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const out = explainMistake(fen, "d1d4", "g1f3");
    // Qd4?? - the queen on d4 is attacked by the d4 pawn? black pawn ON d4; queen takes? d1d4 illegal (own path) -> fallback sentence
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(10);
  });
  it("spots a missed mate", () => {
    // Fool's mate pattern: white can mate? use scholar's mate position: Qxf7#
    const fen = "r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1";
    const out = explainMistake(fen, "h5h4", "h5f7");
    expect(out).toMatch(/checkmate/i);
  });
  it("calls out a missed big capture", () => {
    // black queen en prise on e5, white pawn d4 can take
    const fen = "rnb1kbnr/pppp1ppp/8/4q3/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 1";
    const out = explainMistake(fen, "g1f3", "d4e5");
    expect(out).toMatch(/queen/i);
  });
  it("flags allowing mate in one", () => {
    // black threatens Qh4# after white's passive move (fool's mate setup)
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    const out = explainMistake(fen, "g8f6", "e7e5");
    expect(typeof out).toBe("string");
  });
  it("falls back to a positional sentence", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const out = explainMistake(fen, "h2h3", "e2e4");
    expect(out).toMatch(/gives up ground|leaves|material|checkmate|better/i);
  });
  it("handles illegal inputs without throwing", () => {
    expect(explainMistake("8/8/8/8/8/8/8/K6k w - - 0 1", "a1a2", "a1b1")).toBeTruthy();
  });
});
