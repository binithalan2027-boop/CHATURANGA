import { it, expect } from "vitest";
import { parseEngineInfo } from "./stockfishProtocol";
it("parses score, depth and principal variation", () =>
  expect(
    parseEngineInfo("info depth 10 score cp -38 nodes 20 pv e2e4 e7e5"),
  ).toEqual({ cp: -38, mate: undefined, depth: 10, pv: ["e2e4", "e7e5"] }));
it("preserves mate scores separately", () =>
  expect(parseEngineInfo("info depth 8 score mate 2 pv f7g7")?.mate).toBe(2));
it("ignores unscored protocol chatter", () =>
  expect(parseEngineInfo("uciok")).toBeNull());
