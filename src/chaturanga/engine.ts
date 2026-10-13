import type { BotId } from "./bot";
import { Chess, Color, Square, PieceSymbol } from "chess.js";
import {
  Difficulty,
  Question,
  DuelScore,
  questions,
  random,
  parseAnswer,
  duelWinner,
} from "./math";
export type Power =
  "freeze" | "poison" | "add" | "cut" | "double" | "promote" | "rewind";
export const POWERS: Record<
  Power,
  { name: string; flavour: string; text: string }
> = {
  freeze: {
    name: "Freeze",
    flavour: "Sheetal",
    text: "One enemy piece cannot move next turn. It still attacks.",
  },
  poison: {
    name: "Poison Bed",
    flavour: "Vish Field",
    text: "Empty square, ranks 2–7. Enemy landing costs 8 seconds. Lasts two enemy turns.",
  },
  add: {
    name: "Added Time",
    flavour: "Samay Plus",
    text: "Add 20 seconds, capped at twice starting time.",
  },
  cut: {
    name: "Reduce Time",
    flavour: "Samay Cut",
    text: "Remove up to 10 enemy seconds, never below 5.",
  },
  double: {
    name: "Double Move",
    flavour: "Two steps",
    text: "Two legal moves. First-move check ends the turn. One increment.",
  },
  promote: {
    name: "Promote Pawn",
    flavour: "Unnati",
    text: "Upgrade your pawn on rank 7 (White) or 2 (Black), instead of moving.",
  },
  rewind: {
    name: "Rewind",
    flavour: "Punarchal",
    text: "Undo your previous turn and their reply. No time or spell refunds. Cannot cross a duel.",
  },
};
export interface Settings {
  mode: "mind" | "mantra" | "classic";
  opponent?: "local" | BotId;
  difficulty: Difficulty;
  initialMs: number;
  incrementMs: number;
  untimed: boolean;
  seed: number;
}
interface Effect {
  kind: "freeze" | "poison";
  owner: Color;
  square: Square;
  pieceId?: string;
  turns: number;
}
interface Snapshot {
  fen: string;
  ids: Record<string, string>;
  effects: Effect[];
  actor: Color;
  barrier: number;
  keys: string[];
  halfmoves: number;
}
export interface GameEvent {
  seq: number;
  at: number;
  type: string;
  text: string;
  fen: string;
  branch: number;
}
interface Duel {
  actor: Color;
  set: Question[];
  index: number;
  correct: number;
  start: number;
  deadline: number;
  scores: Partial<Record<Color, DuelScore>>;
  winner: Color | null;
  options: Power[];
}
export interface State {
  schemaVersion: 1;
  settings: Settings;
  fen: string;
  ids: Record<string, string>;
  phase:
    | "math"
    | "play"
    | "handoff"
    | "countdown"
    | "duel"
    | "reward"
    | "resume"
    | "finished";
  gate: Question;
  clocks: Record<Color, number>;
  lastAt: number;
  activeMs: number;
  deadline: number;
  inventory: Record<Color, Power[]>;
  cooldown: Record<Color, number>;
  effects: Effect[];
  cast: boolean;
  double: boolean;
  submove: number;
  history: Snapshot[];
  turnStart: Snapshot;
  keys: string[];
  halfmoves: number;
  events: GameEvent[];
  branch: number;
  barrier: number;
  turn: number;
  duel: Duel | null;
  result: string | null;
  notice: string;
  lastMove: { from: string; to: string } | null;
  seen: string[];
}
export type Command =
  | { type: "answer"; token: number; answer: string; skip?: boolean }
  | { type: "move"; from: Square; to: Square; promotion?: PieceSymbol }
  | { type: "cast"; power: Power; target?: Square; promotion?: PieceSymbol }
  | { type: "ready" }
  | { type: "reward"; power: Power; replace?: Power }
  | { type: "endTurn" }
  | { type: "resign"; actor?: Color }
  | { type: "agreeDraw" }
  | { type: "claimDraw" };
