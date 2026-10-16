# Chaturanga

A quiet courtyard for chess and chess-adjacent games: local boards, classic
variants, original maths and spell modes, online private rooms, and
three/four-player cross-board chess.

## Run it (development)

Requires Node.js >= 22.13.

```bash
npm ci
npm run server   # game server on http://127.0.0.1:8787 (local test auth)
npm run dev      # client on http://127.0.0.1:5173
```

Open http://127.0.0.1:5173, click "Online PvP", create a local test player.
Local authentication binds to loopback only and is refused in production.

## Test

```bash
npm test                 # unit + service suite
npm run typecheck        # client types
npm run typecheck:server # server types
npm run build            # production client bundle
```

Browser regressions (need the server + dev server running):

```bash
node scripts/online-smoke.cjs
node scripts/v7-browser.cjs
node scripts/v7-mantra-browser.cjs
```

Load/soak test: `node scripts/load-test.cjs 100 6 20` (see docs/LOAD-TEST.md).

## Deploy

See docs/DEPLOYMENT.md: single Node + WebSocket + SQLite process behind a
Caddy reverse proxy (HTTPS/WSS), Dockerfile included.

## Licence

Chaturanga source is published under the GNU General Public License v3.0
(see LICENSE), because it bundles GPL chess engines (Stockfish,
Fairy-Stockfish) and the GPL chessops rules library. Third-party
acknowledgements: NOTICE and docs/third-party-notices.md. Source offer:
docs/SOURCE-OFFER.md.
