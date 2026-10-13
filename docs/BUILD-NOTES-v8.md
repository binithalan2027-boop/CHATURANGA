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
- docs/ROADMAP.md: combined maths/spells + three/four-player cross-board is DEFERRED (rules design is an owner decision; merging two verified engines days before launch is a weakest-link risk) with a concrete build sketch and the three owner decisions it needs.

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
