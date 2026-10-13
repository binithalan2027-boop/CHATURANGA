# Chaturanga collection: local implementation

## Integration plan and baseline

The actual project is a single React 18 + TypeScript + Vite app using chess.js 1.4 and Supabase. It is not the Colyseus monorepo described by the older architecture document. The existing online mode uses peer broadcasts and has no secure canonical controller. This change preserves its routes, authentication, Supabase connection and legacy variant engines rather than pretending that transport is an authoritative server.

New isolated modules:

- `src/chaturanga/math.ts`: seeded integer question generation, numeric validation, scoring.
- `src/chaturanga/engine.ts`: serializable local state machine, timestamp clocks, turn gates, effects, seven powers, branching journal.
- `src/chaturanga/ChaturangaMode.tsx`: local setup and match UI, hot-seat handoffs, target confirmation, board keyboard/click/drag input, promotion chooser, JSON state/journal export.
- `src/chaturanga/courtyard.css`: warm home palette, original CSS courtyard illustration, responsive design.
- `src/chaturanga/engine.test.ts`: deterministic rule tests.

The landing page, classic variant selector, versus transition and document title are redesigned. Existing auxiliary pages and legacy in-game panels remain on their original visual design. This is not yet a complete app-wide redesign.

## Run and check

```
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

On Linux, the existing lockfile can omit Rollup's optional native package. For this environment the non-persistent repair was `npm install --no-save --package-lock=false @rollup/rollup-linux-x64-gnu`. No dependency or lockfile changes are required by this feature.

Open the app and choose Play Chaturanga. Local modes need no new environment variables. Existing Supabase settings are untouched.

## Delivered locally

Mind Before Move locks every turn until a correct answer. Wrong answers and skips cost three seconds exactly once. Latin/Devanagari integers work; malformed input is not penalized. Practice is untimed. Unlock, question, board and clocks survive refresh in localStorage.

Mantra Duel pauses at 90 accumulated active chess seconds. It explicitly uses a sequential demo with handoff screens, separate deterministic question sets, 3-second countdowns, 20-second sets, scoring, 300 ms tie band, 8-second reward draft and 2-second resume. All seven powers are implemented in local rule code, with target checks and consumption rules. Inventories have three slots and one type per slot; cooldown requires two subsequent own turns without casting.

Freeze retains attacks, restricts movement, protects against no-reply artificial endings and handles castling rooks. Poison costs eight seconds before increment, expires on enemy turns and never kills pieces. Add Time caps at twice starting time; Cut floors at five seconds. Double Move checks king safety at each step, awards one increment and handles final-move en passant. Early promotion replaces the turn. Rewind restores the previous own-turn/reply board snapshot without clock, inventory or cooldown refunds, and cannot cross a duel. Immutable journal events keep branches.

The in-app rules disclose the local timeout policy. This local Mind mode uses an explicit simplified timeout policy, not a claim to implement every FIDE mating-possibility position. Normal checkmate/stalemate, bare kings, stock orthodox insufficient-material detection in Mind, repetition claims, fivefold and 75-move counters are supported.

## Verification record

- Baseline TypeScript passed. Baseline had no tests; production build passed after the platform-local Rollup optional-package repair.
- New deterministic rule suite covers gates, duplicate/stale attempts, clock settling, reload serialization, duel deadlines and scoring, inventory replacement, seven powers and main interaction edges.
- Browser smoke exercises a correct answer, chess move, refresh preserving the next question, sequential two-player maths sets, reward selection/replacement, resume, freeze targeting/casting and blocked frozen moves.
- Existing Standard variant route loads through the new selector and transition. This is a smoke check, not proof that all legacy variants are regression-free.
- Layout captures at 1366x768, 1024, 768, 390 and 320. No horizontal page overflow in tested new-match layouts. Visual inspection included laptop, narrow board, reward and freeze states.
- New UI smoke recorded no page exceptions. Full accessibility audit and two-independent-client multiplayer verification remain outstanding.

## Deliberate limitations and unfinished work

This is a reversible local first stage, not a production release of the full specification.

1. **No online Chaturanga.** Add a durable authoritative room controller, private server-side answers, identity-bound/versioned/idempotent/rate-limited commands, reconnect budgets and persistent deadlines. Do not use the existing broadcast channel to claim these security guarantees.
2. **No server privacy in local demos.** LocalStorage and browser state contain answers. A shared keyboard cannot provide simultaneous fairness. Questions are deterministic but separate and cannot establish equal measured difficulty.
3. **Replay export is a versioned local snapshot and journal.** It includes branch positions and question results, not a standalone verified command replay player or restart recovery service. Import/playback UI remains to build.
4. **Whole-app UX pass remains.** Auth, profile, learning, about, policies, friend lobby and legacy mode interiors retain existing styling. No copied art/fonts/audio was added; new UI uses system fonts, chess glyphs and CSS art.
5. **Polish remains.** Full captured-material panel, persistent visual/audio preferences, per-channel sound controls, ambience, full focus-return audit and a complete WCAG audit are not finished. Reduced motion, plain board and opt-in move sound work in the current session.
6. **Draw edge cases need further testing.** Rare orthodox dead positions, every multi-move half-move/repetition interaction and all rewind effect histories should be reviewed before competitive use. The local simplified timeout policy is explicit in the UI.
7. **Deployment and remote publication are not done by this patch.** Main is unchanged. A branch must be pushed, reviewed and deployed separately. Never expose a service-role key to the client.

## Suggested next delivery stages

- Review this local branch and the new visual direction.
- Finish UI styling for the legacy surfaces without rewriting their engines.
- Choose and deploy the authoritative backend within the project's current hosting plan; no hosting purchase is authorized by this change.
- Implement online commands/persistence, then run adversarial policy tests and two-client reconnect/deadline convergence checks.
- Add full replay player and complete accessibility/regression verification before declaring the specification release-ready.

## Iteration record and expanded local toolkit

The user's later steering selected a familiar dark chess workspace with original code/assets, premium clean layout, theme/play settings, named personality bots and a larger chess toolkit. The work was separated into component loops and checked after integration:

1. Core chess rules and maths gate, then duel scheduler and seven-power adapter. Tests and local board flow were checked before styling.
2. Persistent `preferences.tsx` and `ProductNav.tsx`: Dark/Light, four board palettes, outline/solid glyph pieces, coordinates, move dots, last-move highlight, click/drag method, move sound, reduced motion. Preferences persist on this device. Settings apply to the new toolkit; legacy board renderers retain their original settings.
3. `bot.ts` and `bot.worker.ts`: original material/position alpha-beta search, bounded node work, three strengths/style biases. Famous-player labels were requested: Magnus Carlsen, Hikaru Nakamura and Viswanathan Anand. They are visibly unofficial/unaffiliated practice profiles, not actual-player simulations or endorsements. No portraits, voices or proprietary personality scripts are included. Name/endorsement/licensing review remains necessary before public release. Classic local computer chess and Mind Before Move vs computer are supported; Mantra stays sequential hot-seat, not bot or online duel.
4. `study.ts`, `PositionBoard.tsx` and `StudyBoard.tsx`: legal PGN/FEN load, main-line export, position replay, branch from current view, independent Stockfish analysis using the repository's existing engine. This is isolated from live variant matches; no live hints. Stockfish was verified returning a depth-8 score and best move. The bundled legacy version is from 2019, not a claim to use a current Stockfish release. Material heuristic is labeled separately. Nested PGN variation preservation and full automatic move-quality review remain unfinished.
5. `library.ts`: a sourced starter game, Lasker vs Capablanca, Havana 1921 game 10, all 136 plies replay legally. Only the historical factual score was transcribed, without source annotations. It is not an exhaustive tournament library. Source: https://www.chessgames.com/perl/printgame?gid=1241504 .
6. `openings.ts`: three starter opening lines with source links, legal loading and exploration in the study board, not database win-rate statistics. Sources:
   - https://lichess.org/opening/Italian_Game/e4_e5_Nf3_Nc6_Bc4
   - https://lichess.org/opening/Sicilian_Defense
   - https://lichess.org/opening/Queens_Gambit
7. `training.ts` and `TrainingPage.tsx`: three original mate-in-one compositions; any legal mate is accepted, hints/reset, device-local progress, and 3-minute repeated-bank practice sprint with three-mistake stop. The UI discloses the small bank and no rated Puzzle Rush/Battle claim.
8. `tournament.ts` and `TournamentPage.tsx`: local round-robin creation for 2–16 unique players, add players before results start, pairings, manual result entry, points/standings, device persistence and JSON export. No player identity, invitations, verified outcomes, live rooms or official tiebreak/rating claims. Pairing tests cover even and odd rosters with no duplicate pair or double booking.

Latest checks: 49 deterministic tests across engine, bot, study, training and tournament modules; TypeScript/build pass; local browser flows verify bot replies, saved themes, PGN/FEN replay, real engine score, historical game, opening loading, puzzles, tournament results and restore. Screenshots inspect laptop and narrow layouts. Automated axe checks on the tested core play and settings states show no WCAG A/AA violations after correcting button contrast; broader accessibility audit remains necessary.

The earlier limitations section should be read with this update: persistent preferences and local position-journal review now work, and training has a new UI. Full event replay/import, modern engine update, all-variant migration, all auxiliary-page redesign and competitive services are still incomplete.

## Expanded program beyond this milestone

- Competitive online: serialized durable room service, private question answers, invitations, reconnect rules, permissions/adversarial tests, two-client convergence, and deployment.
- Variants: validate and adapt 3-check, King of the Hill, Crazyhouse and coordinated Bughouse, plus the original freeze/jump Spell Chess rules. Existing Spell route is preserved, not claimed as a fully audited clone.
- Play cadences: Classic supports short/long local presets and untimed play. Durable daily/correspondence chess requires persistent server workflow.
- Games/training data: choose lawful maintained sources for large tournament PGN, puzzle and opening collections; add search, filters, review and documented coverage. Never claim all matches from every tournament.
- Product polish: restyle auth/profile/policy/friend lobby and old game interiors, use a shared board component across all engines, complete capture panels and full accessibility/keyboard/focus audits.
- Community competition: online tournament registration, pairing variants, game integration, official tiebreak rules, moderation and security.

## Review-only handoff and safety

All changes are on a local feature branch. GitHub main is unchanged; no remote branch, pull request or public deployment was made. The user's no-push instruction controls publication. A public tunnel or hosted preview requires explicit audience permission; no preview has been exposed by this work.

Apply the patch to a clean local checkout without pushing:

```
git switch -c review/chaturanga-local
git am /path/to/Chaturanga-local-review.patch
npm ci
npm test
npm run build
npm run dev
```

A git bundle is also supplied as a review backup; it contains feature-branch commits and requires the original base commit. Reconcile conflicts rather than force-applying over unrelated work.

## UX direction, next local loop
The home board is interactive immediately, without account or setup. It is a small untimed two-person board and queen-only promotion, not online matchmaking. One-click quiet computer practice/resume uses the existing saved local game and skips setup; legacy offline variant starts no longer force a three-second versus screen. Home practice suggestions use actual per-composition attempts on this device; they do not infer a player's overall chess weaknesses. Study position notes explain legal captures, check/mate and material in plain English without claiming a full engine review or move-quality diagnosis. Hide-rating/difficulty-number preference is device-persisted. Mock online friends have been removed; live social presence is not connected. No ads, upsell gates or forced gamification were added.

Worldwide variants remain a phased rules-engine roadmap, not shipped cards: Crazyhouse, Bughouse, King of the Hill, 3-Check, Antichess, Horde, Racing Kings, Duck Chess and historical Indian Chaturanga. Existing Chess960, Atomic, Fog and original Spell rules need independent rules-fidelity checks. Historical Chaturanga has multiple reconstructed rulesets and must name a source/ruleset rather than claim one definitive implementation. Every new engine needs legality, terminal-state, bot compatibility and two-client tests where appropriate.

### Independent feature modules and tested boundaries
- ZenModeToggle: persists hiding rating/difficulty numbers in the new settings and wired legacy player bars/variant selector. Not a full hide-streaks/results mode; legacy profile internals are not audited.
- RematchSettings / rematchPolicy: persisted choice and tested decision helper. No rematch protocol exists yet in the online service, so this is preparation, not functional online auto-decline.
- OpeningExplorer / openingLookup / data/eco.json: 3,865 named lines with legal position index, search and loaded-line classification. Database is lazy-loaded with Study, not the home bundle. No frequency/win-rate statistics.
- AnalysisCoach / positionNotes: rules facts, material balance, SAN translation of a real engine candidate. Does not fabricate causal strategy or full conversational review.
- MistakePuzzleEngine / engineAnalysis / mistakeDetector / MistakePuzzlePractice: real browser-only opt-in depth-8 scan, first 20 imported plies, skips mate-score/promotions, 1.5-pawn loss threshold, cancellable worker, candidate-practice board. One stored candidate, no unique-solution or equal-alternative certification. Imported lines and scans are not uploaded; results are session-only. Cross-device game history and a robust graded bank remain future work.
- Puzzle auto-advance outside sprint is independently optional and defaults off. No new payment gate was added.
- Khivin: original signature house bot with existing bounded search. No book training, world-knowledge or Stockfish-strength claim.

Lighthouse 13.5.0, local Vite production preview, default simulated mobile, home screen: first UX run 96/100/96/82, final repeat 98/100/100/100 (Performance/Accessibility/Best Practices/SEO). Fixes: missing favicon, meta description and valid robots.txt; non-home pages lazy-loaded; board visible labels corrected. Lab scores vary and do not establish public hosting, real-device speed, all-page certification or superiority to another website. Remaining unused CSS/JS and render-blocking legacy font resources are optimization work.

Opening dataset commit: a6189a30dc273ccb21fc2536a9a2fefd5592a67a

## v4 engine/rules milestone

Separate modules: variantCatalog, variantRules, VariantBoard, VariantPage, stockfishProtocol, stockfishAdapter. chessops 0.15.1 offers eight established rulesets in the new local room: Standard, Crazyhouse, KOTH, Three-check, Antichess, Atomic, Horde, Racing Kings. Crazyhouse pockets/drops and promotion choices are interactive. Castling uses the upstream king-to-rook-square move notation. This room is untimed, two-person hot-seat; it does not persist a game over refresh and has no bot/online/verified tournament connection. Existing original variant routes are preserved separately. Bughouse, Duck, historical Chaturanga, Fog and Spell are not newly implemented by this room. These are upstream rules, not claims of every world's ruleset or exhaustive correctness certification.

Stockfish 19 lite single-thread WASM now powers Study and classic Khivin. Engine is loaded only on demand, not on home. New adapter validates orthodox FEN and legal returned moves, aborts on position/phase change, and times out instead of silently switching engines. Maths/spell bots retain the original allowed-move-aware bounded search. Browser tests verified protocol handshake, depth-10 score/bestmove, study suggestion and classic Khivin legal reply.

73 tests/typecheck/build pass. Rules tests include default position/FEN roundtrips, Crazyhouse capture/drop, knight pocket notation, compulsory antichess capture, KOTH center win, third-check win, Atomic king explosion, Racing Kings no-check moves, orthodox promotion choices and king-to-rook castling. Selected rendered flows fit 320/390px; core variant axe A/AA checks returned no findings in the tested state. This is not full certification. Mobile home Lighthouse remains 98/100/100/100, local production preview.

Security note: npm audit reports 13 existing toolchain findings (including critical Vitest/tinypool and high Vite/Tailwind chains). No new production chessops advisory was reported in that audit. Public-release gate remains dependency security upgrades with compatibility tests; no force-upgrade was run in this engine loop. Keep local development servers local and do not equate a Lighthouse best-practices score with vulnerability clearance.
