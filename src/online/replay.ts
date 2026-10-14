import { parseSan } from "chessops/san";
import type { Position } from "chessops/variant";
import { variantPosition } from "../chaturanga/variantRules";
import type { Rule } from "./types";

export interface ReplayResult {
  pos: Position;
  /** Squares the reviewed move touched (drop moves: target only). */
  last: number[];
}

/**
 * Replay recorded SAN moves from the initial position up to `ply`
 * (1-based; ply = sans.length is the live position). Powers move-list
 * step-through in online games. Returns null when any move cannot be
 * parsed - the caller then falls back to the live board. Fog of War is
 * excluded: its move list is masked ("?") to protect hidden information.
 */
export function replayTo(
  rule: Rule,
  sans: string[],
  ply: number,
): ReplayResult | null {
  if (rule === "fog" || ply < 1) return null;
  let pos: Position;
  try {
    pos = variantPosition(rule as never);
  } catch {
    return null;
  }
  const n = Math.min(ply, sans.length);
  let last: number[] = [];
  for (let i = 0; i < n; i++) {
    const move = parseSan(pos, sans[i]);
    if (!move) return null;
    last = "from" in move ? [move.from, move.to] : [move.to];
    pos.play(move);
  }
  return { pos, last };
}
