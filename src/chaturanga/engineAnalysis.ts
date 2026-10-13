export interface EngineScore {
  cp: number;
  best: string;
}
export function analyzePosition(
  fen: string,
  signal?: AbortSignal,
): Promise<EngineScore> {
  return new Promise((resolve, reject) => {
    const w = new Worker("/stockfish.js");
    let cp: number | null = null;
    const done = (err?: Error, result?: EngineScore) => {
      clearTimeout(timer);
      w.terminate();
      signal?.removeEventListener("abort", abort);
      if (err) reject(err);
      else resolve(result!);
    };
    const abort = () => done(new Error("Scan cancelled."));
    const timer = setTimeout(
      () => done(new Error("Engine timed out. No puzzle generated.")),
      12000,
    );
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) {
      abort();
      return;
    }
    w.onerror = () => done(new Error("Engine failed."));
    w.onmessage = (e) => {
      const text = String(e.data);
      if (text.includes("uciok")) {
        w.postMessage("position fen " + fen);
        w.postMessage("go depth 8");
      }
      const score = text.match(/score cp (-?\d+)/);
      if (score) cp = Number(score[1]);
      if (text.startsWith("bestmove")) {
        const best = text.split(" ")[1];
        if (cp === null || !best || best === "(none)")
          done(
            new Error(
              "No centipawn score for this position. Mate positions are skipped.",
            ),
          );
        else done(undefined, { cp, best });
      }
    };
    w.postMessage("uci");
  });
}
