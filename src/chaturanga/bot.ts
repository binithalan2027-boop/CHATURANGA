import { Chess, Move } from "chess.js";
export const BOTS = [
  {
    id: "khivin",
    name: "Khivin",
    level: "House bot · local practice",
    description:
      "Your original house opponent. Bounded local search, not book-trained, master-strength or all-knowing.",
    depth: 3,
    noise: 5,
    accuracy: 0.94,
    capture: 1,
    center: 1.2,
  },
  {
    id: "aarav",
    name: "Magnus Carlsen",
    level: "Positional · approachable",
    description:
      "Unofficial name-inspired positional practice. Not the real player or a strength simulation.",
    depth: 1,
    noise: 160,
    accuracy: 0.65,
    capture: 1,
    center: 1,
  },
  {
    id: "tara",
    name: "Hikaru Nakamura",
    level: "Tactical · intermediate",
    description:
      "Unofficial name-inspired tactical practice. Not the real player or an endorsed bot.",
    depth: 2,
    noise: 45,
    accuracy: 0.82,
    capture: 1.3,
    center: 1.3,
  },
  {
    id: "kabir",
    name: "Viswanathan Anand",
    level: "Balanced · challenging",
    description:
      "Unofficial name-inspired balanced practice. Not the real player or an endorsed bot.",
    depth: 3,
    noise: 5,
    accuracy: 0.94,
    capture: 0.9,
    center: 1,
  },
] as const;
export type BotId = (typeof BOTS)[number]["id"];
const value: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};
function evaluate(c: Chess, positionalWeight = 1): number {
  let score = 0;
  for (const p of c.board().flat()) {
    if (!p) continue;
    const file = p.square.charCodeAt(0) - 97,
      rank = Number(p.square[1]);
    const center = 3.5 - Math.abs(file - 3.5) + 3.5 - Math.abs(rank - 4.5);
    const positional =
      p.type === "p"
        ? (p.color === "w" ? rank - 2 : 7 - rank) * 5
        : p.type === "k"
          ? 0
          : center * 4;
    score +=
      (p.color === "w" ? 1 : -1) *
      (value[p.type] + positional * positionalWeight);
  }
  return score;
}
export function chooseBotMove(
  fen: string,
  id: BotId,
  allowed?: string[],
  maxNodes = 15000,
): string {
  const c = new Chess(fen),
    bot = BOTS.find((b) => b.id === id) || BOTS[0],
    actor = c.turn();
  let nodes = 0;
  const search = (depth: number, alpha: number, beta: number): number => {
    nodes++;
    if (c.isCheckmate())
      return c.turn() === "w" ? -100000 - depth : 100000 + depth;
    if (c.isStalemate() || c.isInsufficientMaterial()) return 0;
    if (depth <= 0 || nodes >= maxNodes) return evaluate(c, bot.center);
    const maximize = c.turn() === "w";
    let best = maximize ? -Infinity : Infinity;
    const moves = c
      .moves({ verbose: true })
      .sort((a, b) => value[b.captured || "k"] - value[a.captured || "k"]);
    for (const m of moves) {
      c.move(m);
      const score = search(depth - 1, alpha, beta);
      c.undo();
      best = maximize ? Math.max(best, score) : Math.min(best, score);
      if (maximize) alpha = Math.max(alpha, best);
      else beta = Math.min(beta, best);
      if (beta <= alpha || nodes >= maxNodes) break;
    }
    return best;
  };
  const encode = (m: Move) => m.from + m.to + (m.promotion || "");
  const moves = c
    .moves({ verbose: true })
    .filter((m) => !allowed || allowed.includes(encode(m)));
  let best = -Infinity,
    result = "";
  for (const m of moves) {
    c.move(m);
    const score =
      search(bot.depth - 1, -Infinity, Infinity) * (actor === "w" ? 1 : -1) +
      Math.random() * bot.noise +
      value[m.captured || "k"] * (bot.capture - 1) * 0.1;
    c.undo();
    if (score > best) {
      best = score;
      result = encode(m);
    }
  }
  return result;
}
