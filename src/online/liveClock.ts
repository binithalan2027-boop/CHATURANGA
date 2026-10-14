/**
 * Local clock countdown between server pushes. The server stays
 * authoritative; this only smooths the display so clocks tick like a
 * real chess site instead of jumping on each update.
 */
export interface ClockSource {
  whiteMs: number;
  blackMs: number;
  turn: "white" | "black";
  status: "waiting" | "active" | "finished";
}

export function liveClock(room: ClockSource, elapsedMs: number): { whiteMs: number; blackMs: number } {
  let { whiteMs, blackMs } = room;
  if (room.status === "active") {
    const dt = Math.max(0, elapsedMs);
    if (room.turn === "white") whiteMs = Math.max(0, whiteMs - dt);
    else blackMs = Math.max(0, blackMs - dt);
  }
  return { whiteMs, blackMs };
}

/** m:ss normally, s.t tenths once under 10 seconds remain. */
export function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  const s = Math.ceil(clamped / 1000);
  if (s > 10) return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const t = Math.ceil(clamped / 100) / 10;
  return `0:${t.toFixed(1)}`;
}
