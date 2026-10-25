# Chaturanga: graphics and design specification

The detailed graphics/design spec for the Matiks-style redesign, Oct 24, 2026. Companion to the Chaturanga PRD v1.3 (its sections 10-11 summarise this) and the redesign build prompt (which tells the coding agent to follow this document). **Updated Oct 24 (v4): adds section 17, the five-mode game screens. v3:** v2 added a no-hotlinked-assets rule to section 4; v3 adds section 14 (screen designs and asset package). Sections 1-13 are unchanged. Written from nine owner-supplied Matiks screenshots, including five direct graphics references: menu with bento cards, home bento grid, daily challenges, stamp art wall, badge-earned celebration.

**Uncertainty to carry through:** the palette hex values are reference-derived approximations carried over from the Stamp Loyalty App PRD v2 (built from the same screenshots), not exact pixel samples. The exact Matiks typeface is unidentified from the screenshots; Bebas Neue (headings) and Poppins (body) are stand-ins whose licences must be verified before shipping (both are commonly distributed under the OFL; confirm at build time). All artwork must be original: Matiks is another company's product - take the design *language*, never their characters, mascots, artwork, or exact layouts.

---

## 1. Surfaces (approximate)

| Token | Hex | Used for |
|---|---|---|
| Void | `#0E0E0E` | App background |
| Charcoal | `#1A1A1A` | Cards, sheets |
| Raised | `#262626` | Pills, inner cards, icon chips |
| Off-white | `#F4F4F4` | Primary text |

Dark mode only. Cards sit one step lighter than the base; interactive chips one step above that.

## 2. Accents (approximate)

| Token | Hex | Used for |
|---|---|---|
| Matiks lime | `#AFF65B` | The ONE key action per screen; kickers; active states; reward moments |
| Bento yellow | `#F2D500` | Accent stat tiles |
| Lavender | `#A594F0` | Accent stat tiles, charts base |
| Teal | `#66D4C2` | Accent stat tiles |
| Coral orange | `#F07040` | Timers, alerts, the "UNLOCKED" pill |
| Emerald | `#0FB567` | Success |
| Sky blue | `#50A0F0` | Illustrations |
| Live red | `#E5484D` | Errors |

Lime is rationed: one lime action per screen, never lime text on a coloured tile.

## 3. Typography

- **Headings:** very large, tall, condensed, bold caps, tight line-height (~0.94). The references run headlines two lines tall and let artwork overlap them. Optionally one lime word per heading, Matiks-style. Stand-in: Bebas Neue (licence to verify).
- **Body / UI:** rounded geometric sans. Stand-in: Poppins (licence to verify).
- **Kickers:** small caps, letter-spaced (~0.3em), lime, at a readable responsive UI size (roughly 0.7-0.8rem / 11-13px equivalent, scaling with the layout) - match the references' visual hierarchy, never print-style point sizes.
- **Numerals:** tabular; large condensed numerals for fraction readouts.
- Keep the existing Noto Devanagari (OFL) for Indic text.

## 4. Illustration style

- Flat vector, solid fills, **no gradients**. The only texture in the references is an occasional motif band: diagonal pinstripes on the profile banner, a dotted flight-path trail behind one character.
- Bold geometric shapes built from rounded rectangles, circles and simple polygons.
- 2-4 colours per illustration, drawn from the accent set plus dark and off-white.
- Characters are chunky and playful with minimal faces (dot eyes, simple mouths).
- Every illustration must be an ORIGINAL Chaturanga subject in this style. Never reproduce Matiks' characters or artwork.
- No hotlinked external assets: every image, texture and font ships self-hosted in the repo. The current landing page loads a background texture from `transparenttextures.com` at runtime; replace it with an original pattern in this style.

## 5. Bento tiles

- Big rounded rectangles (~20-24px radius) in an asymmetric grid: one large tile, two small tiles, one wide tile, one square tile per screen.
- Each accent tile commits to ONE accent colour, with DARK text and dark illustration on it - never lime text on a coloured tile.
- Tile anatomy: condensed caps title top-left; illustration or chart filling the body; optional black pill chip with lime text (the references show a "RATING" chip); optional dark circular chevron button bottom-right.

## 6. Iconography

- Thin-stroke (1.5-2px) line icons, rounded caps, off-white.
- Icons sit inside raised rounded-square chips (~16px radius) with small-caps grey labels beneath.
- Functional, not decorative.

## 7. Charts

