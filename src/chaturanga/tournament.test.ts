import { it, expect } from "vitest";
import { makeTournament, standings, joinLocalTournament } from "./tournament";
it("pairs every player exactly once, with no double booking per round", () => {
  for (const count of [2, 3, 4, 5, 8, 16]) {
    const t = makeTournament(
      "test",
      Array.from({ length: count }, (_, i) => "Player " + i),
    );
    expect(t.fixtures.length).toBe((count * (count - 1)) / 2);
    expect(
      new Set(t.fixtures.map((f) => [f.white, f.black].sort().join("|"))).size,
    ).toBe(t.fixtures.length);
    for (const r of new Set(t.fixtures.map((f) => f.round))) {
      const seats = t.fixtures
        .filter((f) => f.round === r)
        .flatMap((f) => [f.white, f.black]);
      expect(new Set(seats).size).toBe(seats.length);
    }
  }
});
it("updates standings from manual result", () => {
  const t = makeTournament("test", ["A", "B"]);
  t.fixtures[0].result = "1-0";
  expect(standings(t)[0].name).toBe(t.fixtures[0].white);
  expect(standings(t)[0].points).toBe(1);
});
it("join rebuilds schedule only before start", () => {
  let t = makeTournament("test", ["A", "B"]);
  t = joinLocalTournament(t, "C");
  expect(t.players.length).toBe(3);
  t.fixtures[0].result = "1/2-1/2";
  expect(() => joinLocalTournament(t, "D")).toThrow();
});
it("rejects duplicate or too-small player fields", () => {
  expect(() => makeTournament("test", ["A", "a"])).toThrow();
  expect(() => makeTournament("test", ["A"])).toThrow();
});
