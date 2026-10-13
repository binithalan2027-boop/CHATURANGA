> SUPERSEDED by BUILD-NOTES-v8.md / VERIFICATION-v8.md (2026-10-13). Kept for history.

# Online Play - decision needed from Binit

Status 2026-10-13: NOT built in v5. Everything else in v5 is fully local.

## Why it needs his decision, not a default
Real online play needs a server: accounts or at least a signalling/channel layer, a server-authoritative board (the Fog of War moat), move relay, and reconnection. That means:
- A backend to run and pay for (a Supabase project already exists on his account, paused for low activity). Using it creates an ongoing dependency on his account and possible spend.
- Once other people connect, privacy/abuse/moderation questions start (even with private links).
- GPL: the app already uses Stockfish; shipping publicly means the source must be published. Open-sourcing timing is his call.

## Options
1. Supabase Realtime (fastest). Private-link 1v1, no signup: create room -> share link -> play. Server-authoritative move validation via an edge function. Free tier likely covers friends-and-family scale. ~1 build loop after he says go.
2. Self-hosted WebSocket server (Node + ws on a VPS/Railway/Fly). More control, small monthly cost, more ops.
3. Stay local-only for now: hot-seat + bots + drills. No cost, no risk.

## Recommendation
Option 1, after he confirms: (a) use the existing Supabase project, (b) ok to open-source when public, (c) private-link only, no accounts in v1.