const other = (c: Color): Color => (c === "w" ? "b" : "w");
export const sideName = (c: Color) => (c === "w" ? "White" : "Black");
function setTurn(fen: string, color: Color, ep?: string): string {
  const parts = fen.split(" ");
  parts[1] = color;
  if (ep !== undefined) parts[3] = ep;
  return parts.join(" ");
}
function copy<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}
function snapshot(s: State): Snapshot {
  return {
    fen: s.fen,
    ids: copy(s.ids),
    effects: copy(s.effects),
    actor: new Chess(s.fen).turn(),
    barrier: s.barrier,
    keys: [...s.keys],
    halfmoves: s.halfmoves,
  };
}
function event(s: State, now: number, type: string, text: string) {
  s.events.push({
    seq: s.events.length + 1,
    at: now,
    type,
    text,
    fen: s.fen,
    branch: s.branch,
  });
  s.notice = text;
}
function finish(s: State, now: number, result: string) {
  s.result = result;
  s.phase = "finished";
  event(s, now, "result", result);
}
function bareKings(s: State) {
  return (
    Object.values(new Chess(s.fen).board().flat()).filter(Boolean).length === 2
  );
}
function flag(s: State, now: number, actor: Color) {
  const c = new Chess(s.fen);
  // Explicit local timeout policy: bare kings, or lone king vs king with a single bishop/knight, draw. Other positions lose on time.
  const pieces = c
    .board()
    .flat()
    .filter((p) => p?.color === other(actor));
  const cannotMate =
    s.settings.mode !== "mantra" &&
    (pieces.length === 1 ||
      (pieces.length === 2 &&
        pieces.some((p) => p?.type === "b" || p?.type === "n") &&
        c.board().flat().filter(Boolean).length === 3));
  finish(
    s,
    now,
    bareKings(s) || cannotMate
      ? "Draw on time: no mating material under the local policy."
      : `${sideName(other(actor))} wins on time.`,
  );
}
export function newGame(settings: Settings, now: number): State {
  const chess = new Chess(),
    ids: Record<string, string> = {};
  chess
    .board()
    .flat()
    .forEach((p) => {
      if (p) ids[p.square] = `${p.color}${p.type}-${p.square}`;
    });
  const base = {
    fen: chess.fen(),
    ids,
    effects: [],
    actor: "w" as Color,
    barrier: 0,
    keys: [],
    halfmoves: 0,
  };
  const s: State = {
    schemaVersion: 1,
    settings,
    fen: chess.fen(),
    ids,
    phase: settings.mode === "mind" ? "math" : "play",
    gate: questions(settings.seed, settings.difficulty, 1)[0],
    clocks: { w: settings.initialMs, b: settings.initialMs },
    lastAt: now,
    activeMs: 0,
    deadline: 0,
    inventory: { w: [], b: [] },
    cooldown: { w: 0, b: 0 },
    effects: [],
    cast: false,
    double: false,
    submove: 0,
    history: [],
    turnStart: base,
    keys: [],
    halfmoves: 0,
    events: [],
    branch: 0,
    barrier: 0,
    turn: 0,
    duel: null,
    result: null,
    notice:
      settings.mode === "mind"
        ? "Solve to unlock White’s first move."
        : "Sequential local demo. Maths sets are separate, not simultaneous.",
    lastMove: null,
    seen: [],
  };
  s.keys = [key(s)];
  s.turnStart = snapshot(s);
  return s;
}
function key(s: State) {
  return JSON.stringify([
    s.fen.split(" ").slice(0, 4),
    s.effects,
    s.settings.mode === "mantra" ? s.inventory : null,
    s.settings.mode === "mantra" ? s.cooldown : null,
  ]);
}
function legal(s: State, fen = s.fen) {
  const c = new Chess(fen),
    actor = c.turn();
  const frozen = new Set(
    s.effects
      .filter((e) => e.kind === "freeze" && e.owner !== actor)
      .map((e) => e.pieceId),
  );
  return c
    .moves({ verbose: true })
    .filter(
      (m) =>
        !frozen.has(s.ids[m.from]) &&
        !(
          m.flags.includes("k") &&
          frozen.has(s.ids[actor === "w" ? "h1" : "h8"])
        ) &&
        !(
          m.flags.includes("q") &&
          frozen.has(s.ids[actor === "w" ? "a1" : "a8"])
        ),
    );
}
export function legalMoves(s: State, from?: Square) {
  if (s.phase !== "play") return [];
  return legal(s).filter((m) => !from || m.from === from);
}
function dissipate(s: State, now: number) {
  if (!legal(s).length && new Chess(s.fen).moves().length) {
    const actor = new Chess(s.fen).turn();
    s.effects = s.effects.filter(
      (e) => e.kind !== "freeze" || e.owner === actor,
    );
    event(s, now, "fade", "Freeze faded: it cannot remove every legal reply.");
  }
}
function terminal(s: State, now: number): boolean {
  const c = new Chess(s.fen);
  if (c.isCheckmate())
    finish(s, now, `${sideName(other(c.turn()))} wins by checkmate.`);
  else if (c.isStalemate()) finish(s, now, "Draw by stalemate.");
  else if (
    (s.settings.mode !== "mantra" && c.isInsufficientMaterial()) ||
    bareKings(s)
  )
    finish(s, now, "Draw by dead position.");
  else if (s.halfmoves >= 150) finish(s, now, "Draw by the 75-move rule.");
  else if (s.keys.filter((k) => k === key(s)).length >= 5)
    finish(s, now, "Draw by fivefold repetition.");
  return s.phase === "finished";
}
function completeTurn(s: State, now: number, actor: Color) {
  s.effects = s.effects
    .map((e) => ({ ...e, turns: e.turns - (e.owner !== actor ? 1 : 0) }))
    .filter(
      (e) =>
        e.turns > 0 &&
        (e.kind !== "freeze" || Object.values(s.ids).includes(e.pieceId!)),
    );
  s.history.push(s.turnStart);
  if (s.cast) s.cooldown[actor] = 2;
  else s.cooldown[actor] = Math.max(0, s.cooldown[actor] - 1);
  s.cast = false;
  s.double = false;
  s.submove = 0;
  s.turn++;
  dissipate(s, now);
  s.keys.push(key(s));
  if (terminal(s, now)) return;
  if (!s.settings.untimed) s.clocks[actor] += s.settings.incrementMs;
  s.phase = s.settings.mode === "mind" ? "math" : "play";
  s.gate = questions(
    s.settings.seed + s.turn * 977 + s.events.length * 31,
    s.settings.difficulty,
    1,
  )[0];
  s.turnStart = snapshot(s);
}
function beginDuel(s: State, now: number) {
  s.barrier++;
  s.phase = "handoff";
  s.activeMs = 0;
  s.duel = {
    actor: "w",
    set: questions(s.settings.seed + s.barrier * 521, s.settings.difficulty),
    index: 0,
    correct: 0,
    start: 0,
    deadline: 0,
    scores: {},
    winner: null,
    options: [],
  };
  event(
    s,
    now,
    "duel",
    "Maths break. Pass the device to White. Chess clocks are paused.",
  );
}
function scoreDuel(s: State, now: number) {
  const d = s.duel!;
  d.scores[d.actor] = {
    correct: d.correct,
    wrong: 5 - d.correct,
    completed: d.index === 5,
    elapsed: Math.min(20000, now - d.start),
  };
  if (d.actor === "w") {
    d.actor = "b";
    d.index = 0;
    d.correct = 0;
    d.set = questions(
      s.settings.seed + s.barrier * 521 + 10000,
      s.settings.difficulty,
    );
    s.phase = "handoff";
    event(
      s,
      now,
      "handoff",
      "White’s set is complete. Pass the device to Black.",
    );
    return;
  }
  d.winner = duelWinner(d.scores.w!, d.scores.b!);
  const message = `Sequential demo result: White ${d.scores.w!.correct}/5, Black ${d.scores.b!.correct}/5. `;
  if (!d.winner) {
    s.phase = "resume";
    s.deadline = now + 2000;
    event(s, now, "tie", message + "Tie. No reward.");
  } else {
    const rng = random(s.settings.seed + s.barrier * 711);
    const pool = (Object.keys(POWERS) as Power[]).filter(
      (p) => !s.inventory[d.winner!].includes(p),
    );
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    d.options = pool.slice(0, 3);
    s.phase = "reward";
    s.deadline = now + 8000;
    event(
      s,
      now,
      "score",
      message + `${sideName(d.winner)} wins. Choose one power.`,
    );
  }
}
function award(s: State, now: number, p: Power, replace?: Power) {
  const d = s.duel!;
  if (!d.winner || !d.options.includes(p))
    throw new Error("Choose one of the offered powers.");
  const inv = s.inventory[d.winner];
  if (inv.length === 3) {
    const index = replace ? inv.indexOf(replace) : 0;
    if (index < 0) throw new Error("Choose a held power to replace.");
    inv.splice(index, 1);
  }
  inv.push(p);
  s.phase = "resume";
  s.deadline = now + 2000;
  event(
    s,
    now,
    "reward",
    `${sideName(d.winner)} earned ${POWERS[p].name}. Resume in 2 seconds.`,
  );
  s.keys.push(key(s));
}
export function tick(original: State, now: number): State {
  const s = copy(original);
  if (s.phase === "finished" || now <= s.lastAt) return s;
  // Advance across deadlines in timestamp order, so background-tab throttling does not refund time.
  while (s.lastAt < now && !s.result) {
    if (s.phase === "math" || s.phase === "play") {
      const actor = new Chess(s.fen).turn(),
        due = s.settings.mode === "mantra" ? 90000 - s.activeMs : Infinity;
      const flagIn = s.settings.untimed ? Infinity : s.clocks[actor];
      const elapsed = Math.min(now - s.lastAt, due, flagIn);
      if (!s.settings.untimed) s.clocks[actor] -= elapsed;
      if (s.settings.mode === "mantra") s.activeMs += elapsed;
      s.lastAt += elapsed;
      if (!s.settings.untimed && s.clocks[actor] <= 0) flag(s, s.lastAt, actor);
      else if (s.settings.mode === "mantra" && s.activeMs >= 90000)
        beginDuel(s, s.lastAt);
    } else if (s.phase === "handoff") {
      s.lastAt = now;
    } else {
      const end = s.phase === "duel" ? s.duel!.deadline : s.deadline;
      s.lastAt = Math.min(now, end);
      if (s.lastAt < end) break;
      if (s.phase === "countdown") {
        s.phase = "duel";
        s.duel!.start = end;
        s.duel!.deadline = end + 20000;
      } else if (s.phase === "duel") scoreDuel(s, end);
      else if (s.phase === "reward") award(s, end, s.duel!.options[0]);
      else if (s.phase === "resume") {
        s.phase = "play";
        event(
          s,
          end,
          "resume",
          `${sideName(new Chess(s.fen).turn())} to move.`,
        );
      }
    }
  }
  return s;
}
export function targets(s: State, power: Power): Square[] {
  const c = new Chess(s.fen),
    actor = c.turn(),
    out: Square[] = [];
  for (const file of "abcdefgh")
    for (let rank = 1; rank <= 8; rank++) {
      const sq = `${file}${rank}` as Square,
        p = c.get(sq);
      if (
        power === "poison" &&
        !p &&
        rank !== 1 &&
        rank !== 8 &&
        !s.effects.some((e) => e.square === sq && e.kind === "poison")
      )
        out.push(sq);
      if (
        power === "promote" &&
        p?.color === actor &&
        p.type === "p" &&
        rank === (actor === "w" ? 7 : 2)
      )
        out.push(sq);
      if (power === "freeze" && p?.color === other(actor) && p.type !== "k") {
        const test = copy(s);
        test.effects.push({
          kind: "freeze",
          owner: actor,
          square: sq,
          pieceId: s.ids[sq],
          turns: 1,
        });
        if (legal(test, setTurn(s.fen, other(actor), "-")).length) out.push(sq);
      }
    }
  return out;
}
function cast(s: State, now: number, cmd: Extract<Command, { type: "cast" }>) {
  const c = new Chess(s.fen),
    actor = c.turn(),
    enemy = other(actor),
    p = cmd.power;
  if (
    s.settings.mode !== "mantra" ||
    s.phase !== "play" ||
    s.cast ||
    s.submove ||
    s.cooldown[actor]
  )
    throw new Error(
      "Power unavailable: cast only before moving, then wait two of your turns.",
    );
  if (!s.inventory[actor].includes(p))
    throw new Error("You do not hold this power.");
  if (
    ["freeze", "poison", "promote"].includes(p) &&
    (!cmd.target || !targets(s, p).includes(cmd.target))
  )
    throw new Error("No eligible target.");
  if (p === "add" && s.clocks[actor] >= s.settings.initialMs * 2)
    throw new Error("Already at the time cap.");
  if (p === "cut" && s.clocks[enemy] <= 5000)
    throw new Error("Opponent already has 5 seconds or less.");
  if (p === "rewind") {
    const snaps = s.history,
      snap = snaps[snaps.length - 2];
    if (!snap || snap.actor !== actor || snap.barrier !== s.barrier)
      throw new Error(
        "A rewind needs your previous turn and their reply, without a maths duel.",
      );
    s.fen = snap.fen;
    s.ids = copy(snap.ids);
    s.effects = copy(snap.effects);
    s.keys = [...snap.keys];
    s.halfmoves = snap.halfmoves;
    s.history = snaps.slice(0, -2);
    s.branch++;
    s.turnStart = snapshot(s);
    s.lastMove = null;
  }
  if (p === "promote") {
    const target = cmd.target!,
      promotion = cmd.promotion || "q";
    if (!["q", "r", "b", "n"].includes(promotion))
      throw new Error("Choose queen, rook, bishop or knight.");
    c.remove(target);
    c.put({ type: promotion, color: actor }, target);
    if (c.isCheck()) throw new Error("Your king would be in check.");
    s.fen = setTurn(c.fen(), enemy, "-");
  }
  if (p === "freeze")
    s.effects.push({
      kind: "freeze",
      owner: actor,
      square: cmd.target!,
      pieceId: s.ids[cmd.target!],
      turns: 1,
    });
  if (p === "poison")
    s.effects.push({
      kind: "poison",
      owner: actor,
      square: cmd.target!,
      turns: 2,
    });
  if (p === "add")
    s.clocks[actor] = Math.min(
      s.settings.initialMs * 2,
      s.clocks[actor] + 20000,
    );
  if (p === "cut") s.clocks[enemy] = Math.max(5000, s.clocks[enemy] - 10000);
  if (p === "double") s.double = true;
  s.inventory[actor].splice(s.inventory[actor].indexOf(p), 1);
  s.cast = true;
  s.halfmoves = 0;
  event(
    s,
    now,
    "cast",
    `${sideName(actor)} cast ${POWERS[p].name}${cmd.target ? ` on ${cmd.target}` : ""}.`,
  );
  s.keys.push(key(s));
  if (p === "promote") completeTurn(s, now, actor);
}
function move(s: State, now: number, cmd: Extract<Command, { type: "move" }>) {
  if (s.phase !== "play")
    throw new Error("Solve the question first, or wait for chess to resume.");
  const c = new Chess(s.fen),
    actor = c.turn();
  const valid = legal(s).find(
    (m) =>
      m.from === cmd.from &&
      m.to === cmd.to &&
      (!m.promotion || m.promotion === (cmd.promotion || "q")),
  );
  if (!valid)
    throw new Error("That move is not legal, or the piece is frozen.");
  const m = c.move({
    from: cmd.from,
    to: cmd.to,
    promotion: cmd.promotion || "q",
  });
  const pieceId = s.ids[cmd.from];
  delete s.ids[cmd.from];
  delete s.ids[cmd.to];
  s.ids[cmd.to] = pieceId;
  if (m.flags.includes("e")) delete s.ids[`${cmd.to[0]}${cmd.from[1]}`];
  if (m.flags.includes("k") || m.flags.includes("q")) {
    const rank = actor === "w" ? "1" : "8",
      from = (m.flags.includes("k") ? "h" : "a") + rank,
      to = (m.flags.includes("k") ? "f" : "d") + rank;
    s.ids[to] = s.ids[from];
    delete s.ids[from];
  }
  s.effects = s.effects.filter(
    (e) => e.kind !== "freeze" || Object.values(s.ids).includes(e.pieceId!),
  );
  s.effects.forEach((e) => {
    if (e.kind === "freeze")
      e.square = Object.keys(s.ids).find(
        (sq) => s.ids[sq] === e.pieceId,
      ) as Square;
  });
  const poison = s.effects.find(
    (e) =>
      e.kind === "poison" &&
      e.owner !== actor &&
      e.square === cmd.to &&
      m.piece !== "k",
  );
  if (poison) {
    s.clocks[actor] = Math.max(0, s.clocks[actor] - 8000);
    s.effects = s.effects.filter((e) => e !== poison);
    event(
      s,
      now,
      "poison",
      `${sideName(actor)} landed on Poison Bed: −8 seconds.`,
    );
  }
  s.fen = c.fen();
  s.halfmoves = m.piece === "p" || m.captured ? 0 : s.halfmoves + 1;
  s.lastMove = { from: cmd.from, to: cmd.to };
  event(
    s,
    now,
    "move",
    `${sideName(actor)}: ${m.san}${s.double ? ` (step ${s.submove + 1})` : ""}`,
  );
  if (!s.settings.untimed && s.clocks[actor] <= 0) {
    flag(s, now, actor);
    return;
  }
  if (
    s.double &&
    s.submove === 0 &&
    !c.isCheck() &&
    !c.isStalemate() &&
    !bareKings(s) &&
    !(s.settings.mode !== "mantra" && c.isInsufficientMaterial())
  ) {
    const ownFen = setTurn(c.fen(), actor, "-");
    if (legal(s, ownFen).length) {
      s.fen = ownFen;
      s.submove = 1;
      return;
    }
  }
  completeTurn(s, now, actor);
}
export function command(
  original: State,
  now: number,
  cmd: Command,
  id: string,
): State {
  const settled = tick(original, now);
  if (settled.seen.includes(id) || settled.phase === "finished") return settled;
  const s = copy(settled);
  s.seen = [...s.seen.slice(-199), id];
  try {
    if (cmd.type === "answer") {
      const q =
        s.phase === "math"
          ? s.gate
          : s.phase === "duel"
            ? s.duel!.set[s.duel!.index]
            : null;
      if (!q || q.id !== cmd.token)
        throw new Error("This question has expired.");
      const answer = cmd.skip ? null : parseAnswer(cmd.answer);
      if (!cmd.skip && answer === null)
        throw new Error("Enter an integer using Latin or Devanagari digits.");
      const correct = !cmd.skip && answer === q.answer;
      if (s.phase === "math") {
        if (correct) {
          s.phase = "play";
          event(s, now, "answer", "Correct. Your move.");
        } else {
          const actor = new Chess(s.fen).turn();
          if (!s.settings.untimed)
            s.clocks[actor] = Math.max(0, s.clocks[actor] - 3000);
          s.gate = questions(q.id + 991, s.settings.difficulty, 3).find(
            (next) => next.text !== q.text,
          )!;
          event(s, now, "answer", "Not quite. Try the next one.");
          if (!s.settings.untimed && s.clocks[actor] <= 0) flag(s, now, actor);
        }
      } else {
        const d = s.duel!;
        event(
          s,
          now,
          "duel-answer",
          `${sideName(d.actor)} question ${d.index + 1}: ${q.text}, ${correct ? "correct" : "incorrect or skipped"}.`,
        );
        d.index++;
        if (correct) d.correct++;
        if (d.index === 5) scoreDuel(s, now);
      }
    } else if (cmd.type === "move") move(s, now, cmd);
    else if (cmd.type === "cast") cast(s, now, cmd);
    else if (cmd.type === "ready") {
      if (s.phase !== "handoff") throw new Error("Not waiting for a handoff.");
      s.phase = "countdown";
      s.deadline = now + 3000;
    } else if (cmd.type === "reward") {
      if (s.phase !== "reward") throw new Error("No reward is pending.");
      award(s, now, cmd.power, cmd.replace);
    } else if (cmd.type === "endTurn") {
      if (s.phase !== "play" || s.submove !== 1)
        throw new Error("No bonus move to decline.");
      const actor = new Chess(s.fen).turn();
      s.fen = setTurn(s.fen, other(actor), "-");
      completeTurn(s, now, actor);
    } else if (cmd.type === "resign")
      finish(
        s,
        now,
        `${sideName(other(cmd.actor || new Chess(s.fen).turn()))} wins by resignation.`,
      );
    else if (cmd.type === "agreeDraw")
      finish(
        s,
        now,
        "Draw by mutual agreement (both local players confirmed).",
      );
    else if (cmd.type === "claimDraw") {
      if (!["math", "play"].includes(s.phase))
        throw new Error("Wait until chess resumes.");
      if (s.halfmoves < 100 && s.keys.filter((k) => k === key(s)).length < 3)
        throw new Error(
          "No threefold repetition or 50-move claim is available.",
        );
      finish(s, now, "Draw by claim.");
    }
    return s;
  } catch (e) {
    settled.notice = e instanceof Error ? e.message : "Invalid action.";
    settled.seen = s.seen;
    return settled;
  }
}
