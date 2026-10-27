import { authConfigured, getSupabase } from "../lib/supabase";
import type { OnlineState, Provider } from "./types";

export const LIVE_RENDER_SERVER_URL = "https://chaturanga-jpy3.onrender.com";

let currentBaseUrl: string | null = null;

export function clearLocalTokens() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("chaturanga-dev-token");
    localStorage.removeItem("chaturanga-guest-token");
  }
}

export function setForcedBaseUrl(url: string | null) {
  currentBaseUrl = url;
}

export function getActiveServerMode(): "local" | "cloud" {
  const base = getBaseUrl();
  return base.includes("127.0.0.1") || base.includes("localhost") ? "local" : "cloud";
}

export function getBaseUrl(): string {
  if (currentBaseUrl) {
    return currentBaseUrl;
  }
  if (import.meta.env.VITE_GAME_SERVER_URL) {
    return import.meta.env.VITE_GAME_SERVER_URL;
  }
  if (typeof window !== "undefined") {
    // If running directly on a deployed domain (like onrender.com)
    if (window.location.origin.includes("onrender.com")) {
      return window.location.origin;
    }
    // If running on local dev machine, default to local backend server
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://127.0.0.1:8787";
    }
  }
  // Everywhere else: connect directly to the 24/7 live Render server!
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
  const candidateUrls = [getBaseUrl()];
  if (!candidateUrls.includes(LIVE_RENDER_SERVER_URL)) {
    candidateUrls.push(LIVE_RENDER_SERVER_URL);
  }

  for (const base of candidateUrls) {
    try {
      const res = await fetch(`${base}/api/guest-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = (await res.json()) as { token: string; guestId?: string; displayName?: string };
        if (data.token) {
          currentBaseUrl = base;
          sessionStorage.setItem("chaturanga-dev-token", data.token);
          localStorage.setItem("chaturanga-guest-token", data.token);
          return data.token;
        }
      }
    } catch {
      // Try next candidate
    }

    try {
      const res = await fetch(`${base}/api/local-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = (await res.json()) as { token: string };
        if (data.token) {
          currentBaseUrl = base;
          sessionStorage.setItem("chaturanga-dev-token", data.token);
          localStorage.setItem("chaturanga-guest-token", data.token);
          return data.token;
        }
      }
    } catch {
      // Try next candidate
    }
  }

  return "";
}

export async function api<T = unknown>(
  path: string,
  data?: unknown,
  isRetry = false
): Promise<T> {
  const base = getBaseUrl();
  const t = await token();
  
  let res: Response;
  try {
    res = await fetch(`${base}/api/${path}`, {
      method: data === undefined ? "GET" : "POST",
      headers: {
        ...(data === undefined ? {} : { "Content-Type": "application/json" }),
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  } catch (err) {
    // If local dev server failed with a network error and we haven't failed over to Render yet,
    // automatically failover to LIVE_RENDER_SERVER_URL and retry!
    if (!isRetry && base !== LIVE_RENDER_SERVER_URL) {
      currentBaseUrl = LIVE_RENDER_SERVER_URL;
      return api<T>(path, data, true);
    }
    throw Error("Unable to connect to game server. Please check your connection.");
  }

  const text = await res.text();
  let value: any = {};
  try {
    value = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) {
      if (!isRetry && base !== LIVE_RENDER_SERVER_URL) {
        currentBaseUrl = LIVE_RENDER_SERVER_URL;
        return api<T>(path, data, true);
      }
      throw Error(
        res.status === 404 || res.status === 502 || res.status === 503
          ? "Game server is starting up. Please wait a moment and retry."
          : `Server returned HTTP ${res.status}.`
      );
    }
  }
  if (!res.ok) {
    const errMsg = String(value.error ?? "");
    const isSessionExpired =
      res.status === 401 ||
      errMsg.includes("session expired") ||
      errMsg.includes("Sign in expired") ||
      errMsg.includes("Sign in required");

    if (!isRetry && isSessionExpired) {
      clearLocalTokens();
      try {
        const freshToken = await createGuestSession();
        if (freshToken) {
          return api<T>(path, data, true);
        }
      } catch {
        // Continue to throw below
      }
    }
    throw Error(value.error ?? "Request failed.");
  }
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
    retry: ReturnType<typeof setTimeout>,
    hasEverConnected = false;

  async function connect() {
    if (closed) return;
    let t = await token();
    if (!t) {
      try {
        t = await createGuestSession();
      } catch {
        // Fall back
      }
    }
    if (!t) {
      onStatus("Sign in required.");
      return;
    }
    const base = getBaseUrl();
    const wsProtocol = base.startsWith("https") ? "wss:" : "ws:";
    const wsUrl = base.replace(/^https?:/, wsProtocol) + "/api/live";
    
    let receivedState = false;

    try {
      ws = new WebSocket(wsUrl);
    } catch {
      if (!hasEverConnected && base !== LIVE_RENDER_SERVER_URL) {
        currentBaseUrl = LIVE_RENDER_SERVER_URL;
        retry = setTimeout(connect, 500);
        return;
      }
      onStatus("Server connection unavailable.");
      return;
    }

    ws.onopen = () => {
      hasEverConnected = true;
      const mode = getActiveServerMode();
      onStatus(mode === "cloud" ? "Connected (Cloud)" : "Connected");
      ws?.send(JSON.stringify({ token: t }));
    };

    ws.onmessage = (e) => {
      try {
        const v = JSON.parse(e.data);
        if (v.state) {
          receivedState = true;
          onState(v.state);
        }
      } catch {
        onStatus("Invalid server response.");
      }
    };

    ws.onclose = () => {
      if (!closed) {
        if (!receivedState) {
          // Socket was closed without ever receiving state - auth likely rejected
          clearLocalTokens();
        }
        // If it failed before opening and we were on local server, failover to Render!
        if (!hasEverConnected && getBaseUrl() !== LIVE_RENDER_SERVER_URL) {
          currentBaseUrl = LIVE_RENDER_SERVER_URL;
          retry = setTimeout(connect, 500);
          return;
        }
        onStatus("Reconnecting. Moves wait for server confirmation.");
        retry = setTimeout(connect, 2000);
      }
    };

    ws.onerror = () => {
      if (!hasEverConnected && getBaseUrl() !== LIVE_RENDER_SERVER_URL) {
        currentBaseUrl = LIVE_RENDER_SERVER_URL;
        retry = setTimeout(connect, 500);
        return;
      }
      onStatus("Server connection unavailable.");
    };
  }

  void connect();
  return () => {
    closed = true;
    clearTimeout(retry);
    ws?.close();
  };
}
