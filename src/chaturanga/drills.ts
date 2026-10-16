import { MistakePuzzle } from "./mistakeDetector";

export interface Drill extends MistakePuzzle {
  id: string;
  source: string;
  addedOn: string; // YYYY-MM-DD
  solvedOn?: string;
  attempts: number;
  fails: number;
}

export interface DrillStore {
  schemaVersion: 1;
  drills: Drill[];
  days: Record<string, { solved: number; failed: number }>;
}

const KEY = "chaturanga-drills-v1";

export function emptyStore(): DrillStore {
  return { schemaVersion: 1, drills: [], days: {} };
}

export function loadStore(now = new Date()): DrillStore {
  void now;
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (s?.schemaVersion === 1 && Array.isArray(s.drills)) return s;
  } catch {
    /* corrupt store starts empty */
  }
  return emptyStore();
}

export function saveStore(store: DrillStore) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function drillId(p: MistakePuzzle): string {
  return `${p.ply}:${p.fen.slice(0, 24)}:${p.best}`;
}

/** Add scanned puzzles as drills; dedupes by position+best move. Returns added count. */
export function addPuzzles(
  store: DrillStore,
  puzzles: MistakePuzzle[],
  source: string,
  today = dayKey(),
): number {
  const seen = new Set(store.drills.map((d) => d.id));
  let added = 0;
  for (const p of puzzles) {
    const id = drillId(p);
    if (seen.has(id)) continue;
    seen.add(id);
    store.drills.push({ ...p, id, source, addedOn: today, attempts: 0, fails: 0 });
    added++;
  }
  return added;
}

/** Today's set: unsolved first (oldest first), then previously failed for retry. */
export function dailyDrills(store: DrillStore, count = 5): Drill[] {
  const unsolved = store.drills.filter((d) => !d.solvedOn);
  const fresh = unsolved.filter((d) => d.fails === 0);
  const retries = unsolved.filter((d) => d.fails > 0);
  return [...fresh, ...retries].slice(0, count);
}

export function recordAttempt(
  store: DrillStore,
  id: string,
  solved: boolean,
  today = dayKey(),
) {
  const d = store.drills.find((x) => x.id === id);
  if (!d) return;
  d.attempts++;
  const day = (store.days[today] ??= { solved: 0, failed: 0 });
  if (solved) {
    d.solvedOn = today;
    day.solved++;
  } else {
    d.fails++;
    day.failed++;
  }
}

export interface DrillStats {
  total: number;
  solved: number;
  due: number;
  streak: number;
}

export function drillStats(store: DrillStore, today = dayKey()): DrillStats {
  const solved = store.drills.filter((d) => d.solvedOn).length;
  let streak = 0;
  const cursor = new Date(today + "T00:00:00Z");
  for (;;) {
    const k = cursor.toISOString().slice(0, 10);
    const day = store.days[k];
    if (day && day.solved > 0) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else if (k === today) {
      cursor.setUTCDate(cursor.getUTCDate() - 1); // today not done yet: don't break streak
    } else break;
  }
  return {
    total: store.drills.length,
    solved,
    due: store.drills.filter((d) => !d.solvedOn).length,
    streak,
  };
}
