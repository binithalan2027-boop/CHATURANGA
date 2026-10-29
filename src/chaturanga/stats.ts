/**
 * Chaturanga Device-Local Game Stats & Rating Metrics Module
 * Implements FIDE / Chess.com standard Elo and Performance Rating (TPR) tracking.
 */

export interface RatingHistoryEntry {
  id: string;
  date: string;
  ratingBefore: number;
  ratingAfter: number;
  delta: number;
  opponentName: string;
  opponentRating: number;
  result: "win" | "loss" | "draw";
  accuracy: number;
  mode: string;
}

export interface LocalStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  mindGateStreaks: number;
  speedDuelsWon: number;
  currentRating: number;
  peakRating: number;
  history: RatingHistoryEntry[];
}

export const INITIAL_PLAYER_RATING = 1200;

export function getRatingTier(elo: number): {
  tier: string;
  badgeColor: string;
  description: string;
} {
  if (elo >= 2400) return { tier: "Grandmaster", badgeColor: "#FFD700", description: "Elite calculation & positional mastery" };
  if (elo >= 2000) return { tier: "Candidate Master", badgeColor: "#AB97EE", description: "Tournament strength & deep preparation" };
  if (elo >= 1600) return { tier: "Expert Tactician", badgeColor: "#65D1C1", description: "Sharp tactical vision & combinational sight" };
  if (elo >= 1200) return { tier: "Club Player", badgeColor: "#AFF65B", description: "Standard competitive starting baseline (1200 Elo)" };
  if (elo >= 800) return { tier: "Apprentice", badgeColor: "#F2D500", description: "Developing positional grasp & piece safety" };
  return { tier: "Novice", badgeColor: "#8A8A8A", description: "Learning core fundamentals & opening rules" };
}

const STATS_STORAGE_KEY = "chaturanga_local_stats_v2";

export const DEFAULT_STATS: LocalStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  gamesDrawn: 0,
  mindGateStreaks: 0,
  speedDuelsWon: 0,
  currentRating: 1200,
  peakRating: 1200,
  history: [],
};

function getStatsStorageKey(playerId?: string): string {
  if (playerId) return `chaturanga_stats_${playerId}`;
  try {
    const rawUser = typeof localStorage !== "undefined" ? localStorage.getItem("chaturanga_user_profile") : null;
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.playerId) return `chaturanga_stats_${parsed.playerId}`;
    }
  } catch {}
  return STATS_STORAGE_KEY;
}

export function getLocalStats(playerId?: string): LocalStats {
  try {
    if (typeof localStorage === "undefined") return DEFAULT_STATS;
    const key = getStatsStorageKey(playerId);
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);

    // Purge legacy mock data if detected
    const isMockData =
      parsed.gamesPlayed === 14 &&
      Array.isArray(parsed.history) &&
      parsed.history.length === 3 &&
      parsed.history[0]?.id === "game-1";
    if (isMockData) {
      localStorage.removeItem(key);
      localStorage.removeItem(STATS_STORAGE_KEY);
      return DEFAULT_STATS;
    }

    return { ...DEFAULT_STATS, ...parsed };
  } catch {
    return DEFAULT_STATS;
  }
}

/**
 * Standard Elo Rating Formula used by FIDE, Chess.com and Lichess:
 * E = 1 / (1 + 10^((R_opp - R_player) / 400))
 * Delta = round(K * (S - E))
 */
export function calculateEloDelta(
  playerRating: number,
  opponentRating: number,
  outcome: "win" | "loss" | "draw",
  kFactor = 32
): number {
  const exponent = (opponentRating - playerRating) / 400;
  const expected = 1 / (1 + Math.pow(10, exponent));
  const score = outcome === "win" ? 1 : outcome === "draw" ? 0.5 : 0;
  const delta = Math.round(kFactor * (score - expected));
  return delta;
}

/**
 * Performance Rating (TPR) metric:
 * Effective rating played at in this specific match.
 */
export function calculatePerformanceRating(
  opponentRating: number,
  outcome: "win" | "loss" | "draw"
): number {
  if (outcome === "win") return opponentRating + 350;
  if (outcome === "loss") return Math.max(100, opponentRating - 350);
  return opponentRating;
}

/**
 * Chess.com CAPS Accuracy Metric:
 * Calculates accuracy percentage based on evaluation stability over moves.
 */
export function calculateAccuracyFromEvals(evals: number[]): number {
  if (evals.length <= 1) return 88.5;

  let totalPenalty = 0;
  for (let i = 1; i < evals.length; i++) {
    const drop = evals[i - 1] - evals[i]; // drop in player advantage
    if (drop > 0) {
      if (drop > 3.0) totalPenalty += 18; // blunder
      else if (drop > 1.5) totalPenalty += 10; // mistake
      else if (drop > 0.6) totalPenalty += 4; // inaccuracy
      else totalPenalty += drop * 2;
    }
  }

  const avgPenalty = totalPenalty / Math.max(1, evals.length - 1);
  const accuracy = Math.max(52.0, Math.min(98.8, 100 - avgPenalty * 3.5));
  return Math.round(accuracy * 10) / 10;
}

/**
 * Record match rating change and persist progression history
 */
export function recordMatchRating(
  opponentName: string,
  opponentRating: number,
  outcome: "win" | "loss" | "draw",
  accuracy = 87.5,
  mode = "Standard Chess",
  playerId?: string
): { newRating: number; delta: number; stats: LocalStats } {
  const current = getLocalStats(playerId);
  const delta = calculateEloDelta(current.currentRating, opponentRating, outcome);
  const newRating = Math.max(100, current.currentRating + delta);
  const peakRating = Math.max(current.peakRating, newRating);

  const entry: RatingHistoryEntry = {
    id: `game-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    ratingBefore: current.currentRating,
    ratingAfter: newRating,
    delta,
    opponentName,
    opponentRating,
    result: outcome,
    accuracy,
    mode,
  };

  const updated: LocalStats = {
    ...current,
    gamesPlayed: current.gamesPlayed + 1,
    gamesWon: outcome === "win" ? current.gamesWon + 1 : current.gamesWon,
    gamesLost: outcome === "loss" ? current.gamesLost + 1 : current.gamesLost,
    gamesDrawn: outcome === "draw" ? current.gamesDrawn + 1 : current.gamesDrawn,
    currentRating: newRating,
    peakRating,
    history: [entry, ...current.history.slice(0, 49)],
  };

  try {
    if (typeof localStorage !== "undefined") {
      const key = getStatsStorageKey(playerId);
      localStorage.setItem(key, JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Failed to save rating stats", e);
  }

  return { newRating, delta, stats: updated };
}

export function recordGameResult(
  outcome: "win" | "loss" | "draw",
  opponentName = "Tactical Bot",
  opponentRating = 1200,
  mode = "Standard Chess"
): LocalStats {
  const res = recordMatchRating(opponentName, opponentRating, outcome, 88.0, mode);
  return res.stats;
}
