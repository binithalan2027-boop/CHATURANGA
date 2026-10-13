import { describe, expect, it } from "vitest";
import { RULE_VARIANTS } from "./variantCatalog";
import { variantPosition, variantMoves, variantPlay } from "./variantRules";
import { localVariantMove, evaluate } from "./variantSearch";

describe("localVariantMove", () => {
  it("plays a legal move in every catalog variant", () => {
    for (const v of RULE_VARIANTS) {
      const pos = variantPosition(v.id);
      const r = localVariantMove(pos, { depth: 1, seed: 7 });
      expect(
        variantMoves(pos),
        `${v.id} reply ${r.best}`,
      ).toContain(r.best);
    }
  });
  it("takes a free queen in standard chess", () => {
    // white queen en prise on e4, white to move should capture with d-pawn
    const pos = variantPosition(
      "chess",
      "rnb1kbnr/pppp1ppp/8/4q3/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 1",
    );
    const r = localVariantMove(pos, { depth: 2, seed: 1 });
    expect(r.best).toBe("d4e5");
  });
  it("wins material rather than shuffling when ahead", () => {
    const pos = variantPosition(
      "chess",
      "rnb1kbnr/pppp1ppp/8/4q3/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 1",
    );
    const r = localVariantMove(pos, { depth: 2, seed: 1 });
    const after = variantPlay(pos, r.best);
    expect(evaluate(after.pos)).toBeGreaterThan(0);
  });
  it("jitter stays legal", () => {
    const pos = variantPosition("crazyhouse");
    for (const seed of [3, 17, 42, 88]) {
      const r = localVariantMove(pos, { depth: 1, jitter: 0.9, seed });
      expect(variantMoves(pos)).toContain(r.best);
    }
  });
  it("respects compulsory capture in antichess", () => {
    // antichess: a capture exists, engine must capture
    const pos = variantPosition(
      "antichess",
      "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    );
    const r = localVariantMove(pos, { depth: 2, seed: 5 });
    expect(r.best).toBe("e4d5");
  });
  it("throws with no legal moves", () => {
    const pos = variantPosition(
      "chess",
      "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",
    );
    expect(() => localVariantMove(pos)).toThrow();
  });
});
