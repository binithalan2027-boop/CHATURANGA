# Open-source / licence checklist (GPL consequence)

Binit chose GPL engines (2026-10-10, option A). Public release = publish Chaturanga source. Before release:
- [ ] LICENSE file present (GPL-3.0) covering Chaturanga source
- [ ] NOTICE / third-party credits: Stockfish (GPL-3.0, stockfishchess.org), Fairy-Stockfish (GPL-3.0, fairy-stockfish.github.io), chessops (GPL-3.0, lichess-org), chess.js (BSD-2), React/Vite (MIT)
- [ ] Engine WASM files vendored with their license texts in vendor/
- [ ] Bot display names Magnus/Hikaru/Vishy are placeholders Binit said he will manage - swap before public launch (likeness/trademark risk)
- [ ] Supabase keys NOT in the repo (the pre-v4 history embedded keys - scrub before making public)
- [ ] README: what it is, how to run, licence summary
- [ ] Remove local-only dev scripts (fix*.cjs, refactorLanding.cjs, generateModes.cjs etc.) from the published tree
