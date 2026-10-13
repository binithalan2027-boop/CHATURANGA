import { Position } from "chessops/variant";
import { Move, ROLES, Role } from "chessops/types";
import { makeUci, parseUci } from "chessops/util";
import { variantPosition } from "./variantRules";

const VALUE: Record<Role, number> = {
  pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 0,
};

function material(pos: Position): number {
  let score = 0;
  for (const sq of pos.board) {
    const piece = sq[1];
    if (!piece) continue;
    const v = VALUE[piece.role];
    score += piece.color === "white" ? v : -v;
  }
  if (pos.pockets)
    for (const color of ["white", "black"] as const)
      for (const role of ROLES)
        score +=
          (color === "white" ? 1 : -1) *
          (pos.pockets[color][role] ?? 0) *
          Math.min(VALUE[role], 500);
  return score;
}

/** Centipawn-ish static eval from White's perspective, per-variant flavour. */
export function evaluate(pos: Position): number {
  const outcome = pos.outcome();
  if (outcome?.winner) return outcome.winner === "white" ? 100000 : -100000;
  if (outcome) return 0;
  const mat = material(pos);
  if (pos.rules === "antichess") return -mat;
  if (pos.rules === "racingkings") {
    let score = mat / 4;
    for (const [sq, piece] of pos.board) {
      if (piece.role === "king") {
        const rank = 8 - Math.floor(sq / 8);
        score += piece.color === "white" ? rank * 30 : -rank * 30;
      }
    }
    return score;
  }
  if (pos.rules === "horde") {
    let pawns = 0;
    for (const [, piece] of pos.board)
      if (piece.role === "pawn" && piece.color === "white") pawns++;
    return mat + pawns * 20;
  }
  return mat;
}

function orderedMoves(pos: Position): Move[] {
  const moves: Move[] = [];
  for (const [from, dests] of pos.allDests())
    for (const to of dests) {
      const role = pos.board.get(from)?.role;
      if (role === "pawn" && (to < 8 || to >= 56)) {
        for (const promotion of ["queen", "rook", "bishop", "knight"] as Role[]) {
          const m = { from, to, promotion };
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
          const m = { role, to } as Move;
          if (pos.isLegal(m)) moves.push(m);
        }
  // captures first for better alpha-beta pruning
  return moves.sort((a, b) => {
    const ca = "to" in a && pos.board.get(a.to) ? 1 : 0,
      cb = "to" in b && pos.board.get(b.to) ? 1 : 0;
    return cb - ca;
  });
}

function search(
  pos: Position,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
): number {
  if (depth === 0 || pos.isEnd()) {
    const raw = evaluate(pos);
    return pos.turn === "white" ? raw : -raw;
  }
  let best = -Infinity;
  for (const m of orderedMoves(pos)) {
    const next = pos.clone();
    next.play(m);
    const score = -search(next, depth - 1, -beta, -alpha, ply + 1);
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

export interface LocalBotOptions {
  depth?: number;
  /** 0..1 chance of picking a random top-3 move instead of the best. */
  jitter?: number;
  seed?: number;
}

/** On-device variant engine: alpha-beta over chessops legal moves. */
export function localVariantMove(
  pos: Position,
  { depth = 2, jitter = 0, seed = Date.now() }: LocalBotOptions = {},
): { best: string; score: number; engine: string } {
  const moves = orderedMoves(pos);
  if (!moves.length) throw new Error("No legal variant move here.");
  if (moves.length === 1) {
    return {
      best: makeUci(moves[0]),
      score: 0,
      engine: "Chaturanga local variant search",
    };
  }
  const scored = moves.map((m) => {
    const next = pos.clone();
    next.play(m);
    return { m, score: -search(next, depth - 1, -Infinity, Infinity, 1) };
  });
  scored.sort((a, b) => b.score - a.score);
  let pick = scored[0];
  if (jitter > 0 && scored.length > 2 && seed % 100 < jitter * 100) {
    const window = scored.slice(0, Math.min(3, scored.length));
    pick = window[seed % window.length];
  }
  return {
    best: makeUci(pick.m),
    score: pick.score,
    engine: `Chaturanga local variant search, depth ${depth}`,
  };
}

export function localVariantMoveFromFen(
  rules: Parameters<typeof variantPosition>[0],
  fen: string | undefined,
  opts?: LocalBotOptions,
) {
  return localVariantMove(variantPosition(rules, fen), opts);
}

/** Validate an engine reply against the real rules before playing it. */
export function assertLegalEngineMove(pos: Position, uci: string): string {
  const m = parseUci(uci);
  if (!m || !pos.isLegal(m)) throw new Error(`Engine played illegal move ${uci}.`);
  return uci;
}
