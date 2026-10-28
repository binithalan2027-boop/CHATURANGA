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
}

const STORAGE_KEY = "chaturanga_user_profile";
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
}): ChaturangaUser {
  const current = getCurrentUser();
  // Preserve existing 8-digit playerId or generate a new one
  const playerId =
    current.playerId && current.playerId.length === 8
      ? current.playerId
      : generatePlayerId();

  const googleUser: ChaturangaUser = {
    ...current,
    id: `google_${normalizePlayerId(playerId).toLowerCase()}`,
    playerId,
    name: data.name.trim() || data.email.split("@")[0],
    email: data.email.trim(),
    picture: data.picture,
    bio: data.bio ?? current.bio ?? "Chess player & strategist on Chaturanga.",
    provider: "google",
    rating: current.rating || 1200,
    peakRating: Math.max(current.peakRating || 1200, current.rating || 1200),
  };

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
