# Engine and data integration decisions

## Established engines, checked upstream
- Stockfish.js: GPLv3, browser JS/WASM. Modern full builds are large; single-thread/lite options should be tested before replacing the old bundled worker. Exact binary/source correspondence and GPL notices must accompany redistribution. Source: https://github.com/nmrugg/stockfish.js
- Fairy-Stockfish: GPLv3, variant engine and optional WASM. Upstream lists Chess960, Crazyhouse, Bughouse and many regional/historical games, but do not infer complete UI/online support from engine coverage. A Bughouse server still coordinates two boards and pocket transfers. Source: https://github.com/fairy-stockfish/Fairy-Stockfish . Upstream explains exact-source requirements for distributed binaries. WASM rules bindings need a compatible version and adapter before integration.
- chessops: GPLv3-or-later, TypeScript rules library. Fits browser rules handling but copyleft must be assessed before combining/distributing a proprietary application. Source: https://github.com/lichess-org/chessops and https://raw.githubusercontent.com/lichess-org/chessops/master/LICENSE.txt
- scalachess: MIT, Scala rules library. Notice retention required; more natural as JVM/server component, not a drop-in TypeScript module. Source: https://github.com/lichess-org/scalachess and https://raw.githubusercontent.com/lichess-org/scalachess/master/LICENSE
- Maia: GPL software, human-move models used through lc0; upstream uses nodes=1 and warns model ratings are training cohorts, not guaranteed playing ratings. Individual model/weight redistribution rights and the exact version must be checked too. Do not claim a real human's personality. Likely a server-backed option after latency/cost testing. Source: https://github.com/CSSLab/maia-chess and https://raw.githubusercontent.com/CSSLab/maia-chess/master/LICENSE
- Leela Chess Zero: GPLv3-or-later, neural engine with GPU/hardware backends and additional permission described upstream. Model weights and backend licenses require separate checks. Native/server deployment is the practical next evaluation, not promised mobile-browser inference. Source: https://github.com/LeelaChessZero/lc0

Commercial use is not automatically prohibited by GPL. Redistribution and derivative/combined-work obligations can conflict with keeping application source proprietary. Have the release model reviewed before integrating these packages into a public product; a server boundary alone is not a blanket exemption for all software or licenses. No new engine package has been imported in this UX milestone. The old Stockfish worker remains a release-audit item.

## Games archive
No source can establish literally all games ever played by top players. Define coverage: named players, over-the-board/online, time controls, years, completeness and update cadence. Keep every collection's source, retrieval date, license/terms, filtering and missing periods visible.

- https://caissabase.co.uk/ now returns a casino page, not the expected chess database. Do not import or trust that domain as the database source. Recover a verified maintained mirror and its rights first.
- https://theweekinchess.com/ offers event/weekly PGNs, but public access is not proof of commercial collection redistribution rights. Terms/permission still need verification before bundling a bulk archive.
- https://database.lichess.org/ is a source lead for online games; inspect the chosen collection and current terms. Do not label online games as over-the-board master games.
- https://database.nikonoel.fr/ is a source lead for an elite-filtered online collection; verify current filtering, terms and date coverage before import.

No bulk games archive was imported in this loop. Existing local library remains one legally replayed sourced historical game. Import pipeline should stream individual PGNs, reject illegal/oversized games, preserve original headers, deduplicate by source/game hash, partition by year/player, and index positions with explicit collection denominators. Only after real counts exist may the explorer show percentages. An opening name/ECO table cannot supply master statistics.

### Public API integrations (Keyless, Client-Side Only)
- **Lichess Daily Puzzle**: Live client-side fetch from `https://lichess.org/api/puzzle/daily`. No bulk database import; cached locally per calendar date in localStorage. Labeled in UI as "Puzzle from Lichess".
- **Chess.com PubAPI**: Live client-side fetch from `https://api.chess.com/pub/`. Imports individual standard chess games on demand into the study board with strict variant safety (refusing Chess960 and non-standard variants). Labeled in UI as "Data: Chess.com PubAPI".

## Khivin roadmap
Local interim: named original house persona with bounded search, not all-knowing or trained on books. Later separate adapters: Stockfish standard search; Fairy-Stockfish variant rules/search; optional Maia human-move model; vetted openings/game retrieval; tablebase probe with availability, legal-position, 50-move-rule and result interpretation checks. Seven-piece tables do not mean unrestricted perfect practical play in every variant or arbitrary position. Full tablebase storage/API permissions, network latency and failure behavior remain research.

Book-style profiles may encode original heuristics after they are tested, but this is not model training. Publicly readable chess books are not automatically licensed training corpora. Use licensed/public-domain editions with edition/jurisdiction checks; do not copy commentary or claim that heuristics reproduce a named author. Stronger-than-Stockfish is not an honest acceptance criterion here. Test legality, explainability, response time and calibrated human-practice behavior separately.
