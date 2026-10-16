import { describe, expect, it } from "vitest";
import { variantToken, parseBestMove } from "./fairyProtocol";
import { RULE_VARIANTS } from "./variantCatalog";

describe("variantToken", () => {
  it("covers every catalog variant", () => {
    for (const v of RULE_VARIANTS)
      expect(variantToken(v.id), v.id).toBeTruthy();
  });
  it("maps known variants to Fairy-Stockfish tokens", () => {
    expect(variantToken("crazyhouse")).toBe("crazyhouse");
    expect(variantToken("kingofthehill")).toBe("kingofthehill");
    expect(variantToken("3check")).toBe("3check");
    expect(variantToken("antichess")).toBe("antichess");
    expect(variantToken("atomic")).toBe("atomic");
    expect(variantToken("horde")).toBe("horde");
    expect(variantToken("racingkings")).toBe("racingkings");
    expect(variantToken("chess")).toBe("chess");
  });
});

describe("parseBestMove", () => {
  it("reads a normal bestmove", () => {
    expect(parseBestMove("bestmove e2e4 ponder e7e5")).toBe("e2e4");
  });
  it("reads a crazyhouse drop", () => {
    expect(parseBestMove("bestmove N@f3")).toBe("N@f3");
  });
  it("rejects (none) and junk", () => {
    expect(parseBestMove("bestmove (none)")).toBeNull();
    expect(parseBestMove("info depth 3")).toBeNull();
  });
});
