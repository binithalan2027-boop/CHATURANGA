# Chaturanga v8 launch-readiness build
13 October 2026. Based on exact v7, clean original base 34410f9. This patch supersedes all previous patches when applied to that base. No repository push, public preview, hosting configuration or account mutation. v7 notes remain relevant except where this document supersedes them.

## Built in v8
- Server hardening: proxy-aware client IPs behind a single trusted proxy, per-IP HTTP/WebSocket rate limits, WebSocket connection and message-size caps, security headers (CSP, frame, referrer, nosniff) on static serving, session token cache, scheduled retention sweeps, account deletion now removes the auth identity and finishes unrated games, consistent online SQLite backup (WAL-safe).
- Toolchain: vite 8, vitest 5, tailwind 4, TypeScript 7. `npm audit` is zero across the whole tree; the twelve inherited v7 dev advisories are gone. Full browser regressions re-verified after the upgrade.
- Operations pack: multi-stage Dockerfile, docker-compose, Caddy and nginx reverse-proxy configs with HTTPS/WSS termination, systemd unit, `.env.example`, `npm run backup` script with a 14-day cron example, `/healthz` endpoint, and step-by-step hosting guide in docs/DEPLOYMENT.md (single Node process + WebSocket + SQLite).
- Load/soak test: scripts/load-test.cjs drives real HTTP + WebSocket games on loopback. Results in docs/LOAD-TEST.md. RATE_LIMIT_SCALE=20 is the loopback test knob; never set it in production. Soak testing found and fixed a real scaling bug: every /api/state call re-parsed every room record, so latency grew with total rooms (p95 436ms fresh DB to 1588ms grown). The store now keeps a write-through deserialized record cache (rollback-safe); 100-player soak p95 is stable at ~300ms across back-to-back runs on a grown database.
- Entitlement trial mode verified live end to end: free games counted, the gate blocks at the limit with honest "payments are switched off while the owner chooses a model" copy, and the operator grant CLI restores play.
- GPL release package: LICENSE (GPL-3.0), SOURCE-OFFER, README, third-party notices retained, placeholder celebrity bot names replaced with original names (Aarav, Tara, Kabir), dead scripts removed.
- Monetisation entitlement switch: off/trial modes, server-side gate, operator grant CLI, profile display, docs/MONETISATION.md. Payments are OFF. Default FREE_ONLINE_GAMES=3. The owner has not chosen a model or what "3 free trials" means.
- Play Store scaffold: TWA manifest, assetlinks template plus hosting path at public/.well-known/, data-safety draft, store listing draft, packaging guide in playstore/README.md. Listing copy reviewed: modes are listed separately and never imply combined maths/cross play. Real 512px + maskable icons now ship in public/icons/ and the site serves /manifest.webmanifest, both required by the Bubblewrap flow.
- Online Fog of War: server-authoritative engine with king-capture house rules (no check/checkmate), per-player fog projection, masked opponent moves in the shared move list, clocks/repetition integration, reconnect-safe. Client FogBoard with fogged squares, flipped board for Black, house-rules note in the room. Verified in two real browsers.
- Accessibility/copy fixes found by the fog regression: Variant and Time-per-side selects now have explicit accessible names; room detail renders for fog games; stale "Fog remains local-only" copy replaced.
- Production single-process topology (the Docker path) verified live and fixed: same-origin browser requests were 403'd and a missing-Origin request crashed the server; the origin gate now allows same-origin/missing-Origin traffic and keeps the cross-origin allowlist. Two-player game verified over the one-port deployment shape.
- Security pass 3 (post-verification review) found and fixed four more real issues: refused WebSocket connections eroded the per-IP connection cap; /api/export leaked the full Fog of War position mid-game (unfinished fog rooms now export as the player's safe projection); games abandoned mid-play stayed "active" forever (the hourly sweep now closes them unrated after 7 days); and operator CLI writes (moderation decisions, entitlement grants) were invisible to the running server until restart (report/entitlement records now bypass the cache). The account-deletion dialog also claimed the sign-in account survives; the copy now matches the actual auth-identity removal and surfaces manual-step outcomes.
- docs/ROADMAP.md: combined maths/spells + three/four-player cross-board is DEFERRED (rules design is an owner decision; merging two verified engines days before launch is a weakest-link risk) with a concrete build sketch and the three owner decisions it needs.

## October 14 online quality program (user-requested active improvements)
- Clocks that tick live between server pushes (re-anchored on every state view), low-time highlight, tenths under 10 seconds.
- Rematch as a server-created challenge the opponent accepts; colours swap; idempotent under double-clicks and simultaneous clicks; increments preserved.
- Move list: numbered SAN rows, auto-scroll while live, click-to-review read-only step-through with arrow keys (fog excluded by design - masked moves). Copy PGN from the result panel (full headers, variant-aware).
- Board feel: piece glide animation (reduced-motion aware), last-move ring, check ring, premove with blue ring (auto-fires if legal, auto-queens pawns), keyboard play (type e2e4/Nf3), right-click annotations (square highlights and drawn arrows, cleared on click or move; client-only, never transmitted).
- Game-end clarity: every ending names its reason - checkmate, stalemate, insufficient material, resignation, timeout, repetition, fifty-move rule, agreement, abort. Finished rated games show the rating change (+12/-12/no change) beside the provisional-ratings note.
- Fair-play lifecycle: abort before each side has moved (unrated, uncounted), draw offers with accept/decline/withdraw (mutual offers settle at once, chess.com style), takebacks with accept/decline/withdraw in casual rooms (clock not restored), resign behind an inline confirm, and abandonment: a player gone past a 60-second grace window (ABANDON_MS override) forfeits while the opponent is present; both-away pauses the game.
- Lobby: action-needed ordering, All/Needs you/Waiting/Finished filters, friendly variant and time-control labels, relative times, move numbers, game-end summaries, empty-state guidance, join-by-code with Enter, opponent presence, variant summaries on the create form, first-run hints, mobile guard.
- Ratings note: app ratings remain provisional private-match Elo; variants and custom modes are unrated by design.

## Apply this patch
```
git clone <your repo> chaturanga-v8 && cd chaturanga-v8
git checkout 34410f9
git am < Chaturanga-v8-final-*.txt   # the whole series lands in order
npm ci && npx vitest run && npm run build
```
Every shipped revision was artifact-tested this exact way and the resulting
tree compared byte-identical to the verified tree.

## Run
Node >=22.13. `npm ci`; `npm run server`; separately `npm run dev`. Loopback local authentication only. Deployment is `docker compose up` or the systemd path in docs/DEPLOYMENT.md. No hosting cost incurred.

## Owner decisions before public launch
1. Hosting provider and domain; run docs/DEPLOYMENT.md steps (agent cannot create accounts or deploy).
2. OAuth app credentials (Google/etc.) entered as environment variables; persistent secrets via vault link only.
3. Play developer account type/age and package name; assetlinks key hash from the real signing key.
4. Payment model and what "3 free trials" means; entitlement defaults are 3 free online games, payments OFF.
5. Confirm contact email spelling: vinz97512@gmail.com (from owner dictation; policies use it).
6. Supabase publishable key rotation: key and project URL sit in public git history (commit 314da7e); current code is env-based. Rotate and consider history scrub (agent cannot push).
7. Legal operator identity, grievance staffing and child-data route per docs/LEGAL-HANDBOOK-v7.md.
8. Rules for combined maths/spells + cross-board if wanted (see docs/ROADMAP.md).

## Known low-severity notes (accepted for launch)
1. Supabase token cache prunes only expired entries once it exceeds 5000; an attacker holding many distinct valid tokens could grow memory. Requires stolen tokens; bounded by the 60-second entry lifetime in practice.
2. API error messages are forwarded verbatim. They are deliberate user-facing strings by design; a rare unexpected internal error (for example a database failure) would leak minor technical detail, never credentials.
3. Static serving does not resolve symlinks; the dist folder is build output and contains none.

## Honestly not done
No deployed HTTPS/WSS round trip, no real OAuth round trip, no public matchmaking, no rated custom games, no online tournaments, no anti-cheat, no staffed moderation, no child-consent system, no payment rails, no penetration test. Private-match Elo can be farmed and is not FIDE. Standard draws use automatic threefold/50-move settlement as a beta simplification.
