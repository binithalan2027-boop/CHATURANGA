/**
 * Match typed move input ("d4", "exd5", "Nf3+", "e7e8q", "O-O") against
 * the legal moves of the current position. Input is normalised loosely -
 * case, spaces and decoration glyphs (+, #, !, ?, x, =) are ignored - but
 * the match itself is exact against real legal moves, never guessed.
 */
const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[\s+#?!x=]+/g, "");

export function matchMoveInput(
  input: string,
  legalUci: string[],
  sanOf: (uci: string) => string | null,
): string | null {
  const want = norm(input);
  if (!want) return null;
  for (const uci of legalUci) {
    // Direct uci ("e2e4", "e7e8q") or its castling/SAN form ("O-O", "Nf3").
    if (norm(uci) === want) return uci;
    const san = sanOf(uci);
    if (san && norm(san) === want) return uci;
  }
  return null;
}
