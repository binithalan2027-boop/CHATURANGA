import { Chess, Move } from 'chess.js';

export interface Premove {
  id: string;
  from: string;
  to: string;
  promotion?: string;
}

/**
 * Basic plausibility check before queuing off-turn:
 * - from !== to
 * - piece must exist and belong to your color
 * - target square cannot hold a piece of your own color
 */
export function isPlausiblePremove(
  chess: Chess,
  from: string,
  to: string,
  playerColor: 'w' | 'b'
): boolean {
  if (!from || !to || from === to) return false;
  try {
    const piece = chess.get(from as any);
    if (!piece || piece.color !== playerColor) return false;

    const target = chess.get(to as any);
    if (target && target.color === playerColor) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Queue a premove according to the user's premove preference:
 * - 'single': limited to 1 premove (replaces any previous premove)
 * - 'limitless': unlimited queued premoves
 */
export function enqueuePremove(
  currentQueue: Premove[],
  newPremove: Premove,
  mode: 'single' | 'limitless' = 'single'
): Premove[] {
  if (mode === 'single') {
    return [newPremove];
  }
  return [...currentQueue, newPremove];
}

/**
 * Cross-checks whether the queued premove is strictly legal in the current live position.
 * If valid, applies the move and returns { valid: true, moveResult }.
 * If invalid (e.g. piece pinned, destination blocked, checked, or captured), returns { valid: false }.
 */
export function crossCheckAndExecutePremove(
  chess: Chess,
  premove: Premove
): { valid: boolean; moveResult?: Move; reason?: string } {
  try {
    const legalMoves = chess.moves({ verbose: true });
    const isLegal = legalMoves.some(
      (m) => m.from === premove.from && m.to === premove.to
    );

    if (!isLegal) {
      return {
        valid: false,
        reason: `Premove ${premove.from}→${premove.to} is illegal in the current position.`,
      };
    }

    const moveResult = chess.move({
      from: premove.from,
      to: premove.to,
      promotion: premove.promotion || 'q',
    });

    return {
      valid: true,
      moveResult: moveResult ?? undefined,
    };
  } catch (err: any) {
    return {
      valid: false,
      reason: err?.message || 'Illegal premove',
    };
  }
}

/**
 * Extract all squares involved in the premove queue (for visual board highlighting).
 */
export function getPremoveSquares(queue: Premove[]): Set<string> {
  const set = new Set<string>();
  for (const p of queue) {
    set.add(p.from);
    set.add(p.to);
  }
  return set;
}
