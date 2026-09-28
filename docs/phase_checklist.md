# Phase Checklist

- [x] **Phase 0 - Repository and Scope:** Inspect repo, create docs (architecture, rules, risk register, phase checklist, dev commands), basic web shell. Propose rules for variants.
- [ ] **Phase 1 - Shared Domain & Standard Chess:** Typed GameState, Ruleset, Command, Event. Pure reducer. chess.js wrapper for standard 8x8. Perft tests.
- [ ] **Phase 2 - Authoritative Real-Time Rooms:** Create/join rooms, lobby, typed WS messages, server validation, reconnect, rematch. Two simulated clients test.
- [ ] **Phase 3 - Fog of War:** Server-side visibility projection. PlayerView separation. Property tests for visibility leaks.
- [ ] **Phase 4 - Four-Player Mode:** 14x14 geometry, turn rotation, elimination, distinct geometry module.
- [ ] **Phase 5 - Power-Up Mode:** Typed effect system (Freeze, Teleport Pawn, Shield King), strict server validation.
- [ ] **Phase 6 - Web UX & Social:** Polished funky visual direction, accessible moves, room share, friend clubs.
- [ ] **Phase 7 - Harden & Handoff:** E2E tests, security audits, deployment docs.
