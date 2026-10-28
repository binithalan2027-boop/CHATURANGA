import type { RoomView } from "./types";

/**
 * Lobby ordering and one-line status for the "Your games" list, so the
 * game that needs you is always at the top. Pure functions - unit-tested.
 */
export type RoomCategory =
  | "accept"
  | "yourTurn"
  | "opponentTurn"
  | "waiting"
  | "finished";

export function roomCategory(r: RoomView, viewerId: string): RoomCategory {
  if (r.status === "waiting")
    return r.invitee === viewerId ? "accept" : "waiting";
  if (r.status === "active")
    return r.turn === r.yourColor ? "yourTurn" : "opponentTurn";
  return "finished";
}

const ORDER: RoomCategory[] = [
  "accept",
  "yourTurn",
  "opponentTurn",
  "waiting",
  "finished",
];

/**
 * Stable sort: action-needed first, finished games last. Finished games
 * order by their last activity, newest first; other categories keep feed
 * order.
 */
export function sortRooms(rooms: RoomView[], viewerId: string): RoomView[] {
  return rooms
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      const ca = roomCategory(a.r, viewerId),
        cb = roomCategory(b.r, viewerId);
      if (ca !== cb) return ORDER.indexOf(ca) - ORDER.indexOf(cb);
      if (ca === "finished") return b.r.activityAt - a.r.activityAt;
      return a.i - b.i;
    })
    .map((x) => x.r);
}

/**
 * Compact relative time for lobby rows: "just now", "3m", "5h", "2d".
 * Returns "" for missing or invalid timestamps - callers render nothing.
 */
export function timeAgo(now: number, then: number): string {
  if (!Number.isFinite(then) || then <= 0) return "";
  const d = Math.max(0, now - then);
  if (d < 45_000) return "just now";
  const m = Math.round(d / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** Full move number of the next move to be played (1-based). */
function moveNumber(r: RoomView): number {
  return Math.floor(r.moves.length / 2) + 1;
}

/** Short, honest status line for one room in the list. Active games
 * carry the move number so rows are scannable at a glance. */
export function roomLabel(r: RoomView, viewerId: string): string {
  switch (roomCategory(r, viewerId)) {
    case "accept":
      return "challenges you";
    case "yourTurn":
      return r.moves.length === 0
        ? "your turn"
        : `your turn, move ${moveNumber(r)}`;
    case "opponentTurn":
      return r.moves.length === 0
        ? "opponent's turn"
        : `opponent's turn, move ${moveNumber(r)}`;
    case "waiting":
      return "waiting for an opponent";
    default:
      return r.result ?? "finished";
  }
}

/** Squares (0=a1) a last-move uci touches: [from, to], or [to] for drops. */
export function lastMoveSquares(uci: string | null | undefined): number[] {
  if (!uci) return [];
  const sq = (s: string) => {
    if (s.length !== 2) return -1;
    const file = s.charCodeAt(0) - 97,
      rank = s.charCodeAt(1) - 49;
    return file >= 0 && file < 8 && rank >= 0 && rank < 8
      ? file + rank * 8
      : -1;
  };
  if (uci[1] === "@") {
    const to = sq(uci.slice(2, 4));
    return to >= 0 ? [to] : [];
  }
  const from = sq(uci.slice(0, 2)),
    to = sq(uci.slice(2, 4));
  return from >= 0 && to >= 0 ? [from, to] : [];
}

export type LobbyFilter = "all" | "needsYou" | "waiting" | "finished";

/** Filter the sorted lobby list. "Needs you" folds challenges and your-turn
 * games into one bucket; "waiting" covers both challenges-to-accept and your
 * own open rooms so nothing actionable hides. */
export function filterRooms(
  rooms: RoomView[],
  viewerId: string,
  filter: LobbyFilter,
): RoomView[] {
  if (filter === "all") return rooms;
  return rooms.filter((r) => {
    const c = roomCategory(r, viewerId);
    switch (filter) {
      case "needsYou":
        return c === "accept" || c === "yourTurn";
      case "waiting":
        return c === "waiting" || c === "opponentTurn";
      default:
        return c === "finished";
    }
  });
}

/** Friendly variant name for the lobby (the raw rule key is jargon). */
export function ruleLabel(rule: string): string {
  const names: Record<string, string> = {
    chess: "Standard Chess",
    crazyhouse: "Crazyhouse",
    kingofthehill: "King of the Hill",
    "3check": "Three-Check Chess",
    antichess: "Antichess",
    atomic: "Atomic Chess",
    horde: "Horde Chess",
    racingkings: "Racing Kings",
    fog: "Fog of War",
  };
  return names[rule] ?? rule;
}

/** Compact time control for lobby rows ("5 min"). Rooms are created with
 * whole-minute clocks, so no increment suffix is needed. */
export function timeControlLabel(initialMs: number, incrementMs = 0): string {
  if (!Number.isFinite(initialMs) || initialMs <= 0) return "";
  const m = Math.round(initialMs / 60000);
  const base = m >= 1 ? `${m} min` : `${Math.round(initialMs / 1000)}s`;
  const inc = Math.round((incrementMs || 0) / 1000);
  return inc > 0 ? `${base} + ${inc}s` : base;
}
