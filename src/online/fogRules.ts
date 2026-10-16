/**
 * Fog of War - explicit house rules (documented, not lichess-compatible):
 * - Standard 8x8 piece movement; there is NO check or checkmate. A king may
 *   move to or stay on attacked squares.
 * - Win by CAPTURING the enemy king. Draw by agreement, no-moves stalemate,
 *   threefold repetition or the 50-move rule (server automatic).
 * - Castling: king and rook unmoved, path empty, and the king's start,
 *   transit and destination squares are not attacked by the opponent
 *   (standard castling safety, enforced server-side, hidden info stays hidden).
 * - En passant as in standard chess. Promotion to Q/R/B/N (UI defaults to Q).
 * - Visibility: a player sees squares their pieces occupy, attack, or could
 *   move to (pawn pushes included). Enemy pieces elsewhere are hidden.
 */

export type FogColor = "w" | "b";
/** Piece letters follow chess.js casing: upper = white, lower = black. */
export type FogPiece =
  | "P" | "N" | "B" | "R" | "Q" | "K"
  | "p" | "n" | "b" | "r" | "q" | "k";

export interface FogState {
  /** 64 squares, index 0 = a1, 63 = h8. */
  board: (FogPiece | null)[];
  turn: FogColor;
  castling: string; // subset of "KQkq"
  ep: number | null; // en-passant target square
  halfmove: number;
  fullmove: number;
  result: string | null;
}

export interface FogMove {
  from: number;
  to: number;
  promotion?: "q" | "r" | "b" | "n";
}

export const sq = (file: number, rank: number) => rank * 8 + file;
export const fileOf = (s: number) => s % 8;
export const rankOf = (s: number) => Math.floor(s / 8);
export const squareName = (s: number) =>
  "abcdefgh"[fileOf(s)] + (rankOf(s) + 1);
export function parseSquare(name: string): number {
  if (!/^[a-h][1-8]$/.test(name)) throw Error("Bad square.");
  return sq(name.charCodeAt(0) - 97, name.charCodeAt(1) - 49);
}
export const colorOf = (p: FogPiece): FogColor =>
  p === p.toUpperCase() ? "w" : "b";
export const other = (c: FogColor): FogColor => (c === "w" ? "b" : "w");

export function fogInitial(): FogState {
  const board: (FogPiece | null)[] = new Array(64).fill(null);
  const back: FogPiece[] = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  for (let f = 0; f < 8; f++) {
    board[sq(f, 0)] = back[f];
    board[sq(f, 1)] = "P";
    board[sq(f, 6)] = "p";
    board[sq(f, 7)] = back[f].toLowerCase() as FogPiece;
  }
  return {
    board,
    turn: "w",
    castling: "KQkq",
    ep: null,
    halfmove: 0,
    fullmove: 1,
    result: null,
  };
}

