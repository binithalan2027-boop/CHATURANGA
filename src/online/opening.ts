/**
 * Opening-name lookup for standard-chess online rooms, from the ECO
 * table already shipped for the practice explorer. Replays the room's
 * SAN list once, collecting positions, then takes the deepest book
 * hit. Variants and Fog of War are excluded by the caller: their
 * positions are not standard-chess book positions (and fog never
 * reveals the full game anyway).
 */
import { parseSan } from "chessops/san";
import { variantPosition, variantFen } from "../chaturanga/variantRules";
import { findOpening } from "../chaturanga/openingLookup";

export function openingForMoves(moves: string[]): { eco: string; name: string } | null {
  if (moves.length === 0) return null;
  const pos = variantPosition("chess" as never);
  const fens: string[] = [];
  for (const san of moves) {
    const mv = parseSan(pos, san);
    if (!mv) return null; // a move we cannot parse: stay silent
    pos.play(mv);
    fens.push(variantFen(pos));
  }
  return findOpening(fens);
}
