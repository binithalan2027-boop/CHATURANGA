import { it, expect } from "vitest";
import { Chess } from "chess.js";
import { chooseBotMove, BOTS } from "./bot";
it("every bot returns a legal move without mutating the position", () => {
  const c = new Chess();
  const fen = c.fen();
  for (const bot of BOTS) {
    const m = chooseBotMove(fen, bot.id, undefined, 3000);
    expect(() =>
      c.move({
        from: m.slice(0, 2),
        to: m.slice(2, 4),
        promotion: m[4] || "q",
      }),
    ).not.toThrow();
    c.undo();
    expect(c.fen()).toBe(fen);
  }
});
it("honors variant allowed-move filter", () => {
  const c = new Chess();
  for (const b of BOTS)
    expect(chooseBotMove(c.fen(), b.id, ["e2e4"], 1000)).toBe("e2e4");
});
it("returns empty at checkmate", () => {
  const c = new Chess();
  for (const m of ["f3", "e5", "g4", "Qh4#"]) c.move(m);
  expect(chooseBotMove(c.fen(), "tara")).toBe("");
});
