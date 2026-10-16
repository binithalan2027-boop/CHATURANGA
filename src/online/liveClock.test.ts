import { describe, it, expect } from "vitest";
import { liveClock, formatClock } from "./liveClock";

describe("liveClock", () => {
  const base = { whiteMs: 60000, blackMs: 60000, status: "active" as const };
  it("decrements only the side to move", () => {
    expect(liveClock({ ...base, turn: "white" }, 1500)).toEqual({ whiteMs: 58500, blackMs: 60000 });
    expect(liveClock({ ...base, turn: "black" }, 1500)).toEqual({ whiteMs: 60000, blackMs: 58500 });
  });
  it("clamps at zero and ignores negative elapsed", () => {
    expect(liveClock({ ...base, turn: "white", whiteMs: 900 }, 5000).whiteMs).toBe(0);
    expect(liveClock({ ...base, turn: "white" }, -50).whiteMs).toBe(60000);
  });
  it("does not tick waiting or finished games", () => {
    expect(liveClock({ ...base, status: "waiting", turn: "white" }, 9000).whiteMs).toBe(60000);
    expect(liveClock({ ...base, status: "finished", turn: "black" }, 9000).blackMs).toBe(60000);
  });
});

describe("formatClock", () => {
  it("shows m:ss above ten seconds", () => {
    expect(formatClock(300000)).toBe("5:00");
    expect(formatClock(65000)).toBe("1:05");
    expect(formatClock(10500)).toBe("0:11");
  });
  it("shows tenths at ten seconds and below", () => {
    expect(formatClock(10000)).toBe("0:10.0");
    expect(formatClock(9501)).toBe("0:9.6");
    expect(formatClock(40)).toBe("0:0.1");
    expect(formatClock(0)).toBe("0:0.0");
    expect(formatClock(-500)).toBe("0:0.0");
  });
});
