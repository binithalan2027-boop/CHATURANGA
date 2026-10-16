import { Rules } from "chessops/types";
import { variantToken, parseBestMove } from "./fairyProtocol";

export const FAIRY_PATH = "/engines/fairy-stockfish/stockfish.js";

export interface FairyResult {
  best: string;
  engine: string;
}

/**
 * Ask Fairy-Stockfish (WASM, on-device) for a move in any supported variant.
 * One short-lived worker per request, same lifecycle as the classic adapter.
 */
export function fairyBotMove(
  rules: Rules,
  fen: string,
  {
    depth = 4,
    signal,
  }: { depth?: number; signal?: AbortSignal } = {},
): Promise<FairyResult> {
  const variant = variantToken(rules);
  return new Promise((resolve, reject) => {
    const worker = new Worker(FAIRY_PATH);
    let stage = "uci",
      done = false;
    const finish = (err?: Error, best?: string) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      worker.terminate();
      signal?.removeEventListener("abort", abort);
      if (err) reject(err);
      else resolve({ best: best!, engine: "Fairy-Stockfish 1.1.12 WASM" });
    };
    const abort = () => finish(new Error("Engine request cancelled."));
    const timer = setTimeout(
      () => finish(new Error("Variant engine timed out.")),
      30000,
    );
    signal?.addEventListener("abort", abort);
    worker.onerror = () =>
      finish(new Error("Variant engine failed to start (WASM)."));
    worker.onmessage = (e: MessageEvent<string>) => {
      const line = String(e.data ?? "");
      if (stage === "uci" && line === "uciok") {
        stage = "options";
        worker.postMessage(`setoption name UCI_Variant value ${variant}`);
        worker.postMessage("isready");
      } else if (stage === "options" && line === "readyok") {
        stage = "go";
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${depth}`);
      } else if (stage === "go") {
        const best = parseBestMove(line);
        if (best) finish(undefined, best);
        else if (line.startsWith("bestmove"))
          finish(new Error("Variant engine has no move here."));
      }
    };
    worker.postMessage("uci");
  });
}
