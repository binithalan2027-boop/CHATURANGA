import { describe, it, expect } from "vitest";
import { generatePlayerId, isValidPlayerId, formatPlayerId, normalizePlayerId } from "../playerId";
import { getCurrentUser, signInWithGoogle, signOutUser } from "../authStore";

describe("8-Digit Player ID & Auth System", () => {
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

  it("creates and retrieves default guest user with an 8-digit player ID", () => {
    const user = getCurrentUser();
    expect(user).toBeDefined();
    expect(user.playerId).toHaveLength(8);
    expect(isValidPlayerId(user.playerId)).toBe(true);
    expect(user.rating).toBe(1200);
    expect(user.provider).toBe("guest");
  });

  it("signs in with Google, assigns 8-digit player ID and preserves basic player info", () => {
    const googleProfile = {
      name: "Grandmaster Vinit",
      email: "vinit.player@gmail.com",
      picture: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      bio: "Mastering Chaturanga variants and quick mental math.",
    };

    const user = signInWithGoogle(googleProfile);
    expect(user.provider).toBe("google");
    expect(user.name).toBe("Grandmaster Vinit");
    expect(user.email).toBe("vinit.player@gmail.com");
    expect(user.picture).toBe("https://lh3.googleusercontent.com/a/default-user=s96-c");
    expect(user.bio).toBe("Mastering Chaturanga variants and quick mental math.");
    expect(user.playerId).toHaveLength(8);
    expect(isValidPlayerId(user.playerId)).toBe(true);
    expect(user.rating).toBe(1200);

    // Verify persistence
    const loaded = getCurrentUser();
    expect(loaded.email).toBe("vinit.player@gmail.com");
    expect(loaded.playerId).toBe(user.playerId);
  });

  it("signs out and generates a fresh guest user with a new 8-digit player ID", () => {
    const guest = signOutUser();
    expect(guest.provider).toBe("guest");
    expect(guest.email).toContain("@chaturanga.local");
    expect(guest.playerId).toHaveLength(8);
  });
});
