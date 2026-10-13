import { createServer, type IncomingMessage } from "node:http";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { WebSocketServer, WebSocket } from "ws";
import { createClient } from "@supabase/supabase-js";
import { Store } from "./store";
import { Service } from "./service";
import { CustomService } from "./custom";
import {
  RateLimiter,
  ConnectionTracker,
  clientIp,
  originAllowed,
  apiSecurityHeaders,
  clientCsp,
  staticSecurityHeaders,
} from "./http";
import { createStaticHandler } from "./static";
import { sweepExpired } from "./maintenance";
import { Entitlements } from "./entitlements";
import type { Rule } from "../src/online/types";

const mode = process.env.AUTH_MODE ?? "local";
if (!["local", "supabase"].includes(mode))
  throw Error("AUTH_MODE must be local or supabase.");
const host = process.env.HOST ?? "127.0.0.1",
  port = Number(process.env.PORT ?? 8787);
if (mode === "local" && !["127.0.0.1", "localhost", "::1"].includes(host))
  throw Error("Local authentication must bind to loopback.");
if (mode === "local" && process.env.NODE_ENV === "production")
  throw Error("Local authentication is forbidden in production.");
const origins = (
  process.env.ALLOWED_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173"
).split(",");
if (
  mode === "supabase" &&
  (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY)
)
  throw Error("Supabase configuration required.");
if (
  mode === "supabase" &&
  process.env.PUBLIC_LEGAL_REVIEW !== "approved"
)
  throw Error(
    "Public account play requires reviewed audience, child-data safeguards, policies and grievance operations. Local testing remains available.",
  );
const trustProxy = process.env.TRUST_PROXY === "1";
const behindTls = process.env.BEHIND_TLS === "1";
const supabase =
  mode === "supabase"
    ? createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_PUBLISHABLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      )
    : null;

mkdirSync("data", { recursive: true });
const store = new Store(process.env.DB_PATH ?? "data/chaturanga.sqlite"),
  service = new Service(store);
const custom = new CustomService(
  store,
  () => Date.now(),
  (a, b) => {
    if (
      !(
        service.requireUser(a).adultConfirmed ||
        service.requireUser(a).profileReady
      )
    )
      throw Error("Save your test profile first.");
    if (b && service.blocked(a, b)) throw Error("Player unavailable.");
  },
  (id) => service.requireUser(id).displayName,
);

/** Static client build (production single-process deploy). */
const staticDir =
  process.env.STATIC_DIR ?? (existsSync("dist/index.html") ? "dist" : null);
const staticHandler = staticDir ? createStaticHandler(staticDir) : null;
const extraConnect = (process.env.CSP_CONNECT_SRC ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (process.env.SUPABASE_URL) {
  try {
    const u = new URL(process.env.SUPABASE_URL);
    extraConnect.push(u.origin, `wss://${u.host}`);
  } catch {
    /* validated by Supabase client creation above */
  }
}
const csp = clientCsp(extraConnect);
const cspReportOnly = process.env.CSP_REPORT_ONLY === "1";

const entitlements = Entitlements.fromEnv(store);
const limiter = new RateLimiter(60_000);
/** Multiplies every rate limit. For load testing and capacity tuning only. */
const LIMIT_SCALE = Math.max(1, Number(process.env.RATE_LIMIT_SCALE ?? 1));
interface Session {
  id: string;
  user: string;
  expires: number;
}
/** Short-lived cache of validated Supabase tokens (avoids an upstream call per request). */
const tokenCache = new Map<string, { user: string; expires: number }>();
const clients = new Map<WebSocket, { id: string; expires: number }>();
const wsPerIp = new ConnectionTracker(20);
/** Re-authenticate push sockets periodically so revoked sessions drop. */
const WS_REAUTH_MS = 5 * 60_000;

async function auth(token: unknown, ip: string) {
  if (typeof token !== "string" || token.length > 4096) {
    limiter.check(`authfail:${ip}`, 30 * LIMIT_SCALE, "Too many failed sign-ins.");
    throw Error("Sign in required.");
  }
  if (supabase) {
    const cached = tokenCache.get(token);
    if (cached && cached.expires > Date.now()) return cached.user;
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      limiter.check(`authfail:${ip}`, 30 * LIMIT_SCALE, "Too many failed sign-ins.");
      throw Error("Sign in expired.");
    }
    service.ensureUser(data.user.id);
    tokenCache.set(token, {
      user: data.user.id,
      expires: Date.now() + 60_000,
    });
    if (tokenCache.size > 5000)
      for (const [k, v] of tokenCache)
        if (v.expires < Date.now()) tokenCache.delete(k);
    return data.user.id;
  }
  const session = store.get<Session>("session", token);
  if (!session || session.expires < Date.now()) {
    limiter.check(`authfail:${ip}`, 30 * LIMIT_SCALE, "Too many failed sign-ins.");
    throw Error("Local session expired.");
  }
  service.requireUser(session.user);
  return session.user;
}

