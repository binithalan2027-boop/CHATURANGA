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
