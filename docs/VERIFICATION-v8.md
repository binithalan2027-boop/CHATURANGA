# Chaturanga v8 verification record
13 October 2026, loopback only. All steps run against a fresh clone: clean base 34410f9 + the full 57-commit v8 series applied with `git am` (two trailing-whitespace warnings inside an OFL font license text block, harmless). Result tree compared to the working tree: `git diff` empty (identical).

## Automated
- `npm ci`: clean.
- Unit: 21 files, 173 tests, all pass. Includes server auth/rate-limit/store/backup/custom/fog/maintenance suites and client engine/drills/fogRules suites.
- Typechecks: `tsc -b` green (client + server). Build: `tsc && vite build` green.
- `npm audit`: 0 vulnerabilities (v7's twelve dev advisories resolved by the toolchain upgrade).

## Real-browser (system Chrome via Playwright, fresh dev servers)
- scripts/online-smoke.cjs: two-browser PvP room create/join/move, reload restore, draw agreement. PASS.
- Malformed-input fuzz across every API route: nulls, wrong types, path-traversal room codes, script-tag payloads, negative versions, oversized bodies (20KB) - all rejected with precise 400s, no 500s, server stable.
- Entitlement trial flow verified live (ENTITLEMENTS=trial, FREE_ONLINE_GAMES=2): two finished games counted, third create rejected with the payments-off message, operator CLI grant effective immediately (no restart), create succeeds after grant.
- Operator CLI visibility verified live: a moderate.ts resolve decision is visible to the reporter immediately (no server restart). Earlier the server cache hid CLI writes (moderation + entitlement grants) until a restart - fixed by making report/entitlement kinds cache-passthrough, with a two-process unit regression.
- Data export verified live for fog privacy: an unfinished fog game exports as the player's safe projection (hidden army absent, opponent moves "?"); the full record appears only after the game finishes. Earlier the raw room leaked the whole position through /api/export - fixed, with a unit regression.
- WebSocket per-IP cap verified live: 20 held connections + a 50-connection refused flood + 5 post-flood probes; every excess connection refused (earlier, refused attempts silently decremented the counter and would have eroded the cap - fixed, with unit regression tests).
- scripts/v8-fog-browser.cjs: fog room create/join; per-player projection (own back rank visible, enemy squares "fog"); masked move list shows "?" to the opponent; reveal-on-sight (black pawn appears on d5 exactly when white's e4 pawn attacks it); capture of the revealed piece by both players; flipped board for Black; 320px mobile viewport with no horizontal overflow and a usable Variant select; zero page errors. Screenshots: v8-fog-white.png, v8-fog-black.png, v8-fog-mobile.png (pixel-inspected).
- scripts/v7-browser.cjs: four-player cross-board round with four separate players (illegal straight capture correctly rejected), three-player room, Mind Before Move maths unlock + move with opponent question privacy, reload restore, report flow, no 320px mobile overflow, zero page errors, axe-core: zero violations on cross4, mind, policy and home screens. PASS.
- scripts/v7-mantra-browser.cjs: real 90-second Mantra trigger, separate private sets, reward choice, inventory update verified. PASS.

## Operations
- Backup: `npm run backup -- /tmp/backups` against the running server produced a timestamped SQLite file that opens read-only with the records table intact (27 rows after the regression runs). Restore = copy back per docs/DEPLOYMENT.md.
- Load (fresh tree): 40 players, moves p95 263ms, state reads p95 236ms, 10,080 WS pushes, 0 errors.
- Soak (fresh tree, accumulated DB): two back-to-back 100-player runs, moves p95 315ms then 303ms, reads p95 263/258ms, 25k pushes each, 0 errors. This pass found the store read-scaling bug (fixed in the same series) and a load-test harness artifact (scripted opening replay), both documented in docs/LOAD-TEST.md.
- Restore: a timestamped backup was copied to a fresh path and booted as a second server; a restored session token authenticated and the restored rooms served correctly (finished games kept their results).
- Entitlements (trial mode, live server): free-game counter decrements, create blocks at the limit with honest copy, operator grant CLI unlocks and play resumes.
- Pixel inspection of regenerated screenshots: courtyard desktop/mobile, four-player cross-board desktop/mobile, maths desktop, policy desktop, fog white/black. Layouts clean, no overflow, honest copy (modes listed separately; fog described as house rules).

## Second block (21:15): hardening review + artifact validation
- Security review pass 2 (service/custom/entitlements/rate-limiter): version, turn, membership and actor checks consistent across standard, fog, maths and cross actions; mutations transactional or single-thread-atomic; report category allowlist + daily cap; entitlement gate covers all four create/join paths and counts finished games only; 5-unfinished-room cap blocks room flooding.
- Deployment artifacts: Dockerfile static analysis (tsx is a runtime dependency; transitive server imports from src resolve to chessops only; non-root user; healthcheck uses busybox wget present in alpine). compose binds loopback only. Caddy/nginx WebSocket headers present. systemd unit paths now match the guide exactly. .dockerignore excludes .env and data. Code refuses AUTH_MODE=local when NODE_ENV=production.
- .env.example audited against every process.env read in server code; STATIC_DIR, ENTITLEMENTS and FREE_ONLINE_GAMES were missing and are now documented.
- Play/PWA: TWA manifest referenced icons that did not exist - rendered 512px and maskable-512 PNGs from the brand mark (pixel-inspected), added /manifest.webmanifest linked from index.html; manifest and both icons return 200 through the dev server. Data-safety draft cross-checked against server code (added optional country/timezone fields).
- Honesty sweep of user-facing copy: no matchmaking/tournament/anti-cheat overclaims; landing "Find a classic opponent" navigates to the private-room lobby (an unreachable dead cancel button remains, cosmetic).

## Third block (21:22): post-hardening re-run
After the retention, deletion and store-cache changes, the full suite was
re-run against the final tree: 176/176 unit tests, both typechecks,
online-smoke, v8-fog-browser, v7-browser (axe-clean on all four screens) and
v7-mantra-browser - all green. Account deletion verified live end to end:
after /api/delete, entitlement, profile and session rows are all zero and
opponent history stays intact (games finished unrated, names scrubbed).

## Fourth block (23:20): security pass 3 re-runs
After the WebSocket cap, fog export, abandoned-game retention, cache
passthrough and deletion-copy fixes: 176/176 unit tests, both typechecks,
online-smoke, v8-fog-browser and v7-mantra-browser re-run green at 22:02,
v7-browser re-run green at 22:41. API malformed-input fuzz and the live
trial-mode / moderation / export probes above all ran against this tree.

## Owner dry-run (23:57)
The exact shipped patch was applied to a fresh clone of base 34410f9, then
the full owner flow ran there: `npm ci` clean, 176/176 unit tests, `npm run
build` green, `npm audit` 0 vulnerabilities. The patch alone reproduces a
working tree.

## Fifth block (00:50, 14 Oct): production single-process topology
Ran the exact deployment shape the Dockerfile uses - the game server serving
the built client, API and WebSocket on one port. It was BROKEN as first
shipped: same-origin browser GETs carry no Origin header and were 403'd, and
a request without Origin then crashed the server outright
(Access-Control-Allow-Origin set to "undefined"). Both fixed (origin gate
treats a missing Origin as same-origin/non-browser; CORS headers only set
when Origin is present). Verified live: built client boots error-free on
port 8787, two players create/join a room, and a move travels over the
same-port WebSocket. Evil origins still 403. After the origin-gate changes the full browser
suite was re-run against this tree on the dev topology: online-smoke,
v8-fog-browser, v7-browser, v7-mantra-browser - all green.

## Caveats
Loopback local authentication only; no real OAuth, HTTPS/WSS, hosted database, or public-network test was possible without owner accounts. Those steps are scripted in docs/DEPLOYMENT.md and remain owner-run.
