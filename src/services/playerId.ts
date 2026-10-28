/**
 * 8-Digit Alphanumeric Player ID Generator & Utility
 * 
 * Uses an unambiguous uppercase alphanumeric character set (32 chars)
 * omitting 0/O and 1/I to avoid visual confusion when shared with friends.
 */

const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generates an 8-character uppercase alphanumeric Player ID.
 * Example: "K9X2M7P4"
 */
export function generatePlayerId(): string {
  let id = "";
  for (let i = 0; i < 8; i++) {
    const idx = Math.floor(Math.random() * CHARSET.length);
    id += CHARSET[idx];
  }
  return id;
}

/**
 * Validates if an ID is an 8-character alphanumeric string.
 */
export function isValidPlayerId(id: string): boolean {
  if (!id) return false;
  const clean = id.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean.length === 8;
}

/**
 * Formats an 8-digit Player ID with a middle hyphen for human readability.
 * Example: "K9X2M7P4" -> "K9X2-M7P4"
 */
export function formatPlayerId(id: string): string {
  if (!id) return "";
  const clean = id.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return id.toUpperCase();
}

/**
 * Normalizes an input string to a raw 8-digit Player ID (strips hyphens, whitespace, uppercase).
 */
export function normalizePlayerId(id: string): string {
  if (!id) return "";
  return id.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
