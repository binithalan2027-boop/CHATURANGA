import { Chess } from "chess.js";
import { materialEval } from "./study";
export function positionNotes(
  fen: string,
  previousFen?: string,
  san?: string,
): string[] {
  const c = new Chess(fen);
  const side = c.turn() === "w" ? "White" : "Black";
  if (c.isCheckmate())
    return [
      `${side} has no legal escape from check. This position is checkmate.`,
    ];
  if (c.isStalemate())
    return [
      `${side} has no legal move but is not in check. This is stalemate.`,
    ];
  const notes: string[] = [];
  if (previousFen && san) {
    const before = new Chess(previousFen);
    try {
      const m = before.move(san);
      if (m.isKingsideCastle() || m.isQueensideCastle())
        notes.push(
          `${m.color === "w" ? "White" : "Black"} castled: the king and rook moved together.`,
        );
      if (m.captured)
        notes.push(
          `${san} captured a ${{ p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" }[m.captured]} on ${m.to}.`,
        );
      if (m.promotion) notes.push(`${san} promoted a pawn.`);
    } catch {
      /* no claimed explanation for an unrelated move */
    }
  }
  if (c.isCheck())
    notes.push(`${side} is in check. The next move must remove the check.`);
  const balance = materialEval(fen);
  notes.push(
    Math.abs(balance) < 0.01
      ? "Material is balanced. Piece activity and king safety still matter."
      : `${balance > 0 ? "White" : "Black"} has about ${Math.abs(balance).toFixed(1)} pawns more material. That is a piece count, not a verdict on who is winning.`,
  );
  notes.push(`${side} has ${c.moves().length} legal moves in this position.`);
  return notes;
}