function stateFor(id: string) {
  return store.transaction(() => ({
    ...service.state(id, mode as "local" | "supabase"),
    customRooms: custom.state(id),
    entitlement: entitlements.status(id),
  }));
}

function publish() {
  const byUser = new Map<string, WebSocket[]>();
  for (const [ws, identity] of clients) {
    if (identity.expires < Date.now()) {
      ws.close();
      continue;
    }
    if (ws.readyState !== WebSocket.OPEN) continue;
    const list = byUser.get(identity.id) ?? [];
    list.push(ws);
    byUser.set(identity.id, list);
  }
  // Compute each player's state once per tick, then fan out to their tabs.
  for (const [id, sockets] of byUser) {
    let payload: string;
    try {
      payload = JSON.stringify({ state: stateFor(id) });
    } catch {
      for (const ws of sockets) ws.close();
      continue;
    }
    for (const ws of sockets) ws.send(payload);
  }
}

function reply(
  res: import("node:http").ServerResponse,
  status: number,
  body: unknown,
) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

async function body(req: IncomingMessage) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 16384) throw Error("Request too large.");
  }
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw Error("Invalid request body.");
  }
}

/** Deletes the Supabase auth identity. Requires the secret (service-role) key. */
async function deleteAuthIdentity(
  userId: string,
): Promise<"deleted" | "manual-step-required" | "failed"> {
  if (!supabase) return "manual-step-required";
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) return "manual-step-required";
  try {
    const r = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/admin/users/${userId}`,
      {
        method: "DELETE",
        headers: { apikey: secret, Authorization: `Bearer ${secret}` },
      },
    );
    return r.ok ? "deleted" : "failed";
  } catch {
    return "failed";
  }
}

const server = createServer(async (req, res) => {
  const ip = clientIp(req, trustProxy);
  const path = (req.url ?? "").split("?")[0];
  if (
    (path === "/healthz" || path === "/api/healthz") &&
    req.method === "GET"
  ) {
    apiSecurityHeaders(res);
    reply(res, 200, { ok: true });
    return;
  }
  if (!path.startsWith("/api/")) {
    if (staticHandler) {
      staticSecurityHeaders(res, { csp, behindTls, reportOnly: cspReportOnly });
      if (staticHandler(req, res)) return;
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found.");
    return;
  }
  apiSecurityHeaders(res);
  if (!originAllowed(req.headers.origin, req.headers.host, origins)) {
    reply(res, 403, { error: "Origin not allowed." });
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin!);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  try {
    limiter.check(`http:${ip}`, 120 * LIMIT_SCALE);
    if (path === "/api/config") {
      reply(res, 200, {
        mode,
        providers: (process.env.AUTH_PROVIDERS ?? "")
          .split(",")
          .filter((p) => ["google", "facebook", "discord"].includes(p)),
        entitlements: entitlements.describe(),
      });
      return;
    }
    if (req.method === "POST" && path === "/api/local-session") {
      if (mode !== "local") throw Error("Local sign-in is disabled.");
      limiter.check(`signup:${ip}`, 15 * LIMIT_SCALE);
      const token = randomBytes(32).toString("hex"),
        id = randomBytes(16).toString("hex");
      service.ensureUser(id);
      store.put("session", token, {
        id: token,
        user: id,
        expires: Date.now() + 7 * 86400000,
      });
      reply(res, 200, { token });
      return;
    }
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    const id = await auth(token, ip);
    if (req.method === "GET" && path === "/api/state") {
      reply(res, 200, stateFor(id));
      return;
    }
    if (req.method === "GET" && path === "/api/export") {
      reply(res, 200, {
        ...service.export(id),
        customGames: custom.export(id),
      });
      return;
    }
    if (req.method !== "POST") throw Error("Unsupported request.");
    limiter.check(`act:${id}`, 240 * LIMIT_SCALE);
    const data = await body(req);
    let result: unknown = { ok: true };
    if (path === "/api/custom-action") {
      store.transaction(() => custom.act(id, data.room, data.version, data));
      reply(res, 200, { ok: true });
      publish();
      return;
    }
    if (path === "/api/game") {
      service.act(id, data.room, data.version, data.action, data.uci);
      reply(res, 200, { ok: true });
      publish();
      return;
    }
    // Synchronous transaction prevents simultaneous joins/moves from racing.
    store.transaction(() => {
      if (path === "/api/custom-create") {
        entitlements.assertCanPlay(id);
        result = { room: custom.create(id, data.kind, data.minutes) };
      } else if (path === "/api/custom-join") {
        entitlements.assertCanPlay(id);
        custom.join(id, data.room);
      }
      else if (path === "/api/report") result = service.report(id, data);
      else if (path === "/api/reports") result = service.reports(id);
      else if (path === "/api/profile")
        result = service.profile(id, data, mode === "local");
      else if (path === "/api/find")
        result = service.lookup(id, String(data.username ?? "").slice(0, 24));
      else if (path === "/api/friend")
        service.friendAction(id, data.action, data.target);
      else if (path === "/api/create") {
        entitlements.assertCanPlay(id);
        result = {
          room: service.create(id, data.rule as Rule, data.minutes, data.invitee),
        };
      } else if (path === "/api/join") {
        entitlements.assertCanPlay(id);
        service.join(id, data.room);
      }
      else if (path === "/api/delete") {
        entitlements.revoke(id);
        custom.delete(id);
        service.deleteUser(id);
        for (const s of store.all<Session>("session"))
          if (s.user === id) store.delete("session", s.id);
      } else if (path === "/api/logout") {
        if (mode === "local" && token) store.delete("session", token);
      } else throw Error("Unknown endpoint.");
    });
    if (path === "/api/delete") {
      for (const [k, v] of tokenCache) if (v.user === id) tokenCache.delete(k);
      result = { ok: true, authIdentity: await deleteAuthIdentity(id) };
    }
    if (path === "/api/logout" && token) tokenCache.delete(token);
    if (path === "/api/delete" || path === "/api/logout")
      for (const [ws, identity] of clients) if (identity.id === id) ws.close();
    reply(res, 200, result);
    publish();
  } catch (e) {
    reply(res, 400, {
      error: e instanceof Error ? e.message : "Request failed.",
    });
  }
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
server.on("upgrade", (req, socket, head) => {
  const ip = clientIp(req, trustProxy);
  try {
    limiter.check(`ws:${ip}`, 30 * LIMIT_SCALE);
  } catch {
    socket.destroy();
    return;
  }
  if (
    !originAllowed(req.headers.origin, req.headers.host, origins) ||
    req.url !== "/api/live"
  ) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});
wss.on("connection", (ws, req: IncomingMessage) => {
  const ip = clientIp(req, trustProxy);
  if (!wsPerIp.acquire(ip)) {
    ws.close();
    return;
  }
  const timeout = setTimeout(() => ws.close(), 5000);
  let authenticated = false;
  ws.on("message", async (raw) => {
    try {
      if (authenticated) {
        ws.close();
        return;
      }
      authenticated = true;
      const { token } = JSON.parse(raw.toString());
      const id = await auth(token, ip);
      clearTimeout(timeout);
      clients.set(ws, { id, expires: Date.now() + WS_REAUTH_MS });
      publish();
    } catch {
      ws.close();
    }
  });
  ws.on("close", () => {
    clearTimeout(timeout);
    clients.delete(ws);
    wsPerIp.release(ip);
  });
});

function sweep() {
  try {
    const r = sweepExpired(store, {
      gameRetentionDays: Number(process.env.GAME_RETENTION_DAYS ?? 180),
      reportRetentionDays: Number(process.env.REPORT_RETENTION_DAYS ?? 365),
    });
    const total =
      r.sessions +
      r.rooms +
      (r.waiting ?? 0) +
      r.custom +
      r.reports +
      (r.abandoned ?? 0);
    if (total > 0) console.log(`Retention sweep purged: ${JSON.stringify(r)}`);
  } catch (e) {
    console.error("Retention sweep failed:", e);
  }
}
sweep();
const sweepTimer = setInterval(sweep, 3600_000);
const timer = setInterval(publish, 1000);
server.listen(port, host, () =>
  console.log(
    `Chaturanga server: http://${host}:${port} (${mode} authentication${staticDir ? `, static ${staticDir}` : ""})`,
  ),
);
function shutdown() {
  clearInterval(timer);
  clearInterval(sweepTimer);
  for (const ws of clients.keys()) ws.close();
  wss.close();
  server.close(() => {
    store.close();
    process.exit();
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
