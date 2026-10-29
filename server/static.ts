import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
  ".nnue": "application/octet-stream",
};

/**
 * Serves the Vite production build with an SPA fallback. Only GET/HEAD,
 * no directory listing, no path traversal. API routes never reach this.
 */
export function createStaticHandler(root: string) {
  const base = resolve(root);
  function send(
    req: IncomingMessage,
    res: ServerResponse,
    file: string,
    immutable: boolean,
  ): void {
    res.setHeader("Content-Type", MIME[extname(file).toLowerCase()] ?? "application/octet-stream");
    res.setHeader(
      "Cache-Control",
      immutable ? "public, max-age=31536000, immutable" : "no-cache",
    );
    if (req.method === "HEAD") {
      res.writeHead(200);
      res.end();
      return;
    }
    createReadStream(file).pipe(res);
  }
  return function serve(req: IncomingMessage, res: ServerResponse): boolean {
    if (req.method !== "GET" && req.method !== "HEAD") return false;
    let pathname: string;
    try {
      pathname = decodeURIComponent((req.url ?? "/").split("?")[0]);
    } catch {
      return false;
    }
    if (pathname.includes("\0")) return false;
    const candidate = resolve(join(base, normalize(pathname)));
    if (candidate !== base && !candidate.startsWith(base + sep)) return false;
    let file = candidate;
    if (!existsSync(file)) {
      const index = join(base, "index.html");
      if (!existsSync(index)) return false;
      file = index;
    } else if (statSync(file).isDirectory()) {
      const dirIndex = join(file, "index.html");
      if (existsSync(dirIndex)) {
        file = dirIndex;
      } else {
        const index = join(base, "index.html");
        if (!existsSync(index)) return false;
        file = index;
      }
    }
    const immutable = /\/assets\//.test(file) || /\.(woff2?|wasm|ttf|nnue)$/.test(file);
    send(req, res, file, immutable);
    return true;
  };
}
