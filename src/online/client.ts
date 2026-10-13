import { supabase } from "../lib/supabase";
import type { OnlineState, Provider } from "./types";
const base = import.meta.env.VITE_GAME_SERVER_URL ?? "http://127.0.0.1:8787";
export async function token() {
  const { data } = await supabase.auth.getSession();
  return (
    data.session?.access_token ?? sessionStorage.getItem("chaturanga-dev-token")
  );
}
export async function api<T = unknown>(
  path: string,
  data?: unknown,
): Promise<T> {
  const target = new URL(base);
  if (
    target.protocol !== "https:" &&
    !(
      target.protocol === "http:" &&
      ["127.0.0.1", "localhost", "[::1]"].includes(target.hostname)
    )
  )
    throw Error("Game server must use HTTPS outside localhost.");
  const t = await token();
  const res = await fetch(`${base}/api/${path}`, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      ...(data === undefined ? {} : { "Content-Type": "application/json" }),
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const value = await res.json();
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
  const { error } = await supabase.auth.signInWithOAuth({
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
    await supabase.auth.signOut();
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
    ws = new WebSocket(base.replace(/^http/, "ws") + "/api/live");
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
