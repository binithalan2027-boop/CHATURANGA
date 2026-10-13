> SUPERSEDED by BUILD-NOTES-v8.md / VERIFICATION-v8.md (2026-10-13). Kept for history.

# Online play setup and launch gates

## Run locally
Requirements: Node >=22.13 (built-in SQLite), npm.

```
npm ci
npm run server
# in another terminal
npm run dev
```
Open the local Vite address. Online -> Create local test player. Set up the player profile; confirm 18+ and choose discoverability. Separate browser contexts can create independent players. Create a room, copy its room code to the second player, join and play. Local player token is tab-scoped, so reload reconnects but a new tab is a separate test identity.

The server binds only to 127.0.0.1 by default and forbids local authentication on a non-loopback bind or with NODE_ENV=production. It must not be publicly exposed in local mode. SQLite is under data/, ignored by Git; do not send it with the patch. Back it up privately, encrypted and access-controlled when used for real players.

Server reads environment variables from the shell, not automatically from .env. Vite reads client .env values. Copy .env.example for client values and set server variables in the host environment. Never put OAuth client secrets in any VITE_ value or commit them.

## Hosting architecture in this patch
One Node HTTP/WebSocket process owns chess rules, clocks, social actions and a durable SQLite file. Optional Supabase Auth verifies bearer tokens using getUser. This is NOT a Supabase Edge/Reatime-only implementation. Multiple replicas are not supported. Hosting must provide HTTPS/WSS, a persistent volume, backups, and a reverse proxy which preserves WebSocket upgrades. Static Netlify deployment alone cannot run the game server. Client remains deployable as a static Vite build.

## Exact configuration required, not yet authorized/configured
- Owner's chosen auth project and hosting account/domain. Existing Supabase project was not used or changed.
- Server AUTH_MODE=supabase, SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY. No service-role secret is needed for normal gameplay.
- Client VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GAME_SERVER_URL (HTTPS in production).
- Server ALLOWED_ORIGINS set to actual frontend origins. Do not use a wildcard. Bind HOST appropriate for the approved host; NODE_ENV=production.
- Google OAuth client ID + secret in Supabase's Google provider settings, redirect/callback allowlist; Google Cloud consent screen and any applicable verification.
- Facebook App ID + secret in Supabase's Facebook settings, valid callback, email permission, app Live mode and any applicable review.
- Discord client ID + secret in Supabase's Discord settings, callback and application configuration.
- AUTH_PROVIDERS=google,facebook,discord only when each listed provider is actually working. UI disables unconfigured providers. Real auth errors never become guest accounts.
- Persistent credentials must be supplied securely, not chat and not the patch. No developer apps or accounts were created by this build.

Instagram API with Instagram Login serves professional accounts (businesses/creators) managing their presence, not general personal-account chess sign-in. No Instagram integration is claimed. Choose Google, Facebook or Discord instead; a separate professional-account integration would be a new purpose.

## Mandatory prelaunch tests
- Real OAuth round trip for each enabled provider; denied consent, email absence, logout, expired token, token refresh, account deletion/revocation. No real OAuth round trip was possible without app configuration.
- Actual HTTPS/WSS deployment, correct Origin allowlist and proxy, websocket reconnect/token expiry, durable-volume restore and backup restore.
- Server load/latency, rate limits across proxy IPs, logs without credentials, bounded storage retention, operational alerts. This is a single-process beta, not a chess.com-scale service.
- Public audience and legal/privacy review. Current build gates online to 18+ as an interim safeguard; this is not age verification or a complete child-consent solution. Choose countries/audience, policy owner/contact, retention and deletion of auth identities/backups before launch. No street address, DOB, gender or unnecessary sensitive profile fields.
- Moderation/report/support process; anti-cheat/fair ratings before public ranked play. Private-match app Elo is provisional, separate from FIDE.
- Open-source/licence checklist from v5 and remaining dev-tool advisories.

## Features still local-only
Original Chaturanga maths/spell modes, Fog of War, 3/4-player boards and old variants outside chessops. Standard + Crazyhouse, King of the Hill, Three-check, Antichess, Atomic, Horde and Racing Kings are online. Standard uses automatic threefold/50-move draws as an explicit beta simplification.

## Sources checked 2026-10-13
https://supabase.com/docs/guides/auth/social-login
https://supabase.com/docs/guides/auth/social-login/auth-google
https://supabase.com/docs/guides/auth/social-login/auth-facebook
https://supabase.com/docs/guides/auth/social-login/auth-discord
https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login
https://official-stockfish.github.io/docs/stockfish-wiki/UCI-Protocol-and-Stockfish-Commands.html
https://official-stockfish.github.io/docs/stockfish-wiki/Stockfish-FAQ.html
