# Chaturanga v5 - verification report (2026-10-13, local)

Every claim below was executed on this build, not assumed.

| Check | Result |
|---|---|
| Unit tests | 97 passed / 13 files (was 73 at v4; +24 new) |
| `tsc --noEmit` | clean |
| `vite build` | clean (4-6s) |
| Patch hygiene | applies on clean base; tree byte-identical; `git diff --check` clean |
| Variant bot, real Chrome | white replies (Nc3/Na3), black replies after switch (a5); 0 page errors |
| Demo flow, real Chrome | landing -> 60-second demo -> coach panel -> preconfigured Khivin/beginner/easy -> game starts with maths question |
| Drills, real Chrome | nav -> today's set -> practice; solve/fail recorded; 0 page errors |
| Accessibility (axe-core) | 0 violations: landing, quick-play, variants, drills (drills h1 fixed this pass) |
| Layout | no horizontal overflow at 320px and 1366px on audited screens |
| Lighthouse (local preview) | performance 98, accessibility 100, best-practices 100, SEO 100 (docs/lighthouse-local-v5.json); new "agentic-browsing" category scores 50, noted |
| Fairy-Stockfish WASM path | worker loads; bestmove requires cross-origin isolation headers - documented, local search covers non-isolated deploys |

Screenshots (this run): chaturanga-demo-1366.png, chaturanga-demo-game.png,
chaturanga-drills-1366.png, chaturanga-drills-320.png.

Not verified (out of scope, needs decisions): online play, rated puzzle rush,
master-games archive, Fairy-Stockfish strong path under a COOP/COEP deployment.