- Where a trend is shown: one simple dark line chart on a lavender tile, rising, ending in a single lime dot. No axes, no gridlines, no labels - a glanceable trend, not an analytics dashboard.
- Only visualise data the app already produces (games played, puzzles cleared, stamp progress). No new data features may slip in disguised as decoration.

## 8. Profile band

- Accent-colour banner with a subtle diagonal-line texture.
- A flat original avatar shape overlapping the banner's bottom edge.
- Name in bold, handle/subtitle in grey, lime circular chevron button on the right.

## 9. Navigation

- For narrow phone-browser layouts only: bottom bar of 4-5 line icons with small-caps labels; the active tab turns lime; tiny counter badges (0/3 style) where a count matters.
- Chaturanga's tabs map to its real sections (Play, Study, Training, Tournaments, Stamps). Do NOT copy the reference app's tabs (arena, feed, quests) - those features do not exist in Chaturanga.

## 10. Progress and feedback graphics

- **Big fraction readouts** (0/4) in large condensed numerals, the done-count in lime.
- **Stepper trails:** a horizontal line with circular milestone nodes; locked nodes grey with a glyph, reached nodes lime, reward values (5, 15 style) beneath.
- **Countdown chips:** dark pill, lime clock icon, tabular numerals (01:00:22 style) - only where a real timer exists in the app.
- **Tab counters:** small dark rounded chips (0/2) beside tab labels; active tab underlined lime.
- **Reward feel:** earning something plays a short pop + glow, like a game reward.

## 11. Chaturanga treatment, screen by screen

All art original CSS/SVG; same subjects as today's UI, redrawn in this style.

1. **Landing / home.** Profile/header band (section 8), then a bento grid of feature cards: Play (large tile, flat knight illustration), Study (book or magnifier motif), Training (target or puzzle motif), Tournaments (trophy motif). One lime action on the screen: the main Play button.
2. **Mode picker.** Five mode cards in the same card language, each with its own small original flat illustration: Classic (a king), Chess960 (shuffled back-rank squares or dice), Fog of War (a board half-covered by a fog shape), Atomic (an explosion burst), Chess MM (a pi glyph with a chess piece).
3. **Match screens.** Board legibility comes first on the dark base: coordinates, legal dots and the fog/freeze/jump/poison/explosion markers stay readable. Overlays (mind gate, speed duel, spell deck) become charcoal sheets with one lime action each.
4. **Study / openings / training.** Same bento card language; progress visualised with big fractions and stepper trails, only where the underlying counts exist.
5. **Stamp book.** Section 12.

## 12. Postage-stamp achievements

