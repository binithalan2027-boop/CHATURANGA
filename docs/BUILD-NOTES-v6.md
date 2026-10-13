# Chaturanga v6 build notes

2026-10-13. All local; no push, deployment, public preview, account setup or spending.

## Added
- Server-authoritative private-room PvP for standard and seven established chessops variants. Rules, moves, turns, version checks, clocks and outcomes live on one Node server; persistent SQLite and WebSocket recovery.
- Friends: exact-username opt-in lookup, request/accept/decline/cancel/remove/block/unblock, accepted-friend-only challenges.
- Profiles: stable ID, username/display name, optional bio/country/timezone and self-reported FIDE; privacy discovery choice, adult-beta confirmation, server-owned stats and provisional standard-chess private-match Elo. No fictional FM/IM titles or verified FIDE claim.
- Explicit local test identities versus configured Supabase Auth. Google (Gmail included), Facebook and Discord flow code. No silent guest login on auth failure, no hardcoded external Supabase project.
- Game-data export and profile deletion; opponent history anonymized. Plain-language factual beta notice replaces the old invented legal/anti-cheat/compliance copy.
- Khivin: numeric 1-3190 practice control. 1320-3190 sets real Stockfish UCI_Elo and UCI_LimitStrength. 1-1319 is explicitly uncalibrated beginner assistance, NOT Elo/FIDE. Full strength disables the Elo limit but remains device/search-budget limited. Custom maths/spells retain uncalibrated difficulty levels.
- Removed the dead old client-authoritative online relay and fake profile components. Added repeatable local browser smoke script and server tests.

## Honest limitations
Not publicly online yet. Static Netlify cannot run the server alone. Choose an auth project and a persistent HTTPS/WSS host before deployment. Google/Facebook/Discord require developer app configuration; real OAuth round trips remain unverified. Instagram's professional API is not consumer-account sign-in; no Instagram login claimed.

Custom Chaturanga maths/spells, Fog of War and 3/4-player remain local-only. Online has no anti-cheat, public matchmaking, tournaments, horizontal scaling or finished moderation/legal process. Private-match Elo can be farmed and is not FIDE. FIDE field is self-reported only. Standard draws use automatic threefold/50-move settlement as a beta simplification.

Adult-only online beta is an interim guardrail, not verified age or legal compliance. Public audience, children/consent, policy owner/contact, storage retention and external-auth deletion still need decisions. See ONLINE-SETUP-v6.md for exact configuration and launch gates.

## Applying
The incremental patch applies on the exact v5 tree. The complete patch applies to clean original GitHub base 34410f9 and includes v4/v5/v6. Use one, not both. Rename .txt to .patch and use git am. Review locally; Binit pushes himself.
