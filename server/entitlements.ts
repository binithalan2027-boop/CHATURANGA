import type { Store } from "./store";

/**
 * Monetisation switch. OFF by default: no limits, no payments, nothing to buy.
 * When ENTITLEMENTS=trial the server allows FREE_ONLINE_GAMES finished online
 * games per player, then requires an unlock. There is deliberately NO payment
 * integration: unlocks are granted by an operator script until the owner
 * picks a payment rail (see docs/MONETISATION.md).
 */
export type EntitlementMode = "off" | "trial";

interface Entitlement {
  unlocked: boolean;
  at: number;
}
interface FinishedRoom {
  white?: string;
  black?: string;
  members?: string[];
  status: string;
  result: string | null;
}

export class Entitlements {
  constructor(
    public store: Store,
    private mode: EntitlementMode = "off",
    private freeGames = 3,
  ) {}
  static fromEnv(store: Store): Entitlements {
    const mode = process.env.ENTITLEMENTS === "trial" ? "trial" : "off";
    const freeGames = Math.max(
      1,
      Number(process.env.FREE_ONLINE_GAMES ?? 3) || 3,
    );
    return new Entitlements(store, mode, freeGames);
  }
  describe() {
    return { mode: this.mode, freeGames: this.freeGames };
  }
  unlocked(id: string): boolean {
    return (
      this.store.get<Entitlement>("entitlement", id)?.unlocked === true
    );
  }
  grant(id: string) {
    this.store.put("entitlement", id, { unlocked: true, at: Date.now() });
  }
  revoke(id: string) {
    this.store.delete("entitlement", id);
  }
  /** Finished, actually-played online games (standard + custom) for a player. */
  gamesPlayed(id: string): number {
    let n = 0;
    for (const r of this.store.all<FinishedRoom>("room"))
      if (
        r.status === "finished" &&
        r.result !== "Room cancelled" &&
        (r.white === id || r.black === id)
      )
        n++;
    for (const r of this.store.all<FinishedRoom>("custom"))
      if (
        r.status === "finished" &&
        r.result !== "Room cancelled" &&
        (r.members ?? []).includes(id)
      )
        n++;
    return n;
  }
  status(id: string) {
    if (this.mode === "off") return null;
    const unlocked = this.unlocked(id);
    const played = this.gamesPlayed(id);
    return {
      unlocked,
      played,
      remaining: unlocked ? null : Math.max(0, this.freeGames - played),
    };
  }
  /** Throws when a trial player has used their free games. */
  assertCanPlay(id: string): void {
    if (this.mode === "off" || this.unlocked(id)) return;
    if (this.gamesPlayed(id) >= this.freeGames)
      throw Error(
        `Free online games used (${this.freeGames}). Unlocks are not on sale yet - payments are switched off while the owner chooses a model.`,
      );
  }
}
