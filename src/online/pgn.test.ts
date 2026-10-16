import { describe, expect, it } from "vitest";
import { buildPgn, resultTag } from "./pgn";

describe("resultTag", () => {
  it("maps server result text case-insensitively", () => {
    expect(resultTag("white wins")).toBe("1-0");
    expect(resultTag("black wins on time")).toBe("0-1");
    expect(resultTag("White wins by resignation")).toBe("1-0");
    expect(resultTag("Draw by agreement")).toBe("1/2-1/2");
    expect(resultTag("Draw (threefold repetition)")).toBe("1/2-1/2");
  });
  it("uses * for unfinished or voided games", () => {
    expect(resultTag(null)).toBe("*");
    expect(resultTag("Room cancelled")).toBe("*");
    expect(resultTag("Abandoned - time expired")).toBe("*");
  });
});

const base = {
  rule: "chess",
  whiteName: "Asha",
  blackName: "Biru",
  result: "black wins by resignation",
  moves: ["d4", "d5", "c4", "e6"],
  initialMs: 300_000,
  activityAt: Date.UTC(2026, 9, 14, 7, 30),
};

describe("buildPgn", () => {
  it("emits the seven-tag roster plus time control", () => {
    const pgn = buildPgn(base);
    expect(pgn).toContain('[Event "Chaturanga friendly game"]');
    expect(pgn).toContain('[Date "2026.10.14"]');
    expect(pgn).toContain('[White "Asha"]');
    expect(pgn).toContain('[Black "Biru"]');
    expect(pgn).toContain('[Result "0-1"]');
    expect(pgn).toContain('[TimeControl "300+0"]');
    expect(pgn).not.toContain("[Variant");
  });
  it("pairs moves with numbers and ends with the result", () => {
    expect(buildPgn(base)).toContain("1. d4 d5 2. c4 e6 0-1");
  });
  it("adds a Variant header for variant rules", () => {
    expect(buildPgn({ ...base, rule: "atomic" })).toContain('[Variant "Atomic"]');
  });
  it("wraps movetext lines at 80 columns", () => {
    const long = buildPgn({
      ...base,
      moves: Array.from({ length: 60 }, (_, i) => (i % 3 === 0 ? "Nf3" : i % 3 === 1 ? "exd5+" : "O-O")),
    });
    for (const line of long.split("\n")) expect(line.length).toBeLessThanOrEqual(80);
  });
  it("escapes quotes in player names and tolerates a missing Black", () => {
    const pgn = buildPgn({ ...base, whiteName: 'Al "Ace" Asha', blackName: null });
    expect(pgn).toContain('[White "Al \\"Ace\\" Asha"]');
    expect(pgn).toContain('[Black "?"]');
  });
});
