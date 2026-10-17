# Classic collection on the courtyard template + Chess MM merge (2026-10-17)

Binit's feedback (WhatsApp, 2026-10-17): in the "Classic chess" picker on the
main page, Original Spell and Original Maths should be one mode called
**Chess MM**, and all the variant boards still used the old dark gothic design
instead of the courtyard template the rest of the app uses.

## What changed

### 1. Chess MM: Original Spell + Original Maths merged
- `src/BotSelectScreen.tsx`: the picker now lists 5 modes: Classic chess,
  Chess960, Fog of War, Atomic, **Chess MM** (replaces "Original Spell" and
  "Original Maths").
- `src/modes/MathChessMode.tsx` is now Chess MM ("Mind & magic"):
  - Keeps both maths submodes: **Mind gate** (one question before each move)
    and **Speed duel** (10-question duel every 90 seconds, win power-ups).
  - Gains the **spell deck** from Original Spell: **Freeze** (3x3 area frozen
    for the bot's next move, 2 charges to start) and **Jump** (lift one
    non-king piece until after your next move, 1 charge), with a 3-move shared
    cooldown. Winning a speed duel also recharges a random spell.
- `src/modes/SpellMode.tsx` deleted; `spell` route removed from
  `OfflineGameView.tsx` and `App.tsx`.
- `src/LandingPage.tsx`: the "Classic variants" card mentions Chess MM.

### 2. Every classic-collection board now uses the courtyard template
- New shared layout `src/modes/CourtyardMatch.tsx`: the same header, board
  style, pieces, player lines, move list and preferences (coordinates, legal
  dots, solid pieces) as the main Chaturanga game.
- Standard, Chess960, Fog of War, Atomic and Chess MM all render through it.
  Fog hides unreachable squares on the new palette; Atomic marks explosions;
  freeze/poison/jump squares get courtyard effect marks.
- Old dark-theme components deleted: `components/ChessBoard.tsx`,
  `components/PlayerBar.tsx`, `components/MoveHistory.tsx`.
- `courtyard.css` gained the few new classes the modes need (fog, frozen,
  jumped, poison, explosion, spell deck, clocks, maths overlays).

### 3. Small fixes along the way
- `useStockfish`: a stale closure made the 5-second watchdog set
  `engineError` even when the engine was fine. Bots also renamed from the old
  gothic set (Blood Mage, Lich King...) to neutral levels (Novice, Casual,
  Club Player, Tournament Player, Expert, Master, Grandmaster) to match the
  new design.
- Standard-mode takeback now takes back the bot reply plus your move and
  rebuilds the captured-piece lists from the board.

## Verification
- `npm run typecheck` clean, `npm test` 271/271, `npm run build` clean.
- Headless-browser screenshots of the picker and all 5 modes after real
  moves (e2-e4 plus bot reply), the Chess MM mind-gate modal, a freeze cast
  and a jump cast, and a takeback - all inspected and correct.

## Not in this patch (flag if you want them)
- `components/landing/ModesSection.tsx` and `HeroSection.tsx` are old
  dark-theme landing sections. They are not rendered anywhere, left in place.
- Chess960 castling still goes through chess.js, which does not fully support
  960 castling rules (pre-existing).
