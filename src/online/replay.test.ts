import { describe, it, expect } from "vitest";
import { replayTo } from "./replay";
import { variantFen } from "../chaturanga/variantRules";

describe("replayTo", () => {
  it("replays the opening ply by ply with the touched squares", () => {
    const r1 = replayTo("chess", ["e4", "e5"], 1)!;
    expect(variantFen(r1.pos)).toContain("/4P3/");
    expect(variantFen(r1.pos)).toContain("pppppppp"); // black pawns intact
    expect(r1.last).toEqual([12, 28]); // e2 -> e4
    const r2 = replayTo("chess", ["e4", "e5"], 2)!;
    expect(variantFen(r2.pos)).toContain("4p3");
    expect(r2.last).toEqual([52, 36]); // e7 -> e5
  });
  it("caps ply at the move count and returns the final position", () => {
    const r = replayTo("chess", ["e4"], 99)!;
    expect(variantFen(r.pos)).toBe(variantFen(replayTo("chess", ["e4"], 1)!.pos));
  });
  it("marks a capture's from and to squares", () => {
    const r = replayTo("chess", ["e4", "d5", "exd5"], 3)!;
    expect(r.last).toEqual([28, 35]); // e4 -> d5
  });
  it("returns null for fog, unparseable moves and non-positive ply", () => {
    expect(replayTo("fog", ["e2-e4"], 1)).toBeNull();
    expect(replayTo("chess", ["not-a-move"], 1)).toBeNull();
    expect(replayTo("chess", ["e4"], 0)).toBeNull();
  });
  it("replays variant openings from their own initial positions", () => {
    const r = replayTo("kingofthehill", ["e4"], 1)!;
    expect(variantFen(r.pos)).toContain("/4P3/");
  });
});
