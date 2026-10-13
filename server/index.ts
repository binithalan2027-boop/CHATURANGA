import { createServer, type IncomingMessage } from "node:http";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { WebSocketServer, WebSocket } from "ws";
import { createClient } from "@supabase/supabase-js";
import { Store } from "./store";
import { Service } from "./service";
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
interface Session {
  id: string;
  user: string;
  expires: number;
}
const clients = new Map<WebSocket, { id: string; expires: number }>(),
  buckets = new Map<string, { n: number; start: number }>();
function limit(key: string, max = 120) {
  const t = Date.now();
  let b = buckets.get(key);
  if (!b || t - b.start > 60000) {
    b = { n: 0, start: t };
    buckets.set(key, b);
  }
  if (++b.n > max) throw Error("Too many requests. Try again in a minute.");
  if (buckets.size > 10000)
    for (const [k, v] of buckets) if (t - v.start > 60000) buckets.delete(k);
}
function allow(req: IncomingMessage) {
  return !!req.headers.origin && origins.includes(req.headers.origin);
}
async function auth(token: unknown) {
  if (typeof token !== "string" || token.length > 4096)
    throw Error("Sign in required.");
  if (supabase) {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw Error("Sign in expired.");
    service.ensureUser(data.user.id);
    return data.user.id;
  }
  const session = store.get<Session>("session", token);
  if (!session || session.expires < Date.now())
    throw Error("Local session expired.");
  service.requireUser(session.user);
  return session.user;
}
function publish() {
  for (const [ws, identity] of clients)
    if (ws.readyState === WebSocket.OPEN) {
      if (identity.expires < Date.now()) {
        ws.close();
        continue;
      }
      const id = identity.id;
      try {
        ws.send(
          JSON.stringify({
            state: store.transaction(() =>
              service.state(id, mode as "local" | "supabase"),
            ),
          }),
        );
      } catch {
        ws.close();
      }
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
  return raw ? JSON.parse(raw) : {};
}
const server = createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (!allow(req)) {
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
    limit(req.socket.remoteAddress ?? "unknown");
    const path = (req.url ?? "").split("?")[0];
    if (path === "/api/config") {
      reply(res, 200, {
        mode,
        providers: (process.env.AUTH_PROVIDERS ?? "")
          .split(",")
          .filter((p) => ["google", "facebook", "discord"].includes(p)),
      });
      return;
    }
    if (req.method === "POST" && path === "/api/local-session") {
      if (mode !== "local") throw Error("Local sign-in is disabled.");
      limit(`signup:${req.socket.remoteAddress}`, 15);
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
    const id = await auth(token);
    if (req.method === "GET" && path === "/api/state") {
      reply(
        res,
        200,
        store.transaction(() =>
          service.state(id, mode as "local" | "supabase"),
        ),
      );
      return;
    }
    if (req.method === "GET" && path === "/api/export") {
      reply(res, 200, service.export(id));
      return;
    }
    if (req.method !== "POST") throw Error("Unsupported request.");
    const data = await body(req);
    let result: unknown = { ok: true };
    if (path === "/api/game") {
      service.act(id, data.room, data.version, data.action, data.uci);
      reply(res, 200, { ok: true });
      publish();
      return;
    }
    // Synchronous transaction prevents simultaneous joins/moves from racing.
    store.transaction(() => {
      if (path === "/api/profile") result = service.profile(id, data);
      else if (path === "/api/find")
        result = service.lookup(id, String(data.username ?? "").slice(0, 24));
      else if (path === "/api/friend")
        service.friendAction(id, data.action, data.target);
      else if (path === "/api/create")
        result = {
          room: service.create(
            id,
            data.rule as Rule,
            data.minutes,
            data.invitee,
          ),
        };
      else if (path === "/api/join") service.join(id, data.room);
      else if (path === "/api/game")
        throw Error("Internal game route conflict.");
      else if (path === "/api/delete") {
        service.deleteUser(id);
        for (const s of store.all<Session>("session"))
          if (s.user === id) store.delete("session", s.id);
      } else if (path === "/api/logout") {
        if (mode === "local" && token) store.delete("session", token);
      } else throw Error("Unknown endpoint.");
    });
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
  if (!allow(req) || req.url !== "/api/live") {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});
wss.on("connection", (ws) => {
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
      const id = await auth(token);
      clearTimeout(timeout);
      clients.set(ws, { id, expires: Date.now() + 5 * 60000 });
      publish();
    } catch {
      ws.close();
    }
  });
  ws.on("close", () => {
    clearTimeout(timeout);
    clients.delete(ws);
  });
});
const timer = setInterval(publish, 1000);
server.listen(port, host, () =>
  console.log(
    `Chaturanga server: http://${host}:${port} (${mode} authentication)`,
  ),
);
function shutdown() {
  clearInterval(timer);
  for (const ws of clients.keys()) ws.close();
  wss.close();
  server.close(() => {
    store.close();
    process.exit();
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
