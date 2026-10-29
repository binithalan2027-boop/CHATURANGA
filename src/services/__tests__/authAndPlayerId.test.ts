import { describe, it, expect, beforeEach } from "vitest";
import { generatePlayerId, isValidPlayerId, formatPlayerId, normalizePlayerId } from "../playerId";
import { getCurrentUser, signInWithGoogle, signOutUser } from "../authStore";
import { getLocalStats, recordMatchRating } from "../../chaturanga/stats";
import { getUnlockedAchievementIds, unlockAchievement, isAchievementUnlocked } from "../../chaturanga/achievements";

// Polyfill localStorage in Node test runner
const mockStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStore[key] ?? null,
  setItem: (key: string, value: string) => { mockStore[key] = String(value); },
  removeItem: (key: string) => { delete mockStore[key]; },
  clear: () => { for (const k of Object.keys(mockStore)) delete mockStore[k]; },
};
if (typeof globalThis.localStorage === "undefined") {
  (globalThis as any).localStorage = localStorageMock;
}

describe("8-Digit Player ID & Auth System", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("generates an 8-character uppercase alphanumeric ID", () => {
    const id = generatePlayerId();
    expect(id).toHaveLength(8);
    expect(isValidPlayerId(id)).toBe(true);
    expect(/^[A-Z0-9]{8}$/.test(id)).toBe(true);
  });

  it("formats and normalizes 8-digit Player IDs correctly", () => {
    const raw = "K9X2M7P4";
    const formatted = formatPlayerId(raw);
    expect(formatted).toBe("K9X2-M7P4");
    expect(normalizePlayerId("k9x2-m7p4")).toBe("K9X2M7P4");
    expect(normalizePlayerId("  K9X2 M7P4  ")).toBe("K9X2M7P4");
  });

  it("creates and retrieves default guest user with an 8-digit player ID and 0 prior games", () => {
    const user = getCurrentUser();
    expect(user).toBeDefined();
    expect(user.playerId).toHaveLength(8);
    expect(isValidPlayerId(user.playerId)).toBe(true);
    expect(user.rating).toBe(1200);
    expect(user.provider).toBe("guest");

    // Fresh profile must start with 0 prior games and 0 stamps
    const stats = getLocalStats(user.playerId);
    expect(stats.gamesPlayed).toBe(0);
    expect(stats.gamesWon).toBe(0);
    expect(stats.history).toEqual([]);

    const unlocked = getUnlockedAchievementIds(user.playerId);
    expect(unlocked).toEqual([]);
  });

  it("signs in with Google, assigns 8-digit player ID and preserves basic player info", () => {
    const googleProfile = {
      name: "Grandmaster Vinit",
      email: "vinit.player@gmail.com",
      picture: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      bio: "Mastering Chaturanga variants and quick mental math.",
      emailVerified: true,
    };

    const user = signInWithGoogle(googleProfile);
    expect(user.provider).toBe("google");
    expect(user.name).toBe("Grandmaster Vinit");
    expect(user.email).toBe("vinit.player@gmail.com");
    expect(user.picture).toBe("https://lh3.googleusercontent.com/a/default-user=s96-c");
    expect(user.bio).toBe("Mastering Chaturanga variants and quick mental math.");
    expect(user.emailVerified).toBe(true);
    expect(user.playerId).toHaveLength(8);
    expect(isValidPlayerId(user.playerId)).toBe(true);
    expect(user.rating).toBe(1200);

    // Verify persistence
    const loaded = getCurrentUser();
    expect(loaded.email).toBe("vinit.player@gmail.com");
    expect(loaded.playerId).toBe(user.playerId);
  });

  it("restores existing player ID when signing back into an already registered email", () => {
    const firstLogin = signInWithGoogle({
      name: "Player One",
      email: "player1@example.com",
      emailVerified: true,
    });
    const player1Id = firstLogin.playerId;

    // Sign out to guest
    const guest = signOutUser();
    expect(guest.playerId).not.toBe(player1Id);

    // Sign into a different email -> gets a distinct player ID
    const secondUser = signInWithGoogle({
      name: "Player Two",
      email: "player2@example.com",
      emailVerified: true,
    });
    expect(secondUser.playerId).not.toBe(player1Id);

    // Sign back into first email -> preserves original player ID
    const restored = signInWithGoogle({
      name: "Player One",
      email: "player1@example.com",
      emailVerified: true,
    });
    expect(restored.playerId).toBe(player1Id);
  });

  it("isolates game history and rating stats per player ID", () => {
    const playerA = "PLYR0001";
    const playerB = "PLYR0002";

    // Record game win for Player A
    recordMatchRating("Tactical Bot", 1200, "win", 90.0, "Standard Chess", playerA);

    const statsA = getLocalStats(playerA);
    expect(statsA.gamesPlayed).toBe(1);
    expect(statsA.gamesWon).toBe(1);
    expect(statsA.history).toHaveLength(1);

    // Player B should still have completely clean stats
    const statsB = getLocalStats(playerB);
    expect(statsB.gamesPlayed).toBe(0);
    expect(statsB.gamesWon).toBe(0);
    expect(statsB.history).toHaveLength(0);
  });

  it("isolates unlocked achievement stamps per player ID", () => {
    const playerA = "PLYR0001";
    const playerB = "PLYR0002";

    unlockAchievement("first-win", playerA);
    expect(isAchievementUnlocked("first-win", playerA)).toBe(true);
    expect(isAchievementUnlocked("first-win", playerB)).toBe(false);

    expect(getUnlockedAchievementIds(playerA)).toContain("first-win");
    expect(getUnlockedAchievementIds(playerB)).toEqual([]);
  });

  it("automatically purges legacy mock stats if encountered", () => {
    const legacyMock = {
      gamesPlayed: 14,
      gamesWon: 9,
      gamesLost: 3,
      gamesDrawn: 2,
      currentRating: 1342,
      peakRating: 1380,
      history: [
        { id: "game-1", opponentName: "Tactical Bot" },
        { id: "game-2", opponentName: "Guest #4912" },
        { id: "game-3", opponentName: "Aarav" },
      ],
    };
    (globalThis as any).localStorage.setItem("chaturanga_stats_MOCK0001", JSON.stringify(legacyMock));

    const cleaned = getLocalStats("MOCK0001");
    expect(cleaned.gamesPlayed).toBe(0);
    expect(cleaned.gamesWon).toBe(0);
    expect(cleaned.history).toEqual([]);
  });
});
