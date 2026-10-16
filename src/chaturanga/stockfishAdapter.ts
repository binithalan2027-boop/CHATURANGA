import { strengthOptions } from "./engineStrength";
import { Chess } from "chess.js";
import { EngineInfo, parseEngineInfo } from "./stockfishProtocol";
export const STOCKFISH_PATH =
  "/engines/stockfish-19-lite/stockfish-19-lite-single.js";
export interface EngineResult extends EngineInfo {
  best: string;
  engine: string;
}
export function stockfishAnalyze(
  fen: string,
  {
    depth = 10,
    elo,
    signal,
    onInfo,
  }: {
    depth?: number;
    elo?: number | null;
    signal?: AbortSignal;
    onInfo?: (info: EngineInfo) => void;
  } = {},
): Promise<EngineResult> {
  new Chess(fen);
  return new Promise((resolve, reject) => {
    const worker = new Worker(STOCKFISH_PATH);
    let latest: EngineInfo = { pv: [] },
      done = false;
    const finish = (err?: Error, best?: string) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      worker.terminate();
      signal?.removeEventListener("abort", abort);
      if (err) reject(err);
      else
        resolve({
          ...latest,
          best: best!,
          engine: "Stockfish 19 lite, single-thread WASM",
        });
    };
    const abort = () => finish(new Error("Engine request cancelled."));
    const timer = setTimeout(
      () => finish(new Error("Stockfish did not finish within 15 seconds.")),
      15000,
    );
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) {
      abort();
      return;
    }
    worker.onerror = () => finish(new Error("Stockfish WASM could not load."));
    worker.onmessage = (e) => {
      const text = String(e.data);
      if (text.includes("uciok")) {
        worker.postMessage("setoption name Hash value 16");
        if (elo !== undefined) {
          try {
            strengthOptions(elo).forEach((cmd) => worker.postMessage(cmd));
          } catch (e) {
            finish(e instanceof Error ? e : Error(String(e)));
            return;
          }
        }
        worker.postMessage("isready");
      }
      if (text.includes("readyok")) {
        worker.postMessage("position fen " + fen);
        worker.postMessage("go depth " + Math.max(1, Math.min(16, depth)));
      }
      const info = parseEngineInfo(text);
      if (info) {
        latest = info;
        onInfo?.(info);
      }
      if (text.startsWith("bestmove")) {
        const best = text.split(/\s+/)[1];
        if (!best || best === "(none)")
          finish(
            new Error("No engine move is available in this terminal position."),
          );
        else {
          try {
            new Chess(fen).move({
              from: best.slice(0, 2),
              to: best.slice(2, 4),
              promotion: best[4],
            });
            finish(undefined, best);
          } catch {
            finish(new Error("Engine returned an illegal move."));
          }
        }
      }
    };
    worker.postMessage("uci");
  });
}
