import { Chess } from "chess.js";
import { EngineScore } from "./engineAnalysis";
export interface MistakePuzzle {
  fen: string;
  played: string;
  best: string;
  loss: number;
  ply: number;
}
export function detectMistake(
  fen: string,
  played: string,
  before: EngineScore,
  after: EngineScore,
  ply: number,
): MistakePuzzle | null {
  const loss = before.cp + after.cp;
  const c = new Chess(fen);
  try {
    c.move({
      from: before.best.slice(0, 2),
      to: before.best.slice(2, 4),
      promotion: before.best[4],
    });
  } catch {
    return null;
  }
  if (loss < 150) return null;
  return { fen, played, best: before.best, loss, ply };
}
