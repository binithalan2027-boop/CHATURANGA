import { authConfigured, getSupabase } from "../lib/supabase";
import type { OnlineState, Provider } from "./types";

export const LIVE_RENDER_SERVER_URL = "https://chaturanga-jpy3.onrender.com";

export function getBaseUrl(): string {
  if (import.meta.env.VITE_GAME_SERVER_URL) {
    return import.meta.env.VITE_GAME_SERVER_URL;
  }
  if (typeof window !== "undefined") {
    // If running on local dev machine, connect to local backend server
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://127.0.0.1:8787";
    }
    // If running directly on a deployed domain (like onrender.com)
    if (window.location.origin.includes("onrender.com")) {
      return window.location.origin;
    }
  }
  // Everywhere else (localhost, local previews, or desktop):
  // ALWAYS connect directly to the 24/7 live Render server!
  return LIVE_RENDER_SERVER_URL;
}

export async function token() {
  if (authConfigured) {
    const { data } = await (await getSupabase()).auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  }
  return (
    sessionStorage.getItem("chaturanga-dev-token") ||
    localStorage.getItem("chaturanga-guest-token")
  );
}

export async function createGuestSession(): Promise<string> {
  try {
    const res = await api<{ token: string; guestId?: string; displayName?: string }>("guest-session", {});
    if (res.token) {
      sessionStorage.setItem("chaturanga-dev-token", res.token);
      localStorage.setItem("chaturanga-guest-token", res.token);
      return res.token;
    }
  } catch {
    try {
      const res = await api<{ token: string }>("local-session", {});
      if (res.token) {
        sessionStorage.setItem("chaturanga-dev-token", res.token);
        localStorage.setItem("chaturanga-guest-token", res.token);
        return res.token;
      }
    } catch {}
  }
  return "";
}

export async function api<T = unknown>(
  path: string,
  data?: unknown,
): Promise<T> {
  const base = getBaseUrl();
  const t = await token();
  const res = await fetch(`${base}/api/${path}`, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      ...(data === undefined ? {} : { "Content-Type": "application/json" }),
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const text = await res.text();
  let value: any = {};
  try {
    value = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) {
      throw Error(
        res.status === 404 || res.status === 502 || res.status === 503
          ? "Game server is starting up. Please wait a moment and retry."
          : `Server returned HTTP ${res.status}.`
      );
    }
  }
  if (!res.ok) throw Error(value.error ?? "Request failed.");
  return value;
}
export async function localSignIn() {
  const { token: t } = await api<{ token: string }>("local-session", {});
  sessionStorage.setItem("chaturanga-dev-token", t);
}
export async function socialSignIn(provider: Provider) {
  if (
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY
  )
    throw Error("Social login has not been configured.");
  const { error } = await (await getSupabase()).auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}
export async function signOut() {
  try {
    await api("logout", {});
  } finally {
    sessionStorage.removeItem("chaturanga-dev-token");
    localStorage.removeItem("chaturanga-guest-token");
    if (authConfigured) await (await getSupabase()).auth.signOut();
  }
}
export function subscribe(
  onState: (state: OnlineState) => void,
  onStatus: (s: string) => void,
) {
  let closed = false,
    ws: WebSocket | undefined,
    retry: ReturnType<typeof setTimeout>;
  async function connect() {
    if (closed) return;
    const t = await token();
    if (!t) {
      onStatus("Sign in required.");
      return;
    }
    const base = getBaseUrl();
    const wsProtocol = base.startsWith("https") ? "wss:" : "ws:";
    const wsUrl = base.replace(/^https?:/, wsProtocol) + "/api/live";
    ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      onStatus("Connected");
      ws?.send(JSON.stringify({ token: t }));
    };
    ws.onmessage = (e) => {
      try {
        const v = JSON.parse(e.data);
        if (v.state) onState(v.state);
      } catch {
        onStatus("Invalid server response.");
      }
    };
    ws.onclose = () => {
      if (!closed) {
        onStatus("Reconnecting. Moves wait for server confirmation.");
        retry = setTimeout(connect, 3000);
      }
    };
    ws.onerror = () => onStatus("Server connection unavailable.");
  }
  void connect();
  return () => {
    closed = true;
    clearTimeout(retry);
    ws?.close();
  };
}
