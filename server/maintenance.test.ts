import { describe, it, expect, afterEach } from "vitest";
import { Store } from "./store";
import { sweepExpired } from "./maintenance";

let stores: Store[] = [];
afterEach(() => {
  stores.forEach((s) => s.close());
  stores = [];
});
const DAY = 86_400_000;

describe("retention sweep", () => {
  it("purges expired sessions, old finished games and stale reports", () => {
    const store = new Store();
    stores.push(store);
    const now = 1_000_000_000_000;
    store.put("session", "live", { id: "live", expires: now + DAY });
    store.put("session", "dead", { id: "dead", expires: now - 1 });
    store.put("room", "old", {
      id: "old",
      status: "finished",
      updatedAt: now - 200 * DAY,
    });
    store.put("room", "new", {
      id: "new",
      status: "finished",
      updatedAt: now - 10 * DAY,
    });
    store.put("room", "active", { id: "active", status: "active", updatedAt: 0 });
    store.put("custom", "cold", {
      id: "cold",
      status: "finished",
      finishedAt: now - 400 * DAY,
    });
    store.put("report", "stale", { id: "stale", updatedAt: now - 500 * DAY });
    store.put("report", "fresh", { id: "fresh", updatedAt: now - 5 * DAY });
    store.put("room", "staleWaiting", {
      id: "staleWaiting",
      status: "waiting",
      updatedAt: now - 10 * DAY,
    });
    store.put("custom", "staleCustomWaiting", {
      id: "staleCustomWaiting",
      status: "waiting",
      createdAt: now - 10 * DAY,
    });
    const r = sweepExpired(store, { now });
    expect(r).toEqual({
      sessions: 1,
      rooms: 1,
      waiting: 2,
      custom: 1,
      reports: 1,
    });
    expect(store.get("room", "staleWaiting")).toBeUndefined();
    expect(store.get("custom", "staleCustomWaiting")).toBeUndefined();
    expect(store.get("session", "live")).toBeTruthy();
    expect(store.get("room", "new")).toBeTruthy();
    expect(store.get("room", "active")).toBeTruthy();
    expect(store.get("report", "fresh")).toBeTruthy();
  });
  it("honours custom retention windows", () => {
    const store = new Store();
    stores.push(store);
    const now = 1_000_000_000_000;
    store.put("room", "r", {
      id: "r",
      status: "finished",
      updatedAt: now - 10 * DAY,
    });
    expect(sweepExpired(store, { now, gameRetentionDays: 7 }).rooms).toBe(1);
  });
});
