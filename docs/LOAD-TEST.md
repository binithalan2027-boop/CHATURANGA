# Load and soak testing

Last run: 2026-10-13, on this codebase, in the agent sandbox (shared CPU,
loopback). Treat numbers as a floor, not a promise: a quiet VPS will be
faster, real networks add latency.

## How to run

```bash
# Terminal 1: dev server with raised limits (test-only knob)
RATE_LIMIT_SCALE=20 npm run server
# Terminal 2:
node scripts/load-test.cjs [players] [movesPerPlayer] [soakSeconds]
# e.g. node scripts/load-test.cjs 100 6 20
```

The script creates local test players, opens one WebSocket each, pairs them
into rooms, plays real moves through the HTTP API, and measures latency and
push delivery. Exit code is non-zero if any move or read fails.

`RATE_LIMIT_SCALE` multiplies every rate limit (default 1). Never set it
above 1 in production except to diagnose a genuine capacity ceiling.

## Results (this sandbox)

| Players | Moves | Move errors | Move p50 | Move p95 | Move p99 | State p95 | WS pushes |
|---------|-------|-------------|----------|----------|----------|-----------|-----------|
| 40      | 320   | 0           | 140 ms   | 304 ms   | 385 ms   | 234 ms    | 8,480     |
| 100     | 600   | 0           | 255 ms   | 436 ms   | 652 ms   | 402 ms    | 16,720    |

Both runs held 100% of WebSocket connections through the soak with zero
failed actions. The 1-second state broadcast reached every connected player.

## Reading the numbers

- Latencies here are dominated by the sandbox's shared CPU and loopback
  scheduling, not the network. Relative scaling matters more: p95 roughly
  doubles from 40 to 100 concurrent players.
- Design ceiling: the single-process event loop plus per-tick state
  computation is comfortable into the low hundreds of concurrent players,
  matching the "small community" launch target. The deployment guide
  (docs/DEPLOYMENT.md section 9) lists the horizontal-scaling path if the
  game outgrows that.
- Not covered: hostile-traffic simulation, TLS termination cost (handled by
  the proxy), and real cross-country network behaviour.

## Second pass (2026-10-13 evening, after store cache)

Back-to-back 100-player soaks (10 moves each, 45s soak) on an ACCUMULATED
database (several prior runs of rooms/players present):

- Run A: moves p50 163ms / p95 315ms / p99 419ms; reads p95 263ms; 25,140 pushes; 0 errors.
- Run B: moves p50 148ms / p95 303ms; reads p95 258ms; 0 errors.

Latency is now flat across runs. Before the store cache, the same grown
database read p95 1588ms and degraded every run - every /api/state call
re-queried and re-parsed every room record.

Harness note: the scripted game line has 20 plies. Moves-per-player is
clamped to 10 so a game never replays the opening; earlier "errors" at 12
moves were illegal replayed moves plus cascading Not-your-turn responses,
not server failures.
