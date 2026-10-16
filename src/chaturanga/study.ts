import { Chess } from "chess.js";
export interface StudyLine {
  startFen: string;
  fens: string[];
  sans: string[];
  pgn: string;
  headers: Record<string, string>;
}
export function parsePgn(pgn: string): StudyLine {
  if (pgn.length > 1000000)
    throw new Error("PGN is too large. Import one game under 1 MB.");
  const c = new Chess();
  c.loadPgn(pgn);
  const moves = c.history({ verbose: true });
  return {
    startFen: moves[0]?.before || c.fen(),
    fens: [moves[0]?.before || c.fen(), ...moves.map((m) => m.after)],
    sans: moves.map((m) => m.san),
    pgn: c.pgn(),
    headers: c.getHeaders(),
  };
}
export function fromFen(fen: string): StudyLine {
  const c = new Chess(fen.trim());
  return {
    startFen: c.fen(),
    fens: [c.fen()],
    sans: [],
    pgn: c.pgn(),
    headers: {},
  };
}
export function studyMove(
  line: StudyLine,
  index: number,
  from: string,
  to: string,
  promotion = "q",
): StudyLine {
  const c = new Chess(line.startFen);
  for (const san of line.sans.slice(0, index)) c.move(san);
  c.move({ from, to, promotion });
  return parsePgn(c.pgn());
}
export function materialEval(fen: string): number {
  const c = new Chess(fen),
    v: Record<string, number> = {
      p: 100,
      n: 320,
      b: 330,
      r: 500,
      q: 900,
      k: 0,
    };
  return (
    c
      .board()
      .flat()
      .reduce(
        (s, p) => s + (p ? (p.color === "w" ? 1 : -1) * v[p.type] : 0),
        0,
      ) / 100
  );
}
