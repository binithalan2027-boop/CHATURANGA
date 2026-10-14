import { describe, expect, it } from "vitest";
import { openingForMoves } from "./opening";

describe("openingForMoves", () => {
  it("names the deepest book line", () => {
    expect(openingForMoves(["e4"])?.name).toBe("King's Pawn Game");
    expect(
      openingForMoves(["e4", "e5", "Nf3", "Nc6", "Bc4"])?.name,
    ).toBe("Italian Game");
  });
  it("keeps the last book name when the game leaves the book", () => {
    const hit = openingForMoves(["e4", "e5", "Nf3", "Nc6", "Bc4", "a6", "O-O", "h6"]);
    expect(hit?.name).toBe("Italian Game");
    expect(hit?.eco).toBe("C50");
  });
  it("returns null for no moves, unparseable moves, and off-book starts", () => {
    expect(openingForMoves([])).toBeNull();
    expect(openingForMoves(["nonsense"])).toBeNull();
  });
});
