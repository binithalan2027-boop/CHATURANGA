# Chaturanga v5 - build notes (2026-10-13)

Method: compound-engineering loop (brainstorm -> plan -> work -> verify -> compound)
with superpowers TDD + verification-before-completion, per docs/FRAMEWORK-BLUEPRINT.md.
Base: v4 (reconstructed and re-verified: 73 tests, typecheck, build). Local only; nothing pushed.

## What changed
1. Variant computer (Variant room). Play White/Black/off vs the computer at Casual/Club/Strong
   in all 8 rule variants. Two on-device backends: Fairy-Stockfish 1.1.12 WASM when the site is
   cross-origin isolated, otherwise a built-in alpha-beta search with per-variant eval
   (antichess inversion, racing-kings king advance, horde pawn mass). Every engine reply is
   rules-validated with chessops before being played. Browser-verified both colours.
2. Daily drills. The Study mistake scan can now be saved as drills; a new Drills page serves
   a daily set (fresh first, retries after), records attempts, tracks solved/due and streaks.
   All in localStorage; no account, no upload.
3. Khivin levels + explanations. Beginner/Club/Master (depth+noise for maths modes, Stockfish
   depth 4/10/14 for classic). Mistake practice now shows a one-sentence, rules-based reason
   the played move lost ground (hung piece, missed mate, missed capture, allowed mate-in-1,
   traded down, positional).
4. 60-second demo. Landing -> "60-second demo" -> preconfigured easy Mind Before Move vs
   beginner Khivin with a 3-step coach panel. Browser-verified end to end.
5. Toolchain + licence. Full lockfile regeneration (fixes rollup native-dep gap on fresh
   npm ci), engine licence texts next to each engine, NOTICE, OPEN-SOURCE-CHECKLIST,
   ONLINE-PLAY-DECISION, docs/solutions learnings.

## Deferred, honestly
- Online play: needs Binit's Supabase decision (docs/ONLINE-PLAY-DECISION.md). Not started.
- 12 npm advisories remain, all in the vite/vitest dev chain (incl. 2 critical tinypool).
  None ship to the browser; the fix is a vite/vitest major bump, deliberately not forced
  mid-build. Tracked in docs/OPEN-SOURCE-CHECKLIST.md.
- Fairy-Stockfish strong path activates only with COOP/COEP headers on deploy
  (docs/solutions/variant-engine-two-backend.md). Until then the local search serves.
