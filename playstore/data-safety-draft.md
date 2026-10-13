# Play Data safety form - draft answers (v8, 2026-10-13)

Map each answer in Play Console. Verify against the final build; this draft
matches the current server code.

| Question | Draft answer | Evidence in code |
|----------|--------------|------------------|
| Collect email? | Only if Supabase OAuth collects it (provider account) | server/index.ts auth via Supabase |
| Collect name? | Display name + username (user-chosen) | service.ts profile() |
| Collect location? | No | - |
| Collect precise device identifiers? | No advertising/analytics IDs | no SDKs |
| Game activity (games, moves, ratings)? | Yes, stored on server | store.ts records |
| Reports/moderation content? | Yes (report text, category, target) | service.ts report() |
| Data encrypted in transit? | Yes - HTTPS/WSS only in production | deploy/Caddyfile, BEHIND_TLS |
| Data shared with third parties? | Only Supabase (auth processor) | - |
| Data deletion? | Account deletion removes profile, games, sessions, auth identity | index.ts /api/delete |
| Retention | Finished games 180d, reports 365d, sessions 7d | server/maintenance.ts |
| Children | Not directed at children; adult confirmation for public accounts; child-consent route NOT built (launch blocker per legal handbook) | service.ts profile() |
| Ads / analytics / crashlytics | None integrated | - |

Privacy policy URL is mandatory for Play. The in-app draft is at /policy;
publish it on the domain before submission (see docs/DEPLOYMENT.md).
