import { describe, expect, it } from "vitest";
import { soundForSan } from "./sounds";

describe("soundForSan", () => {
  it("picks cues from SAN", () => {
    expect(soundForSan("e4", false)).toBe("move");
    expect(soundForSan("exd5", false)).toBe("capture");
    expect(soundForSan("Qh5+", false)).toBe("check");
    expect(soundForSan("Qxf7#", false)).toBe("check");
    expect(soundForSan("O-O", false)).toBe("move");
  });
  it("a finished game plays the end cue whatever the last move was", () => {
    expect(soundForSan("Qxf7#", true)).toBe("end");
    expect(soundForSan("e4", true)).toBe("end");
  });
  it("masked fog moves and missing SAN fall back to the plain move cue", () => {
    expect(soundForSan("?", false)).toBe("move");
    expect(soundForSan(null, false)).toBe("move");
    expect(soundForSan(undefined, false)).toBe("move");
  });
});
