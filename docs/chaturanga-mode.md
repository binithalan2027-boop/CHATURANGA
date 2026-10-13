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
