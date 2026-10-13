# Open-source / licence checklist (GPL consequence)

Binit chose GPL engines (2026-10-10, option A). Public release = publish Chaturanga source. Before release:
- [x] LICENSE file present (GPL-3.0) covering Chaturanga source (added v8)
- [x] NOTICE / third-party credits: Stockfish (GPL-3.0, stockfishchess.org), Fairy-Stockfish (GPL-3.0, fairy-stockfish.github.io), chessops (GPL-3.0, lichess-org), chess.js (BSD-2), React/Vite (MIT)
- [x] Engine WASM files vendored with their license texts in vendor/
- [x] Bot display names swapped to original house personas (Aarav/Tara/Kabir) in v8; Khivin unchanged
- [ ] Supabase keys NOT in the repo: current tree is env-based (clean), BUT public git history (commit 314da7e) still contains the project URL and a publishable key. Owner must rotate the key in the Supabase dashboard and/or scrub history before launch - repo is owner-managed, agent cannot push
- [x] README: what it is, how to run, licence summary (added v8)
- [x] Local-only dev scripts removed in v8 (fix*.cjs, refactorLanding.cjs, generate*.cjs, transformStockfish.cjs)

- [x] docs/SOURCE-OFFER.md written-offer text (added v8)
