/**
 * PGN export for finished standard and variant games, built from the
 * room's SAN move list. Fog of War is excluded by the caller: a fog
 * player only ever sees a filtered move list, so an exported record
 * could not faithfully describe the game.
 */

/** Map the room's human result text to a PGN result tag. Result text is
 * lowercase in the server ("white wins on time"), so match loosely. */
export function resultTag(result: string | null): string {
  const r = (result ?? "").trim().toLowerCase();
  if (r.startsWith("white")) return "1-0";
  if (r.startsWith("black")) return "0-1";
  if (r.startsWith("draw")) return "1/2-1/2";
  // Cancelled or abandoned games have no completed result.
  return "*";
}

const VARIANT_NAMES: Record<string, string> = {
  crazyhouse: "Crazyhouse",
  kingofthehill: "King of the Hill",
  "3check": "Three-check",
  antichess: "Antichess",
  atomic: "Atomic",
  horde: "Horde",
  racingkings: "Racing Kings",
};

export interface PgnGame {
  rule: string;
  whiteName: string;
  blackName: string | null;
  result: string | null;
  moves: string[];
  /** Initial clock per player in ms. */
  initialMs: number;
  /** Used for the Date header (last activity on the room). */
  activityAt: number;
}

function esc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function buildPgn(game: PgnGame): string {
  const tag = resultTag(game.result);
  const d = new Date(game.activityAt);
  const date = `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${String(d.getUTCDate()).padStart(2, "0")}`;
  const headers: string[] = [
    `[Event "Chaturanga friendly game"]`,
    `[Site "Chaturanga private room"]`,
    `[Date "${date}"]`,
    `[White "${esc(game.whiteName)}"]`,
    `[Black "${esc(game.blackName ?? "?")}"]`,
    `[Result "${tag}"]`,
    `[TimeControl "${Math.round(game.initialMs / 1000)}+0"]`,
  ];
  const variant = VARIANT_NAMES[game.rule];
  if (variant) headers.push(`[Variant "${variant}"]`);

  // Movetext: "1. e4 e5 2. Nf3 ..." wrapped at 80 columns, result last.
  const tokens: string[] = [];
  game.moves.forEach((san, i) => {
    if (i % 2 === 0) tokens.push(`${i / 2 + 1}.`);
    tokens.push(san);
  });
  tokens.push(tag);
  const lines: string[] = [];
  let line = "";
  for (const tok of tokens) {
    if (line && line.length + 1 + tok.length > 80) {
      lines.push(line);
      line = tok;
    } else {
      line = line ? `${line} ${tok}` : tok;
    }
  }
  if (line) lines.push(line);
  return `${headers.join("\n")}\n\n${lines.join("\n")}\n`;
}
