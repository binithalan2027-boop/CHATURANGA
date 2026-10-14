import { describe, it, expect } from "vitest";
import { roomCategory, sortRooms, roomLabel, lastMoveSquares, timeAgo, filterRooms } from "./roomList";
import type { RoomView } from "./types";

const base: RoomView = {
  id: "r1",
  rule: "chess",
  white: "a",
  black: "b",
  whiteName: "A",
  blackName: "B",
  fen: "",
  moves: [],
  version: 0,
  status: "active",
  turn: "white",
  whiteMs: 300000,
  blackMs: 300000,
  serverTime: 0,
  activityAt: 0,
  result: null,
  drawOffer: null,
  yourColor: "white",
  invitee: null,
};
const room = (over: Partial<RoomView>): RoomView => ({ ...base, ...over });

describe("roomCategory", () => {
  it("puts challenges to accept, your turn, opponent turn, waiting and finished in order", () => {
    expect(roomCategory(room({ status: "waiting", invitee: "me" }), "me")).toBe("accept");
    expect(roomCategory(room({ status: "waiting", invitee: "other" }), "me")).toBe("waiting");
    expect(roomCategory(room({ turn: "white", yourColor: "white" }), "me")).toBe("yourTurn");
    expect(roomCategory(room({ turn: "black", yourColor: "white" }), "me")).toBe("opponentTurn");
    expect(roomCategory(room({ status: "finished", result: "white wins" }), "me")).toBe("finished");
  });
});

describe("sortRooms", () => {
  it("orders action-needed games first and finished newest-first", () => {
    const finished1 = room({ id: "f1", status: "finished", result: "white wins", activityAt: 100 });
    const finished2 = room({ id: "f2", status: "finished", result: "Draw", activityAt: 200 });
    const opponent = room({ id: "o1", turn: "black", yourColor: "white" });
    const mine = room({ id: "m1", turn: "white", yourColor: "white" });
    const invite = room({ id: "i1", status: "waiting", invitee: "me" });
    const waiting = room({ id: "w1", status: "waiting", black: null, blackName: null });
    const sorted = sortRooms([finished1, opponent, finished2, waiting, mine, invite], "me");
    expect(sorted.map((r) => r.id)).toEqual(["i1", "m1", "o1", "w1", "f2", "f1"]);
  });
  it("keeps the input untouched", () => {
    const input = [room({ id: "a1" }), room({ id: "a2", status: "finished" })];
    const copy = [...input];
    sortRooms(input, "me");
    expect(input).toEqual(copy);
  });
});

describe("roomLabel", () => {
  it("describes each state plainly", () => {
    expect(roomLabel(room({ status: "waiting", invitee: "me" }), "me")).toBe("challenges you");
    expect(roomLabel(room({ turn: "white", yourColor: "white" }), "me")).toBe("your turn");
    expect(roomLabel(room({ turn: "black", yourColor: "white" }), "me")).toBe("opponent's turn");
    expect(roomLabel(room({ status: "waiting" }), "me")).toBe("waiting for an opponent");
    expect(roomLabel(room({ status: "finished", result: "black wins on time" }), "me")).toBe("black wins on time");
  });
});

describe("lastMoveSquares", () => {
  it("maps a normal move to from and to squares (a1=0)", () => {
    expect(lastMoveSquares("e2e4")).toEqual([12, 28]);
  });
  it("maps a promotion the same way", () => {
    expect(lastMoveSquares("a7a8q")).toEqual([48, 56]);
  });
  it("maps a crazyhouse drop to its target square only", () => {
    expect(lastMoveSquares("n@e4")).toEqual([28]);
  });
  it("returns nothing for empty or malformed input", () => {
    expect(lastMoveSquares(null)).toEqual([]);
    expect(lastMoveSquares("")).toEqual([]);
    expect(lastMoveSquares("i9i9")).toEqual([]);
  });
});

describe("timeAgo", () => {
  const now = 1_000_000_000;
  it("formats fresh, minute, hour and day ages", () => {
    expect(timeAgo(now, now - 10_000)).toBe("just now");
    expect(timeAgo(now, now - 3 * 60_000)).toBe("3m ago");
    expect(timeAgo(now, now - 5 * 3_600_000)).toBe("5h ago");
    expect(timeAgo(now, now - 2 * 86_400_000)).toBe("2d ago");
  });
  it("never goes negative on clock skew", () => {
    expect(timeAgo(now, now + 5_000)).toBe("just now");
  });
});

describe("timeAgo invalid input", () => {
  it("returns an empty string for missing, NaN, zero or negative stamps", () => {
    expect(timeAgo(1000, undefined as never)).toBe("");
    expect(timeAgo(1000, NaN)).toBe("");
    expect(timeAgo(1000, 0)).toBe("");
    expect(timeAgo(1000, -50)).toBe("");
  });
});

describe("filterRooms", () => {
  const mk = (id: string, over: Partial<RoomView>) => room({ id, ...over });
  const list = [
    mk("t1", { turn: "white", yourColor: "white" }),
    mk("t2", { turn: "black", yourColor: "white" }),
    mk("t3", { status: "waiting", invitee: "me" }),
    mk("t4", { status: "waiting", black: null, blackName: null }),
    mk("t5", { status: "finished", result: "Draw" }),
  ];
  it("groups actionable, waiting and finished games", () => {
    expect(filterRooms(list, "me", "all").map((r) => r.id)).toEqual(["t1", "t2", "t3", "t4", "t5"]);
    expect(filterRooms(list, "me", "needsYou").map((r) => r.id)).toEqual(["t1", "t3"]);
    expect(filterRooms(list, "me", "waiting").map((r) => r.id)).toEqual(["t2", "t4"]);
    expect(filterRooms(list, "me", "finished").map((r) => r.id)).toEqual(["t5"]);
  });
});
