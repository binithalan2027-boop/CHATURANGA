import type { Store } from "./store";

export interface SweepOptions {
  now?: number;
  /** Days a waiting (never-joined) room is kept. Default 7. */
  waitingRoomDays?: number;
  /** Days finished games/custom rooms are kept before purge. Default 180. */
  gameRetentionDays?: number;
  /** Days report tickets are kept after their last update. Default 365. */
  reportRetentionDays?: number;
}

interface TimedRoom {
  id: string;
  status: string;
  updatedAt?: number;
  createdAt?: number;
  finishedAt?: number;
}
interface Session {
  id: string;
  expires: number;
}
interface Report {
  id: string;
  updatedAt: number;
}

const DAY = 86_400_000;

/**
 * Retention cleanup. Returns counts so operators can log what was purged.
 * Local sessions expire after 7 days; finished games are kept for
 * gameRetentionDays so players retain history/export, then removed.
 */
export function sweepExpired(store: Store, opts: SweepOptions = {}) {
  const now = opts.now ?? Date.now();
  const gameCutoff = now - (opts.gameRetentionDays ?? 180) * DAY;
  const reportCutoff = now - (opts.reportRetentionDays ?? 365) * DAY;
  const waitingCutoff = now - (opts.waitingRoomDays ?? 7) * DAY;
  let sessions = 0,
    rooms = 0,
    waiting = 0,
    custom = 0,
    reports = 0;
  for (const s of store.all<Session>("session"))
    if (s.expires < now) {
      store.delete("session", s.id);
      sessions++;
    }
  for (const r of store.all<TimedRoom>("room")) {
    if (r.status === "finished" && (r.updatedAt ?? 0) < gameCutoff) {
      store.delete("room", r.id);
      rooms++;
    } else if (r.status === "waiting" && (r.updatedAt ?? 0) < waitingCutoff) {
      // Abandoned rooms nobody joined: purge so they cannot accumulate.
      store.delete("room", r.id);
      waiting++;
    }
  }
  for (const r of store.all<TimedRoom>("custom")) {
    if (
      r.status === "finished" &&
      (r.finishedAt ?? r.updatedAt ?? 0) < gameCutoff
    ) {
      store.delete("custom", r.id);
      custom++;
    } else if (
      r.status === "waiting" &&
      (r.createdAt ?? r.updatedAt ?? 0) < waitingCutoff
    ) {
      store.delete("custom", r.id);
      waiting++;
    }
  }
  for (const r of store.all<Report>("report"))
    if (r.updatedAt < reportCutoff) {
      store.delete("report", r.id);
      reports++;
    }
  return { sessions, rooms, waiting, custom, reports };
}