**Stamp tile.**
- **Perforated edge:** a white/off-white border with semicircular notches on all four sides (~6-8 per side), done in CSS (radial-gradient mask) or SVG. The perforation is what makes it read as a postage stamp.
- **Art window:** an inset rectangle with a solid accent background and one original flat illustration; optional dotted motion-path lines behind the subject (the reference bee's flight trail).
- **States:** locked = desaturated silhouette of the art; unlocked = full colour with a small "UNLOCKED" pill overlapping the stamp's right edge (coral orange pill, dark text, in the references).
- **Presentation:** stamps may sit at slight rotations (2-4 degrees) and overlap headings - a collected, scattered feel, not a rigid grid.

**Stamp book screen.**
- Dark base; stamps grouped into sets (variant set, Chess MM set, training set), each set titled in condensed caps with a completion fraction (2/6). Unlocked stamps full colour, locked ones greyed.
- Overall completion visible at a glance (fraction + stepper trail).

**Earned celebration (full screen).**
- Radial sunburst background: alternating rays of near-black and one-step-lighter dark.
- Centred circular badge with a thick metallic-grey ring and a lime glyph inside; the new stamp shown with it.
- Huge lime condensed caps headline ("STAMP EARNED" plus the stamp name), one-line description in off-white.
- One full-width lime pill button (dark text) to claim and continue - the single action on screen.
- Motion: scale-in with slight overshoot, brief lime glow behind the badge. Respect the existing reduced-motion preference.

**Scope.** Example stamps (concept only, all tied to locally playable flows): First Win vs a bot, Fog of War win, Atomic win, Chess MM Speed-duel win, Mind-gate answer streak, Mate-sprint clear. Achievement tracking is device-local to start (the game server is not hosted); structure it so server-backed unlocks can be added later.

## 13. Explicitly out of scope

The Matiks references also show a feed, duels arena, ranks and quests. Those are visual inspiration, not commitments - none are Chaturanga features today, and this spec does not add them. Do not build quests, a feed, ranks, or an arena.

## 14. Screen designs and asset package (v3)

Companion file: `chaturanga-design-package.zip`. These are design proposals drawn from sections 1-13. None is implemented in the repo.

**Earlier phone-browser references (390x844, plus initial web frames). See the desktop-first clarification below for the primary full web set.** 01 Home, 02 Mode picker, 03 Match, 04 Chess MM mind gate, 05 Study, 06 Training, 07 Events, 08 Stamp book, 09 Stamp earned, 10 Profile and achievements, 11 Sign in to play online, 12 Web landing, 13 Web play, 14 Component sheet.

**Package contents.**
- `png/` rendered screens; `svg/` editable vector versions with live text.
- `assets/illustrations/` 19 original flat illustrations (knight, king, queen, rook, pawn, trophy, book, target, dice, fog, burst, pi, bolt, flag, star, shield, snow, clock, sum).
- `assets/stamps/` 10 stamps, each locked and unlocked. `assets/icons/` 18 thin-stroke icons.
- `design-tokens.json` (plain design-token JSON: colours, type, radii, spacing, board colours).
- `screens-spec.json` (each frame, its components, status and caveats).

**Figma.** The package is not a native Figma file. Figma sign-in succeeded, but the browser imports did not add either SVGs or a PNG control to the canvas. No finished native Figma design is claimed. To get editable Figma frames: install Bebas Neue and Poppins, then drag the SVG files onto a Figma page. Import the tokens JSON with a token plugin such as Tokens Studio. Imported layers are flat vectors, so reusable components and auto-layout must be rebuilt in Figma.

**What the designs add to this spec.**
- Board colours: light `#D9D5C7`, dark `#5F7A4A`, last-move highlight `#F2D500` at 45%. Approximate, chosen for legibility on the dark base.
- Profile: coral banner with diagonal pinstripes, overlapping avatar, three stat tiles (yellow, lavender, teal), a rating trend tile, a row of earned stamps.
- Desktop: board left, move list and tiles right, one lime action.
- Sign-in follows the code: Google, Facebook and Discord only, with "play a bot instead". There is no guest online mode.

**Caveats.**
- Stats, counts, ratings and events on the screens are sample values.
- The Events screen needs the online server, which is not hosted. Ship it only behind a clear coming-soon state, or leave it out until the server exists.
- Profile stats and stamps are device-local until online accounts exist.
- Chess pieces are simple original shapes, not a finished piece set. Hex values and fonts remain approximations (section top note).
- Open decision: whether this look replaces the current theme or is a selectable theme. The screens do not settle it.


## 15. Video references received Oct 24

Two additional recordings confirm the existing direction. The first shows Matiks' condensed lime UPDATE AVAILABLE heading and lime button on a dark card, followed by Google Play's pending download. The second shows the app after the update: skeleton loading placeholders, Insights with compact filter chips and overview/accuracy/presets/quality tabs, then the profile band and asymmetric bento menu.

Apply loading placeholders only while real data is loading, preserving the final card dimensions. Avoid perpetual decorative spinners. On existing multi-view Study/Training screens, use compact filter chips and lime active-tab outlines or underlines; only expose tabs supported by real content. The recordings do not add a feed, quests, currency, ranks or a paid update flow to Chaturanga. They do not identify Matiks' exact font.

## 16. Chess example verification

Match screens use the legal Ruy Lopez position after `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6`. FEN: `r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4`. White to move. Selected f3 knight: legal destinations g1, d4, g5, h4, and capture e5. Last move a7-a6. Verified with python-chess. Screens are visual proposals, not executable chess UI.


## Web application clarification (owner, Oct 24)

Desktop-first responsive web application, NOT a native mobile app. `web/svg/` and `web/png/` are the primary 14-layout set: home, mode selection, Study, Training, Profile, Stamps, achievement celebration, sign-in, tournament coming-soon, loading/error/empty states, public landing, match, components and Chess MM overlay. Earlier 390px frames are secondary phone-browser references.

At wide widths use persistent left navigation and a top account bar for app workspaces; public landing and board-focused match can use compact top navigation. At 1024px collapse the rail to labelled compact navigation; below 768px reflow tiles to one column (two only where readable), keep the chessboard square within the viewport, move panels below it, and use a responsive web bottom navigation (the fixed bottom tab bar in the design-package reference images), styled as a web component rather than native-app tabs. No horizontal page overflow. Keep Profile accessible via the account/menu control on narrow screens. Touch targets at least 44px. Keyboard focus, screen-reader labels and reduced motion remain required.

Tournaments is a coming-soon concept, not a fabricated event list. Profile stats are labelled sample data; do not invent Elo. Mockup artwork, typefaces and colours are design proposals, not implemented screens. No Figma retry or new integration is part of this revision.


---

## 17. Five-mode game screens (v4, Oct 24)

Full-size, mode-specific match screens for all five shipped modes, each in desktop (1440x900, `web/svg/15-19` + `web/png/15-19`) and phone-browser (390x844, `svg/15-19` + `png/15-19`) versions. Built as reference images to feed directly to the coding platform. The shared match chrome is identical everywhere (top nav, bot card, move list, mode tile, tool chips, one lime action); the mode-specific parts:

1. **Classic** (`15-mode-classic`). Standard rules, no game clock in the current build. Bot-strength slider panel ("applies from the next bot move") and a Takeback tool chip. Position: Ruy Lopez after `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6`, Nf3 selected with legal destinations g1, d4, g5, h4 and the e5 capture ring. Verified with python-chess.
2. **Chess960** (`16-mode-chess960`). Shuffled back rank (screen shows BQNRKBRN, python-chess chess960 position #290), a "this game's back rank" strip in the side panel, the castling note, and bot strength locked once the game starts. A new game shuffles a fresh rank.
3. **Fog of War** (`17-mode-fog-of-war`). The repo visibility rule rendered: your pieces plus every square they can legally move to (35/64 in the shown position). Hidden squares carry an 85% void overlay and hidden black pieces are not drawn; the last-move highlight dims under fog.
4. **Atomic** (`18-mode-atomic`). Post-capture state after `4. Bxc6` (python-chess atomic): burst marks across the 3x3 around c6, the knight and the capturing bishop destroyed, pawns in the blast immune. The captured piece sits on a raised chip; a note flags that the repo material counter counts captures, not explosion losses. The turn pill reads "BOT TO MOVE".
5. **Chess MM** (`19-mode-chess-mm`). 10:00 clocks (player lime pill, bot raised pill), a "DUEL IN 00:41" countdown chip, the How-it-plays toggle (Mind gate / Speed duel), the spell deck (Freeze x1, Jump x1, 3-move cooldown note) and the power-ups line. A cast freeze shows as a sky-tinted 3x3 with original snowflake marks. The mind-gate and speed-duel overlays stay on existing frame 14.

**Marker conventions.** Legal destinations are dark dots, captures a dark ring, the selected square a dark inset outline, the last move a 45% yellow highlight. Freeze = sky tint + snowflake; explosion = coral burst behind surviving pieces. In the repo today these marks are emoji; the redesign replaces them with original flat marks.

**Phone-browser versions reflow, never shrink:** bot card on top, square board, panels below, bottom tab bar (Play active). No native-app chrome.

**Phone controls continuation (`svg/20-mode-*-controls`).** Core match controls never disappear on phone: a below-the-fold continuation frame per mode shows them as full-width 48px+ touch rows - New game (the one lime action), Resign, Settings, Back home, Takeback on Classic only - plus the mode's side-panel content (bot-strength slider, 960 back-rank strip, Chess MM How-it-plays toggle). The page scrolls; the tab bar stays fixed.

**Chess MM overlays.** Mind gate: existing frames 14 (desktop) and 04 (phone). Speed duel: new frames `21-mode-chess-mm-duel` (desktop + phone) - a charcoal sheet over the dimmed match, "MATHS DUEL · ROUND 1 · QUESTION 3/10", one question, four options, score line, clocks paused. Sample question 8 × 9 with answer 72 and repo-style distractors.

**State consistency notes.** The Chess MM match screens show the moment just after one freeze was cast: Freeze ×1 left of the ×2 starting charges and the deck on its 3-move cooldown. Fog of War: the repo's match sidebar passes the full move history (`chess.history()`), so SAN for moves inside the fog is visible today; the screens mirror that and the desktop footer flags masking it as an open design call.

**Caveats.** Ratings, clock values and counts on the screens are sample values. Only Chess MM has clocks in the current build. Positions and visibility/blast states are verified against the repo rules with python-chess; the SVGs remain visual proposals, not executable UI.
