# Chaturanga Redesign, Postage-Stamp Achievements & API Integrations Build Notes

**Date:** October 25, 2026  
**Target:** Local clone of CHATURANGA (`CHATURANGA-v2` @ `main`, commit `3684d36`)  
**Deliverable:** Local changes (no git push) with verified tests, types, production build, and patch series for review  

---

## 1. Initial Measured Baseline

Before applying any changes, the repository was measured:
- **Dependencies (`npm ci`):** Clean install, 98 packages audited, 0 vulnerabilities found.
- **Typecheck (`npm run typecheck` / `tsc --noEmit`):** 0 errors.
- **Test suite (`npm test` / `vitest run`):** 271 passing unit tests across 34 test files.
- **Production build (`npm run build`):** Built clean in 2.20s.
- **Audit (`npm audit`):** 0 vulnerabilities.

---

## 2. Key Architectural Decisions

- **Theme Strategy:** User confirmed **Full Replacement** — the unified Matiks dark/lime design language replaces the legacy courtyard theme as the default system across ALL pages.
- **Chessboard & Pieces:** Exact flat vector pieces extracted from `15-mode-classic.svg` implemented in `<MatiksPiece />` and self-hosted `public/pieces/` SVGs. Replaced all Unicode text symbols.
- **Font Licensing & Verification:**
  - Self-hosted `Bebas Neue` (Dharma Type) under SIL Open Font License (OFL-1.1).
  - Self-hosted `Poppins` (Indian Type Foundry) under SIL Open Font License (OFL-1.1).
  - Recorded in root `NOTICE-FONTS.txt` and preserved existing `Noto Devanagari` OFL fonts.
- **Add-On API Strategy:**
  - **Lichess API:** Free, read-only, no key. Powers daily puzzle fetching, opening explorer with master statistics, and cloud evaluations.
  - **Gemini API:** Server-side AI Coach endpoint (`/api/ai-coach`) that explains engine candidate moves in plain English (strictly public FEN/SAN data only, zero private user data).
  - **Microsoft Clarity:** Non-invasive script injection (`initClarity()`) initialized with `VITE_CLARITY_PROJECT_ID`.
  - **Chess.com Public API:** Free, read-only, no key. Imports public player profiles and monthly game archives directly into the study room.
  - **Resend:** Account and notification email utility endpoint (`/api/email/send`) with dev simulation mode when key is absent.

---

## 3. What Changed

### Task 1 — Design Tokens & Theme Foundation
- `src/chaturanga/tokens.ts`: Plain TypeScript design tokens mapping colors (`#0E0E0E`, `#1A1A1A`, `#262626`, `#F4F4F4`, `#AFF65B`, `#F2D500`, `#A594F0`, `#66D4C2`, `#F07040`, `#0FB567`, `#50A0F0`, `#E5484D`), board colors (`#D9D5C7`, `#5F7A4A`, `#F2D500` @ 45%), radii, and font stacks.
- `src/chaturanga/matiks-theme.css`: Defined `@font-face` for self-hosted Bebas Neue & Poppins, CSS variables, `.matiks-headline`, `.matiks-kicker`, `.btn-lime`, `.btn-raised`, `.chip-raised`, `.bento-card` variants, and perforated stamp styles.

### Task 2 — Flat Vector Piece System & Chess Board (Matching `15-mode-classic.svg`)
- `src/components/MatiksPiece.tsx`: Reusable vector piece component rendering all 6 piece types for both colors using the precise flat silhouettes from `15-mode-classic.svg`:
  - White pieces: `#FAFAFA` body with dark `#1B1B1B` accents.
  - Black pieces: `#1B1B1B` body with light `#FAFAFA` accents.
- `public/pieces/*.svg`: Generated all 12 standalone SVG piece assets for fallback and direct references.
- `src/modes/CourtyardMatch.tsx` & `src/chaturanga/PositionBoard.tsx`:
  - Completely replaced Unicode characters (`♔`, `♕`, etc.) with `<MatiksPiece />`.
  - Added solid dark move destination dots (`#0E0E0E`, ~32% diameter).
  - Added capture rings (`stroke="#0E0E0E" stroke-width="3.5" fill="none"`) on legal moves to squares containing enemy pieces.
  - Added yellow last-move overlay (`rgba(242, 213, 0, 0.45)`).
  - Added inset selection outline (`border: 3.5px solid #0E0E0E`).
  - Added Poppins rank and file coordinate labels.
  - Added modern Matiks controls sidebar with Takeback, New Game, Resign, Settings buttons and Lime status pill.

