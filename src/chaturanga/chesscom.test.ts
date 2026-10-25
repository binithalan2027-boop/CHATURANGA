import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateGameForImport,
  formatArchiveLabel,
  fetchChessComProfile,
  fetchChessComArchives,
  _resetRateLimits,
} from "./chesscom";
import { parsePgn } from "./study";

// Fixture 1: Standard Chess Game from Chess.com
export const STANDARD_CHESSCOM_PGN = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2026.02.15"]
[White "hikaru"]
[Black "magnuscarlsen"]
[Result "1-0"]
[ECO "C50"]
[WhiteElo "2820"]
[BlackElo "2830"]
[TimeControl "180+2"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 1-0`;

// Fixture 2: Chess960 Game from Chess.com
export const CHESS960_CHESSCOM_PGN = `[Event "Live Chess 960"]
[Site "Chess.com"]
[Date "2026.02.10"]
[White "hikaru"]
[Black "wesleyso"]
[Result "0-1"]
[Variant "Chess960"]
[SetUp "1"]
[FEN "bbqnnrkr/pppppppp/8/8/8/8/PPPPPPPP/BBQNNRKR w HFhf - 0 1"]
[TimeControl "300"]

1. c4 c5 2. e4 e5 0-1`;

// Fixture 3: Crazyhouse Variant Game from Chess.com
export const CRAZYHOUSE_CHESSCOM_PGN = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2026.01.20"]
[White "playerA"]
[Black "playerB"]
[Result "1-0"]
[Variant "Crazyhouse"]
[TimeControl "180"]

1. e4 e5 2. Nf3 Nc6 1-0`;

describe("Chess.com Variant Safety & Validation", () => {
  it("approves standard chess game and allows it to load in study parser", () => {
    const val = validateGameForImport(STANDARD_CHESSCOM_PGN, "chess");
    expect(val.ok).toBe(true);

    // Assert that parsePgn parses it accurately
    const line = parsePgn(STANDARD_CHESSCOM_PGN);
    expect(line.sans.length).toBe(10);
    expect(line.headers.White).toBe("hikaru");
    expect(line.headers.Black).toBe("magnuscarlsen");
  });

  it("detects and refuses Chess960 game with friendly message", () => {
    const val = validateGameForImport(CHESS960_CHESSCOM_PGN, "chess960");
    expect(val.ok).toBe(false);
    if (!val.ok) {
      expect(val.error).toMatch(/variant .* can't be imported yet/i);
    }

    // Refuses even if rules parameter omitted because of PGN header
    const valHeaderOnly = validateGameForImport(CHESS960_CHESSCOM_PGN);
    expect(valHeaderOnly.ok).toBe(false);
    if (!valHeaderOnly.ok) {
      expect(valHeaderOnly.error).toMatch(/variant .* can't be imported yet/i);
    }
  });

  it("detects and refuses Crazyhouse variant game with friendly message", () => {
    const val = validateGameForImport(CRAZYHOUSE_CHESSCOM_PGN);
    expect(val.ok).toBe(false);
    if (!val.ok) {
      expect(val.error).toMatch(/Crazyhouse.*can't be imported yet/i);
    }
  });

  it("rejects oversized PGN games over 1 MB limit", () => {
    const hugePgn = STANDARD_CHESSCOM_PGN + " ".repeat(1000001);
    const val = validateGameForImport(hugePgn);
    expect(val.ok).toBe(false);
    if (!val.ok) {
      expect(val.error).toContain("PGN is too large");
    }
  });

  it("formats monthly archive URLs into friendly display labels", () => {
    const res = formatArchiveLabel("https://api.chess.com/pub/player/hikaru/games/2026/02");
    expect(res.label).toBe("February 2026");
    expect(res.year).toBe("2026");
    expect(res.month).toBe("02");
  });
});

describe("Chess.com API Error Handling", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    _resetRateLimits();
  });

  it("returns a friendly player-not-found message on HTTP 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 404,
      ok: false,
    } as Response);

    const result = await fetchChessComProfile("nonexistentuser9999");
    expect(result.profile).toBeNull();
    expect(result.error).toMatch(/Player "nonexistentuser9999" not found on Chess\.com/i);
  });

  it("returns a backoff message on HTTP 429 rate limit", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      status: 429,
      ok: false,
    } as Response);

    const result = await fetchChessComArchives("hikaru");
    expect(result.archives).toHaveLength(0);
    expect(result.error).toContain("429");
  });

  it("handles offline network failure with friendly plain-language error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network failed"));

    const result = await fetchChessComProfile("hikaru");
    expect(result.profile).toBeNull();
    expect(result.error).toMatch(/connection/i);
  });
});
