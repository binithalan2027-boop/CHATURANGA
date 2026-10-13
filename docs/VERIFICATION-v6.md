> SUPERSEDED by BUILD-NOTES-v8.md / VERIFICATION-v8.md (2026-10-13). Kept for history.

# Chaturanga v6 verification

2026-10-13. Local development only, not a public-deployment certification.

Executed:
- 120/120 unit tests in 15 files. 21 new authoritative service tests + 2 strength-option tests.
- Client and server TypeScript checks clean. Production Vite build clean with inherited chunk-size warning.
- Two independent real Chrome player contexts: profile creation, room create/join, e4/e5 relay through server, reload recovery, agreed draw and stored stats.
- Real Chrome friends: exact lookup, request, acceptance, accepted-friend challenge, invitation join, block.
- Server tests: unauthorized/nonparticipant/wrong-turn/illegal/stale moves; extra seat rejected; no room leakage; clock timeout and insufficient-material timeout; checkmate; draw offer/accept; cancel; castling, en passant, required promotion; repetition; server-owned rating; profile deletion/anonymization.
- HTTP negative checks: absent auth, tampered session, unapproved origin rejected. Logout revokes local session. Production refuses local authentication; Supabase mode refuses absent configuration.
- Persistence: fresh process read SQLite profiles/rooms/results from disk. In-memory reconstruction test restores finished game without duplicate stats.
- Chrome Stockfish handshake advertises UCI_Elo 1320-3190. Runtime workers returned moves at 1320, 3190 and unlimited mode. UI-configured target 1500 emitted UCI_LimitStrength=true and UCI_Elo=1500. No FIDE claim.
- axe-core: zero violations on sign-in, PvP, Friends and Profile audited screens.
- Actual pixels inspected: desktop PvP/Profile/Friends/sign-in/Khivin, 320px PvP/Profile/Khivin. First checks found clipped board and squeezed Khivin controls; both fixed and re-rendered. No horizontal overflow in checked mobile views.
- npm audit --omit=dev: zero vulnerabilities. Full audit: 12 inherited dev-tool advisories (4 moderate, 6 high, 2 critical); not forced mid-build.

Not verified: configured social OAuth round trips, production HTTPS/WSS, hosting/proxy behaviour, scale/load, backups restored into hosted environment, legal/privacy compliance, external-auth deletion, child consent, anti-cheat, official FIDE integration. No public preview or accounts touched. No new Lighthouse run; v5 score is not a v6 measurement.

Patch: complete patch on original 34410f9 plus incremental on exact v5. Apply only one. Clean-base tree equality verified during packaging.
