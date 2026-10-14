/**
 * Captured-piece and material computation for standard chess, derived
 * from the board FEN. Variants have non-standard starting armies, so the
 * caller only uses this for the standard rule.
 */
const VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const START: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };

export interface Material {
  /** Piece types (p,n,b,r,q) Black has lost, i.e. White captured. */
  capturedByWhite: string[];
  /** Piece types White has lost, i.e. Black captured. */
  capturedByBlack: string[];
  /** Material lead in pawns from White's perspective. */
  lead: number;
}

export function materialFromFen(fen: string): Material {
  const placement = fen.split(" ")[0] ?? "";
  const onBoard: Record<"w" | "b", Record<string, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };
  for (const ch of placement) {
    const role = ch.toLowerCase();
    if (role in START)
      onBoard[ch === role ? "b" : "w"][role]++;
  }
  const capturedByWhite: string[] = [];
  const capturedByBlack: string[] = [];
  for (const role of Object.keys(START)) {
    for (let i = onBoard.b[role]; i < START[role]; i++) capturedByWhite.push(role);
    for (let i = onBoard.w[role]; i < START[role]; i++) capturedByBlack.push(role);
  }
  const points = (lost: string[]) => lost.reduce((n, role) => n + VALUES[role], 0);
  return {
    capturedByWhite,
    capturedByBlack,
    lead: points(capturedByWhite) - points(capturedByBlack),
  };
}
