# v7 verification
13 October 2026. Local development evidence, not production certification.

- npm ci succeeded on restored exact v6.
- Client TypeScript: passed. Server TypeScript: passed.
- Vitest: 142/142 tests in 16 files, including original v6 and 22 added cases.
- Production bundle: passed. Large inherited chunks remain a Vite warning.
- Runtime npm audit: zero vulnerabilities. Whole-toolchain audit: 12 inherited development advisories (4 moderate, 6 high, 2 critical). Not claimed fixed.
- Real Chrome standard regression: independent players e4/e5, reload restore, mutual draw; no page errors or 320px overflow.
- Four independent Chrome contexts: joined one four-seat room, played a full South/West/North/East round, illegal straight pawn capture did not execute. Three-seat room and first move passed.
- Mind Before Move: correct private maths answer unlocked legal e2-e4; other player received only its own next question. Reload reopened stored cross-board.
- Mantra: actually waited through real 90-second server trigger, private timed White and Black sets, reward selection, resume, Black move, White earned Freeze inventory/button visible. No fixture time acceleration. No page errors.
- Reports: persistent ticket submitted and own status loaded. No email sent or staffed review claimed.
- axe: zero violations on cross-board, mind, privacy/terms page and home in the final browser run.
- Pixels inspected at desktop and 320px: courtyard board/type, online cross-board, maths, Mantra reward, policy and mobile viewport. Fixed old dark styling, invisible square colours, low-contrast connection strip and off-turn inventory. The fixed mobile navigation is at viewport bottom; full-page screenshots render it mid-document, so actual 320x820 viewport was inspected too. At 320px the 14x14 board has necessarily small cells; broader accessibility/touch usability needs further work.
- Final clean-base patch apply/tree equality and fresh-install checks are reported separately in closeout.

Not tested: real OAuth/provider credentials, HTTPS/WSS production origin/proxy, load/scale/security audit, backup restoration, auth identity deletion, retention enforcement, child consent, store packaging/payments or legal operational compliance. Fog and combined multiplayer maths/spells not built. Some legacy routes/assets still await rights and design audit; no claim that every inherited screen is re-designed.

## Clean-base delivery check
Complete patch applied with git am to a fresh worktree at original 34410f9. Source tree exactly matched the tested build (38515c33d0602f608b3ad8d765a53655f5f848bd before this verification-only note). Fresh npm ci, both typechecks, 142/142 tests and production build all passed in that worktree. git am warned about two trailing spaces preserved verbatim in upstream OFL licence texts; application still succeeded. Source/code diffs are whitespace-clean; licence text was not edited to silence a cosmetic warning.
