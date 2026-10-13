import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Client IP for rate limiting. X-Forwarded-For is only trusted when the
 * server sits behind a known reverse proxy (TRUST_PROXY=1); otherwise the
 * direct socket address is used so clients cannot spoof their identity.
 */
export function clientIp(req: IncomingMessage, trustProxy: boolean): string {
  if (trustProxy) {
    const fwd = req.headers["x-forwarded-for"];
    const raw = Array.isArray(fwd) ? fwd[0] : fwd;
    const first = raw?.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.socket.remoteAddress ?? "unknown";
}

/** Fixed-window rate limiter with lazy eviction of stale buckets. */
export class RateLimiter {
  private buckets = new Map<string, { n: number; start: number }>();
  constructor(
    private windowMs = 60_000,
    private maxKeys = 10_000,
    private now: () => number = () => Date.now(),
  ) {}
  check(
    key: string,
    max: number,
    message = "Too many requests. Try again in a minute.",
  ): void {
    const t = this.now();
    let b = this.buckets.get(key);
    if (!b || t - b.start > this.windowMs) {
      b = { n: 0, start: t };
      this.buckets.set(key, b);
    }
    if (++b.n > max) throw Error(message);
    if (this.buckets.size > this.maxKeys)
      for (const [k, v] of this.buckets)
        if (t - v.start > this.windowMs) this.buckets.delete(k);
  }
  count(key: string): number {
    return this.buckets.get(key)?.n ?? 0;
  }
}

/**
 * Open WebSocket connections per client IP. Rejected connections never
 * acquire a slot, so floods of refused attempts cannot erode the count and
 * silently lift the cap.
 */
export class ConnectionTracker {
  private counts = new Map<string, number>();
  constructor(private max = 20) {}
  /** Take a slot for the key, or refuse when it is at capacity. */
  acquire(key: string): boolean {
    const n = this.counts.get(key) ?? 0;
    if (n >= this.max) return false;
    this.counts.set(key, n + 1);
    return true;
  }
  /** Return a slot. Releasing a key that holds none is a no-op. */
  release(key: string): void {
    const n = this.counts.get(key) ?? 0;
    if (n <= 1) this.counts.delete(key);
    else this.counts.set(key, n - 1);
  }
  count(key: string): number {
    return this.counts.get(key) ?? 0;
  }
}

/**
 * Origin gate for API and WebSocket traffic. Same-origin requests (the
 * production single-process topology, where the server also serves the
 * client) are always allowed; cross-origin requests must be on the explicit
 * ALLOWED_ORIGINS list (the Vite dev server during development).
 */
export function originAllowed(
  origin: string | undefined,
  host: string | undefined,
  allowed: string[],
): boolean {
  if (origin && host) {
    try {
      if (new URL(origin).host === host) return true;
    } catch {
      /* fall through to the allowlist */
    }
  }
  return allowed.includes(origin ?? "");
}

/** Security headers applied to every API response. */
export function apiSecurityHeaders(res: ServerResponse): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'",
  );
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
}

/**
 * Content-Security-Policy for the static client build. The chess engines run
 * as WebAssembly workers, which requires 'wasm-unsafe-eval'; styles use React
 * inline style attributes, which requires 'unsafe-inline' for style-src.
 * connectSrc: extra origins the client talks to (Supabase auth/realtime).
 */
export function clientCsp(connectSrc: string[] = []): string {
  const connect = ["'self'", "wss:", ...connectSrc].join(" ");
  return [
    "default-src 'self'",
    `script-src 'self' 'wasm-unsafe-eval'`,
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src ${connect}`,
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join("; ");
}

/** Security headers for static client responses. */
export function staticSecurityHeaders(
  res: ServerResponse,
  opts: { csp: string; behindTls: boolean; reportOnly?: boolean },
): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader(
    opts.reportOnly
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy",
    opts.csp,
  );
  if (opts.behindTls)
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
}
