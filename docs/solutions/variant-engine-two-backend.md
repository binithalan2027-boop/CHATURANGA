---
area: engines
date: 2026-10-13
---

# Variant computer: two backends, rules-validated replies

Problem: the strong variant engine (Fairy-Stockfish WASM, all published builds
including lichess's stockfish-web and stockfish-mv.wasm) is compiled with WASM
threads and needs cross-origin isolation headers (COOP/COEP) on the deployed
site. Without them the worker starts but never answers - the failure mode is a
silent stall, not an exception.

Solution that ships everywhere: variantEngine tries Fairy-Stockfish only when
`globalThis.crossOriginIsolated` is true, otherwise it uses a built-in
alpha-beta search over chessops legal moves (variantSearch.ts) with per-variant
eval flavours. Every engine reply - WASM or local - is validated with
`pos.isLegal` before it is played, because an engine that answers an illegal
move in a variant (pockets, drops, explosions) would otherwise corrupt game
state.

Deploy note: to activate the strong path, the host must send
Cross-Origin-Embedder-Policy: require-corp and Cross-Origin-Opener-Policy:
same-origin. A `public/_headers` Netlify snippet is the place to add it when
Binit deploys. Google Fonts already sends CORP: cross-origin, so fonts survive
isolation.
