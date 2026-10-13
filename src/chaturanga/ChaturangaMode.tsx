import { stockfishAnalyze } from "./stockfishAdapter";
import { useEffect, useRef, useState } from "react";
import { Chess, Square, PieceSymbol } from "chess.js";
import {
  command,
  newGame,
  tick,
  legalMoves,
  targets,
  POWERS,
  Power,
  Settings,
  State,
  sideName,
  Command,
} from "./engine";
import "./courtyard.css";
import { usePreferences } from "./preferences";
import { BOTS, BotId, BotLevel, BOT_LEVELS } from "./bot";
const STORAGE = "chaturanga-local-v1";
const symbols: Record<string, string> = {
  wk: "♔",
  wq: "♕",
  wr: "♖",
  wb: "♗",
  wn: "♘",
  wp: "♙",
  bk: "♚",
  bq: "♛",
  br: "♜",
  bb: "♝",
  bn: "♞",
  bp: "♟",
};
const names: Record<string, string> = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};
function saved(storage: string): State | null {
  try {
    const s = JSON.parse(localStorage.getItem(storage) || "null");
    if (s?.schemaVersion === 1) {
      new Chess(s.fen);
      return tick(s, Date.now());
    }
  } catch {
    /* corrupt local save starts setup */
  }
  return null;
}
function time(ms: number) {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
export default function ChaturangaMode({
  onExit,
  initialMode = "mind",
  quickStart = false,
}: {
  onExit: () => void;
  initialMode?: Settings["mode"];
  quickStart?: boolean;
}) {
  const { prefs, update, open } = usePreferences();
  const [opponent, setOpponent] = useState<"local" | BotId>("khivin");
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const stateRef = useRef<State | null>(null);
  const botWorker = useRef<Worker | null>(null);
  const [botThinking, setBotThinking] = useState(false);
  const [khivinLevel, setKhivinLevel] = useState<BotLevel>("club");
  const storage = initialMode === "classic" ? STORAGE + "-bots" : STORAGE;
  const [game, setGame] = useState<State | null>(
    () =>
      saved(storage) ||
      (quickStart
        ? newGame(
            {
              mode: "classic",
              opponent: "khivin",
              difficulty: "medium",
              initialMs: 600000,
              incrementMs: 0,
              untimed: true,
              seed: Math.floor(Math.random() * 1000000),
            },
            Date.now(),
          )
        : null),
  );

  const [mode, setMode] = useState<Settings["mode"]>(initialMode);
  const [difficulty, setDifficulty] =
    useState<Settings["difficulty"]>("medium");
  const [control, setControl] = useState("10+5");
  const [selected, setSelected] = useState<Square | null>(null);
  const [answer, setAnswer] = useState("");
  const [power, setPower] = useState<Power | null>(null);
  const [target, setTarget] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{
    from?: Square;
    to: Square;
    power?: boolean;
  } | null>(null);
  const [flip, setFlip] = useState(false),
    [plain, setPlain] = useState(false);
  const sound = prefs.sound,
    motion = prefs.motion;
  const [replace, setReplace] = useState<Power | undefined>();
  const input = useRef<HTMLInputElement>(null),
    seq = useRef(0);
  stateRef.current = game;
  const replayEvent =
    game?.result && replayIndex !== null ? game.events[replayIndex] : null;
  const chess = new Chess(replayEvent?.fen || game?.fen);
  const vsBot = !!game?.settings.opponent && game.settings.opponent !== "local";
  const humanTurn = !vsBot || chess.turn() === "w";
  const actor = chess.turn();
  const material = chess
    .board()
    .flat()
    .reduce(
      (score, p) =>
        score +
        (p
          ? (p.color === "w" ? 1 : -1) *
            { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }[p.type]
          : 0),
      0,
    );
  useEffect(() => {
    const worker = new Worker(new URL("./bot.worker.ts", import.meta.url), {
      type: "module",
    });
    botWorker.current = worker;
    worker.onerror = () => {
      setBotThinking(false);
      setGame((s) =>
        s
          ? {
              ...s,
              notice:
                "Computer engine failed. Reload to retry; your local game is saved.",
            }
          : s,
      );
    };
    worker.onmessage = (e) => {
      setBotThinking(false);
      const current = stateRef.current;
      if (
        !current ||
        current.phase !== "play" ||
        current.fen !== e.data.request ||
        current.result ||
        new Chess(current.fen).turn() !== "b"
      )
        return;
      const move = e.data.move;
      if (typeof move === "string" && move.length >= 4)
        setGame((s) =>
          s
            ? command(
                s,
                Date.now(),
                {
                  type: "move",
                  from: move.slice(0, 2) as Square,
                  to: move.slice(2, 4) as Square,
                  promotion: move[4] as PieceSymbol | undefined,
                },
                `bot-${Date.now()}`,
              )
            : s,
        );
    };
    return () => worker.terminate();
  }, []);
  useEffect(() => {
    if (!game || !vsBot || game.result) return;
    const id = game.settings.opponent as BotId,
      bot = BOTS.find((b) => b.id === id)!;
    let delay: ReturnType<typeof setTimeout> | undefined;
    const ctl = new AbortController();
    if (actor === "b" && game.phase === "math") {
      const token = game.gate.id;
      delay = setTimeout(
        () =>
          setGame((s) =>
            s && s.phase === "math" && s.gate.id === token
              ? command(
                  s,
                  Date.now(),
                  {
                    type: "answer",
                    token,
                    answer: String(
                      Math.random() < bot.accuracy
                        ? s.gate.answer
                        : s.gate.answer + 1,
                    ),
                  },
                  `bot-answer-${token}`,
                )
              : s,
          ),
        1000,
      );
    } else if (actor === "b" && game.phase === "play") {
      const request = game.fen;
      delay = setTimeout(() => {
        if (
          stateRef.current?.fen !== request ||
          stateRef.current.phase !== "play"
        )
          return;
        setBotThinking(true);
        if (id === "khivin" && game.settings.mode === "classic") {
          stockfishAnalyze(request, { depth: { beginner: 4, club: 10, master: 14 }[khivinLevel], signal: ctl.signal })
            .then((result) => {
              const current = stateRef.current;
              if (
                !current ||
                current.fen !== request ||
                current.phase !== "play" ||
                ctl.signal.aborted
              )
                return;
              const legal = legalMoves(current).map(
                (m) => m.from + m.to + (m.promotion || ""),
              );
              if (!legal.includes(result.best))
                throw Error("Engine candidate is not legal under game rules.");
              setBotThinking(false);
              setGame((s) =>
                s && s.fen === request
                  ? command(
                      s,
                      Date.now(),
                      {
                        type: "move",
                        from: result.best.slice(0, 2) as Square,
                        to: result.best.slice(2, 4) as Square,
                        promotion: result.best[4] as PieceSymbol | undefined,
                      },
                      `stockfish-${Date.now()}`,
                    )
                  : s,
              );
            })
            .catch(() => {
              if (!ctl.signal.aborted) {
                setBotThinking(false);
                setGame((s) =>
                  s
                    ? {
                        ...s,
                        notice:
                          "Stockfish could not finish. Your game is saved; no silent fallback engine was used.",
                      }
                    : s,
                );
              }
            });
          return;
        }
        botWorker.current?.postMessage({
          fen: request,
          id,
          request,
          level: khivinLevel,
          allowed: legalMoves(game).map(
            (m) => m.from + m.to + (m.promotion || ""),
          ),
        });
      }, 500);
    }
    return () => {
      if (delay) clearTimeout(delay);
      ctl.abort();
    };
  }, [game?.phase, game?.fen, game?.gate.id, vsBot, actor]);
  const send = (cmd: Command) => {
    const id = `${Date.now()}-${seq.current++}`;
    setGame((s) => (s ? command(s, Date.now(), cmd, id) : s));
    setAnswer("");
    setSelected(null);
    setPower(null);
    setTarget(null);
    setPromotion(null);
    if (sound && cmd.type === "move") {
      const context = new AudioContext();
      const osc = context.createOscillator(),
        gain = context.createGain();
      osc.connect(gain);
      gain.connect(context.destination);
      osc.frequency.value = 250;
      gain.gain.setValueAtTime(0.04, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);
      osc.start();
      osc.stop(context.currentTime + 0.08);
      osc.onended = () => {
        void context.close();
      };
    }
  };
  useEffect(() => {
    const interval = window.setInterval(
      () => setGame((s) => (s ? tick(s, Date.now()) : s)),
      150,
    );
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (game) {
      try {
        localStorage.setItem(storage, JSON.stringify(game));
      } catch {
        /* local save unavailable; gameplay stays usable */
      }
    }
  }, [game, storage]);
  useEffect(() => {
    input.current?.focus();
  }, [game?.phase, game?.gate.id, game?.duel?.index]);
  useEffect(() => {
    if (game?.phase !== "play") {
      setSelected(null);
      setTarget(null);
      setPower(null);
      setPromotion(null);
    }
  }, [game?.phase]);
  const start = () => {
    setReplayIndex(null);
    const [minutes, increment] = control.split("+").map(Number);
    setGame(
      newGame(
        {
          mode,
          opponent: mode === "mantra" ? "local" : opponent,
          difficulty,
          initialMs: control === "practice" ? 600000 : minutes * 60000,
          incrementMs: control === "practice" ? 0 : increment * 1000,
          untimed: mode !== "mantra" && control === "practice",
          seed: Math.floor(Math.random() * 1000000),
        },
        Date.now(),
      ),
    );
  };
  const chooseSquare = (sq: Square) => {
    if (!game || game.phase !== "play" || !humanTurn || replayIndex !== null)
      return;
    if (power) {
      if (targets(game, power).includes(sq)) setTarget(sq);
      return;
    }
    if (selected) {
      const move = legalMoves(game, selected).find((m) => m.to === sq);
      if (move) {
        if (move.promotion) setPromotion({ from: selected, to: sq });
        else send({ type: "move", from: selected, to: sq });
        return;
      }
    }
    setSelected(chess.get(sq)?.color === actor ? sq : null);
  };
  const squareTargets = game && power ? targets(game, power) : [];
  const moves =
    game && selected ? legalMoves(game, selected).map((m) => m.to) : [];
  const q =
    game?.phase === "math"
      ? game.gate
      : game?.phase === "duel"
        ? game.duel!.set[game.duel!.index]
        : null;
  const confirmCast = (p: PieceSymbol = "q") => {
    if (power)
      send({ type: "cast", power, target: target || undefined, promotion: p });
  };
  const exportReplay = () => {
    if (!game) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              schemaVersion: 1,
              rulesVersion: "local-v1",
              localOnly: true,
              state: game,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    a.download = "chaturanga-local-replay.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div
      className={`courtyard play-workspace ${plain ? "plain" : ""} ${motion ? "reduce-motion" : ""}`}
    >
      <header className="court-header">
        <button className="court-brand" onClick={onExit}>
          ♞{" "}
          <span>
            Chaturanga<small>A little thought. A little magic.</small>
          </span>
        </button>
        <div className="court-header-actions">
          <span className="court-tag">LOCAL PLAY · NO ACCOUNT NEEDED</span>
          <button onClick={open} aria-label="Open board settings">
            ⚙ Settings
          </button>
          <button onClick={onExit}>Back home</button>
        </div>
      </header>
      {!game ? (
        <main className="court-setup">
          <div className="eyebrow">THE COURTYARD COLLECTION</div>
          <h1>
            Take a seat.
            <br />
            Make your next move.
          </h1>
          <p>
            Chess, mental maths and small moments of magic.
            <br />A quieter kind of challenge.
          </p>
          <div className="mode-choice">
            <button
              className={mode === "mind" ? "chosen" : ""}
              onClick={() => setMode("mind")}
            >
              <span>01 / THOUGHT</span>
              <h2>Mind Before Move</h2>
              <p>
                Solve a quick question to unlock each chess turn. Your clock
                keeps running.
              </p>
            </button>
            <button
              className={mode === "mantra" ? "chosen" : ""}
              onClick={() => {
                setMode("mantra");
                setOpponent("local");
                if (control === "practice") setControl("10+5");
              }}
            >
              <span>02 / MAGIC</span>
              <h2>Mantra Duel</h2>
              <p>
                Every 90 active seconds, take a maths break. Earn one of seven
                tactical powers.
              </p>
            </button>
          </div>
          <div className="bot-setup">
            <label>
              Opponent
              <select
                value={mode === "mantra" ? "local" : opponent}
                disabled={mode === "mantra"}
                onChange={(e) => setOpponent(e.target.value as "local" | BotId)}
              >
                <option value="local">Friend on this device</option>
                {BOTS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} · {b.level}
                  </option>
                ))}
              </select>
            </label>
            {opponent === "khivin" && (
              <label>
                Khivin difficulty
                <select
                  aria-label="Khivin difficulty"
                  value={khivinLevel}
                  onChange={(e) => setKhivinLevel(e.target.value as BotLevel)}
                >
                  {(Object.keys(BOT_LEVELS) as BotLevel[]).map((lv) => (
                    <option key={lv} value={lv}>
                      {BOT_LEVELS[lv].label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {opponent !== "local" && mode !== "mantra" && (
              <div className="bot-card">
                <span className="bot-avatar">
                  {opponent === "aarav" ? "♙" : opponent === "tara" ? "♘" : "♚"}
                </span>
                <div>
                  <strong>{BOTS.find((b) => b.id === opponent)?.name}</strong>
                  <p>{BOTS.find((b) => b.id === opponent)?.description}</p>
                  <small>
                    Unofficial, unaffiliated practice bots. Original local
                    engine; not measured Elo or actual player strength. You play
                    White.
                  </small>
                </div>
              </div>
            )}
            <button
              className={mode === "classic" ? "primary" : ""}
              onClick={() => setMode("classic")}
            >
              Classic computer chess
            </button>
          </div>
          <div className="setup-controls">
            <label>
              {mode === "classic"
                ? "Maths (not used in Classic)"
                : "Maths difficulty"}
              <select
                disabled={mode === "classic"}
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as Settings["difficulty"])
                }
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label>
              Time control
              <select
                value={control}
                onChange={(e) => setControl(e.target.value)}
              >
                {mode === "classic" && (
                  <>
                    <option>1+0</option>
                    <option>2+1</option>
                    <option>3+2</option>
                    <option>30+0</option>
                  </>
                )}
                <option>5+3</option>
                <option>10+5</option>
                <option>15+10</option>
                {mode !== "mantra" && (
                  <option value="practice">Untimed practice</option>
                )}
              </select>
            </label>
            <button className="primary" onClick={start}>
              Set the board ↗
            </button>
          </div>
          <div className="local-note">
            <strong>
              {mode === "mantra"
                ? "Sequential local demo"
                : opponent === "local"
                  ? "Local hot-seat play"
                  : "Local computer play"}
            </strong>
            <p>
              {mode === "mantra"
                ? "Share one device with hidden handoff screens and separate equal-format sets. This is not a simultaneous or fair online race. Chess clocks pause during maths."
                : mode === "mind"
                  ? "Wrong answers and skips cost 3 seconds, except in untimed practice. Against a computer, you play White."
                  : "Standard chess, no maths gates or spells. Against a computer, you play White. Timers include one increment per completed turn."}
            </p>
            <p>
              Online Chaturanga requires a secure room controller. It is not
              enabled here. Time controls are minutes per side + seconds per
              completed turn.
            </p>
          </div>
        </main>
      ) : (
        <main className="court-match">
          <section className="board-column">
            <div className="match-heading">
              <div>
                <div className="eyebrow">
                  {game.settings.mode === "mind"
                    ? "MIND BEFORE MOVE"
                    : game.settings.mode === "classic"
                      ? "CLASSIC · COMPUTER OR LOCAL"
                      : "MANTRA DUEL · SEQUENTIAL DEMO"}
                </div>
                <h1>
                  {game.result
                    ? "Until the next game."
                    : "Room for a good move."}
                </h1>
              </div>
              <button onClick={() => setFlip(!flip)} aria-label="Rotate board">
                ↻ Rotate
              </button>
            </div>
            {[flip ? "w" : "b"].map((c) => (
              <div
                key={c}
                className={`player-line ${actor === c && ["play", "math"].includes(game.phase) ? "active" : ""}`}
              >
                <span>
                  {c === "w" ? "○" : "●"} {sideName(c as "w" | "b")}
                  {c === "b" && vsBot
                    ? ` · ${BOTS.find((b) => b.id === game.settings.opponent)?.name}`
                    : ""}
                  <small>
                    {actor === c
                      ? "Your turn"
                      : "At the other side of the board"}
                  </small>
                </span>
                <strong>
                  {game.settings.untimed
                    ? "∞"
                    : time(game.clocks[c as "w" | "b"])}
                </strong>
              </div>
            ))}
            <div
              className="court-board"
              role="group"
              aria-label="Chess board. Tab to a square; Enter selects it. Arrow keys navigate."
            >
              {(flip
                ? [1, 2, 3, 4, 5, 6, 7, 8]
                : [8, 7, 6, 5, 4, 3, 2, 1]
              ).flatMap((rank, ri) =>
                (flip ? [..."hgfedcba"] : [..."abcdefgh"]).map((file, fi) => {
                  const sq = `${file}${rank}` as Square,
                    p = chess.get(sq),
                    effect = game.effects.find((e) => e.square === sq),
                    isTarget = squareTargets.includes(sq),
                    isMove = prefs.legalDots && moves.includes(sq);
                  return (
                    <button
                      key={sq}
                      className={`square ${(ri + fi) % 2 ? "dark" : "light"} ${selected === sq || target === sq ? "selected" : ""} ${prefs.lastMove && (game.lastMove?.from === sq || game.lastMove?.to === sq) ? "last" : ""} ${p?.type === "k" && p.color === actor && chess.isCheck() ? "check" : ""}`}
                      aria-label={`${sq}, ${p ? `${sideName(p.color)} ${names[p.type]}` : "empty"}${effect ? `, ${effect.kind}` : ""}${isMove ? ", legal move" : ""}${isTarget ? ", power target" : ""}`}
                      onClick={(e) => {
                        if (prefs.input !== "drag" || power || e.detail === 0)
                          chooseSquare(sq);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const from = e.dataTransfer.getData(
                          "text/plain",
                        ) as Square;
                        if (!humanTurn || prefs.input === "click" || power)
                          return;
                        if (legalMoves(game, from).some((m) => m.to === sq)) {
                          if (
                            legalMoves(game, from).some(
                              (m) => m.to === sq && m.promotion,
                            )
                          )
                            setPromotion({ from, to: sq });
                          else send({ type: "move", from, to: sq });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setPower(null);
                          setTarget(null);
                          setSelected(null);
                        }
                        const shift: Record<string, number> = {
                          ArrowRight: 1,
                          ArrowLeft: -1,
                          ArrowDown: 8,
                          ArrowUp: -8,
                        };
                        if (e.key in shift) {
                          e.preventDefault();
                          const nodes = Array.from(
                            e.currentTarget.parentElement!.querySelectorAll(
                              "button",
                            ),
                          );
                          const index = nodes.indexOf(e.currentTarget);
                          nodes[
                            Math.max(0, Math.min(63, index + shift[e.key]))
                          ]?.focus();
                        }
                      }}
                    >
                      {fi === 0 && <small className="rank">{rank}</small>}
                      {ri === 7 && <small className="file">{file}</small>}
                      {p && (
                        <span
                          className={`piece ${p.color}`}
                          draggable={
                            game.phase === "play" &&
                            humanTurn &&
                            prefs.input !== "click" &&
                            p.color === actor &&
                            !power
                          }
                          onDragStart={(e) =>
                            e.dataTransfer.setData("text/plain", sq)
                          }
                        >
                          {prefs.pieces === "solid"
                            ? symbols["b" + p.type]
                            : symbols[p.color + p.type]}
                        </span>
                      )}
                      {isMove && <i className="move-dot" />}
                      {isTarget && <i className="target-mark">＋</i>}
                      {effect && (
                        <span className={`effect ${effect.kind}`}>
                          {effect.kind === "freeze" ? "❄" : "◇"}
                        </span>
                      )}
                    </button>
                  );
                }),
              )}
            </div>
            {[flip ? "b" : "w"].map((c) => (
              <div
                key={c}
                className={`player-line ${actor === c && ["play", "math"].includes(game.phase) ? "active" : ""}`}
              >
                <span>
                  {c === "w" ? "○" : "●"} {sideName(c as "w" | "b")}
                  {c === "b" && vsBot
                    ? ` · ${BOTS.find((b) => b.id === game.settings.opponent)?.name}`
                    : ""}
                  <small>{actor === c ? "Your turn" : "Thinking ahead"}</small>
                </span>
                <strong>
                  {game.settings.untimed
                    ? "∞"
                    : time(game.clocks[c as "w" | "b"])}
                </strong>
              </div>
            ))}
            <div className="material-strip">
              Board material:{" "}
              {material === 0
                ? "equal"
                : `${material > 0 ? "White" : "Black"} +${Math.abs(material)}`}{" "}
              · promotion effects included
            </div>
            <div className="board-tools">
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `${vsBot ? "White" : sideName(actor)} resigns?`,
                    )
                  )
                    send({ type: "resign", actor: vsBot ? "w" : actor });
                }}
              >
                Resign
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Do BOTH local players agree to a draw?"))
                    send({ type: "agreeDraw" });
                }}
              >
                Agree draw
              </button>
              <button onClick={() => send({ type: "claimDraw" })}>
                Claim draw
              </button>
              <button onClick={exportReplay}>Export replay</button>
            </div>
          </section>
          <aside className="court-sidebar">
            <section className="court-panel maths-panel">
              <div className="eyebrow">
                {q
                  ? game.phase === "math"
                    ? `${sideName(actor)} · SOLVE TO MOVE`
                    : `${sideName(game.duel!.actor)} · QUESTION ${game.duel!.index + 1} OF 5`
                  : "AT YOUR OWN PACE"}
              </div>
              {q && !humanTurn && game.phase === "math" ? (
                <>
                  <h2>
                    {BOTS.find((b) => b.id === game.settings.opponent)?.name} is
                    thinking.
                  </h2>
                  <p>The computer takes its own maths gate before moving.</p>
                </>
              ) : q ? (
                <>
                  <h2 className="expression">{q.text}</h2>
                  {game.phase === "duel" && (
                    <p className="duel-timer">
                      {time(game.duel!.deadline - game.lastAt)} left in this set
                    </p>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      send({ type: "answer", token: q.id, answer });
                    }}
                  >
                    <label className="sr-label" htmlFor="math-answer">
                      Your integer answer
                    </label>
                    <input
                      id="math-answer"
                      ref={input}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Your answer"
                      autoComplete="off"
                      inputMode="numeric"
                      maxLength={12}
                    />
                    <div className="answer-actions">
                      <button type="submit" className="primary">
                        Submit answer
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          send({
                            type: "answer",
                            token: q.id,
                            answer: "",
                            skip: true,
                          })
                        }
                      >
                        Skip
                        {game.phase === "math" && !game.settings.untimed
                          ? " (−3s)"
                          : ""}
                      </button>
                    </div>
                  </form>
                </>
              ) : game.phase === "handoff" ? (
                <>
                  <h2>Pass to {sideName(game.duel!.actor)}.</h2>
                  <p>
                    Only the next player should see their set. Five questions,
                    20 seconds.
                  </p>
                  <button
                    className="primary"
                    onClick={() => send({ type: "ready" })}
                  >
                    I'm ready
                  </button>
                </>
              ) : game.phase === "countdown" ? (
                <>
                  <h2>Take a breath.</h2>
                  <p>
                    Questions start in{" "}
                    {Math.ceil((game.deadline - game.lastAt) / 1000)}.
                  </p>
                </>
              ) : game.phase === "reward" ? (
                <>
                  <h2>{sideName(game.duel!.winner!)} earned a power.</h2>
                  <p>
                    Choose within{" "}
                    {Math.ceil((game.deadline - game.lastAt) / 1000)} seconds.
                    Leftmost is the default.
                  </p>
                  {game.inventory[game.duel!.winner!].length === 3 && (
                    <label>
                      Replace a held power
                      <select
                        value={replace || game.inventory[game.duel!.winner!][0]}
                        onChange={(e) => setReplace(e.target.value as Power)}
                      >
                        {game.inventory[game.duel!.winner!].map((p) => (
                          <option key={p} value={p}>
                            {POWERS[p].name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <div className="reward-cards">
                    {game.duel!.options.map((p) => (
                      <button
                        key={p}
                        onClick={() =>
                          send({ type: "reward", power: p, replace })
                        }
                      >
                        <strong>{POWERS[p].name}</strong>
                        <small>{POWERS[p].text}</small>
                      </button>
                    ))}
                  </div>
                </>
              ) : game.phase === "finished" ? (
                <>
                  <h2>{game.result}</h2>
                  <button
                    className="primary"
                    onClick={() => {
                      setGame(null);
                      setReplace(undefined);
                      localStorage.removeItem(storage);
                    }}
                  >
                    Set up another game
                  </button>
                </>
              ) : game.phase === "resume" ? (
                <>
                  <h2>Back to the board.</h2>
                  <p>
                    Resuming in{" "}
                    {Math.ceil((game.deadline - game.lastAt) / 1000)}.
                  </p>
                </>
              ) : (
                <>
                  <h2>
                    {game.submove
                      ? "One more move?"
                      : `${sideName(actor)}, your move.`}
                  </h2>
                  <p>
                    {game.settings.mode === "mantra"
                      ? `Next maths break in ${time(90000 - game.activeMs)} of active chess time.`
                      : game.settings.mode === "classic"
                        ? botThinking
                          ? "The computer is choosing its reply."
                          : "Standard chess. Choose a piece to see legal moves."
                        : "Your answer unlocked this turn. Take a moment, then move."}
                  </p>
                  {game.submove === 1 && (
                    <button onClick={() => send({ type: "endTurn" })}>
                      Decline bonus move
                    </button>
                  )}
                </>
              )}
              <p className="feedback" role="status" aria-live="polite">
                {game.notice}
              </p>
            </section>
            {game.settings.mode === "mantra" && (
              <section className="court-panel">
                <div className="eyebrow">EARNED, NEVER BOUGHT</div>
                <h2>Your powers</h2>
                {(["w", "b"] as const).map((c) => (
                  <div key={c} className="inventory">
                    <h3>
                      {sideName(c)}{" "}
                      <small>
                        {game.cooldown[c]
                          ? `Available after ${game.cooldown[c]} of your turns`
                          : "Ready when it is your turn"}
                      </small>
                    </h3>
                    {game.inventory[c].length ? (
                      game.inventory[c].map((p) => (
                        <button
                          key={p}
                          disabled={
                            c !== actor ||
                            game.phase !== "play" ||
                            game.cast ||
                            !!game.submove ||
                            !!game.cooldown[c]
                          }
                          onClick={() => {
                            setPower(p);
                            setTarget(null);
                          }}
                        >
                          <strong>{POWERS[p].name}</strong>
                          <small>{POWERS[p].text}</small>
                        </button>
                      ))
                    ) : (
                      <p className="muted">
                        No powers yet. Win a maths break to earn one.
                      </p>
                    )}
                  </div>
                ))}
                {power && (
                  <div className="cast-preview">
                    <h3>{POWERS[power].name}</h3>
                    <p>{POWERS[power].text}</p>
                    {["freeze", "poison", "promote"].includes(power) && (
                      <p>
                        {target
                          ? `Target: ${target}`
                          : squareTargets.length
                            ? "Choose a marked square."
                            : "No eligible target in this position."}
                      </p>
                    )}
                    {power === "cut" && (
                      <p>
                        Actual deduction:{" "}
                        {time(
                          Math.min(
                            10000,
                            Math.max(
                              0,
                              game.clocks[actor === "w" ? "b" : "w"] - 5000,
                            ),
                          ),
                        )}
                      </p>
                    )}
                    <button
                      className="primary"
                      disabled={
                        ["freeze", "poison", "promote"].includes(power) &&
                        !target
                      }
                      onClick={() =>
                        power === "promote" && target
                          ? setPromotion({ to: target, power: true })
                          : confirmCast()
                      }
                    >
                      Confirm power
                    </button>
                    <button
                      onClick={() => {
                        setPower(null);
                        setTarget(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </section>
            )}
            {game.result && (
              <section className="court-panel replay-controls">
                <h2>Review this game</h2>
                <p>
                  Position snapshots from the event journal, including rewound
                  branches.
                </p>
                <button onClick={() => setReplayIndex(0)}>First</button>
                <button
                  onClick={() =>
                    setReplayIndex((i) =>
                      Math.max(0, (i ?? game.events.length) - 1),
                    )
                  }
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setReplayIndex((i) =>
                      Math.min(game.events.length - 1, (i ?? -1) + 1),
                    )
                  }
                >
                  Next
                </button>
                <button onClick={() => setReplayIndex(null)}>Final</button>
                {replayEvent && (
                  <p>
                    {replayEvent.seq}. {replayEvent.text}
                  </p>
                )}
              </section>
            )}
            <details className="court-panel" open>
              <summary>
                Move journal ·{" "}
                {game.events.filter((e) => e.type === "move").length} moves
              </summary>
              <ol className="journal">
                {game.events
                  .filter(
                    (e) =>
                      e.type !== "duel-answer" ||
                      ["reward", "resume", "play", "finished"].includes(
                        game.phase,
                      ),
                  )
                  .map((e) => (
                    <li key={e.seq}>
                      <small>
                        {e.seq} · branch {e.branch}
                      </small>{" "}
                      {e.text}
                    </li>
                  ))}
              </ol>
            </details>
          </aside>
        </main>
      )}
      <footer className="court-footer">
        <details>
          <summary>How to play · rules & local limitations</summary>
          <div className="rules">
            <h2>A familiar board, a different rhythm.</h2>
            <p>
              Standard 8×8 chess: checkmate, castling, en passant and promotion.
              Kings cannot be captured. Mind Before Move locks every turn until
              a correct answer. Wrong or skipped answers cost 3 seconds; untimed
              practice has no penalty.
            </p>
            <p>
              Mantra Duel is a sequential demo: 90 seconds of active chess,
              paused clocks, a 3-second countdown and 20 seconds per
              five-question set. More correct wins, then fewer wrong answers,
              then completion time with a 300 ms tie band. A zero-correct tie
              earns nothing. Separate equal-format sets do not provide online
              fairness.
            </p>
            <p>
              Winner chooses one of three distinct powers within 8 seconds, then
              chess resumes after 2 seconds. Hold at most 3 charges, one per
              type. A full inventory replaces your chosen oldest/default charge.
              Cast once before moving, then complete two subsequent turns
              without casting.
            </p>
            {Object.values(POWERS).map((p) => (
              <p key={p.name}>
                <strong>
                  {p.name} / {p.flavour}:
                </strong>{" "}
                {p.text}
              </p>
            ))}
            <p>
              Freeze cannot manufacture checkmate or stalemate. Poison applies
              before increment. Rewind preserves spent charges, cooldowns and
              clocks; old event branches remain in the journal. Repetition
              claims use effect, inventory and cooldown state. Automatic
              fivefold and 75-move draws apply; mate takes priority. In Mantra
              Duel, timeouts lose except bare kings. Local Mind timeout draws
              only for a lone opposing king, or a single opposing bishop/knight
              with only kings otherwise; other timeout positions lose under this
              explicit simplified policy.
            </p>
            <p>
              Refresh restores local questions, position and clocks.
              Closing/sleeping the browser does not pause chess time. Private
              online answers, secure identities, reconnect grace and server
              replay recovery are not implemented. Local answer keys are
              inspectable. Replay export contains the complete local state and
              journal, not a verified server replay.
            </p>
          </div>
        </details>
        <div className="preferences">
          <label>
            <input
              type="checkbox"
              checked={plain}
              onChange={(e) => setPlain(e.target.checked)}
            />{" "}
            Plain board
          </label>
          <label>
            <input
              type="checkbox"
              checked={sound}
              onChange={(e) => update({ sound: e.target.checked })}
            />{" "}
            Move sounds
          </label>
          <label>
            <input
              type="checkbox"
              checked={motion}
              onChange={(e) => update({ motion: e.target.checked })}
            />{" "}
            Reduced motion
          </label>
        </div>
      </footer>
      {promotion && (
        <div className="court-overlay">
          <div
            className="court-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Choose promotion"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setPromotion(null);
                input.current?.focus();
              }
              if (e.key === "Tab") {
                const nodes = Array.from(
                  e.currentTarget.querySelectorAll("button"),
                );
                const first = nodes[0],
                  last = nodes[nodes.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <h2>Choose your piece</h2>
            <div className="promotion-options">
              {(["q", "r", "b", "n"] as PieceSymbol[]).map((p) => (
                <button
                  autoFocus={p === "q"}
                  key={p}
                  onClick={() =>
                    promotion.power
                      ? confirmCast(p)
                      : send({
                          type: "move",
                          from: promotion.from!,
                          to: promotion.to,
                          promotion: p,
                        })
                  }
                >
                  {names[p]}
                </button>
              ))}
            </div>
            <button onClick={() => setPromotion(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
