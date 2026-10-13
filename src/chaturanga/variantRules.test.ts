import { it, expect } from "vitest";
import {
  variantPosition,
  variantMoves,
  variantPlay,
  variantFen,
} from "./variantRules";
import { RULE_VARIANTS } from "./variantCatalog";
it("all eight defaults roundtrip and offer legal moves", () => {
  for (const v of RULE_VARIANTS) {
    const p = variantPosition(v.id);
    expect(variantMoves(p).length).toBeGreaterThan(0);
    expect(variantFen(variantPosition(v.id, variantFen(p)))).toBe(
      variantFen(p),
    );
  }
});
it("crazyhouse captures supply pockets and allow drops", () => {
  let p = variantPosition("crazyhouse");
  for (const u of ["e2e4", "d7d5", "e4d5", "g8f6"]) p = variantPlay(p, u).pos;
  expect(p.pockets?.white.pawn).toBe(1);
  expect(variantMoves(p)).toContain("P@e4");
  p = variantPlay(p, "P@e4").pos;
  expect(p.pockets?.white.pawn).toBe(0);
});
it("KOTH ends on a central king arrival", () => {
  let p = variantPosition("kingofthehill", "7k/8/8/8/8/3K4/8/8 w - - 0 1");
  p = variantPlay(p, "d3d4").pos;
  expect(p.outcome()?.winner).toBe("white");
});
it("antichess requires capture and permits nonroyal kings", () => {
  const p = variantPosition("antichess", "7k/8/8/8/8/8/p7/R6K w - - 0 1");
  expect(variantMoves(p)).toEqual(["a1a2"]);
});
it("three-check ends when the remaining counter reaches zero", () => {
  let p = variantPosition("3check", "7k/8/8/8/8/8/R7/K7 w - - 1+3 0 1");
  p = variantPlay(p, "a2h2").pos;
  expect(p.outcome()?.winner).toBe("white");
});
it("atomic king explosion ends game", () => {
  let p = variantPosition("atomic", "6rk/8/8/8/8/8/8/K5R1 w - - 0 1");
  p = variantPlay(p, "g1g8").pos;
  expect(p.outcome()?.winner).toBe("white");
});
it("rejects illegal input without altering original", () => {
  const p = variantPosition("horde");
  const f = variantFen(p);
  expect(() => variantPlay(p, "a1a8")).toThrow();
  expect(variantFen(p)).toBe(f);
});
it("racing kings disallows giving check", () => {
  const p = variantPosition("racingkings");
  for (const u of variantMoves(p))
    expect(variantPlay(p, u).pos.isCheck()).toBe(false);
});
it("castling uses king-to-rook notation and relocates both pieces", () => {
  let p = variantPosition("chess", "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
  expect(variantMoves(p)).toContain("e1h1");
  p = variantPlay(p, "e1h1").pos;
  expect(p.board.get(6)?.role).toBe("king");
  expect(p.board.get(5)?.role).toBe("rook");
});
it("promotion offers four orthodox choices", () => {
  const p = variantPosition("chess", "7k/P7/8/8/8/8/8/7K w - - 0 1");
  for (const u of ["a7a8q", "a7a8r", "a7a8b", "a7a8n"])
    expect(variantMoves(p)).toContain(u);
});
it("pocket knight moves use N not K", () => {
  const p = variantPosition("crazyhouse", "7k/7p/8/8/8/8/8/K7[N] w - - 0 1");
  expect(variantMoves(p)).toContain("N@e4");
  expect(variantPlay(p, "N@e4").pos.board.get(28)?.role).toBe("knight");
});
