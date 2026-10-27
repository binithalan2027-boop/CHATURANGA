import { Chess, Square } from "chess.js";
import rawPuzzles from "./puzzles150.json";

export interface BankPuzzleRaw {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
  sourceGame: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface PreparedBankPuzzle {
  id: string; // e.g. "lichess-bank:00008"
  bankId: string; // "00008"
  rating: number;
  themes: string[];
  difficulty: "easy" | "medium" | "hard";
  sourceGame: string;
  setupFen: string; // Position AFTER opponent setup move moves[0]
  solverTurn: "w" | "b";
  setupMoveUci: string;
  setupMoveSan: string;
  solutionUci: string[]; // moves.slice(1)
  totalPlies: number;
}

export function parseUciMove(uci: string): {
  from: Square;
  to: Square;
  promotion?: "q" | "r" | "b" | "n";
} {
  const from = uci.slice(0, 2) as Square;
  const to = uci.slice(2, 4) as Square;
  const promotion =
    uci.length > 4 ? (uci[4].toLowerCase() as "q" | "r" | "b" | "n") : undefined;
  return { from, to, promotion };
}

/**
 * Prepares a raw bank puzzle record according to Lichess CSV semantics:
 * raw.fen is the position BEFORE the opponent setup move.
 * raw.moves[0] is the opponent setup move.
 * The board after raw.moves[0] is setupFen, and its turn is solverTurn.
 * The solution moves to be solved are raw.moves.slice(1).
 */
export function prepareBankPuzzle(raw: BankPuzzleRaw): PreparedBankPuzzle {
  const c = new Chess(raw.fen);
  const { from, to, promotion } = parseUciMove(raw.moves[0]);
  const moveRes = c.move({ from, to, promotion });
  if (!moveRes) {
    throw new Error(`Invalid setup move ${raw.moves[0]} for puzzle ${raw.id}`);
  }

  const setupFen = c.fen();
  const solverTurn = c.turn();
  const solutionUci = raw.moves.slice(1);

  return {
    id: `lichess-bank:${raw.id}`,
    bankId: raw.id,
    rating: raw.rating,
    themes: [...raw.themes],
    difficulty: raw.difficulty,
    sourceGame: raw.sourceGame,
    setupFen,
    solverTurn,
    setupMoveUci: raw.moves[0],
    setupMoveSan: moveRes.san,
    solutionUci,
    totalPlies: solutionUci.length,
  };
}

// Memoized array of all 150 prepared bank puzzles
export const BANK_PUZZLES: PreparedBankPuzzle[] = (
  rawPuzzles as BankPuzzleRaw[]
).map(prepareBankPuzzle);

export function getBankPuzzleById(id: string): PreparedBankPuzzle | undefined {
  const clean = id.startsWith("lichess-bank:") ? id : `lichess-bank:${id}`;
  return BANK_PUZZLES.find((p) => p.id === clean || p.bankId === id);
}

/**
 * Filter bank puzzles by theme.
 * Handles 'all', 'all 150', or specific themes like 'mate', 'fork', 'pin', 'endgame'.
 */
export function filterBankByTheme(theme: string): PreparedBankPuzzle[] {
  const normalized = theme.trim().toLowerCase();
  if (
    !normalized ||
    normalized === "all" ||
    normalized === "all 150" ||
    normalized === "all150"
  ) {
    return BANK_PUZZLES;
  }
  return BANK_PUZZLES.filter((p) =>
    p.themes.some((t) => t.toLowerCase().includes(normalized)),
  );
}

/**
 * Returns the 20 mate-in-one puzzles for the Mate Sprint mode.
 */
export function getMateSprintPuzzles(): PreparedBankPuzzle[] {
  return BANK_PUZZLES.filter((p) => p.themes.includes("mateIn1"));
}

/**
 * Checks if a move delivers checkmate from the current position.
 * Used to accept alternative checkmating moves in mate-in-one puzzles.
 */
export function isMoveCheckmate(
  fen: string,
  from: Square,
  to: Square,
  promotion?: string,
): boolean {
  try {
    const c = new Chess(fen);
    const m = c.move({
      from,
      to,
      promotion: (promotion?.toLowerCase() as "q" | "r" | "b" | "n") || "q",
    });
    return !!m && c.isCheckmate();
  } catch {
    return false;
  }
}

/**
 * Validates whether a solver's candidate move is correct for the puzzle step.
 * Accepts exact UCI solution move, or any checkmate in a mate-in-one puzzle.
 */
export function validatePuzzleMove(
  puzzle: PreparedBankPuzzle,
  stepIndex: number,
  currentFen: string,
  candidate: { from: Square; to: Square; promotion?: string },
): { valid: boolean; isCheckmate: boolean; nextFen?: string; san?: string } {
  try {
    const c = new Chess(currentFen);
    const promo =
      (candidate.promotion?.toLowerCase() as "q" | "r" | "b" | "n") ||
      (c.get(candidate.from)?.type === "p" &&
      ((candidate.to[1] === "8" && c.turn() === "w") ||
        (candidate.to[1] === "1" && c.turn() === "b"))
        ? "q"
        : undefined);

    const playedMove = c.move({
      from: candidate.from,
      to: candidate.to,
      promotion: promo,
    });

    if (!playedMove) {
      return { valid: false, isCheckmate: false };
    }

    const expectedUci = puzzle.solutionUci[stepIndex];
    if (!expectedUci) {
      return { valid: false, isCheckmate: false };
    }

    const candidateUci = `${candidate.from}${candidate.to}${
      promo ? promo.toLowerCase() : ""
    }`;
    const isDirectMatch =
      candidateUci === expectedUci ||
      candidateUci.slice(0, 4) === expectedUci.slice(0, 4);

    // If mate-in-one puzzle or final ply of a mate puzzle, check if move delivers checkmate
    const deliversMate = c.isCheckmate();
    const isMatePuzzle = puzzle.themes.some((t) =>
      t.toLowerCase().includes("mate"),
    );

    if (isDirectMatch) {
      return {
        valid: true,
        isCheckmate: deliversMate,
        nextFen: c.fen(),
        san: playedMove.san,
      };
    }

    if (isMatePuzzle && deliversMate) {
      // Alternate checkmating move accepted!
      return {
        valid: true,
        isCheckmate: true,
        nextFen: c.fen(),
        san: playedMove.san,
      };
    }

    return { valid: false, isCheckmate: deliversMate };
  } catch {
    return { valid: false, isCheckmate: false };
  }
}
