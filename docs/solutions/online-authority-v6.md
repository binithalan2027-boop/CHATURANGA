# Online authority and honest identity

The old prototype's online and profile surfaces had client-authoritative relay, placeholder ratings/titles and auth-error guest fallback. Those dead components have been removed and all active entry points route to one authoritative service. Never restore an auth fallback that disguises an outage as an authenticated player.

Game clients send a move plus current room version. The server owns the board, turn, clocks, result and profile stats. Duplicate/stale moves cannot apply twice. Clock settlement commits even when an invalid move is rejected, so malformed attempts cannot freeze time. SQLite serializes the single process and persists state across restart. Reconnection gets the latest snapshot; client never treats its board as truth.

Token goes in Authorization headers or the initial WebSocket frame, never a query URL. Browser Origin is allowlisted for HTTP and WebSocket. Local identities are visibly marked and loopback-only. Production verifies Supabase tokens. WebSocket identity is revalidated at most every five minutes by disconnect/reconnect. This is a beta foundation, not production security certification.

Elo is context-relative. Stockfish's actual vendored UCI range is 1320-3190; asking it for 1 is false precision. Beginner values are assistance, labelled uncalibrated. Full strength is not a maximum FIDE number. Self-reported FIDE and provisional app Elo remain separate.
