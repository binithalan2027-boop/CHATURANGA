import { Chess, Square } from "chess.js";

const VALUE: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};
const NAME: Record<string, string> = {
  p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
};

function play(fen: string, uci: string): Chess | null {
  const c = new Chess(fen);
  try {
    c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    return c;
  } catch {
    return null;
  }
}

/** Squares of `color` pieces that are attacked by the opponent and worth >= pawn. */
function hanging(c: Chess, color: "w" | "b"): { square: Square; piece: string }[] {
  const out: { square: Square; piece: string }[] = [];
  for (const row of c.board())
    for (const sq of row) {
      if (!sq || sq.color !== color || sq.type === "k") continue;
      if (c.isAttacked(sq.square, color === "w" ? "b" : "w"))
        out.push({ square: sq.square, piece: NAME[sq.type] });
    }
  return out.sort((a, b) => VALUE[b.piece[0]] - VALUE[a.piece[0]]);
}

/**
 * One plain-English sentence on why `played` is worse than `best`.
 * Deterministic, rules-based; no engine prose, no invented plans.
 */
export function explainMistake(
  fen: string,
  played: string,
  best: string,
): string {
  const before = new Chess(fen);
  if (before.isCheckmate() || before.isStalemate()) return "The game was already over here.";
  const me = before.turn();
  const afterPlayed = play(fen, played);
  const afterBest = play(fen, best);
  if (!afterPlayed || !afterBest) return "One of these moves is not legal here.";

  if (afterBest.isCheckmate()) return "This missed a checkmate on the board.";

  const bestMove = (() => {
    try {
      return before.move({ from: best.slice(0, 2), to: best.slice(2, 4), promotion: best[4] });
    } catch {
      return null;
    }
  })();

  const hangBefore = new Set(hanging(before, me).map((h) => h.square));
  const hangAfter = hanging(afterPlayed, me).filter((h) => !hangBefore.has(h.square));
  if (hangAfter.length && VALUE[hangAfter[0].piece[0]] >= 3)
    return `It leaves the ${hangAfter[0].piece} on ${hangAfter[0].square} attacked with no good answer - that's where the material goes.`;

  // opponent mate in 1 after played move?
  if (!afterPlayed.isCheckmate()) {
    const replies = afterPlayed.moves({ verbose: true });
    for (const r of replies) {
      const t = new Chess(afterPlayed.fen());
      t.move(r);
      if (t.isCheckmate())
        return "It allows a checkmate in one reply - that had to be stopped first.";
    }
  }

  if (bestMove?.captured && VALUE[bestMove.captured] >= 5)
    return `The better move took the ${NAME[bestMove.captured]} (${bestMove.san}). Winning that material was the point.`;

  const playedMove = (() => {
    try {
      return new Chess(fen).move({ from: played.slice(0, 2), to: played.slice(2, 4), promotion: played[4] });
    } catch {
      return null;
    }
  })();
  if (
    playedMove?.captured &&
    bestMove?.captured &&
    VALUE[bestMove.captured] > VALUE[playedMove.captured]
  )
    return `Both moves captured, but ${bestMove.san} took the more valuable ${NAME[bestMove.captured]}.`;

  if (hangAfter.length)
    return `It leaves the ${hangAfter[0].piece} on ${hangAfter[0].square} loose.`;

  return "It gives up ground without a concrete gain - the position, not a piece, gets worse here.";
}
