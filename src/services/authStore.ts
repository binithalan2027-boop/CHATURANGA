import { generatePlayerId, normalizePlayerId } from "./playerId";

export interface ChaturangaUser {
  id: string;
  playerId: string; // 8-digit alphanumeric ID, e.g. "K9X2M7P4"
  name: string;
  email: string;
  picture?: string;
  bio?: string;
  rating: number;
  peakRating: number;
  country?: string;
  timezone?: string;
  provider: "google" | "guest";
  createdAt: number;
  emailVerified?: boolean;
}

const STORAGE_KEY = "chaturanga_user_profile";
const ACCOUNTS_STORAGE_KEY = "chaturanga_accounts_v1";
const USER_CHANGE_EVENT = "chaturanga:user_changed";

const memoryStorage: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(key);
    }
  } catch {}
  return memoryStorage[key] ?? null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    }
  } catch {}
  memoryStorage[key] = value;
}

export function getSavedAccountByEmail(email: string): ChaturangaUser | null {
  try {
    const raw = getStorageItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return null;
    const accounts = JSON.parse(raw) as Record<string, ChaturangaUser>;
    const normalized = email.toLowerCase().trim();
    return accounts[normalized] || null;
  } catch {
    return null;
  }
}

export function saveAccountToDirectory(user: ChaturangaUser): void {
  try {
    if (!user.email || user.email.includes("@chaturanga.local")) return;
    const raw = getStorageItem(ACCOUNTS_STORAGE_KEY);
    const accounts = raw ? (JSON.parse(raw) as Record<string, ChaturangaUser>) : {};
    accounts[user.email.toLowerCase().trim()] = user;
    setStorageItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {}
}

function createDefaultGuest(): ChaturangaUser {
  const guestNum = Math.floor(1000 + Math.random() * 9000);
  const playerId = generatePlayerId();
  return {
    id: `guest_${playerId.toLowerCase()}`,
    playerId,
    name: `Guest #${guestNum}`,
    email: `guest${guestNum}@chaturanga.local`,
    rating: 1200,
    peakRating: 1200,
    bio: "Passionate chess & mental math player.",
    provider: "guest",
    createdAt: Date.now(),
  };
}

export function getCurrentUser(): ChaturangaUser {
  try {
    const raw = getStorageItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChaturangaUser;
      if (parsed && parsed.id) {
        // Ensure an 8-digit playerId exists
        if (!parsed.playerId || parsed.playerId.length !== 8) {
          parsed.playerId = generatePlayerId();
          saveCurrentUser(parsed);
        }
        return parsed;
      }
    }
  } catch {
    // Fall back to new guest
  }

  const defaultUser = createDefaultGuest();
  saveCurrentUser(defaultUser);
  return defaultUser;
}

export function saveCurrentUser(user: ChaturangaUser): void {
  try {
    setStorageItem(STORAGE_KEY, JSON.stringify(user));
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent(USER_CHANGE_EVENT, { detail: user })
      );
    }
  } catch (err) {
    console.error("Failed to persist user profile:", err);
  }
}

export function signInWithGoogle(data: {
  name: string;
  email: string;
  picture?: string;
  bio?: string;
  emailVerified?: boolean;
}): ChaturangaUser {
  const normalizedEmail = data.email.trim().toLowerCase();
  const existingAccount = getSavedAccountByEmail(normalizedEmail);

  if (existingAccount) {
    const updated: ChaturangaUser = {
      ...existingAccount,
      name: data.name.trim() || existingAccount.name,
      picture: data.picture || existingAccount.picture,
      bio: data.bio || existingAccount.bio,
      emailVerified: data.emailVerified !== undefined ? data.emailVerified : existingAccount.emailVerified ?? true,
      provider: "google",
    };
    saveAccountToDirectory(updated);
    saveCurrentUser(updated);
    return updated;
  }

  // Brand new user registration!
  // Assign a fresh 8-digit player ID
  const playerId = generatePlayerId();

  const googleUser: ChaturangaUser = {
    id: `google_${normalizePlayerId(playerId).toLowerCase()}`,
    playerId,
    name: data.name.trim() || data.email.split("@")[0],
    email: data.email.trim(),
    picture: data.picture || "/illustrations/knight.svg",
    bio: data.bio || "Passionate chess & tactical strategist.",
    provider: "google",
    rating: 1200,
    peakRating: 1200,
    createdAt: Date.now(),
    emailVerified: data.emailVerified !== undefined ? data.emailVerified : true,
  };

  saveAccountToDirectory(googleUser);
  saveCurrentUser(googleUser);
  return googleUser;
}

export function signOutUser(): ChaturangaUser {
  const newGuest = createDefaultGuest();
  saveCurrentUser(newGuest);
  return newGuest;
}

export function updateUserProfile(updates: Partial<ChaturangaUser>): ChaturangaUser {
  const current = getCurrentUser();
  const next: ChaturangaUser = {
    ...current,
    ...updates,
    // Do not allow wiping the playerId
    playerId: updates.playerId && updates.playerId.length === 8 ? updates.playerId : current.playerId,
  };
  saveCurrentUser(next);
  saveAccountToDirectory(next);
  return next;
}

export function onUserChange(callback: (user: ChaturangaUser) => void): () => void {
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
    return () => {};
  }
  const handler = (e: Event) => {
    const custom = e as CustomEvent<ChaturangaUser>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };
  window.addEventListener(USER_CHANGE_EVENT, handler);
  return () => window.removeEventListener(USER_CHANGE_EVENT, handler);
}
