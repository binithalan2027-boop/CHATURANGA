# Chaturanga v5 - Framework Blueprint

Date: 2026-10-13. Base: v4-fixed (head 608c33a, branch feat/chaturanga-maths-spells).
Method: Compound Engineering loop (EveryInc compound-engineering-plugin: ce-brainstorm -> ce-plan -> ce-work -> ce-compound) fused with Superpowers disciplines (obra/superpowers: test-driven-development, systematic-debugging, verification-before-completion). Both are Claude Code skill packs on GitHub; here their workflow is applied directly, not installed as plugins.

## Governing rules (from Binit, standing)
- Everything stays local. Deliverable is a patch file; Binit reviews and pushes himself.
- No public or unlisted preview links.
- Build in loops, component by component; every component coded and tested separately; test on repeat until it clears the bar.
- Benchmark: chess.com. GPL engines accepted (Stockfish, Fairy-Stockfish); public release implies open-sourcing.

## The loop (applies to every component)
1. BRAINSTORM (WHAT): one paragraph per component - goal, gap lens vs chess.com, success criteria. Recorded in this doc.
2. PLAN (HOW): bounded guardrails - files touched, test scenarios (U-IDs), risks. WHAT decisions here, HOW code in step 3.
3. WORK: implement one component at a time. Test-first where behaviour is new (write failing test, implement, green). Incremental commits per component.
4. VERIFY (verification-before-completion): per component - its unit tests, then global: full test suite, typecheck, production build, no console errors, 320px + desktop width check. A feature is "working" only with evidence, not intention.
5. COMPOUND: non-obvious learnings written to docs/solutions/ so the next loop starts smarter.

## v5 components
| ID | Component | Why (gap vs chess.com) | Success criteria |
|----|-----------|------------------------|------------------|
| U1 | Variant bots (Fairy-Stockfish WASM) | chess.com bots are classic-only; variants solo need an opponent | Bot replies legal moves in Crazyhouse, KOTH, Three-check, Antichess, Atomic, Horde, Racing Kings; adjustable strength; no engine load failure states |
| U2 | Puzzles from your own mistakes | chess.com charges for this; top Reddit ask | Mistake-scanner output converts into a drill set; daily drill page; solve/fail flow with retry; progress saved locally |
| U3 | Khivin: explanations + levels | raw eval numbers teach nothing | After a bad move Khivin says why in one plain sentence (hanging piece, missed tactic, weakened king etc.); 3 difficulty levels verified to change strength |
| U4 | Chaturanga-mode hook polish | the maths duel is the moat; must demo in 60s | First-run demo path: one tap from landing into a guided Mind Before Move round; Mantra Duel reward pick clarified; calm Indian-home visual consistency check |
| U5 | UI/UX polish pass | chess.com benchmark | Zero-tap play preserved; controls contextual; consistent spacing/typography; no 320px overflow; Lighthouse re-run |
| U6 | Toolchain + licence hygiene | release blocker | npm audit fixes applied where safe; LICENSE/NOTICE for GPL engines + chessops complete; OPEN-SOURCE checklist doc |

## Explicitly not built (needs Binit's decision)
- Online play / private-link 1v1: requires a server (Supabase project exists but is his account + spend). Documented in docs/ONLINE-PLAY-DECISION.md.
- Rated puzzle rush, master-games archive: deferred (costly, low differentiation).
- Timing of open-sourcing the repo (GPL consequence) - his call.

## Verification matrix (run in order, all must pass)
1. `npm test` - all unit tests (73 v4 + new v5 tests)
2. `npm run typecheck`
3. `npm run build`
4. Browser smoke: landing, play, variants room + bot move, study, training, drills, settings; console clean
5. 320px and 1366px visual checks
6. Patch hygiene: applies on clean base, tree byte-identical, `git diff --check` clean

## Deliverables
- Chaturanga-v5.txt patch (apply on clean base; supersedes v4-fixed)
- This blueprint, build notes, verification report, docs/solutions/* learnings, ONLINE-PLAY-DECISION.md
