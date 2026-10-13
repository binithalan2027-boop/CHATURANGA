import { describe, it, expect } from "vitest";
import { RateLimiter, ConnectionTracker, clientIp, clientCsp } from "./http";
import type { IncomingMessage } from "node:http";

function req(headers: Record<string, string>, remote = "10.0.0.1") {
  return {
    headers,
    socket: { remoteAddress: remote },
  } as unknown as IncomingMessage;
}

describe("clientIp", () => {
  it("uses the socket address unless the proxy is trusted", () => {
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4" }), false)).toBe(
      "10.0.0.1",
    );
  });
  it("takes the first forwarded hop behind a trusted proxy", () => {
    expect(
      clientIp(req({ "x-forwarded-for": "1.2.3.4, 10.0.0.2" }), true),
    ).toBe("1.2.3.4");
  });
  it("falls back to the socket when the header is absent", () => {
    expect(clientIp(req({}), true)).toBe("10.0.0.1");
  });
});

describe("RateLimiter", () => {
  it("allows up to max per window and then rejects", () => {
    let now = 0;
    const l = new RateLimiter(1000, 100, () => now);
    for (let i = 0; i < 3; i++) l.check("k", 3);
    expect(() => l.check("k", 3)).toThrow("Too many");
    now = 1001;
    l.check("k", 3);
    expect(l.count("k")).toBe(1);
  });
  it("tracks keys independently", () => {
    const l = new RateLimiter(1000);
    l.check("a", 1);
    expect(() => l.check("a", 1)).toThrow();
    l.check("b", 1);
  });
});


describe("ConnectionTracker", () => {
  it("caps per key and frees slots on release", () => {
    const t = new ConnectionTracker(2);
    expect(t.acquire("ip")).toBe(true);
    expect(t.acquire("ip")).toBe(true);
    expect(t.acquire("ip")).toBe(false);
    t.release("ip");
    expect(t.acquire("ip")).toBe(true);
  });
  it("rejected attempts never erode the live count", () => {
    const t = new ConnectionTracker(2);
    t.acquire("ip");
    t.acquire("ip");
    for (let i = 0; i < 50; i++) expect(t.acquire("ip")).toBe(false);
    expect(t.count("ip")).toBe(2);
    expect(t.acquire("ip")).toBe(false);
  });
  it("releasing an untracked key is a no-op", () => {
    const t = new ConnectionTracker(2);
    t.release("ghost");
    expect(t.count("ghost")).toBe(0);
    expect(t.acquire("ghost")).toBe(true);
  });
});

describe("clientCsp", () => {
  it("permits wasm engines and websocket state, no objects", () => {
    const c = clientCsp(["https://example.supabase.co"]);
    expect(c).toContain("wasm-unsafe-eval");
    expect(c).toContain("wss:");
    expect(c).toContain("https://example.supabase.co");
    expect(c).toContain("object-src 'none'");
    expect(c).toContain("frame-ancestors 'none'");
  });
});
