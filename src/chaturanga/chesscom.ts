/**
 * Chess.com Public API Service
 * Keyless, read-only public data directly from browser.
 * https://www.chess.com/news/view/published-data-api
 */

export interface ChessComPlayerProfile {
  username: string;
  player_id: number;
  title?: string;
  status: string;
  avatar?: string;
  name?: string;
  url: string;
  country?: string;
  joined: number;
  last_online: number;
  followers: number;
}

export interface ChessComArchiveMonth {
  url: string;
  label: string;
  year: string;
  month: string;
}

export interface ChessComArchiveGame {
  url: string;
  pgn: string;
  time_control: string;
  time_class: string;
  end_time: number;
  rated: boolean;
  rules?: string;
  white: {
    username: string;
    rating: number;
    result: string;
  };
  black: {
    username: string;
    rating: number;
    result: string;
  };
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Inspects PGN and game rules for non-standard variants (Chess960, Crazyhouse, etc.)
 * or oversized PGNs. Only standard chess that can be safely loaded into Study is accepted.
 */
export function validateGameForImport(pgn: string, rules?: string): ValidationResult {
  if (!pgn || !pgn.trim()) {
    return { ok: false, error: "This game does not contain any PGN notation." };
  }

  // Respect existing 1 MB limit
  if (pgn.length > 1000000) {
    return { ok: false, error: "PGN is too large. Import one game under 1 MB." };
  }

  // Check rules field if provided by PubAPI
  if (rules && rules.toLowerCase() !== "chess") {
    return {
      ok: false,
      error: `This variant (${rules}) can't be imported yet. Only standard chess games can be loaded.`,
    };
  }

  // Inspect PGN headers for Variant
  const variantMatch = pgn.match(/\[Variant\s+"([^"]+)"\]/i);
  if (variantMatch) {
    const variantName = variantMatch[1].trim();
    if (variantName.toLowerCase() !== "standard") {
      return {
        ok: false,
        error: `This variant (${variantName}) can't be imported yet. Only standard chess games can be loaded.`,
      };
    }
  }

  // Inspect for non-standard starting position (e.g. Chess960 SetUp + FEN)
  const setUpMatch = pgn.match(/\[SetUp\s+"1"\]/i);
  const fenMatch = pgn.match(/\[FEN\s+"([^"]+)"\]/i);
  if (setUpMatch && fenMatch) {
    const startFen = fenMatch[1].trim();
    const standardStart = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    if (startFen !== standardStart) {
      return {
        ok: false,
        error: "This variant can't be imported yet. Non-standard starting positions are not supported.",
      };
    }
  }

  return { ok: true };
}

let inFlightProfilePromise = new Map<string, Promise<{ profile: ChessComPlayerProfile | null; error?: string }>>();
let inFlightArchivesPromise = new Map<string, Promise<{ archives: ChessComArchiveMonth[]; error?: string }>>();
let inFlightGamesPromise = new Map<string, Promise<{ games: ChessComArchiveGame[]; error?: string }>>();
let rateLimitedUntil = 0;

export function _resetRateLimits(): void {
  rateLimitedUntil = 0;
  inFlightProfilePromise.clear();
  inFlightArchivesPromise.clear();
  inFlightGamesPromise.clear();
}

export function isChessComInFlight(): boolean {
  return (
    inFlightProfilePromise.size > 0 ||
    inFlightArchivesPromise.size > 0 ||
    inFlightGamesPromise.size > 0
  );
}

export function getChessComCooldownRemainingSec(): number {
  return Math.max(0, Math.ceil((rateLimitedUntil - Date.now()) / 1000));
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatArchiveLabel(url: string): { label: string; year: string; month: string } {
  const parts = url.split("/").filter(Boolean);
  const monthStr = parts[parts.length - 1] || "01";
  const yearStr = parts[parts.length - 2] || "";
  const monthNum = parseInt(monthStr, 10);
  const monthName = !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12
    ? MONTH_NAMES[monthNum - 1]
    : monthStr;
  return {
    label: `${monthName} ${yearStr}`,
    year: yearStr,
    month: monthStr,
  };
}

/**
 * Fetch a player's public profile from Chess.com.
 */
export async function fetchChessComProfile(
  username: string
): Promise<{ profile: ChessComPlayerProfile | null; error?: string }> {
  const clean = username.trim().toLowerCase();
  if (!clean) {
    return { profile: null, error: "Please enter a valid Chess.com username." };
  }

  const remaining = getChessComCooldownRemainingSec();
  if (remaining > 0) {
    return {
      profile: null,
      error: `Chess.com rate limit reached (HTTP 429). Please wait ${remaining}s before retrying.`,
    };
  }

  const cached = inFlightProfilePromise.get(clean);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    try {
      const res = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(clean)}`, {
        headers: { Accept: "application/json" },
      });

      if (res.status === 404) {
        return {
          profile: null,
          error: `Player "${username}" not found on Chess.com. Please check the spelling.`,
        };
      }

      if (res.status === 429) {
        rateLimitedUntil = Date.now() + 60000;
        return {
          profile: null,
          error: "Chess.com API rate limit reached (HTTP 429). Waiting 60 seconds.",
        };
      }

      if (!res.ok) {
        return {
          profile: null,
          error: `Chess.com profile request failed (HTTP ${res.status}).`,
        };
      }

      const data = (await res.json()) as ChessComPlayerProfile;
      return { profile: data };
    } catch {
      return {
        profile: null,
        error: "Could not connect to Chess.com. Please verify your internet connection.",
      };
    } finally {
      inFlightProfilePromise.delete(clean);
    }
  })();

  inFlightProfilePromise.set(clean, promise);
  return promise;
}

/**
 * Fetch available monthly archives for a given player.
 */
export async function fetchChessComArchives(
  username: string
): Promise<{ archives: ChessComArchiveMonth[]; error?: string }> {
  const clean = username.trim().toLowerCase();
  if (!clean) {
    return { archives: [], error: "Please enter a valid username." };
  }

  const remaining = getChessComCooldownRemainingSec();
  if (remaining > 0) {
    return {
      archives: [],
      error: `Chess.com is rate-limited (HTTP 429). Please wait ${remaining}s.`,
    };
  }

  const cached = inFlightArchivesPromise.get(clean);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    try {
      const res = await fetch(
        `https://api.chess.com/pub/player/${encodeURIComponent(clean)}/games/archives`,
        { headers: { Accept: "application/json" } }
      );

      if (res.status === 404) {
        return { archives: [], error: `Player "${username}" not found on Chess.com.` };
      }

      if (res.status === 429) {
        rateLimitedUntil = Date.now() + 60000;
        return {
          archives: [],
          error: "Chess.com rate limit reached (HTTP 429). Waiting 60 seconds.",
        };
      }

      if (!res.ok) {
        return { archives: [], error: `Could not load archives (HTTP ${res.status}).` };
      }

      const data = await res.json();
      const rawList: string[] = Array.isArray(data?.archives) ? data.archives : [];

      const parsed: ChessComArchiveMonth[] = rawList
        .map((url) => {
          const { label, year, month } = formatArchiveLabel(url);
          return { url, label, year, month };
        })
        .reverse(); // Most recent months first

      return { archives: parsed };
    } catch {
      return {
        archives: [],
        error: "Could not connect to Chess.com to fetch archives. Please check your connection.",
      };
    } finally {
      inFlightArchivesPromise.delete(clean);
    }
  })();

  inFlightArchivesPromise.set(clean, promise);
  return promise;
}

