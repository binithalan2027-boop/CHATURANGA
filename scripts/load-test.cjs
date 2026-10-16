/**
 * Local load/soak test for the Chaturanga server. Runs entirely on loopback
 * against a dev server (AUTH_MODE=local). Not a production benchmark; it
 * proves the single-process design holds up at small-community scale.
 *
 * Usage: node scripts/load-test.cjs [players=50] [movesPerPlayer=10] [soakSeconds=30]
 */
const { WebSocket } = require("ws");
const BASE = process.env.GAME_SERVER ?? "http://127.0.0.1:8787";
const ORIGIN = "http://localhost:5173";
const PLAYERS = Number(process.argv[2] ?? 50);
// The scripted line has LINE.length plies; MOVES is clamped so a game never
// replays the opening: a repeated move is illegal mid-game and would show up
// as move errors that are harness artifacts, not server failures.
const MOVES = Math.min(Number(process.argv[3] ?? 10), 10);
const SOAK_S = Number(process.argv[4] ?? 30);
const LINE = [
  "e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4", "g8f6",
  "e1g1", "f8e7", "f1e1", "b7b5", "a4b3", "d7d6", "c2c3", "e8g8",
  "h2h3", "c6b8", "d2d4", "b8d7",
];

const stats = {
  stateLat: [], moveLat: [], pushes: 0, moveErrors: 0, otherErrors: 0,
};
const pct = (arr, p) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]);
};

async function api(token, path, data) {
  const t0 = performance.now();
  const res = await fetch(`${BASE}/api/${path}`, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      Origin: ORIGIN,
      ...(data === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const ms = performance.now() - t0;
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, ms, body };
}

async function makePlayer(i) {
  const sess = await api(null, "local-session", {});
  if (!sess.ok) throw Error("session failed: " + JSON.stringify(sess.body));
  const token = sess.body.token;
  await api(token, "profile", {
    username: `load_${Date.now().toString(36)}_${i}`,
    displayName: `Load ${i}`,
    bio: "", country: "", timezone: "UTC",
    discoverable: false, adultConfirmed: true, fideRating: null,
  });
  const ws = new WebSocket(BASE.replace(/^http/, "ws") + "/api/live", {
    headers: { Origin: ORIGIN },
  });
  await new Promise((resolve, reject) => {
    ws.once("open", () => { ws.send(JSON.stringify({ token })); resolve(); });
    ws.once("error", reject);
    setTimeout(() => reject(Error("ws open timeout")), 5000);
  });
  ws.on("message", () => stats.pushes++);
  return { token, ws, i };
}

async function playRoom(a, b) {
  const created = await api(a.token, "create", { rule: "chess", minutes: 15 });
  if (!created.ok) { stats.otherErrors++; return; }
  const room = created.body.room;
  const joined = await api(b.token, "join", { room });
  if (!joined.ok) { stats.otherErrors++; return; }
  let version = 0;
  for (let ply = 0; ply < MOVES * 2; ply++) {
    const me = ply % 2 === 0 ? a : b;
    // refresh version from state occasionally to stay in sync
    const st = await api(me.token, "state");
    if (st.ok) {
      stats.stateLat.push(st.ms);
      const r = st.body.rooms.find((x) => x.id === room);
      if (!r) { stats.otherErrors++; return; }
      version = r.version;
      if (r.status !== "active") return;
    }
    const uci = LINE[ply % LINE.length];
    const t0 = performance.now();
    const mv = await api(me.token, "game", { room, version, action: "move", uci });
    stats.moveLat.push(performance.now() - t0);
    if (!mv.ok) stats.moveErrors++;
    await new Promise((r) => setTimeout(r, 50 + Math.random() * 150));
  }
}

(async () => {
  const t0 = Date.now();
  console.log(`Load test: ${PLAYERS} players, ${MOVES} moves each, ${SOAK_S}s soak, ${BASE}`);
  const players = [];
  for (let i = 0; i < PLAYERS; i++) players.push(await makePlayer(i));
  console.log(`Players ready: ${players.length}`);
  const rooms = [];
  for (let i = 0; i + 1 < players.length; i += 2)
    rooms.push(playRoom(players[i], players[i + 1]));
  // Soak: while games run, hold connections and count pushes.
  await Promise.race([
    Promise.all(rooms),
    new Promise((r) => setTimeout(r, SOAK_S * 1000 * 2)),
  ]);
  await new Promise((r) => setTimeout(r, SOAK_S * 1000));
  for (const p of players) p.ws.close();
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(JSON.stringify({
    durationSeconds: Number(dur),
    players: players.length,
    moves: { count: stats.moveLat.length, errors: stats.moveErrors,
      p50ms: pct(stats.moveLat, 50), p95ms: pct(stats.moveLat, 95), p99ms: pct(stats.moveLat, 99) },
    stateReads: { count: stats.stateLat.length,
      p50ms: pct(stats.stateLat, 50), p95ms: pct(stats.stateLat, 95), p99ms: pct(stats.stateLat, 99) },
    wsPushesReceived: stats.pushes,
    otherErrors: stats.otherErrors,
  }, null, 2));
  process.exit(stats.moveErrors || stats.otherErrors ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
