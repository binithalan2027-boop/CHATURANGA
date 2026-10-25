/**
 * Lichess Open API Service
 * Free, read-only, no authentication key required.
 * https://lichess.org/api
 * https://database.lichess.org
 */

export interface LichessDailyPuzzle {
  id: string;
  rating: number;
  plays: number;
  initialPly: number;
  solution: string[];
  themes: string[];
  game: {
    id: string;
    perf: { key: string; name: string };
    rated: boolean;
    players: Array<{
      name: string;
      title?: string;
      rating: number;
    }>;
    pgn: string;
  };
  fen: string;
}

export interface LichessOpeningMove {
  uci: string;
  san: string;
  averageRating: number;
  white: number;
  draws: number;
  black: number;
  game?: {
    id: string;
    white: { name: string; rating: number };
    black: { name: string; rating: number };
    year: number;
    winner?: 'white' | 'black' | null;
  };
}

export interface LichessOpeningStats {
  white: number;
  draws: number;
  black: number;
  moves: LichessOpeningMove[];
  topGames?: Array<{
    id: string;
    white: { name: string; rating: number };
    black: { name: string; rating: number };
    year: number;
    winner?: 'white' | 'black' | null;
  }>;
  opening?: {
    eco: string;
    name: string;
  };
}

export interface LichessCloudEval {
  depth: number;
  knodes: number;
  pvs: Array<{
    moves: string;
    cp?: number;
    mate?: number;
  }>;
}

/**
 * Fetch the Lichess Daily Tactical Puzzle
 */
export async function fetchDailyPuzzle(): Promise<LichessDailyPuzzle | null> {
  try {
    const res = await fetch("https://lichess.org/api/puzzle/daily", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.puzzle.id,
      rating: data.puzzle.rating,
      plays: data.puzzle.plays,
      initialPly: data.puzzle.initialPly,
      solution: data.puzzle.solution,
      themes: data.puzzle.themes,
      game: {
        id: data.game.id,
        perf: data.game.perf,
        rated: data.game.rated,
        players: data.game.players,
        pgn: data.game.pgn,
      },
      fen: data.game.treeParts?.fen || "",
    };
  } catch (err) {
    console.warn("Lichess daily puzzle unavailable:", err);
    return null;
  }
}

/**
 * Fetch Lichess Masters / Player Opening Explorer statistics for any FEN position
 */
export async function fetchOpeningExplorer(
  fen: string,
  database: "masters" | "lichess" = "masters"
): Promise<LichessOpeningStats | null> {
  try {
    const baseUrl =
      database === "masters"
        ? "https://explorer.lichess.ovh/masters"
        : "https://explorer.lichess.ovh/lichess";

    const url = new URL(baseUrl);
    url.searchParams.set("fen", fen);
    url.searchParams.set("moves", "8");
    url.searchParams.set("topGames", "4");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Lichess opening explorer unavailable:", err);
    return null;
  }
}

/**
 * Fetch Lichess Cloud Evaluation for position if already analyzed by deep engines
 */
export async function fetchCloudEval(fen: string): Promise<LichessCloudEval | null> {
  try {
    const url = new URL("https://lichess.org/api/cloud-eval");
    url.searchParams.set("fen", fen);

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}
