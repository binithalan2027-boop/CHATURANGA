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
  service = new Service(
    store,
    undefined,
    Number(process.env.ABANDON_MS) || 60_000,
  );
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
  // Check local store session first (supports guests and local dev players)
  const session = store.get<Session>("session", token);
  if (session && session.expires > Date.now()) {
    service.requireUser(session.user);
    return session.user;
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
  limiter.check(`authfail:${ip}`, 30 * LIMIT_SCALE, "Too many failed sign-ins.");
  throw Error("Local session expired.");
}

/** A user counts as online while any of their tabs holds a live socket. */
function isOnline(userId: string | null): boolean {
  if (!userId) return false;
  for (const [ws, identity] of clients)
    if (
      identity.id === userId &&
      identity.expires > Date.now() &&
      ws.readyState === WebSocket.OPEN
    )
      return true;
  return false;
}

function stateFor(id: string) {
  return store.transaction(() => {
    const state = {
      ...service.state(id, mode as "local" | "supabase"),
      customRooms: custom.state(id),
      entitlement: entitlements.status(id),
    };
    for (const room of state.rooms) {
      room.whiteOnline = isOnline(room.white);
      room.blackOnline = room.black ? isOnline(room.black) : false;
    }
    return state;
  });
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
  service.sweep();
  // Compute each player's state once per tick, then fan out to their tabs.
  for (const [id, sockets] of byUser) {
    service.touch(id);
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
  // CORS headers matter only for cross-origin browser requests, which
  // always send Origin. Setting the header to "undefined" would throw.
  if (req.headers.origin) {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }
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
    if (req.method === "POST" && (path === "/api/local-session" || path === "/api/guest-session")) {
      if (path === "/api/local-session" && mode !== "local") throw Error("Local sign-in is disabled.");
      limiter.check(`signup:${ip}`, 30 * LIMIT_SCALE);
      const token = randomBytes(32).toString("hex"),
        id = "guest_" + randomBytes(8).toString("hex");
      const guestNum = Math.floor(1000 + Math.random() * 9000);
      const p = service.ensureUser(id);
      p.displayName = `Guest #${guestNum}`;
      p.username = `guest_${guestNum}`;
      p.adultConfirmed = true;
      store.put("profile", id, p);
      store.put("session", token, {
        id: token,
        user: id,
        expires: Date.now() + 7 * 86400000,
      });
      reply(res, 200, { token, guestId: id, displayName: p.displayName });
      return;
    }
    if (req.method === "POST" && path === "/api/ai-coach") {
      limiter.check(`ai:${ip}`, 30 * LIMIT_SCALE);
      const data = await body(req);
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        reply(res, 200, {
          ok: true,
          explanation: "AI Coach ready: Add GEMINI_API_KEY to your .env to unlock real-time Gemini grandmaster insights for every position.",
          source: "heuristic",
          available: false,
        });
        return;
      }

      const prompt = `You are an expert chess master coach. Explain this chess position or move in 1-2 clear, punchy sentences in plain English for a club player. Focus on the tactical or strategic objective (e.g. piece development, central control, king safety, open files, outpost, or tactical fork/pin).
FEN: ${String(data.fen || "").slice(0, 100)}
${data.san ? `Move played: ${String(data.san).slice(0, 10)}` : ""}
${data.bestMove ? `Engine suggested move: ${String(data.bestMove).slice(0, 10)}` : ""}
${data.evaluation ? `Stockfish score: ${String(data.evaluation).slice(0, 30)}` : ""}`;

      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 120, temperature: 0.3 },
            }),
          }
        );

        if (!geminiRes.ok) {
          reply(res, 200, {
            ok: true,
            explanation: "Gemini API temporarily busy. The engine evaluation and candidate move remain active.",
            source: "heuristic",
            available: false,
          });
          return;
        }

        const gData = (await geminiRes.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = gData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        reply(res, 200, {
          ok: true,
          explanation: text || "Tactical balance maintained. Look for open lines and piece activity.",
          source: "gemini",
          available: true,
        });
      } catch {
        reply(res, 200, {
          ok: true,
          explanation: "Unable to reach Gemini API. Local engine evaluation remains active.",
          source: "heuristic",
          available: false,
        });
      }
      return;
    }
    if (req.method === "POST" && path === "/api/email/send") {
      limiter.check(`email:${ip}`, 10 * LIMIT_SCALE);
      const data = await body(req);
      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) {
        console.log("[Resend Simulated Email]", data);
        reply(res, 200, { ok: true, simulated: true });
        return;
      }
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "Chaturanga <onboarding@resend.dev>",
            to: data.to,
            subject: data.subject,
            html: data.html,
            text: data.text,
          }),
        });
        const rData = await resendRes.json();
        reply(res, 200, { ok: resendRes.ok, data: rData });
      } catch (e) {
        reply(res, 500, { error: String(e) });
      }
      return;
    }
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    const id = await auth(token, ip);
    service.touch(id);
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
      if (data.action === "rematch") entitlements.assertCanPlay(id);
      const out = service.act(id, data.room, data.version, data.action, data.uci);
      reply(res, 200, out ?? { ok: true });
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
          room: service.create(id, data.rule as Rule, data.minutes, data.invitee, {
            incrementSeconds: Number(data.incrementSeconds ?? 0),
          }),
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
    service.touch(id);
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
    // Opponents see the seat go offline promptly, not on the next action.
    publish();
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
