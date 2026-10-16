import { describe, it, expect } from "vitest";
import { matchMoveInput } from "./keyboardMove";
import { variantPosition } from "../chaturanga/variantRules";
import { parseUci } from "chessops/util";
import { makeSan } from "chessops/san";

const start = variantPosition("chess");
const sanOf = (uci: string) => {
  const m = parseUci(uci);
  return m ? makeSan(start.clone(), m) : null;
};
const legal = ["e2e4", "d2d4", "g1f3", "e2e3"];

describe("matchMoveInput", () => {
  it("matches plain uci", () => {
    expect(matchMoveInput("e2e4", legal, sanOf)).toBe("e2e4");
    expect(matchMoveInput("  D2D4 ", legal, sanOf)).toBe("d2d4");
  });
  it("matches SAN with loose formatting", () => {
    expect(matchMoveInput("e4", legal, sanOf)).toBe("e2e4");
    expect(matchMoveInput("Nf3", legal, sanOf)).toBe("g1f3");
    expect(matchMoveInput("nf3", legal, sanOf)).toBe("g1f3");
  });
  it("matches captures and check decorations in SAN", () => {
    const pos = variantPosition("chess", "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2");
    const san2 = (uci: string) => {
      const m = parseUci(uci);
      return m ? makeSan(pos.clone(), m) : null;
    };
    expect(matchMoveInput("exd5", ["e4d5"], san2)).toBe("e4d5");
    expect(matchMoveInput("ed5", ["e4d5"], san2)).toBe("e4d5");
  });
  it("returns null for moves not in the legal list", () => {
    expect(matchMoveInput("e2e5", legal, sanOf)).toBeNull();
    expect(matchMoveInput("Qh5", legal, sanOf)).toBeNull();
    expect(matchMoveInput("", legal, sanOf)).toBeNull();
  });
  it("matches promotion uci", () => {
    expect(matchMoveInput("e7e8q", ["e7e8q"], () => "e8=Q")).toBe("e7e8q");
    expect(matchMoveInput("e8=Q", ["e7e8q"], () => "e8=Q")).toBe("e7e8q");
  });
});
