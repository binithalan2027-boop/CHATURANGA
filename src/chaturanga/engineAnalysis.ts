import { stockfishAnalyze } from "./stockfishAdapter";
export interface EngineScore {
  cp: number;
  best: string;
}
export async function analyzePosition(
  fen: string,
  signal?: AbortSignal,
): Promise<EngineScore> {
  const result = await stockfishAnalyze(fen, { depth: 8, signal });
  if (result.cp === undefined || result.mate !== undefined)
    throw Error("Mate positions are skipped.");
  return { cp: result.cp, best: result.best };
}
