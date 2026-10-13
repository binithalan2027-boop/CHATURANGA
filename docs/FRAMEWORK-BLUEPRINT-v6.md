# Chaturanga v6 build plan

2026-10-13. Local development only, exact v5 base.

## Loop
Define the component and its acceptance tests, implement it separately, run targeted tests, inspect the browser result, fix issues, then run the full suite and record what remains.

## Components
- V1: independent server, SQLite store, authenticated HTTP and WebSocket transport. Local identities are explicit test players, loopback-only; production mode requires Supabase token verification.
- V2: server-authoritative rooms, legal moves, versions, turns, clocks, draw/resign, persisted recovery. Standard and seven existing chessops variants. No optimistic client authority.
- V3: friends with explicit request acceptance, exact-username opt-in discovery, restricted challenges, remove/block/unblock.
- V4: minimal editable profiles, server-owned stats/app rating, separate self-reported FIDE, export/deletion controls. Adult-only online beta guardrail pending owner's audience choice.
- V5: Google/Facebook/Discord auth wiring through configured Supabase providers. Instagram unsupported for personal-account login; no fake button or credential collection.
- V6: Khivin strength targets, real UCI options, beginner assistance explicitly uncalibrated, full-strength option separate from numeric Elo.
- V7: desktop/mobile pixel inspection, accessibility, two-player browser tests, security negatives, typechecks, tests/build and patch application.

## Not claimed
No public deployment, OAuth round-trip certification, spending, account setup, push or preview. No authoritative online maths/spells/fog/3/4-player yet. No legal compliance certification, anti-cheat or verified FIDE integration.
