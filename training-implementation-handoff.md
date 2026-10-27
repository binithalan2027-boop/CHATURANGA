<USER_REQUEST>
# Chaturanga Training: implementation handoff
Use this with the four individual JPEG references, the separate graphics spec and puzzle-bank-150.json. The HTML is a local design prototype, not a drop-in React replacement or finished application patch. Do not push or deploy.

## First read current code
The inspected public default branch was7badb29a672ecb8ed4e7ad6548fc01238731da98 on27 October2026. Fetch/read your current working tree before editing. Do not overwrite changes made since that commit. Inspect at least:
- src/chaturanga/TrainingPage.tsx
- src/chaturanga/training.ts and training.test.ts
- src/chaturanga/lichessPuzzles.ts and lichessPuzzles.test.ts
- src/chaturanga/PositionBoard.tsx
- src/chaturanga/ProductNav.tsx
- src/chaturanga/preferences.tsx, achievements.ts and DrillsPage.tsx
- src/components/MatiksPiece.tsx, src/chaturanga/matiks-theme.css
- app routing, existing Maths/Chess MM generators and state, package.json and lockfile

Verified baseline:3 original mate-in-one compositions; daily Lichess API fetch/cache; full-line daily solving already exists. Mate Sprint currently recycles the3 originals. Mind Gate and Speed Duel training cards have no click handlers in TrainingPage. Current progress can count daily IDs alongside original IDs, causing solved count to exceed the3-item denominator. Do not mistake static card copy for an implemented mode.

## Product boundary
User wants at least150 chess puzzles, timed quick maths with error tracking, and a mode-first, interactive, low-text redesign in the current theme. Names and exact maths rules are proposals. Keep Training, Mate Sprint and Speed Duel provisionally. Puzzle Practice is a proposed untimed-mode label; do not silently delete/rename Mind Gate or change Chess MM. Confirm the intended meaning of "match the name" before final naming. Solo practice is the implemented proposal; do not fake multiplayer. No remote mutation, push/deploy, payments or third-party account connection.

## Loop1: data model and real bank
Copy puzzle-bank-150.json into an appropriate local data directory, following current repo conventions. Keep its Lichess IDs, original pre-opponent FEN, full UCI moves, rating, themes and sourceGame. Use stable namespaced IDs such as lichess-bank:<id>. This is150 distinct IDs and150 distinct source FENs,50 each in proposed bands:700-1199,1200-1699,1700-2200. Ratings are source puzzle ratings, not user ratings; bands are our labels. Source selection additionally required popularity>=80 and plays>=100. These are first qualifying export rows, not a claim of a professionally curated curriculum. Prefer a later pedagogical pass over quality claims.

Critical: CSV FEN is BEFORE the opponent setup move. Apply moves[0] once, derive solver colour from resulting position, and solve moves.slice(1). Do not reuse the API initialPly/PGN parser on CSV records. Introduce an explicit common prepared-puzzle type if useful, with adapters for original, local-bank and daily API formats. Validate all FENs and every UCI move with chess.js at build/test time. Preserve castling, en passant and UCI promotions. Any checkmating move should be accepted for mate-in-one, even if not the recorded UCI. For other puzzles follow the validated line, unless an engine-backed alternative validator is intentionally added.

Source: https://database.lichess.org/ . Database exports are CC0 and allow modification/redistribution/commercial use. Keep source/license metadata in the repo even though attribution is not required. Do not scrape Chess.com or copy Matiks puzzles/art. Never build150 puzzles by repeatedly requesting /daily or enumerating /next or /batch. Official batch docs explicitly prohibit mass download and cap batch requests at50: https://github.com/lichess-org/api/blob/master/doc/specs/tags/puzzles/api-puzzle-batch-angle.yaml . The attached bank is already sourced from the export.

Tests: >=150 unique bank IDs and FENs; full line legal for every item; all mate-tagged final states mate; setup move applied once; solver colour correct; multi-ply reply, promotion, underpromotion, castling, en passant and alternate mate-in-one fixtures. Fail build for malformed entries rather than silently displaying less than150. Do not assert all150 lines are mates: many win material.

