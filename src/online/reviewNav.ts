/**
 * Keyboard navigation for move-list review. Arrow keys step through
 * the game, Home jumps to the first move, End/Escape return to the
 * live board. Pure so the rules are unit-testable; the component owns
 * the DOM listener and focus guards. Fog of War never reaches this:
 * its move list is masked, so there is nothing to step through.
 *
 * Returns the new review ply (1-based), null for "back to live", or
 * undefined when the key does not change the review state.
 */
export function nextReviewPly(
  current: number | null,
  moves: number,
  key: string,
): number | null | undefined {
  if (moves < 1) return undefined;
  switch (key) {
    case "ArrowLeft":
      // From live: step to the move before the current position.
      return current === null ? Math.max(1, moves - 1) : Math.max(1, current - 1);
    case "ArrowRight":
      if (current === null) return undefined; // already live
      return current + 1 >= moves ? null : current + 1;
    case "Home":
      return 1;
    case "End":
    case "Escape":
      return current === null ? undefined : null;
    default:
      return undefined;
  }
}
