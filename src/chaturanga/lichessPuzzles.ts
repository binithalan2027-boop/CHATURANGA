import { Chess, Square } from "chess.js";

export interface LichessPuzzleRaw {
  game: {
    id: string;
    perf?: { key: string; name: string };
    rated?: boolean;
    players?: Array<{
      name?: string;
      id?: string;
      color?: string;
      rating?: number;
    }>;
    pgn: string;
  };
  puzzle: {
    id: string;
    rating: number;
    plays?: number;
    initialPly: number;
    solution: string[];
    themes: string[];
  };
}

export interface PreparedLichessPuzzle {
  id: string;
  rating: number;
  themes: string[];
  initialPly: number;
  solution: string[];
  setupFen: string;
  solverTurn: "w" | "b";
  setupMoveSan?: string;
  gameId: string;
  players?: {
    white?: string;
    black?: string;
  };
}

/**
 * Parses a UCI move string (e.g. "a8a4" or "e7e8q") into from, to, and optional promotion.
 */
export function parseUciMove(uci: string): { from: Square; to: Square; promotion?: "q" | "r" | "b" | "n" } {
  const from = uci.slice(0, 2) as Square;
  const to = uci.slice(2, 4) as Square;
  const promotion = uci.length > 4 ? (uci[4].toLowerCase() as "q" | "r" | "b" | "n") : undefined;
  return { from, to, promotion };
}

/**
 * Replay semantics according to Lichess API:
 * Replay game.pgn through `initialPly + 1` half-moves (half-move at index `initialPly` is the opponent's setup move).
 * The position AFTER it is what we present to the solver.
 * solution[0] is the solver's first move, solution[1] is opponent's reply, etc.
 */
export function prepareLichessPuzzle(raw: LichessPuzzleRaw): PreparedLichessPuzzle {
  const { game, puzzle } = raw;
  if (!game?.pgn) {
    throw new Error("Missing game PGN in Lichess puzzle data.");
  }

  const c = new Chess();
  c.loadPgn(game.pgn);
  const moves = c.history({ verbose: true });

  const setupMoveIndex = puzzle.initialPly;
  if (moves.length <= setupMoveIndex) {
    throw new Error(
      `PGN only has ${moves.length} half-moves, but puzzle requires initialPly ${setupMoveIndex} + 1.`
    );
  }

  const setupMove = moves[setupMoveIndex];
  const setupFen = setupMove.after;
  const postBoard = new Chess(setupFen);
  const solverTurn = postBoard.turn();

  const whitePlayer = game.players?.find((p) => p.color === "white")?.name;
  const blackPlayer = game.players?.find((p) => p.color === "black")?.name;

  return {
    id: puzzle.id,
    rating: puzzle.rating,
    themes: puzzle.themes || [],
    initialPly: puzzle.initialPly,
    solution: puzzle.solution || [],
    setupFen,
    solverTurn,
    setupMoveSan: setupMove.san,
    gameId: game.id,
    players: {
      white: whitePlayer,
      black: blackPlayer,
    },
  };
}

// In-flight guard to satisfy rate-limit etiquette (one request at a time)
let inFlightPromise: Promise<FetchDailyResult> | null = null;
let rateLimitedUntil = 0;

export function isLichessInFlight(): boolean {
  return inFlightPromise !== null;
}

export function getLichessRateLimitRemainingMs(): number {
  return Math.max(0, rateLimitedUntil - Date.now());
}

/**
 * Cache key based on today's local date string (YYYY-MM-DD).
 */
export function getDailyCacheKey(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `chaturanga-lichess-daily-${yyyy}-${mm}-${dd}`;
}

export interface FetchDailyResult {
  puzzle: PreparedLichessPuzzle | null;
  error?: string;
  fromCache?: boolean;
}

/**
 * Fetches the daily puzzle from Lichess with caching and rate-limiting.
 */
export async function fetchLichessDailyPuzzle(forceRefresh = false): Promise<FetchDailyResult> {
  const cacheKey = getDailyCacheKey();

  // 1. Return cached puzzle if available and not forced
  if (!forceRefresh && typeof localStorage !== "undefined") {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as PreparedLichessPuzzle;
        if (parsed?.id && parsed?.setupFen && Array.isArray(parsed?.solution)) {
          return { puzzle: parsed, fromCache: true };
        }
      }
    } catch {
      // Ignore cache parse failure and fetch fresh
    }
  }

  // 2. Check 429 backoff
  const remainingCooldown = rateLimitedUntil - Date.now();
  if (remainingCooldown > 0) {
    const sec = Math.ceil(remainingCooldown / 1000);
    return {
      puzzle: null,
      error: `Lichess is busy (rate limit 429). Please wait ${sec}s before retrying.`,
    };
  }

  // 3. Single request in flight: if already fetching, reuse the in-flight promise
  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const res = await fetch("https://lichess.org/api/puzzle/daily", {
        headers: { Accept: "application/json" },
      });

      if (res.status === 429) {
        rateLimitedUntil = Date.now() + 60000;
        return {
          puzzle: null,
          error: "Lichess rate limit reached (HTTP 429). Waiting 60 seconds before retrying.",
        };
      }

      if (!res.ok) {
        return {
          puzzle: null,
          error: `Lichess request failed (HTTP ${res.status}). Local puzzles remain fully playable.`,
        };
      }

      const data = (await res.json()) as LichessPuzzleRaw;
      const prepared = prepareLichessPuzzle(data);

      // Save to localStorage for repeat same-day visits
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(prepared));
        } catch {
          // Ignore localStorage quota errors
        }
      }

      return { puzzle: prepared, fromCache: false };
    } catch {
      return {
        puzzle: null,
        error: "Could not reach Lichess (network offline or unavailable). Local puzzles are fully playable.",
      };
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

/**
 * Fetch a specific puzzle by ID from Lichess.
 */
export async function fetchLichessPuzzleById(id: string): Promise<FetchDailyResult> {
  const remainingCooldown = rateLimitedUntil - Date.now();
  if (remainingCooldown > 0) {
    const sec = Math.ceil(remainingCooldown / 1000);
    return {
      puzzle: null,
      error: `Lichess is busy (rate limit 429). Please wait ${sec}s.`,
    };
  }

  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const res = await fetch(`https://lichess.org/api/puzzle/${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json" },
      });

      if (res.status === 429) {
        rateLimitedUntil = Date.now() + 60000;
        return {
          puzzle: null,
          error: "Lichess rate limit reached (HTTP 429). Waiting 60 seconds.",
        };
      }

      if (!res.ok) {
        return {
          puzzle: null,
          error: `Puzzle #${id} could not be loaded from Lichess (HTTP ${res.status}).`,
        };
      }

      const data = (await res.json()) as LichessPuzzleRaw;
      const prepared = prepareLichessPuzzle(data);
      return { puzzle: prepared, fromCache: false };
    } catch {
      return {
        puzzle: null,
        error: "Could not reach Lichess. Please check your connection.",
      };
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}
