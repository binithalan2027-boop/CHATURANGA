# Chaturanga v8 verification record
13 October 2026, loopback only. All steps run against a fresh clone: clean base 34410f9 + the full 27-commit v8 series applied with `git am` (two trailing-whitespace warnings inside an OFL font license text block, harmless). Result tree compared to the working tree: `git diff` empty (identical).

## Automated
- `npm ci`: clean.
- Unit: 21 files, 168 tests, all pass. Includes server auth/rate-limit/store/backup/custom/fog/maintenance suites and client engine/drills/fogRules suites.
- Typechecks: `tsc -b` green (client + server). Build: `tsc && vite build` green.
- `npm audit`: 0 vulnerabilities (v7's twelve dev advisories resolved by the toolchain upgrade).

## Real-browser (system Chrome via Playwright, fresh dev servers)
- scripts/online-smoke.cjs: two-browser PvP room create/join/move, reload restore, draw agreement. PASS.
- scripts/v8-fog-browser.cjs: fog room create/join; per-player projection (own back rank visible, enemy squares "fog"); masked move list shows "?" to the opponent; reveal-on-sight (black pawn appears on d5 exactly when white's e4 pawn attacks it); capture of the revealed piece by both players; flipped board for Black; zero page errors. Screenshots: v8-fog-white.png, v8-fog-black.png (pixel-inspected).
- scripts/v7-browser.cjs: four-player cross-board round with four separate players (illegal straight capture correctly rejected), three-player room, Mind Before Move maths unlock + move with opponent question privacy, reload restore, report flow, no 320px mobile overflow, zero page errors, axe-core: zero violations on cross4, mind, policy and home screens. PASS.
- scripts/v7-mantra-browser.cjs: real 90-second Mantra trigger, separate private sets, reward choice, inventory update verified. PASS.

## Operations
- Backup: `npm run backup -- /tmp/backups` against the running server produced a timestamped SQLite file that opens read-only with the records table intact (27 rows after the regression runs). Restore = copy back per docs/DEPLOYMENT.md.
- Load (fresh tree): 40 players, moves p95 263ms, state reads p95 236ms, 10,080 WS pushes, 0 errors.
- Soak (fresh tree, accumulated DB): two back-to-back 100-player runs, moves p95 315ms then 303ms, reads p95 263/258ms, 25k pushes each, 0 errors. This pass found the store read-scaling bug (fixed in the same series) and a load-test harness artifact (scripted opening replay), both documented in docs/LOAD-TEST.md.
- Restore: a timestamped backup was copied to a fresh path and booted as a second server; a restored session token authenticated and the restored rooms served correctly (finished games kept their results).
- Entitlements (trial mode, live server): free-game counter decrements, create blocks at the limit with honest copy, operator grant CLI unlocks and play resumes.
- Pixel inspection of regenerated screenshots: courtyard desktop/mobile, four-player cross-board desktop/mobile, maths desktop, policy desktop, fog white/black. Layouts clean, no overflow, honest copy (modes listed separately; fog described as house rules).

## Caveats
Loopback local authentication only; no real OAuth, HTTPS/WSS, hosted database, or public-network test was possible without owner accounts. Those steps are scripted in docs/DEPLOYMENT.md and remain owner-run.
