import type { Position } from "chessops/variant";

/**
 * Build a premove uci from an off-turn selection. This is a plausibility
 * check only - the piece must be yours and the target must not hold your
 * own piece. The real legality check happens against the live position
 * the moment the opponent's move lands; an illegal premove is discarded.
 * Pawn premoves to the last rank auto-queen, matching major chess sites.
 */
export function premoveUci(
  pos: Position,
  from: number,
  to: number,
  yourColor: "white" | "black",
): string | null {
  if (from === to) return null;
  const piece = pos.board.get(from);
  if (!piece || piece.color !== yourColor) return null;
  const target = pos.board.get(to);
  if (target && target.color === yourColor) return null;
  const name = (sq: number) =>
    "abcdefgh"[sq % 8] + String(Math.floor(sq / 8) + 1);
  const promotion = piece.role === "pawn" && (to < 8 || to >= 56);
  return name(from) + name(to) + (promotion ? "q" : "");
}
