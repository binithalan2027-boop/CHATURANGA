/**
 * Computes which piece(s) moved between two board states so the UI can
 * glide them from their old square to the new one. Pure board diff - the
 * caller keeps the previous board and renders the overlay.
 */
export interface GlidePiece {
  color: "white" | "black";
  role: string;
}
export interface Glide {
  from: number;
  to: number;
  piece: GlidePiece;
}

export function diffGlides(
  prev: (GlidePiece | null)[],
  next: (GlidePiece | null)[],
): Glide[] {
  const removed: { sq: number; piece: GlidePiece }[] = [];
  const added: { sq: number; piece: GlidePiece }[] = [];
  for (let sq = 0; sq < 64; sq++) {
    const a = prev[sq] ?? null;
    const b = next[sq] ?? null;
    if (a && (!b || b.color !== a.color || b.role !== a.role))
      removed.push({ sq, piece: a });
    if (b && (!a || a.color !== b.color || a.role !== b.role))
      added.push({ sq, piece: b });
  }
  const glides: Glide[] = [];
  const used = new Set<number>();
  for (const add of added) {
    // Exact match first (same colour and role), then same colour (promotion).
    let idx = removed.findIndex(
      (r, i) =>
        !used.has(i) &&
        r.piece.color === add.piece.color &&
        r.piece.role === add.piece.role,
    );
    if (idx === -1)
      idx = removed.findIndex(
        (r, i) => !used.has(i) && r.piece.color === add.piece.color,
      );
    if (idx === -1) continue; // drop (crazyhouse) - nothing to glide from
    used.add(idx);
    glides.push({ from: removed[idx].sq, to: add.sq, piece: add.piece });
  }
  return glides;
}