## Loop2: mode hub and puzzle solver
Refactor the training page into mode selection, setup, active session and results. Use semantic button cards as the main content. Preserve ProductNav and current fonts/icons/pieces. No duplicate shell or giant intro paragraph. Follow desktop/phone layouts in the graphics spec.

Untimed Puzzle Practice: all150, theme and difficulty filters, empty-state fallback choice, unseen-first ordering, repeat/retry tools. Selected theme must really filter; do not silently replace an empty filter with all puzzles. Daily puzzle stays a secondary bonus using current cache/retry policy and offline recovery. Keep the original3 compositions accessible and migrate progress safely.

Mate Sprint: preserve existing3-minute/3-error behavior unless the user changes it. Select only appropriate mate puzzles; prototype has20 mate-in-one puzzles in its subset. Don't recycle a solved item inside a run to inflate score; finish on exhaustion or provision a larger unique subset. Disable input while opponent replying and after solve/end; clean up every timer on switch/unmount. Use accessible promotion selection, not the prototype browser prompt. Ensure hints/skip/retry cannot produce an unassisted clean-solve badge.

Fix progress model: count unique solved local bank IDs against bank length; keep original/daily/drill progress separately. Clamp ratios0-100%, use distinct local and daily counts, don't lose existing chaturanga-training-v1 records. Unknown/malformed saved data should recover safely. Use a schema version and migration tests.

## Loop3: quick maths practice
Implement Speed Duel as explicitly labelled SOLO PRACTICE. Suggested configurable defaults from design:60 seconds;30/60/120 choices; easy/medium/hard. Addition, non-negative subtraction, multiplication, exact integer division with nonzero divisor. Bounds and error policy are proposed, not verified Matiks mechanics. Preserve existing chess-maths logic; a standalone training generator must not change in-match math balance.

State machine: setup -> countdown -> active -> results/review. Suggested3-2-1 countdown is an integration requirement, absent from the prototype. Deadline-based clock; reject late answers in submit handler. Wrong submitted numeric answer counts once as1 error and advances, with no time penalty and no error-limit exit. Blank input ignored. Correct+1. Prevent double-submit of the same question. Input supports fast digit entry, backspace, clear, Enter and touch keypad. Do not use answer-length auto-submit. Keep input state functional/atomic to avoid lost digits. No eval on user input. Reject non-finite and malformed values. Ensure question ID and deadline are checked together so a queued key cannot score twice.

Results show correct/errors/accuracy, duration, response-time summary if measured, and each missed equation with entered/correct answer. Add retry-missed-only flow as well as a new run. Local best and history persist under a separate versioned key. No fake opponent, server connection, external leaderboard or ELO. If actual friend duels are requested, stop and design server-authoritative scoring/session sync separately.

Tests: seeded generator with bounded integer answers and zero-divisor prevention; fast137 digit sequence; backspace/clear; empty input ignored; wrong answer counted exactly once; double submit; answer at/after deadline rejected; timer drift/background catch-up; unmount/switch cleanup; result accuracy denominator correct; missed-only retry; history persistence/recovery.

## Loop4: visual and regression checks
Run npm test, npm run typecheck, npm run build, and any affected server tests. Report existing failures separately; don't claim a clean suite without running it. Exercise real app navigation and keyboard focus. Check320/390/768/1440px widths using actual screenshots and inspect each. At390px mode choice is primary; active maths keypad/submit is reachable without fixed-tab overlap; at320px no page-level horizontal scrolling. Verify board/settings/theme choice, sound/preferences, daily loading/error/retry/offline, drills, achievements and existing modes. Screen-reader status and reduced-motion support are required.

Return a local patch against the actual base, changed-file list, test outputs and new JPEG screenshots. Do not commit/push/deploy. State honestly what works locally and what remains unverified. The supplied HTML is evidence of interaction/design intent, not proof that the React app has been updated.

</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-10-27T16:09:45+05:30.
</ADDITIONAL_METADATA>