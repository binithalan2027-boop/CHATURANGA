# Third-party notices and sources

This branch introduces no runtime dependencies or copied proprietary artwork.

- chess.js is an existing dependency. Keep its BSD-2-Clause notice distributed with installed dependency code.
- React, Vite and existing project dependencies retain their installed licenses. No dependency licenses were changed.
- The existing `public/stockfish.js` includes a GPL notice and credits to Stockfish and multi-variant contributors. Its binary/JS came from the existing repository, not a new engine download. Public distribution requires auditing the existing engine's GPL source/license compliance; this local branch does not establish that the repository's old package has fulfilled all source-distribution obligations.
- New board silhouettes use system Unicode chess glyphs. New UI fonts are system fonts; the old app's existing Google-font imports remain unchanged.
- Courtyard artwork is original CSS; opt-in new move sound is generated with Web Audio.
- Historical move score: Lasker-Capablanca 1921 game 10, factual moves transcribed from https://www.chessgames.com/perl/printgame?gid=1241504 . No commentary, analysis or page artwork was copied. This one game is not an archive license for bulk scraping.
- Opening starter factual lines have source links in `openings.ts`; no source descriptions/statistics/artwork were copied.
- Famous-player bot labels are requested unofficial name-inspired labels only. No real player photos/voices or endorsement claims. Public-release rights review remains outstanding.

Opening name database: lichess-org/chess-openings, CC0/public-domain dedication. Imported from https://github.com/lichess-org/chess-openings (a.tsv through e.tsv); each PGN replayed legally using chess.js before generating the local position index. Names/classification only, no popularity, master win rates or opening recommendation statistics. The upstream commit is recorded in the UX build notes.

## Local engine/rules loop (v4)

User chose the GPL-compatible integration path in their October 10, 2026 option-A reply; no publication is authorized or performed. New dependency: chessops 0.15.1, GPL-3.0-or-later, https://github.com/lichess-org/chessops . Exact npm package (including upstream source) and license are preserved under vendor/chessops-0.15.1; package-lock pins integrity. The dependency @badrap/result retains its upstream MIT license in npm distribution.

New browser engine: stockfish npm 19.0.0, Stockfish 19 lite single-thread JS/WASM, GPLv3. Files under public/engines/stockfish-19-lite are unmodified from the npm archive. Upstream: https://github.com/nmrugg/stockfish.js/tree/v19.0.0 , source commit 9cb3e5066d48f1a35d792afeda36eff37ae60570. Source archive/build scripts, AUTHORS, license and the named lite NNUE network are preserved under vendor/stockfish-19-source. Upstream source build command: `node build.js --lite --single-threaded` with its documented Emscripten environment. We verified the distributed binary works, but have not rebuilt it and proved binary reproducibility. Before public redistribution, verify the exact package binary's complete corresponding source/build inputs and make them available together with notices; do not claim this local provenance work alone is legal certification. Source and network checksums are recorded below. No source publication was done.

Stockfish classic Khivin uses depth 10, one thread, bounded request lifetime and legal-move validation. Study uses depth 10; imported-line scanner depth 8. Lite is intentionally smaller than the full engine and is not the maximum-strength build. It does not play nonstandard maths/spell rules: those remain the original bounded local search. No Maia, lc0, Fairy-Stockfish search worker or trained book model is integrated in this milestone.
d3344124ab067fb0b90ee77873bb8e9fbf5fc01bc525fe714b0f942581e889e6  public/engines/stockfish-19-lite/stockfish-19-lite-single.js
57ac2d72312aba346760e3f173f687a8c211208e97a87268436f7f0e10bb5387  public/engines/stockfish-19-lite/stockfish-19-lite-single.wasm
f81e7d74c350626766382ec67fa262c38cda00cb8b501790f95cdebb526006c1  vendor/stockfish-19-source/AUTHORS
8ceb4b9ee5adedde47b31e975c1d90c73ad27b6b165a1dcd80c7c545eb65b903  vendor/stockfish-19-source/Copying.txt
06dd16ff7cd369c38e96f00dc8462245832083facac574ce663b612ea73cd625  vendor/stockfish-19-source/README.md
61e7af4bb97d51eeeb25d322916f86513b5cd3a827ce189c98c6e31946f99e5b  vendor/stockfish-19-source/nn-61e7af4bb97d.nnue
0a9e0621b7e1e88736f28c58163e588b56a880e1832f4aea37ef97a13f72b2a1  vendor/stockfish-19-source/stockfish-js-v19-source.tar.gz

Upstream GPL text has CRLF normalized to LF for portable patch application. License wording is unchanged.

## Free Public Read-Only APIs (Lichess & Chess.com)

- **Lichess API**: Free, read-only public API (`https://lichess.org/api`, AGPL-3.0-or-later). Used client-side for daily tactical puzzles (`/api/puzzle/daily` and `/api/puzzle/{id}`) and live master opening database statistics (`https://explorer.lichess.ovh/masters`). Replayed legally in-browser using existing chess.js engine. Rate-limit etiquette is strictly respected with client in-flight request deduplication, 60-second backoff on HTTP 429, and daily puzzle localStorage caching. Labeled in UI as "Puzzle from Lichess".
- **Chess.com PubAPI**: Free, read-only public API (`https://api.chess.com/pub/`). Used client-side for public player profile lookup (`/pub/player/{username}`), monthly game archives index (`/pub/player/{username}/games/archives`), and individual game PGN imports. Replayed legally in-browser using existing chess.js with strict variant safety (Chess960, Crazyhouse, and non-standard starting positions rejected with friendly notification; standard chess imported). Labeled in UI as "Data: Chess.com PubAPI".
- **Three.js**: MIT License, Copyright (c) 2010-2026 three.js authors. Used via dynamic import for procedural WebGL point sprite particle bursts (https://threejs.org/). No copied external 3D models or textures.


