/**
 * Arrow-key movement across the 8x8 board grid. The index is the
 * square's position in DOM order (visual order, so this works the same
 * flipped or not). Returns null at the board edge - the cursor must
 * stop there instead of wrapping onto the next rank, which feels like
 * a teleport and misreads the board for keyboard and screen-reader
 * users. Enter/Space activation is the button's native behavior.
 */
export function navIndex(i: number, key: string): number | null {
  const file = i % 8;
  switch (key) {
    case "ArrowRight":
      return file < 7 ? i + 1 : null;
    case "ArrowLeft":
      return file > 0 ? i - 1 : null;
    case "ArrowDown":
      return i + 8 <= 63 ? i + 8 : null;
    case "ArrowUp":
      return i - 8 >= 0 ? i - 8 : null;
    default:
      return null;
  }
}
