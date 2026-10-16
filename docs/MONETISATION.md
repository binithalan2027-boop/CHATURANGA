# Monetisation switch (payments are OFF)

Status 2026-10-13: the owner has NOT chosen between "free with limited free
games then one-time unlock" and "paid upfront", and has not defined what
"3 free trials" means (3 games? 3 days? 3 uses?). The code therefore ships
an entitlement gate behind a clearly-labelled switch, defaulted OFF, with
no payment integration at all.

## The switch

| Env var | Values | Default | Meaning |
|---------|--------|---------|---------|
| `ENTITLEMENTS` | `off` / `trial` | `off` | off = no limits anywhere. trial = free-game counter active. |
| `FREE_ONLINE_GAMES` | integer >= 1 | `3` | Finished online games (standard + custom rooms) each player gets before needing an unlock. |

When `trial` is on:
- The server counts each player's finished, actually-played online games
  (cancelled rooms never count) across standard and custom rooms.
- Past the limit, create/join calls fail with: "Free online games used.
  Unlocks are not on sale yet..." - enforced server-side, never client-side.
- `/api/config` advertises the mode; the online Profile tab shows
  "Free online games left: N" or "Online play unlocked".
- There is NO checkout, NO Play Billing, NO card field anywhere.

## Unlocking players (operator, until a payment rail exists)

```bash
npx tsx scripts/entitlement.ts grant <userId>
npx tsx scripts/entitlement.ts revoke <userId>
npx tsx scripts/entitlement.ts list
```

## Owner decisions required before turning this on

1. Pick the model: paid-upfront app vs free + one-time unlock (Play has no
   native "3 trials" for paid apps; the free-then-unlock model is what this
   switch implements).
2. Define the free unit: games (implemented), days, or uses - only "games"
   is implemented; the others need a small spec change.
3. Choose the payment rail: Google Play Billing (required for digital
   unlocks inside a Play-distributed app; 15% fee under the Small Business
   program) vs a web checkout for the browser version.
4. Only then wire the unlock grant to real purchases (replace the operator
   script with a purchase-verification endpoint). Do not take money before
   legal operator identity exists (docs/LEGAL-HANDBOOK-v7.md).
