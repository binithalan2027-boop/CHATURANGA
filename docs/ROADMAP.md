# Roadmap: deferred combinations and owner decisions

This file records combinations that were explicitly evaluated for launch and
deferred, so the store listing, docs and UI never imply they exist.

## Combined maths/spells + three/four-player cross-board: DEFERRED

Status: NOT built. The four custom online modes exist and are verified
separately (Mind Before Move, Mantra Duel + spells, three-player cross-board,
four-player cross-board). No mode combines maths questions or spell powers
with the cross-board, and no copy may suggest one does.

Why deferred (assessed 2026-10-13, v8):

1. Rules design is an owner decision, not an engineering default. Unanswered
   questions: with 3-4 players, who enters a maths duel and when (all seats
   pause together? pairwise? rotating?); how long seats wait while others
   duel; whether powers target any army or only neighbours; how powers such
   as add/cut/double/rewind translate onto the 14x14 cross geometry with
   pawns moving inward; whether a captured king's pending duel resolves.
2. Launch risk. The maths/spell engine and the cross engine are separate,
   each verified on its own. Merging them days before launch would ship the
   least-tested feature as the weakest link, against the honesty contract.
3. The v7 warning stands: this combination must never be implied in UI,
   docs, or store copy until it is actually built and verified.

What building it takes (when the owner chooses the rules):

- `server/custom.ts`: a `crossmath` kind combining the cross engine state
  with the maths duel scheduler; duel participation rules per seat; power
  effects mapped onto cross coordinates.
- `src/online/CustomRoomPanel.tsx` + `src/online/crossRules.ts`: spell
  targeting UI on the cross-board, duel overlays per seat.
- House-rules documentation for the combined mode (king capture plus
  powers), added to the in-app rules details and the store listing.
- Unit tests mirroring `server/custom.test.ts` coverage (seats, geometry,
  powers, duel privacy, reconnect) plus a four-browser Playwright
  regression mirroring `scripts/v7-browser.cjs`.

Owner decisions needed before build:

1. Duel format for 3-4 seats (simultaneous all-seat sets is the simplest
   honest option: every 90 seconds all seats get the same private 20-second
   set, fastest correct answer wins the power).
2. Power targeting scope (any army vs adjacent armies only).
3. Whether powers survive elimination (recommend: no).

## Fog of War online: BUILT (v8)

Fog of War is online as of v8 (king-capture house rules, per-player
projection, masked move list). The old v7 note "Fog is still local" is
superseded.

## Other deferred items (tracked in final report)

- Payments: entitlement switch exists (off/trial), payment rails are OFF
  until the owner picks a model and answers what "3 free trials" means.
- Public matchmaking, rated custom games, tournaments online: not built.
