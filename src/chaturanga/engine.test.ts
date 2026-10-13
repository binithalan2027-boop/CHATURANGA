import { describe, it, expect } from "vitest";
import { Chess, Square } from "chess.js";
import {
  newGame,
  command,
  tick,
  legalMoves,
  targets,
  Settings,
  State,
  Power,
} from "./engine";
import { questions, parseAnswer, duelWinner } from "./math";
const settings: Settings = {
  mode: "mantra",
  difficulty: "medium",
  initialMs: 600000,
  incrementMs: 5000,
  untimed: false,
  seed: 123,
};
let seq = 0;
const send = (s: State, cmd: Parameters<typeof command>[2], at = s.lastAt) =>
  command(s, at, cmd, String(seq++));
const mv = (s: State, from: Square, to: Square) =>
  send(s, { type: "move", from, to });
const held = (power: Power, fen?: string) => {
  const s = newGame(settings, 0);
  s.inventory.w = [power];
  if (fen) {
    s.fen = fen;
    const c = new Chess(fen);
    s.ids = {};
    c.board()
      .flat()
      .forEach((p) => {
        if (p) s.ids[p.square] = `${p.color}-${p.square}`;
      });
    s.turnStart = { ...s.turnStart, fen, ids: { ...s.ids } };
  }
  return s;
};
describe("maths", () => {
  it("has deterministic, unique integer questions at every difficulty", () => {
    for (const d of ["easy", "medium", "hard"] as const) {
      const set = questions(1, d, 50);
      expect(set).toEqual(questions(1, d, 50));
      expect(new Set(set.map((q) => q.text)).size).toBe(50);
      expect(set.every((q) => Number.isInteger(q.answer))).toBe(true);
    }
  });
  it("normalizes digits and rejects executable or malformed values", () => {
    expect(parseAnswer(" +००४२ ")).toBe(42);
    for (const a of ["", "1e2", "NaN", "2+2", "-4", "1234567890"])
      expect(parseAnswer(a)).toBeNull();
  });
  it("scores correctly including zero and tie band", () => {
    const a = { correct: 3, wrong: 2, completed: true, elapsed: 1000 };
    expect(duelWinner(a, { ...a, elapsed: 1200 })).toBeNull();
    expect(duelWinner(a, { ...a, elapsed: 1400 })).toBe("w");
    expect(
      duelWinner({ ...a, correct: 0 }, { ...a, correct: 0, elapsed: 9000 }),
    ).toBeNull();
    expect(
      duelWinner(
        { ...a, completed: false },
        { ...a, completed: false, elapsed: 5000 },
      ),
    ).toBeNull();
  });
});
describe("math gates and clocks", () => {
  it("locks first turn, validates answers, preserves unlock across illegal moves", () => {
    let s = newGame({ ...settings, mode: "mind" }, 0);
    expect(legalMoves(s)).toHaveLength(0);
    s = send(s, { type: "answer", token: s.gate.id, answer: "bad" }, 1000);
    expect(s.clocks.w).toBe(599000);
    const id = s.gate.id;
    s = send(
      s,
      { type: "answer", token: id, answer: String(s.gate.answer) },
      1000,
    );
    expect(s.phase).toBe("play");
    s = mv(s, "e2", "e5");
    expect(s.phase).toBe("play");
    s = mv(s, "e2", "e4");
    expect(s.phase).toBe("math");
    expect(new Chess(s.fen).turn()).toBe("b");
    expect(s.clocks.w).toBe(604000);
  });
  it("wrong answers cost exactly once and stale tokens cannot penalize", () => {
    const s = newGame({ ...settings, mode: "mind" }, 0);
    const cmd = {
      type: "answer" as const,
      token: s.gate.id,
      answer: "",
      skip: true,
    };
    const next = command(s, 0, cmd, "same");
    expect(next.clocks.w).toBe(597000);
    expect(command(next, 0, cmd, "same").clocks.w).toBe(597000);
    expect(command(next, 0, cmd, "different").clocks.w).toBe(597000);
  });
  it("untimed practice never penalizes; timeout occurs during maths", () => {
    let s = newGame({ ...settings, mode: "mind", untimed: true }, 0);
    s = send(
      s,
      { type: "answer", token: s.gate.id, answer: "", skip: true },
      1000000,
    );
    expect(s.clocks.w).toBe(600000);
    expect(s.result).toBeNull();
    s = tick(newGame({ ...settings, mode: "mind" }, 0), 600000);
    expect(s.result).toContain("Black wins on time");
  });
  it("reload serialization preserves questions and unlocks", () => {
    let s = newGame({ ...settings, mode: "mind" }, 0);
    const before = s.gate;
    s = JSON.parse(JSON.stringify(tick(s, 500)));
    expect(s.gate).toEqual(before);
    s = send(s, {
      type: "answer",
      token: s.gate.id,
      answer: String(s.gate.answer),
    });
    expect(tick(JSON.parse(JSON.stringify(s)), 1000).phase).toBe("play");
  });
});
describe("duel scheduling", () => {
  it("pauses at 90 active seconds and honors exact deadlines on a delayed tick", () => {
    let s = tick(newGame(settings, 0), 100000);
    expect(s.phase).toBe("handoff");
    expect(s.clocks.w).toBe(510000);
    s = send(s, { type: "ready" });
    s = tick(s, 104000);
    expect(s.phase).toBe("duel");
    expect(s.duel!.start).toBe(103000);
    expect(s.clocks.w).toBe(510000);
    s = tick(s, 130000);
    expect(s.phase).toBe("handoff");
    expect(s.duel!.actor).toBe("b");
    expect(s.duel!.scores.w!.correct).toBe(0);
  });
  it("scores sequential sets, drafts distinct options, defaults and resumes", () => {
    let s = tick(newGame(settings, 0), 90000);
    s = send(s, { type: "ready" });
    s = tick(s, 93000);
    for (let i = 0; i < 5; i++)
      s = send(
        s,
        {
          type: "answer",
          token: s.duel!.set[i].id,
          answer: String(s.duel!.set[i].answer),
        },
        94000 + i * 100,
      );
    expect(s.phase).toBe("handoff");
    s = send(s, { type: "ready" }, 95000);
    s = tick(s, 98000);
    for (let i = 0; i < 5; i++)
      s = send(
        s,
        { type: "answer", token: s.duel!.set[i].id, answer: "", skip: true },
        99000 + i * 100,
      );
    expect(s.phase).toBe("reward");
    expect(new Set(s.duel!.options).size).toBe(3);
    const chosen = s.duel!.options[0];
    s = tick(s, 109400);
    expect(s.phase).toBe("play");
    expect(s.inventory.w).toEqual([chosen]);
    expect(s.activeMs).toBe(0);
    expect(s.clocks.w).toBe(510000);
  });
  it("flag wins a race against threshold", () => {
    const s = tick(newGame({ ...settings, initialMs: 90000 }, 0), 90000);
    expect(s.phase).toBe("finished");
    expect(s.duel).toBeNull();
  });
});
describe("seven powers", () => {
  it("freeze blocks mover, retains attacks, expires after enemy turn", () => {
    let s = send(held("freeze"), {
      type: "cast",
      power: "freeze",
      target: "b8",
    });
    s = mv(s, "e2", "e4");
    expect(legalMoves(s, "b8")).toHaveLength(0);
    expect(new Chess(s.fen).isAttacked("a6", "b")).toBe(true);
    s = mv(s, "e7", "e5");
    expect(s.effects).toHaveLength(0);
    expect(s.cooldown.w).toBe(2);
  });
  it("rejects king freeze and occupied poison without spending", () => {
    let s = send(held("freeze"), {
      type: "cast",
      power: "freeze",
      target: "e8",
    });
    expect(s.inventory.w).toEqual(["freeze"]);
    s = send(held("poison"), { type: "cast", power: "poison", target: "e2" });
    expect(s.inventory.w).toEqual(["poison"]);
    expect(targets(s, "poison")).not.toContain("a1");
  });
  it("poison deducts before increment and expires or triggers once", () => {
    let s = send(held("poison"), {
      type: "cast",
      power: "poison",
      target: "e5",
    });
    s = mv(s, "e2", "e4");
    s = mv(s, "e7", "e5");
    expect(s.clocks.b).toBe(597000);
    expect(s.effects).toHaveLength(0);
  });
  it("poison flags before increment", () => {
    let s = send(held("poison"), {
      type: "cast",
      power: "poison",
      target: "e5",
    });
    s = mv(s, "e2", "e4");
    s.clocks.b = 7000;
    s = mv(s, "e7", "e5");
    expect(s.phase).toBe("finished");
    expect(s.clocks.b).toBe(0);
  });
  it("added time respects cap, cut respects floor", () => {
    let s = held("add");
    s.clocks.w = 1195000;
    s = send(s, { type: "cast", power: "add" });
    expect(s.clocks.w).toBe(1200000);
    s = held("add");
    s.clocks.w = 1200000;
    s = send(s, { type: "cast", power: "add" });
    expect(s.inventory.w).toEqual(["add"]);
    s = held("cut");
    s.clocks.b = 6000;
    s = send(s, { type: "cast", power: "cut" });
    expect(s.clocks.b).toBe(5000);
  });
  it("double allows two moves with one increment and no own en passant", () => {
    let s = send(held("double"), { type: "cast", power: "double" });
    s = mv(s, "e2", "e4");
    expect(new Chess(s.fen).turn()).toBe("w");
    expect(s.fen.split(" ")[3]).toBe("-");
    s = mv(s, "d2", "d4");
    expect(new Chess(s.fen).turn()).toBe("b");
    expect(s.clocks.w).toBe(605000);
    expect(s.fen.split(" ")[3]).not.toBe("e3");
  });
  it("double first check ends turn; bonus can be declined", () => {
    let s = held("double", "4k3/8/8/8/8/8/R7/4K3 w - - 0 1");
    s = send(s, { type: "cast", power: "double" });
    s = mv(s, "a2", "e2");
    expect(new Chess(s.fen).turn()).toBe("b");
    expect(s.submove).toBe(0);
    s = send(held("double"), { type: "cast", power: "double" });
    s = mv(s, "e2", "e4");
    s = send(s, { type: "endTurn" });
    expect(new Chess(s.fen).turn()).toBe("b");
    expect(s.clocks.w).toBe(605000);
  });
  it("early promotion consumes the turn and can check, excludes wrong ranks", () => {
    let s = held("promote", "4k3/P7/8/8/8/8/8/4K3 w - - 0 1");
    s = send(s, {
      type: "cast",
      power: "promote",
      target: "a7",
      promotion: "q",
    });
    expect(new Chess(s.fen).get("a7")?.type).toBe("q");
    expect(new Chess(s.fen).turn()).toBe("b");
    expect(s.clocks.w).toBe(605000);
    expect(targets(held("promote"), "promote")).toHaveLength(0);
  });
  it("rewind restores pair without refunding time or erasing events", () => {
    let s = held("rewind");
    const initial = s.fen;
    s = mv(s, "e2", "e4");
    s = mv(s, "e7", "e5");
    const clocks = { ...s.clocks };
    s = send(s, { type: "cast", power: "rewind" });
    expect(s.fen).toBe(initial);
    expect(s.clocks).toEqual(clocks);
    expect(s.inventory.w).toEqual([]);
    expect(s.events.filter((e) => e.type === "move")).toHaveLength(2);
    expect(s.branch).toBe(1);
  });
  it("rewind cannot cross duel or resurrect ended matches", () => {
    let s = held("rewind");
    s = mv(s, "e2", "e4");
    s = mv(s, "e7", "e5");
    s.barrier = 1;
    s = send(s, { type: "cast", power: "rewind" });
    expect(s.inventory.w).toEqual(["rewind"]);
    expect(s.notice).toContain("without a maths duel");
    s = send(s, { type: "resign" });
    expect(send(s, { type: "cast", power: "rewind" }).result).toBe(s.result);
  });
  it("cooldown blocks two subsequent turns and illegal casts spend nothing", () => {
    let s = send(held("add"), { type: "cast", power: "add" });
    s = mv(s, "e2", "e4");
    s = mv(s, "e7", "e5");
    s.inventory.w = ["cut"];
    s = send(s, { type: "cast", power: "cut" });
    expect(s.inventory.w).toEqual(["cut"]);
    s = mv(s, "g1", "f3");
    s = mv(s, "g8", "f6");
    expect(s.cooldown.w).toBe(1);
    s = mv(s, "b1", "c3");
    s = mv(s, "b8", "c6");
    expect(s.cooldown.w).toBe(0);
    s = send(s, { type: "cast", power: "cut" });
    expect(s.inventory.w).toEqual([]);
  });
  it("normal mate is detected and kings never captured", () => {
    let s = newGame(settings, 0);
    s = mv(s, "f2", "f3");
    s = mv(s, "e7", "e5");
    s = mv(s, "g2", "g4");
    s = mv(s, "d8", "h4");
    expect(s.result).toContain("Black wins by checkmate");
    expect(new Chess(s.fen).get("e1")?.type).toBe("k");
  });
});
describe("rule edge cases", () => {
  it("freezing the only mobile enemy piece is not offered", () => {
    const s = held("freeze", "7k/6R1/5K2/8/8/8/8/7r w - - 0 1");
    expect(targets(s, "freeze")).not.toContain("h1");
  });
  it("freeze expires if it alone would leave no reply after a move", () => {
    let s = held("freeze", "7k/8/5K2/8/8/8/6R1/7r w - - 0 1");
    s = send(s, { type: "cast", power: "freeze", target: "h1" });
    expect(s.effects).toHaveLength(1);
    s = mv(s, "g2", "g7");
    expect(s.effects).toHaveLength(0);
    expect(s.result).toBeNull();
  });
  it("frozen rook cannot castle", () => {
    const s = held("freeze", "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    s.effects = [
      { kind: "freeze", owner: "b", square: "h1", pieceId: s.ids.h1, turns: 1 },
    ];
    expect(legalMoves(s, "e1").map((m) => m.to)).not.toContain("g1");
    expect(legalMoves(s, "e1").map((m) => m.to)).toContain("c1");
  });
  it("poison king and owner are immune", () => {
    let s = held("poison", "4k3/8/8/8/8/8/8/R3K3 w - - 0 1");
    s = send(s, { type: "cast", power: "poison", target: "e7" });
    s = mv(s, "a1", "a2");
    s = mv(s, "e8", "e7");
    expect(s.clocks.b).toBe(605000);
    expect(s.effects).toHaveLength(1);
  });
  it("early promotion cannot bypass check", () => {
    let s = held("promote", "4k3/P7/8/8/8/8/8/r3K3 w - - 0 1");
    s = send(s, {
      type: "cast",
      power: "promote",
      target: "a7",
      promotion: "q",
    });
    expect(s.inventory.w).toEqual(["promote"]);
    expect(new Chess(s.fen).get("a7")?.type).toBe("p");
    expect(s.notice).toContain("king would be in check");
  });
  it("double preserves final en passant but clears non-final pawn push", () => {
    let s = held("double", "4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1");
    s = send(s, { type: "cast", power: "double" });
    s = mv(s, "e1", "f1");
    s = mv(s, "e2", "e4");
    expect(s.fen.split(" ")[3]).toBe("e3");
    expect(legalMoves(s, "d4").map((m) => m.to)).toContain("e3");
  });
  it("full reward inventory replaces oldest without a fourth charge", () => {
    let s = newGame(settings, 0);
    s.inventory.w = ["freeze", "add", "cut"];
    s.phase = "reward";
    s.duel = {
      actor: "b",
      set: [],
      index: 5,
      correct: 0,
      start: 0,
      deadline: 0,
      scores: {},
      winner: "w",
      options: ["double", "poison", "promote"],
    };
    s.deadline = 8000;
    s = tick(s, 8000);
    expect(s.inventory.w).toEqual(["add", "cut", "double"]);
    expect(s.phase).toBe("resume");
  });
  it("promotion capture clears a frozen identity and assigns stable mover identity", () => {
    let s = held("freeze", "r3k3/1P6/8/8/8/8/8/4K3 w - - 0 1");
    const pawn = s.ids.b7;
    s = send(s, { type: "cast", power: "freeze", target: "a8" });
    s = send(s, { type: "move", from: "b7", to: "a8", promotion: "n" });
    expect(s.ids.a8).toBe(pawn);
    expect(s.effects).toHaveLength(0);
  });
  it("checkmate takes precedence over 75 move draw", () => {
    let s = newGame(settings, 0);
    s = mv(s, "f2", "f3");
    s = mv(s, "e7", "e5");
    s = mv(s, "g2", "g4");
    s.halfmoves = 149;
    s = mv(s, "d8", "h4");
    expect(s.result).toContain("checkmate");
  });
});
describe("classic computer policy", () => {
  it("classic chess starts unlocked and no duels trigger", () => {
    let s = newGame({ ...settings, mode: "classic" }, 0);
    expect(s.phase).toBe("play");
    s = tick(s, 90000);
    expect(s.duel).toBeNull();
    expect(s.clocks.w).toBe(510000);
  });
  it("human may resign on computers turn without awarding human win", () => {
    let s = newGame({ ...settings, mode: "classic", opponent: "tara" }, 0);
    s = mv(s, "e2", "e4");
    s = send(s, { type: "resign", actor: "w" });
    expect(s.result).toContain("Black wins by resignation");
  });
});
