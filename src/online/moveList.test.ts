import { describe, it, expect } from "vitest";
import { moveRows } from "./moveList";

describe("moveRows", () => {
  it("pairs moves with row numbers", () => {
    expect(moveRows(["e4", "e5", "Nf3"])).toEqual([
      ["1.", "e4", "e5"],
      ["2.", "Nf3", null],
    ]);
  });
  it("handles empty and single move lists", () => {
    expect(moveRows([])).toEqual([]);
    expect(moveRows(["d4"])).toEqual([["1.", "d4", null]]);
  });
});