const KNIGHT = [
  [1, 2], [2, 1], [2, -1], [1, -2],
  [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];
const KING = [
  [1, 0], [1, 1], [0, 1], [-1, 1],
  [-1, 0], [-1, -1], [0, -1], [1, -1],
];
const ROOK_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const BISHOP_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

function onBoard(f: number, r: number) {
  return f >= 0 && f < 8 && r >= 0 && r < 8;
}

/** Squares attacked by `color` (pawn diagonals included; for castling safety). */
export function fogAttacks(state: FogState, color: FogColor): Set<number> {
  const out = new Set<number>();
  const b = state.board;
  for (let s = 0; s < 64; s++) {
    const p = b[s];
    if (!p || colorOf(p) !== color) continue;
    const f = fileOf(s), r = rankOf(s), t = p.toLowerCase();
    if (t === "p") {
      const dr = color === "w" ? 1 : -1;
      for (const df of [-1, 1])
        if (onBoard(f + df, r + dr)) out.add(sq(f + df, r + dr));
    } else if (t === "n") {
      for (const [df, dr] of KNIGHT)
        if (onBoard(f + df, r + dr)) out.add(sq(f + df, r + dr));
    } else if (t === "k") {
      for (const [df, dr] of KING)
        if (onBoard(f + df, r + dr)) out.add(sq(f + df, r + dr));
    } else {
      const dirs =
        t === "r" ? ROOK_DIRS : t === "b" ? BISHOP_DIRS : [...ROOK_DIRS, ...BISHOP_DIRS];
      for (const [df, dr] of dirs) {
        let nf = f + df, nr = r + dr;
        while (onBoard(nf, nr)) {
          const t2 = sq(nf, nr);
          out.add(t2);
          if (b[t2]) break;
          nf += df; nr += dr;
        }
      }
    }
  }
  return out;
}

/** Pseudo-legal moves for the piece on `from` (no check concept). */
export function fogMovesFrom(state: FogState, from: number): FogMove[] {
  const p = state.board[from];
  if (!p || colorOf(p) !== state.turn) return [];
  const color = state.turn;
  const enemy = other(color);
  const f = fileOf(from), r = rankOf(from), t = p.toLowerCase();
  const out: FogMove[] = [];
  const push = (to: number) => {
    if (t === "p" && (rankOf(to) === 0 || rankOf(to) === 7)) {
      for (const promotion of ["q", "r", "b", "n"] as const)
        out.push({ from, to, promotion });
    } else out.push({ from, to });
  };
  const tryStep = (df: number, dr: number) => {
    const nf = f + df, nr = r + dr;
    if (!onBoard(nf, nr)) return;
    const to = sq(nf, nr);
    const target = state.board[to];
    if (!target || colorOf(target) === enemy) push(to);
  };
  const trySlide = (dirs: number[][]) => {
    for (const [df, dr] of dirs) {
      let nf = f + df, nr = r + dr;
      while (onBoard(nf, nr)) {
        const to = sq(nf, nr);
        const target = state.board[to];
        if (!target) push(to);
        else {
          if (colorOf(target) === enemy) push(to);
          break;
        }
        nf += df; nr += dr;
      }
    }
  };
  if (t === "p") {
    const dr = color === "w" ? 1 : -1;
    const startRank = color === "w" ? 1 : 6;
    const one = onBoard(f, r + dr) ? sq(f, r + dr) : -1;
    if (one >= 0 && !state.board[one]) {
      push(one);
      const two = sq(f, r + 2 * dr);
      if (r === startRank && !state.board[two]) push(two);
    }
    for (const df of [-1, 1]) {
      if (!onBoard(f + df, r + dr)) continue;
      const to = sq(f + df, r + dr);
      const target = state.board[to];
      if (target && colorOf(target) === enemy) push(to);
      else if (!target && state.ep === to) push(to);
    }
  } else if (t === "n") {
    for (const [df, dr] of KNIGHT) tryStep(df, dr);
  } else if (t === "k") {
    for (const [df, dr] of KING) tryStep(df, dr);
    // Castling with standard safety (house rule).
    const enemyAttacks = fogAttacks(state, enemy);
    const home = color === "w" ? 0 : 7;
    const ksq = color === "w" ? parseSquare("e1") : parseSquare("e8");
    if (from === ksq && !enemyAttacks.has(ksq)) {
      const rights = state.castling;
      const kingSide = color === "w" ? "K" : "k";
      const queenSide = color === "w" ? "Q" : "q";
      if (
        rights.includes(kingSide) &&
        !state.board[sq(5, home)] &&
        !state.board[sq(6, home)] &&
        state.board[sq(7, home)] === (color === "w" ? "R" : "r") &&
        !enemyAttacks.has(sq(5, home)) &&
        !enemyAttacks.has(sq(6, home))
      )
        out.push({ from, to: sq(6, home) });
      if (
        rights.includes(queenSide) &&
        !state.board[sq(3, home)] &&
        !state.board[sq(2, home)] &&
        !state.board[sq(1, home)] &&
        state.board[sq(0, home)] === (color === "w" ? "R" : "r") &&
        !enemyAttacks.has(sq(3, home)) &&
        !enemyAttacks.has(sq(2, home))
      )
        out.push({ from, to: sq(2, home) });
    }
  } else if (t === "r") trySlide(ROOK_DIRS);
  else if (t === "b") trySlide(BISHOP_DIRS);
  else trySlide([...ROOK_DIRS, ...BISHOP_DIRS]);
  return out;
}

export function fogLegalMoves(state: FogState): FogMove[] {
  const out: FogMove[] = [];
  for (let s = 0; s < 64; s++) out.push(...fogMovesFrom(state, s));
  return out;
}

export function fogPositionKey(state: FogState): string {
  return `${state.board.map((p) => p ?? ".").join("")} ${state.turn} ${state.castling} ${state.ep ?? "-"}`;
}

/** Applies a legal move. Throws on illegal input. */
export function fogPlay(state: FogState, move: FogMove): FogState {
  if (state.result) throw Error("Game is finished.");
  const legal = fogMovesFrom(state, move.from);
  const found = legal.find(
    (m) =>
      m.to === move.to &&
      (m.promotion ?? "q") === (move.promotion ?? "q") &&
      !!m.promotion === !!move.promotion,
  ) ?? legal.find((m) => m.to === move.to && !m.promotion && !move.promotion);
  if (!found) throw Error("Illegal move.");
  const board = [...state.board];
  const piece = board[move.from]!;
  const color = colorOf(piece);
  const t = piece.toLowerCase();
  const captured = board[move.to];
  // En-passant capture: pawn moves to empty ep square diagonally.
  if (t === "p" && state.ep === move.to && !captured && fileOf(move.from) !== fileOf(move.to))
    board[sq(fileOf(move.to), rankOf(move.from))] = null;
  board[move.from] = null;
  board[move.to] = found.promotion
    ? (color === "w" ? found.promotion.toUpperCase() : found.promotion) as FogPiece
    : piece;
  // Castling rook hop.
  if (t === "k" && Math.abs(fileOf(move.to) - fileOf(move.from)) === 2) {
    const home = rankOf(move.from);
    if (fileOf(move.to) === 6) {
      board[sq(5, home)] = board[sq(7, home)];
      board[sq(7, home)] = null;
    } else {
      board[sq(3, home)] = board[sq(0, home)];
      board[sq(0, home)] = null;
    }
  }
  let castling = state.castling;
  const drop = (flag: string) => {
    castling = castling.replace(flag, "");
  };
  if (t === "k") drop(color === "w" ? "K" : "k"), drop(color === "w" ? "Q" : "q");
  if (move.from === parseSquare("a1") || move.to === parseSquare("a1")) drop("Q");
  if (move.from === parseSquare("h1") || move.to === parseSquare("h1")) drop("K");
  if (move.from === parseSquare("a8") || move.to === parseSquare("a8")) drop("q");
  if (move.from === parseSquare("h8") || move.to === parseSquare("h8")) drop("k");
  const next: FogState = {
    board,
    turn: other(state.turn),
    castling,
    ep:
      t === "p" && Math.abs(rankOf(move.to) - rankOf(move.from)) === 2
        ? sq(fileOf(move.from), (rankOf(move.from) + rankOf(move.to)) / 2)
        : null,
    halfmove: t === "p" || captured ? 0 : state.halfmove + 1,
    fullmove: state.turn === "b" ? state.fullmove + 1 : state.fullmove,
    result: null,
  };
  if (captured?.toLowerCase() === "k")
    next.result = `${color === "w" ? "White" : "Black"} wins by capturing the king`;
  else if (fogLegalMoves(next).length === 0)
    next.result = "Draw - no moves available";
  else if (next.halfmove >= 100) next.result = "Draw - 50-move rule";
  return next;
}

/** Squares visible to `color`: own pieces plus everything they attack or can reach. */
export function fogVisible(state: FogState, color: FogColor): Set<number> {
  const out = fogAttacks(state, color);
  const saved = state.turn;
  const asColor: FogState = { ...state, turn: color };
  for (let s = 0; s < 64; s++) {
    const p = state.board[s];
    if (p && colorOf(p) === color) {
      out.add(s);
      for (const m of fogMovesFrom(asColor, s)) out.add(m.to);
    }
  }
  void saved;
  return out;
}

export interface FogViewPiece {
  square: number;
  piece: FogPiece;
}
/** Per-player projection: own pieces always; enemy pieces only on visible squares. */
export function fogView(
  state: FogState,
  color: FogColor,
): { pieces: FogViewPiece[]; fog: number[] } {
  const visible = fogVisible(state, color);
  const pieces: FogViewPiece[] = [];
  const fog: number[] = [];
  for (let s = 0; s < 64; s++) {
    const p = state.board[s];
    if (p && (colorOf(p) === color || visible.has(s)))
      pieces.push({ square: s, piece: p });
    if (!visible.has(s) && !pieces.some((x) => x.square === s)) fog.push(s);
  }
  return { pieces, fog };
}

/** Compact FEN-like serialisation for storage (house format, not standard FEN). */
export function fogFen(state: FogState): string {
  const rows: string[] = [];
  for (let r = 7; r >= 0; r--) {
    let row = "", empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = state.board[sq(f, r)];
      if (!p) empty++;
      else {
        if (empty) row += empty, empty = 0;
        row += p;
      }
    }
    if (empty) row += empty;
    rows.push(row);
  }
  return `${rows.join("/")} ${state.turn} ${state.castling || "-"} ${state.ep == null ? "-" : squareName(state.ep)} ${state.halfmove} ${state.fullmove}`;
}

export function fogFromFen(fen: string): FogState {
  const [rows, turn, castling, ep, half, full] = fen.split(" ");
  const board: (FogPiece | null)[] = new Array(64).fill(null);
  rows.split("/").forEach((row, i) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) f += Number(ch);
      else board[sq(f++, 7 - i)] = ch as FogPiece;
    }
  });
  return {
    board,
    turn: turn as FogColor,
    castling: castling === "-" ? "" : castling,
    ep: ep === "-" ? null : parseSquare(ep),
    halfmove: Number(half),
    fullmove: Number(full),
    result: null,
  };
}
