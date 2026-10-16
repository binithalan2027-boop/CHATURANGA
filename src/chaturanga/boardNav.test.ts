import { describe, expect, it } from "vitest";
import { navIndex } from "./boardNav";

describe("navIndex", () => {
  it("moves one square in each direction", () => {
    expect(navIndex(27, "ArrowRight")).toBe(28);
    expect(navIndex(27, "ArrowLeft")).toBe(26);
    expect(navIndex(27, "ArrowDown")).toBe(35);
    expect(navIndex(27, "ArrowUp")).toBe(19);
  });
  it("stops at the file edge instead of wrapping to the next rank", () => {
    expect(navIndex(7, "ArrowRight")).toBeNull();
    expect(navIndex(8, "ArrowLeft")).toBeNull();
  });
  it("stops at the rank edge", () => {
    expect(navIndex(56, "ArrowUp")).toBe(48);
    expect(navIndex(0, "ArrowUp")).toBeNull();
    expect(navIndex(63, "ArrowDown")).toBeNull();
  });
  it("ignores other keys", () => {
    expect(navIndex(27, "a")).toBeNull();
    expect(navIndex(27, "Enter")).toBeNull();
  });
});
