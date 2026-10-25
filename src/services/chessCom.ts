/**
 * Chess.com Public API Service
 * Free, read-only, no authentication key required.
 * https://support.chess.com/en/articles/9650547-what-is-the-pubapi-and-how-do-i-use-it
 */

export interface ChessComProfile {
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

export interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
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
  rules: string;
  time_class: string;
}

/**
 * Fetch a player's public profile from Chess.com
 */
export async function fetchChessComProfile(
  username: string
): Promise<ChessComProfile | null> {
  const cleanUser = username.trim().toLowerCase();
  if (!cleanUser) return null;

  try {
    const res = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(cleanUser)}`, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Chess.com profile fetch failed:", err);
    return null;
  }
}

/**
 * Fetch the latest archive of games for a given Chess.com user
 */
export async function fetchChessComRecentGames(
  username: string
): Promise<ChessComGame[]> {
  const cleanUser = username.trim().toLowerCase();
  if (!cleanUser) return [];

  try {
    // 1. Get the list of monthly archives
    const listRes = await fetch(
      `https://api.chess.com/pub/player/${encodeURIComponent(cleanUser)}/games/archives`,
      { headers: { Accept: "application/json" } }
    );
    if (!listRes.ok) return [];
    const listData = await listRes.json();
    const archives: string[] = listData.archives || [];
    if (archives.length === 0) return [];

    // 2. Fetch the latest month archive
    const latestArchiveUrl = archives[archives.length - 1];
    const gamesRes = await fetch(latestArchiveUrl, {
      headers: { Accept: "application/json" },
    });
    if (!gamesRes.ok) return [];
    const gamesData = await gamesRes.json();
    return (gamesData.games || []).reverse().slice(0, 15); // Return up to 15 most recent
  } catch (err) {
    console.warn("Chess.com games archive fetch failed:", err);
    return [];
  }
}
