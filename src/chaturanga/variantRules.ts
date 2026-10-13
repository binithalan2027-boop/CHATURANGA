import { defaultPosition, setupPosition, Position } from "chessops/variant";
import { parseFen, makeFen } from "chessops/fen";
import { parseUci, makeUci } from "chessops/util";
import { makeSanAndPlay } from "chessops/san";
import { Rules, Move, ROLES, Role } from "chessops/types";
export function variantPosition(rules: Rules, fen?: string): Position {
  return fen
    ? setupPosition(rules, parseFen(fen).unwrap()).unwrap()
    : defaultPosition(rules);
}
export function variantFen(pos: Position) {
  return makeFen(pos.toSetup());
}
export function variantMoves(pos: Position): string[] {
  if (pos.isEnd()) return [];
  const moves: Move[] = [];
  for (const [from, dests] of pos.allDests())
    for (const to of dests) {
      if (pos.board.get(from)?.role === "pawn" && (to < 8 || to >= 56)) {
        for (const promotion of [
          "queen",
          "rook",
          "bishop",
          "knight",
          ...(pos.rules === "antichess" ? ["king"] : []),
        ] as const) {
          const m = { from, to, promotion: promotion as Role };
          if (pos.isLegal(m)) moves.push(m);
        }
      } else {
        const m = { from, to };
        if (pos.isLegal(m)) moves.push(m);
      }
    }
  if (pos.pockets)
    for (const role of ROLES.filter((r) => r !== "king"))
      if (pos.pockets[pos.turn][role] > 0)
        for (const to of pos.dropDests()) {
          const m = { role, to };
          if (pos.isLegal(m)) moves.push(m);
        }
  return moves.map(makeUci);
}
export function variantPlay(pos: Position, uci: string) {
  const m = parseUci(uci);
  if (!m || !pos.isLegal(m) || pos.isEnd())
    throw Error("Illegal variant move.");
  const next = pos.clone();
  const san = makeSanAndPlay(next, m);
  return { pos: next, san };
}
