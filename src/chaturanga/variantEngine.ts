import { Rules } from "chessops/types";
import { variantPosition, variantFen } from "./variantRules";
import { localVariantMove, assertLegalEngineMove } from "./variantSearch";
import { fairyBotMove } from "./fairyStockfish";

export interface VariantBotResult {
  best: string;
  engine: string;
}

const STRENGTH: Record<string, { depth: number; jitter: number }> = {
  casual: { depth: 1, jitter: 0.35 },
  club: { depth: 2, jitter: 0.1 },
  strong: { depth: 3, jitter: 0 },
};

export function variantStrengths() {
  return Object.keys(STRENGTH);
}

/**
 * Best available variant move on this device.
 * Uses Fairy-Stockfish WASM when the page is cross-origin isolated
 * (stronger); otherwise the built-in local search, which works everywhere.
 * Every engine reply is validated against chessops rules before use.
 */
export async function variantBotMove(
  rules: Rules,
  fen: string | undefined,
  strength: keyof typeof STRENGTH = "club",
  signal?: AbortSignal,
): Promise<VariantBotResult> {
  const level = STRENGTH[strength] ?? STRENGTH.club;
  const pos = variantPosition(rules, fen);
  const isolated =
    typeof globalThis.crossOriginIsolated !== "undefined" &&
    globalThis.crossOriginIsolated;
  if (isolated) {
    try {
      const r = await fairyBotMove(rules, fen ?? variantFen(pos), {
        depth: Math.max(6, level.depth * 3),
        signal,
      });
      return { best: assertLegalEngineMove(pos, r.best), engine: r.engine };
    } catch (e) {
      if (signal?.aborted) throw e;
      // fall through to local search
    }
  }
  if (signal?.aborted) throw new Error("Engine request cancelled.");
  const r = localVariantMove(pos, {
    depth: level.depth,
    jitter: level.jitter,
    seed: Date.now() % 9973,
  });
  return { best: assertLegalEngineMove(pos, r.best), engine: r.engine };
}
