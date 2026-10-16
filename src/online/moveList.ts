/** Pair SAN moves into numbered rows for a two-column move list. */
export function moveRows(moves: string[]): [string, string, string | null][] {
  const rows: [string, string, string | null][] = [];
  for (let i = 0; i < moves.length; i += 2)
    rows.push([`${i / 2 + 1}.`, moves[i], moves[i + 1] ?? null]);
  return rows;
}
