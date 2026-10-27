<USER_REQUEST>
# Chaturanga Training: graphics and interaction spec
27 October 2026. Design proposal and local prototype, not a deployed update.

## Intent
Make choosing a training mode the primary action. Remove the essay above the board. Keep the existing Chaturanga style, fonts, icons, upright pieces, charcoal shell, raised controls and lime action language. Desktop and phone are different compositions of the same task, not a scaled-down desktop.

## Naming is provisional
The user's phrase "match the name" has not been clarified. Training is the top-level page name because chess and maths both belong here. Existing names Mate Sprint and Speed Duel are retained, with short functional labels. Puzzle Practice is a proposed name for untimed chess puzzles, not a confirmed rename of Mind Gate. Do not remove Mind Gate or silently change its meaning in production. Its existing Training card is static; the Chess MM move-gate mechanics elsewhere are not in scope. Keep that behavior untouched until its placement/name is settled.

## Reference files
- training-mode-picker-desktop.jpg: 1440px desktop viewport, mode selection first.
- training-mode-picker-phone.jpg: 390px phone viewport, vertical mode tiles. The progress card continues below the fold. This is a viewport capture, not a complete page.
- training-puzzle-desktop.jpg: an actual position from the included Lichess bank after its setup move.
- training-speed-duel-phone.jpg: keypad-driven maths practice. Example equation is generated, not a claimed app screenshot.
- chaturanga-training-interactive.html: local interactive design prototype with embedded fonts, SVGs, chess library and150 puzzles. Open in a desktop browser after saving. Chat attachment previews may not run HTML.

The images show a prototype badge. Numbers are starter/example state, not Binit's real progress.

## System and shell
Use existing ProductNav in the real app; do not create a second header/rail. Desktop rail stays224px wide below the64px header. Main area uses32-40px padding and a maximum content width around1400px. Below1024px, use the existing phone navigation. The prototype's shell navigation is visual context, not functioning navigation to the rest of the product. All real app navigation must remain functional during integration.

Fonts: bundled Bebas Neue for large headings, Poppins for labels/body. Reuse public/fonts and public/icons. Reuse src/components/MatiksPiece.tsx paths without rotating pieces. Palette comes from the current product: #0E0E0E canvas, #1A1A1A cards, #262626 controls, #F4F4F4 text, #8A8A8A secondary text, #AFF65B primary action, #F2D500 yellow, #AB97EE lavender, #65D1C1 teal. Board uses the existing green/cream language; integration should use the actual board theme variables, not overwrite settings.

## Hub hierarchy
1. Compact kicker and TRAINING title.
2. CHOOSE YOUR MODE and three large button cards.
3. Optional pattern filters and small local-progress summary.
No chessboard, daily API card or long explanation should compete with mode selection on first load.

Cards, desktop: three equal columns with18px gap,24px corner radius,25px inner padding,240px minimum height. Whole card is a semantic button with keyboard focus, not a clickable div. Use a short label, a large icon/equation and one line of facts. Hover lifts4px; reduced-motion users should get a colour/border cue instead.

Cards, phone: stack vertically, approximately124px high,20px padding,12px gaps. Title/content left and illustration right. All three choices are visible before the secondary content at390px width. At320px, allow vertical scrolling rather than reducing type below readable sizes. Do not obscure controls with fixed tabs or the software keyboard; add bottom safe-area padding and scroll focused controls into view.

Proposed cards:
- Yellow Puzzle Practice: "150 puzzles · Offline bank", knight silhouette, "Untimed · Choose a theme".
- Lavender Mate Sprint: queen silhouette +3:00, "3 min · 3 mistakes ends the run". Uses mate-tagged subset, not all puzzles. Prototype uses20 mate-in-one puzzles from this bank and ends on exhaustion rather than recycling for more score.
- Teal Speed Duel: "Quick maths · Solo practice", equation illustration, "Timer · Errors · Review misses". No fake opponent, online status, league or ELO.

## Puzzle session
Mode back button returns to hub. Board is primary: desktop left column with a concise side-to-move label and ordinal. Desktop right card contains time/solved/errors, themes, source ID and next action. On phone, board takes full available width; put time/score/errors above it in production, with secondary details below. Do not put the answer in visible theme copy before solving. Render library UCI as SAN only for review, not as a pre-solve solution.

Use tap/click source then destination, legal target indicators, selected-square highlight and normal upright pieces. Invalid selection is not an error. Legal but incorrect submitted moves are errors. Correct player moves trigger the scripted opponent continuation. Support promotions with an accessible four-piece chooser; the prototype uses a simple browser prompt as a functional placeholder, not the final design. Hint reveals a source square, flags the solve as assisted in production and must not crash on completed puzzles. End state includes solved/missed, hint use, next and modes. Production sessions must distinguish retry/skip from a clean solve.

## Speed Duel session
Setup: mode title,30/60/120-second chip row, easy/medium/hard chip row, start button. Proposed default60s, easy. These are design defaults, not verified Matiks rules and not user-confirmed mechanics. Keep settings configurable.
Active: remaining time, correct answers, errors. One large equation, one answer input,3-column numeric keypad, delete/clear and a lime Check answer button. Desktop shows an extra accuracy/review card; phone prioritizes the equation and keypad. Every key is at least44px high. Enter submits; blank input does not count. Never auto-submit at each digit. Use atomic state updates so fast inputs such as137 do not drop characters.

Correct submission: +1 correct, next question. Incorrect submission: +1 error, record the expected and entered answers, next question, clock continues. No hidden time penalty or three-error exit in maths. Empty input is ignored. Stop input exactly at the deadline, even if interval callbacks are delayed. Derive time from a deadline, not decrementing state. On hidden tab either continue elapsed time or explicitly document a pause rule; this proposal continues. Use a compact polite status message in addition to colour.

Questions: addition, non-negative subtraction, multiplication, exact division with nonzero divisor. All answers are integers in this proposal. Easy operands1-12; medium1-30; hard1-99, with division built as product/divisor. These are initial implementation bounds, not a calibrated learning curriculum. Prevent immediate repeats in production.

Results: correct, errors, accuracy, elapsed time, missed equations with correct answers, Try again and Choose mode. Add retry-missed-only as a production acceptance requirement; prototype currently offers review and a fresh retry, not a missed-only drill. Do not claim live multiplayer. Actual head-to-head duels require a separate explicit scope with authoritative server clocks/scoring, not a cosmetic opponent card.

## States, accessibility and truth
Loading/error on the optional daily API must not block the local bank. Empty filter shows a recovery option, never silently substitutes a different theme. Prototype contains a fallback for empty filters; remove that shortcut in production. Unique solved progress denominator is the local bank only; daily IDs and original3 puzzle IDs must not inflate it. Progress is on-device, no account sync promised. Keyboard focus must be visible, screen readers get side-to-move and equation/status, and colour never carries the whole meaning.

## Preserved features
Keep daily Lichess as a secondary bonus reachable from Puzzle Practice, existing preferences, prior local progress, achievements, drills from mistakes and all Chess MM rules. No push, deploy, public preview or account changes. Do not build stamps from this document; that request is separate.

</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-10-27T16:09:44+05:30.
</ADDITIONAL_METADATA>