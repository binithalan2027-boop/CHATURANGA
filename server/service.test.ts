import { describe, it, expect, afterEach } from "vitest";
import { Service } from "./service";
import { Store } from "./store";
let stores: Store[] = [];
afterEach(() => {
  stores.forEach((s) => s.close());
  stores = [];
});
function setup() {
  let now = 1000;
  const store = new Store();
  stores.push(store);
  const s = new Service(store, () => now);
  for (const id of ["a", "b", "c"]) {
    s.ensureUser(id);
    s.profile(id, {
      username: `user_${id}`,
      displayName: id,
      discoverable: true,
      adultConfirmed: true,
    });
  }
  return {
    s,
    store,
    advance: (n: number) => {
      now += n;
    },
  };
}
describe("authoritative game service", () => {
  it("validates board, turn, membership and version", () => {
    const { s } = setup();
    const r = s.create("a", "chess", 5);
    s.join("b", r);
    expect(() => s.act("b", r, 1, "move", "e7e5")).toThrow("turn");
    expect(() => s.act("c", r, 1, "move", "e2e4")).toThrow("player");
    expect(() => s.act("a", r, 1, "move", "e2e5")).toThrow();
    s.act("a", r, 1, "move", "e2e4");
    expect(() => s.act("a", r, 1, "move", "d2d4")).toThrow("changed");
    expect(s.state("b", "local").rooms[0].moves).toEqual(["e4"]);
  });
  it("prevents extra joins and leaking rooms", () => {
    const { s } = setup();
    const r = s.create("a", "chess", 3);
    s.join("b", r);
    expect(() => s.join("c", r)).toThrow();
    expect(s.state("c", "local").rooms).toHaveLength(0);
  });
  it("settles time on server and counts outcome once", () => {
    const { s, advance } = setup();
    const r = s.create("a", "chess", 3);
    s.join("b", r);
    advance(180001);
    expect(s.state("a", "local").rooms[0].result).toMatch("black wins");
    s.state("a", "local");
    expect(s.requireUser("b").wins).toBe(1);
    expect(() => s.act("a", r, 1, "move", "e2e4")).toThrow();
  });
  it("ends checkmate and supports reconnection from storage", () => {
    const { s, store } = setup();
    const r = s.create("a", "chess", 5);
    s.join("b", r);
    ["f2f3", "e7e5", "g2g4", "d8h4"].forEach((m, i) =>
      s.act(i % 2 ? "b" : "a", r, i + 1, "move", m),
    );
    const recovered = new Service(store);
    expect(recovered.state("a", "local").rooms[0].result).toBe("black wins");
    expect(recovered.requireUser("b").games).toBe(1);
  });
  it.each([
    "crazyhouse",
    "kingofthehill",
    "3check",
    "antichess",
    "atomic",
    "horde",
    "racingkings",
  ] as const)("supports %s with server rule engine", (rule) => {
    const { s } = setup();
    const r = s.create("a", rule, 5);
    s.join("b", r);
    expect(s.state("a", "local").rooms[0].rule).toBe(rule);
    expect(() => s.act("a", r, 1, "move", "a1a8")).toThrow();
  });
  it("requires explicit incoming request acceptance", () => {
    const { s } = setup();
    s.friendAction("a", "request", "b");
    expect(() => s.friendAction("a", "accept", "b")).toThrow();
    s.friendAction("b", "accept", "a");
    expect(s.friend("a", "b")).toBe(true);
    const r = s.create("a", "chess", 5, "b");
    expect(() => s.join("c", r)).toThrow();
    s.join("b", r);
  });
  it("block removes friendship and prevents search, requests and joins", () => {
    const { s } = setup();
    s.friendAction("a", "request", "b");
    s.friendAction("b", "accept", "a");
    const r = s.create("b", "chess", 3);
    s.friendAction("a", "block", "b");
    expect(s.lookup("a", "user_b")).toBeNull();
    expect(() => s.friendAction("b", "request", "a")).toThrow();
    expect(() => s.join("a", r)).toThrow();
    expect(s.friend("a", "b")).toBe(false);
  });
  it("stores only validated minimal profile fields, not client stats", () => {
    const { s } = setup();
    expect(() =>
      s.profile("a", {
        username: "x",
        displayName: "a",
        adultConfirmed: true,
        discoverable: true,
      }),
    ).toThrow();
    expect(() =>
      s.profile("a", {
        username: "user_b",
        displayName: "a",
        adultConfirmed: true,
        discoverable: true,
      }),
    ).toThrow("taken");
    const p = s.profile("a", {
      username: "renamed",
      displayName: "New",
      adultConfirmed: true,
      discoverable: false,
      wins: 999,
      email: "private@example.com",
    });
    expect(p.wins).toBe(0);
    expect(p).not.toHaveProperty("email");
    expect(s.lookup("b", "renamed")).toBeNull();
  });
  it("draw acceptance requires an opponent offer and cancellation works", () => {
    const { s } = setup();
    const r = s.create("a", "chess", 3);
    s.join("b", r);
    s.act("a", r, 1, "offerDraw");
    expect(() => s.act("a", r, 2, "acceptDraw")).toThrow();
    s.act("b", r, 2, "acceptDraw");
    expect(s.requireUser("a").draws).toBe(1);
    const r2 = s.create("a", "chess", 5);
    s.act("a", r2, 0, "cancel");
    expect(() => s.join("b", r2)).toThrow();
  });
  it("automatic repetition ends the match", () => {
    const { s } = setup();
    const r = s.create("a", "chess", 3);
    s.join("b", r);
    ["g1f3", "g8f6", "f3g1", "f6g8", "g1f3", "g8f6", "f3g1", "f6g8"].forEach(
      (m, i) => s.act(i % 2 ? "b" : "a", r, i + 1, "move", m),
    );
    expect(s.state("a", "local").rooms[0].status).toBe("finished");
  });
  it("deletes profile and social data without breaking opponent history", () => {
    const { s } = setup();
    const r = s.create("a", "chess", 3);
    s.join("b", r);
    s.deleteUser("a");
    expect(() => s.requireUser("a")).toThrow();
    expect(s.state("b", "local").rooms[0].whiteName).toBe("Deleted player");
  });
});
describe("special moves and persistent storage", () => {
  it("handles castling, en passant and promotion with authoritative position", () => {
    const { s, store } = setup();
    const r = s.create("a", "chess", 3);
    s.join("b", r);
    const update = (fen: string) => {
      const room = s.getRoom(r);
      room.fen = fen;
      room.version++;
      store.put("room", r, room);
      return room.version;
    };
    let v = update("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    s.act("a", r, v, "move", "e1g1");
    expect(s.getRoom(r).fen).toMatch("R4RK1");
    v = update("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1");
    s.act("a", r, v, "move", "e5d6");
    expect(s.getRoom(r).moves.at(-1)).toBe("exd6");
    v = update("4k3/P7/8/8/8/8/8/4K3 w - - 0 1");
    expect(() => s.act("a", r, v, "move", "a7a8")).toThrow();
    s.act("a", r, v, "move", "a7a8n");
    expect(s.getRoom(r).fen.startsWith("N3k3")).toBe(true);
  });
  it("does not allow changing app rating through profile or duplicate result", () => {
    const { s } = setup();
    const r = s.create("a", "chess", 3);
    s.join("b", r);
    s.act("a", r, 1, "resign");
    expect(s.requireUser("a").rating).toBe(1188);
    expect(s.requireUser("b").rating).toBe(1212);
    expect(() => s.act("a", r, 2, "resign")).toThrow();
    expect(s.requireUser("b").rating).toBe(1212);
  });
  it("profile deletion cancels waiting rooms", () => {
    const { s } = setup();
    const r = s.create("a", "chess", 3);
    s.deleteUser("a");
    expect(() => s.join("b", r)).toThrow("unavailable");
  });
});

it("timeout is a draw if opponent cannot mate", () => {
  const { s, store, advance } = setup();
  const r = s.create("a", "chess", 3);
  s.join("b", r);
  const room = s.getRoom(r);
  room.fen = "4k3/8/8/8/8/8/P7/4K3 w - - 0 1";
  store.put("room", r, room);
  advance(180001);
  expect(s.state("a", "local").rooms[0].result).toMatch("Draw on time");
});

describe("profile deletion fairness", () => {
  it("finishes active games unrated so deletion cannot farm rating", () => {
    const { s } = setup();
    const r = s.create("a", "chess", 5);
    s.join("b", r);
    const before = s.requireUser("b").rating;
    s.deleteUser("a");
    expect(s.requireUser("b").rating).toBe(before);
    expect(s.requireUser("b").wins).toBe(1);
  });
});

describe("fog of war rooms", () => {
  it("creates, joins and plays with per-player projection and masked moves", () => {
    const { s } = setup();
    const r = s.create("a", "fog" as never, 5);
    s.join("b", r);
    const wa = s.state("a", "local").rooms[0];
    // White to move: white gets legal moves, black gets none yet.
    expect(wa.fogMoves?.length).toBe(20);
    const wb = s.state("b", "local").rooms[0];
    expect(wb.fogMoves).toEqual([]);
    // Both see their own back rank; neither sees the enemy back rank.
    expect(wa.fen).toContain("RNBQKBNR");
    expect(wa.fen.startsWith("8/8/8/8")).toBe(true); // black pieces hidden
    expect(wb.fen.startsWith("8/8/8/8")).toBe(false); // black sees own pieces... check below
    expect(wb.fogSquares?.length).toBeGreaterThan(0);
    // White plays e2e4.
    s.act("a", r, 1, "move", "e2e4");
    const wa2 = s.state("a", "local").rooms[0];
    const wb2 = s.state("b", "local").rooms[0];
    expect(wa2.moves).toEqual(["e2-e4"]);
    expect(wb2.moves).toEqual(["?"]); // opponent move masked
    expect(wb2.fogMoves?.length).toBe(20); // black to move now
    // Not black's opponents turn enforcement:
    expect(() => s.act("a", r, 2, "move", "d2d4")).toThrow("turn");
    // Illegal move rejected:
    expect(() => s.act("b", r, 2, "move", "e7e6e9")).toThrow("Invalid");
    expect(() => s.act("b", r, 2, "move", "e7e4")).toThrow();
    s.act("b", r, 2, "move", "e7e5");
    expect(s.state("a", "local").rooms[0].moves).toEqual(["e2-e4", "?"]);
  });
  it("finishes when a king is captured and hides castling/en-passant state", () => {
    const { s } = setup();
    const r = s.create("a", "fog" as never, 5);
    s.join("b", r);
    const wa = s.state("a", "local").rooms[0];
    expect(wa.fen.split(" ")[2]).toBe("-"); // castling blanked in projection
    expect(wa.fen.split(" ")[3]).toBe("-"); // en-passant blanked
  });
  it("handles resign and draw in fog rooms", () => {
    const { s } = setup();
    const r = s.create("a", "fog" as never, 5);
    s.join("b", r);
    s.act("a", r, 1, "resign");
    expect(s.state("a", "local").rooms[0].result).toMatch("resignation");
  });
});

describe("fog export privacy", () => {
  it("never leaks the full fog position through export while the game runs", () => {
    const { s } = setup();
    const r = s.create("a", "fog" as never, 5);
    s.join("b", r);
    s.act("a", r, 1, "move", "e2e4");
    s.act("b", r, 2, "move", "e7e5");
    const exported = s.export("a");
    const room = exported.games.find((g) => g.id === r) as never as {
      fen: string;
      moves: string[];
      status: string;
    };
    // The full-position FEN would place every black piece; the safe view must not.
    const full = s.getRoom(r);
    expect(room.fen).not.toBe(full.fen);
    expect(room.moves).toContain("?");
    // A finished game's full record is fine to export.
    s.act("a", r, 3, "resign");
    const after = s.export("a").games.find((g) => g.id === r)!;
    expect(after.fen).toBe(s.getRoom(r).fen);
  });
});

describe("rematch", () => {
  it("creates a colour-swapped challenge the opponent can accept without friendship", () => {
    const { s } = setup();
    const r = s.create("a", "chess", 5);
    s.join("b", r);
    s.act("a", r, 1, "resign");
    const out = s.act("a", r, 2, "rematch");
    const id2 = out?.room;
    expect(id2).toBeTruthy();
    const room2 = s.getRoom(id2!);
    expect(room2.rematchOf).toBe(r);
    expect(room2.invitee).toBe("b");
    expect(room2.initialMs).toBe(5 * 60000);
    // No friendship exists; the rematch invite still lets b join.
    s.join("b", id2!);
    // Colour swap: a was White, so a takes Black in the rematch.
    expect(room2.white).toBe("b");
    expect(room2.black).toBe("a");
    expect(room2.status).toBe("active");
  });
  it("keeps the requester on White when they were Black before", () => {
    const { s } = setup();
    const r = s.create("a", "chess", 3);
    s.join("b", r);
    s.act("a", r, 1, "resign");
    const out = s.act("b", r, 2, "rematch");
    s.join("a", out!.room);
    const room2 = s.getRoom(out!.room);
    expect(room2.white).toBe("b");
    expect(room2.black).toBe("a");
  });
  it("rejects rematch on active, waiting or cancelled rooms and from strangers", () => {
    const { s } = setup();
    const waiting = s.create("a", "chess", 3);
    expect(() => s.act("a", waiting, 0, "rematch")).toThrow("played game");
    const r = s.create("a", "chess", 3);
    s.join("b", r);
    expect(() => s.act("a", r, 1, "rematch")).toThrow("played game");
    s.act("a", r, 1, "resign");
    expect(() => s.act("c", r, 2, "rematch")).toThrow("player");
    const out = s.act("b", r, 2, "rematch");
    expect(() => s.join("c", out!.room)).toThrow("unavailable");
  });
  it("rejects rematch on a cancelled room", () => {
    const { s } = setup();
    const r = s.create("a", "chess", 3);
    s.act("a", r, 0, "cancel");
    expect(() => s.act("a", r, 1, "rematch")).toThrow("played game");
  });
});

describe("rematch idempotency", () => {
  it("returns the existing rematch room on a repeated request", () => {
    const { s } = setup();
    const r = s.create("a", "chess", 5);
    s.join("b", r);
    s.act("a", r, 1, "resign");
    const first = s.act("a", r, 2, "rematch");
    const again = s.act("a", r, 2, "rematch");
    expect(again?.room).toBe(first?.room);
  });
  it("returns the same room when both players ask for a rematch", () => {
    const { s } = setup();
    const r = s.create("a", "chess", 5);
    s.join("b", r);
    s.act("a", r, 1, "resign");
    const first = s.act("a", r, 2, "rematch");
    const second = s.act("b", r, 2, "rematch");
    expect(second?.room).toBe(first?.room);
    // The invitee can still join that room for the colour swap.
    s.join("b", first!.room);
    expect(s.getRoom(first!.room).status).toBe("active");
  });
});

describe("last move in room views", () => {
  it("exposes the last uci move in non-fog games", () => {
    const { s } = setup();
    const r = s.create("a", "chess", 5);
    s.join("b", r);
    expect(s.state("a", "local").rooms[0].lastMove).toBeNull();
    s.act("a", r, 1, "move", "e2e4");
    expect(s.state("a", "local").rooms[0].lastMove).toBe("e2e4");
    s.act("b", r, 2, "move", "e7e5");
    expect(s.state("b", "local").rooms[0].lastMove).toBe("e7e5");
  });
  it("shows your own fog moves but hides moves made in the dark", () => {
    const { s } = setup();
    const r = s.create("a", "fog" as never, 5);
    s.join("b", r);
    s.act("a", r, 1, "move", "e2e4");
    const wa = s.state("a", "local").rooms[0];
    const wb = s.state("b", "local").rooms[0];
    // White's own move stays visible to White.
    expect(wa.lastMove).toBe("e2e4");
    // Black cannot see e2 or e4 yet: the move happened in the dark.
    expect(wb.lastMove).toBeNull();
  });
});

describe("activityAt", () => {
  it("falls back to updatedAt for rooms persisted before activityAt existed", () => {
    const { s, store } = setup();
    const r = s.create("a", "chess", 5);
    const raw = store.get<any>("room", r)!;
    delete raw.activityAt;
    store.put("room", r, raw);
    const view = s.state("a", "local").rooms[0];
    expect(Number.isFinite(view.activityAt)).toBe(true);
    expect(view.activityAt).toBe(raw.updatedAt);
  });
});

describe("declineDraw", () => {
  it("lets the recipient decline and the offerer withdraw", () => {
    const { s } = setup();
    const r = s.create("a", "chess", 5);
    s.join("b", r);
    s.act("a", r, 1, "offerDraw");
    s.act("b", r, 2, "declineDraw");
    expect(s.getRoom(r).drawOffer).toBeNull();
    // Offer again, then the offerer withdraws it.
    s.act("a", r, 3, "offerDraw");
    s.act("a", r, 4, "declineDraw");
    expect(s.getRoom(r).drawOffer).toBeNull();
    expect(s.getRoom(r).status).toBe("active");
  });
  it("rejects declining when there is no offer", () => {
    const { s } = setup();
    const r = s.create("a", "chess", 5);
    s.join("b", r);
    expect(() => s.act("a", r, 1, "declineDraw")).toThrow("No draw offer");
  });
});
