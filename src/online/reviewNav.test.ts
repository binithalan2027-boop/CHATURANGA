import { describe, expect, it } from "vitest";
import { nextReviewPly } from "./reviewNav";

describe("nextReviewPly", () => {
  it("ArrowLeft from live enters review one move back", () => {
    expect(nextReviewPly(null, 5, "ArrowLeft")).toBe(4);
  });
  it("ArrowLeft steps back and clamps at the first move", () => {
    expect(nextReviewPly(3, 5, "ArrowLeft")).toBe(2);
    expect(nextReviewPly(1, 5, "ArrowLeft")).toBe(1);
  });
  it("ArrowRight steps forward and returns to live at the end", () => {
    expect(nextReviewPly(2, 5, "ArrowRight")).toBe(3);
    expect(nextReviewPly(4, 5, "ArrowRight")).toBeNull();
    expect(nextReviewPly(5, 5, "ArrowRight")).toBeNull();
  });
  it("ArrowRight while live does nothing", () => {
    expect(nextReviewPly(null, 5, "ArrowRight")).toBeUndefined();
  });
  it("Home jumps to the first move; End and Escape return to live", () => {
    expect(nextReviewPly(3, 5, "Home")).toBe(1);
    expect(nextReviewPly(null, 5, "Home")).toBe(1);
    expect(nextReviewPly(3, 5, "End")).toBeNull();
    expect(nextReviewPly(3, 5, "Escape")).toBeNull();
    expect(nextReviewPly(null, 5, "End")).toBeUndefined();
  });
  it("ignores games with no moves and unrelated keys", () => {
    expect(nextReviewPly(null, 0, "ArrowLeft")).toBeUndefined();
    expect(nextReviewPly(2, 5, "a")).toBeUndefined();
  });
  it("a one-move game steps straight back to the first move", () => {
    expect(nextReviewPly(null, 1, "ArrowLeft")).toBe(1);
    expect(nextReviewPly(1, 1, "ArrowRight")).toBeNull();
  });
});
