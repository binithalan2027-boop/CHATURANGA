# Chaturanga v7 local build
13 October 2026. Based on exact v6, clean original base 34410f9. This patch supersedes previous patches when applied to that base. No repository push, public preview, hosting configuration or account mutation.

## Built
- Original server-authoritative three/four-player 14x14 cross-board rooms: seats, inward pawns, legal moves, king-capture elimination, clocks, resign, all-player draw, persistence/reconnect, private room codes. Three-player omits North. Explicit house rules: no check/castling/en passant, queen promotion at far central edge, last army wins. Not Chess.com/FIDE compatibility.
- Two-player online Mind Before Move and Mantra Duel using existing tested original rules on the server. Seven earned powers. Server checks actor/phase/version; maths question answers, seeds and full hidden state never leave the server. Opaque question tokens prevent exposing the deterministic question seed.
- Mantra is a bounded TURN-BASED online duel, each player gets private 20-second set after countdown; no device handoff. It is not simultaneous maths. Custom online UI currently defaults promotions to queen. Combining maths/spells with cross-board is NOT built; Fog is still local.
- Persistent authenticated reports, reporter-private ticket status, report bounds/rate cap and local reviewer CLI. Not a staffed moderation system, anti-cheat system or legal-response guarantee.
- Local age gate removed and profile readiness separated from adult confirmation. Public Supabase mode requires PUBLIC_LEGAL_REVIEW=approved as an operational launch checkpoint, not compliance certification. Existing production adult checkpoint is retained pending lawful audience design; no child-consent system exists.
- Cohesive sandstone/teak/leaf/copper courtyard styling, self-hosted Noto Sans/Serif Devanagari under OFL with included notices, readable type hierarchy, matching online/custom/policy screens, mobile layout and visible power inventory. Legacy About false network/latency claims replaced.
- Draft in-app privacy/terms/community/credits, US/India legal handbook and contact vinz97512@gmail.com from owner dictation. No phone number. Confirm email spelling and monitoring.

## Run
Node >=22.13. `npm ci`; `npm run server`; separately `npm run dev`. Loopback local authentication only. Create test player, click the online screen's Profile tab, save profile, then PvP. Use custom room controls for maths/cross-board. Separate browser contexts have separate test identities. No hosting cost incurred.

## Not production-ready
No deployed HTTPS/WSS, real OAuth round trip, provider setup, load/penetration/abuse soak testing, backups/restore, auth-identity deletion, retention cleanup, child consent, staffed grievance handling, payment/trials, store listing or rights clearance. Runtime dependency audit is zero; twelve inherited dev advisories remain. Existing v6 setup notes remain relevant, but their 'all custom modes local-only' and arbitrary local 18+ statements are superseded by this document. Read LEGAL-HANDBOOK-v7.md before public use.
