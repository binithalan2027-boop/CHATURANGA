import { describe, it, expect, afterEach } from "vitest";
import { Store } from "./store";
import { Service } from "./service";
import { Entitlements } from "./entitlements";

let stores: Store[] = [];
afterEach(() => {
  stores.forEach((s) => s.close());
  stores = [];
});
function setup(free = 2) {
  let now = 1000;
  const store = new Store();
  stores.push(store);
  const s = new Service(store, () => now);
  for (const id of ["a", "b"]) {
    s.ensureUser(id);
    s.profile(id, {
      username: `user_${id}`,
      displayName: id,
      discoverable: true,
      adultConfirmed: true,
    });
  }
  return { s, store, ent: new Entitlements(store, "trial", free) };
}
function playOne(s: Service, a: string, b: string) {
  const r = s.create(a, "chess", 5);
  s.join(b, r);
  s.act(a, r, 1, "resign");
}
describe("entitlements (trial mode)", () => {
  it("counts only finished, played games across standard rooms", () => {
    const { s, ent } = setup();
    expect(ent.gamesPlayed("a")).toBe(0);
    playOne(s, "a", "b");
    expect(ent.gamesPlayed("a")).toBe(1);
    expect(ent.gamesPlayed("b")).toBe(1);
    // Cancelled room does not count.
    const r = s.create("a", "chess", 5);
    s.act("a", r, 0, "cancel");
    expect(ent.gamesPlayed("a")).toBe(1);
  });
  it("blocks create/join once free games are used, unlock restores", () => {
    const { s, ent } = setup(2);
    playOne(s, "a", "b");
    playOne(s, "a", "b");
    expect(() => ent.assertCanPlay("a")).toThrow("Free online games used");
    expect(() => ent.assertCanPlay("b")).toThrow("Free online games used");
    ent.grant("a");
    ent.assertCanPlay("a");
    expect(ent.status("a")).toEqual({ unlocked: true, played: 2, remaining: null });
    ent.revoke("a");
    expect(() => ent.assertCanPlay("a")).toThrow();
  });
  it("reports remaining games and is null when switch is off", () => {
    const { s, ent, store } = setup(3);
    playOne(s, "a", "b");
    expect(ent.status("a")).toEqual({ unlocked: false, played: 1, remaining: 2 });
    expect(new Entitlements(store, "off", 3).status("a")).toBeNull();
  });
});