/**
 * Fetch all games from a specific monthly archive URL.
 */
export async function fetchChessComMonthlyGames(
  archiveUrl: string
): Promise<{ games: ChessComArchiveGame[]; error?: string }> {
  if (!archiveUrl) {
    return { games: [], error: "Missing archive URL." };
  }

  const remaining = getChessComCooldownRemainingSec();
  if (remaining > 0) {
    return {
      games: [],
      error: `Chess.com is rate-limited (HTTP 429). Please wait ${remaining}s.`,
    };
  }

  const cached = inFlightGamesPromise.get(archiveUrl);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    try {
      const res = await fetch(archiveUrl, {
        headers: { Accept: "application/json" },
      });

      if (res.status === 429) {
        rateLimitedUntil = Date.now() + 60000;
        return {
          games: [],
          error: "Chess.com rate limit reached (HTTP 429). Waiting 60 seconds.",
        };
      }

      if (!res.ok) {
        return { games: [], error: `Could not load monthly games (HTTP ${res.status}).` };
      }

      const data = await res.json();
      const rawGames: ChessComArchiveGame[] = Array.isArray(data?.games) ? data.games : [];

      // Sort with most recent game first
      const sorted = [...rawGames].reverse();
      return { games: sorted };
    } catch {
      return {
        games: [],
        error: "Could not connect to Chess.com to load games archive.",
      };
    } finally {
      inFlightGamesPromise.delete(archiveUrl);
    }
  })();

  inFlightGamesPromise.set(archiveUrl, promise);
  return promise;
}
