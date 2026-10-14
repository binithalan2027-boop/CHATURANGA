import { describe, it, expect } from "vitest";
import { premoveUci } from "./premove";
import { variantPosition } from "../chaturanga/variantRules";

const start = () => variantPosition("chess");

describe("premoveUci", () => {
  it("builds a normal premove for your own piece", () => {
    expect(premoveUci(start(), 52, 36, "black")).toBe("e7e5"); // e7 -> e5
  });
  it("rejects the opponent's pieces and empty squares", () => {
    expect(premoveUci(start(), 12, 28, "black")).toBeNull(); // white pawn
    expect(premoveUci(start(), 28, 36, "black")).toBeNull(); // empty e4
  });
  it("rejects self-capture targets and same-square clicks", () => {
    expect(premoveUci(start(), 52, 53, "black")).toBeNull(); // e7 -> f7 own pawn
    expect(premoveUci(start(), 52, 52, "black")).toBeNull();
  });
  it("auto-queens pawn premoves to the last rank", () => {
    const pos = variantPosition("chess", "4k3/8/8/8/8/8/6p1/K7 b - - 0 1");
    expect(premoveUci(pos, 14, 6, "black")).toBe("g2g1q");
  });
});
