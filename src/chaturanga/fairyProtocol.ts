import { Rules } from "chessops/types";

/** chessops Rules id -> Fairy-Stockfish UCI_Variant token. */
export function variantToken(rules: Rules): string {
  const map: Partial<Record<Rules, string>> = {
    chess: "chess",
    crazyhouse: "crazyhouse",
    kingofthehill: "kingofthehill",
    "3check": "3check",
    antichess: "antichess",
    atomic: "atomic",
    horde: "horde",
    racingkings: "racingkings",
  };
  const token = map[rules];
  if (!token) throw new Error(`Fairy-Stockfish does not cover variant "${rules}".`);
  return token;
}

export function parseBestMove(text: string): string | null {
  if (!text.startsWith("bestmove ")) return null;
  const move = text.split(/\s+/)[1];
  return move && move !== "(none)" ? move : null;
}