### Task 3 — Unified Graphics Across All Pages
- **Play & Bots (`src/BotSelectScreen.tsx` & `src/App.tsx`):**
  - Directed navbar and landing "Play" and "Bots" actions to the 5-Mode Bento selector (`BotSelectScreen`).
  - Allows selecting game mode, bot ELO (400-3000), and clock time, then playing with the unified chessboard.
- **Study Hub (`src/chaturanga/StudyBoard.tsx` matching `03-web-study.svg`):**
  - Rebuilt as a Matiks Bento Study Hub with 4 hero cards: Openings (`#A594F0`), Endgames (`#66D4C2`), Tactics/Daily Puzzle (`#F2D500`), and Chess.com/Library (`#1A1A1A`).
  - Turn-by-turn board replay, FEN/PGN import & export, and Lichess master database stats.
- **Training Page (`src/chaturanga/TrainingPage.tsx` matching `04-web-training.svg`):**
  - Bento cards for Mate Sprint (`#F2D500`), Mind Gate (`#A594F0`), Speed Duel (`#66D4C2`), and Your Practice stats.
  - Integrated 3-minute sprint countdown timer, live strike counter (max 3), and tracked accuracy.
- **Tournaments Page (`src/chaturanga/TournamentPage.tsx` matching `09-web-events-coming-soon.svg`):**
  - Hero bento banner "COMING LATER · No scheduled events until online hosting is ready" with lime "Play a Bot Instead" button.
  - Concept cards for Arena Blitz, Swiss Brackets, and Rating Tiers.
  - Offline Club Round Robin organizer for in-person gatherings.
- **Online Page (`src/online/OnlinePage.tsx` & `online.css` matching `08-web-sign-in.svg`):**
  - Sign-in state with dual bento layout: "YOUR NEXT OPPONENT" (`#A594F0`) and "SIGN IN TO PLAY" with OAuth buttons and lime "Play a Bot Instead" fallback.
  - Unified `online.css` to dark Matiks tokens (`#0E0E0E`, `#1A1A1A`, Bebas Neue & Poppins).
- **Postage-Stamp Achievements (`src/chaturanga/StampBookPage.tsx`):**
  - Perforated stamp album tracking 10 distinct milestones with unlocked celebrations.

### Task 4 — Connected External APIs & AI Coach
- `src/services/lichess.ts`:
  - `fetchDailyPuzzle()`: Queries live daily puzzle from `https://lichess.org/api/puzzle/daily`.
  - `fetchOpeningExplorer()`: Queries live master opening statistics from `https://explorer.lichess.ovh/masters`.
  - `fetchCloudEval()`: Queries precomputed deep cloud evaluations from `https://lichess.org/api/cloud-eval`.
- `src/services/chessCom.ts`:
  - `fetchChessComProfile()`: Fetches public player profiles from `https://api.chess.com/pub/player/{username}`.
  - `fetchChessComRecentGames()`: Imports recent games and PGNs from `https://api.chess.com/pub/player/{username}/games/archives`.
- `src/services/aiCoach.ts` & `server/index.ts`:
  - `/api/ai-coach` endpoint connected to Google Gemini (`gemini-1.5-flash`).
  - Explains Stockfish candidate moves and tactical motifs in plain English for club players.
  - Fallback heuristic explanation when key is not configured.
- `src/lib/clarity.ts`:
  - Microsoft Clarity script integration triggered via `VITE_CLARITY_PROJECT_ID`.
- `server/index.ts`:
  - `/api/email/send` endpoint with Resend API integration.
- `.env.example` & `.env`:
  - Fully documented configuration for all optional add-on keys.

---

## 4. Verification & Health Summary

| Check | Expected | Result | Status |
|---|---|---|---|
| `npm run typecheck` | 0 errors | 0 errors | **PASS** |
| `npm test` | All tests pass | 35 test files passed, 276/276 tests passed | **PASS** |
| `npm run build` | Zero build errors | Production client built in 3.54s | **PASS** |
| `npm audit` | 0 vulnerabilities | 0 vulnerabilities | **PASS** |
| Dev servers | Active | Vite on port 5173, backend on port 8787 | **RUNNING** |
| Git status | Local only | 0 remote pushes made, patch generated | **PASS** |
