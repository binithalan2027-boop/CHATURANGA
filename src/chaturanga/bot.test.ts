import { describe, it, expect } from "vitest";
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

describe("Khivin difficulty levels", () => {
  const fen = "rnb1kbnr/pppp1ppp/8/4q3/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 1"; // free queen on e5
  it("master takes the free queen", () => {
    expect(chooseBotMove(fen, "khivin", undefined, 8000, "master")).toBe("d4e5");
  });
  it("all levels return legal moves", () => {
    const c = new Chess();
    for (const lv of ["beginner", "club", "master"] as const) {
      const m = chooseBotMove(c.fen(), "khivin", undefined, 8000, lv);
      expect(c.moves({ verbose: true }).map((x) => x.from + x.to + (x.promotion || ""))).toContain(m);
    }
  });
  it("without a level, house defaults still apply", () => {
    expect(chooseBotMove(fen, "khivin", undefined, 8000)).toBe("d4e5");
  });
});
