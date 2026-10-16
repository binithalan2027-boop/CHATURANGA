import { useEffect, useRef, useState } from "react";
import { Rules, Role } from "chessops/types";
import { variantBotMove } from "./variantEngine";
import { makeSquare, parseUci } from "chessops/util";
import {
  variantPosition,
  variantMoves,
  variantPlay,
  variantFen,
} from "./variantRules";
import { RULE_VARIANTS } from "./variantCatalog";
import VariantBoard from "./VariantBoard";
import { usePreferences } from "./preferences";
export default function VariantPage({ onExit }: { onExit: () => void }) {
  const { open } = usePreferences();
  const [rule, setRule] = useState<Rules>("crazyhouse"),
    [pos, setPos] = useState(() => variantPosition("crazyhouse")),
    [selected, setSelected] = useState<number | null>(null),
    [drop, setDrop] = useState<Role | null>(null),
    [history, setHistory] = useState<string[]>([]),
    [notice, setNotice] = useState(""),
    [promotion, setPromotion] = useState<string[]>([]),
    [botSide, setBotSide] = useState<"white" | "black" | null>(null),
    [botStrength, setBotStrength] = useState<"casual" | "club" | "strong">("club"),
    [thinking, setThinking] = useState(false);
  const botCtl = useRef<AbortController | null>(null),
    lastBotFen = useRef("");
  const legal = variantMoves(pos),
    outcome = pos.outcome(),
    catalog = RULE_VARIANTS.find((v) => v.id === rule)!;
  const dests = legal
    .filter((u) =>
      drop
        ? u.startsWith(
            {
              pawn: "P",
              knight: "N",
              bishop: "B",
              rook: "R",
              queen: "Q",
              king: "K",
            }[drop] + "@",
          )
        : selected !== null && u.startsWith(makeSquare(selected)),
    )
    .map((u) => parseUci(u)!.to);
  useEffect(() => () => botCtl.current?.abort(), []);
  useEffect(() => {
    if (!botSide || outcome || pos.turn !== botSide || thinking) return;
    const fen = variantFen(pos);
    if (lastBotFen.current === fen) return;
    lastBotFen.current = fen;
    const ctl = new AbortController();
    botCtl.current = ctl;
    setThinking(true);
    variantBotMove(rule, fen, botStrength, ctl.signal)
      .then((r) => {
        if (ctl.signal.aborted) return;
        const next = variantPlay(pos, r.best);
        setPos(next.pos);
        setHistory((h) => [...h, next.san]);
      })
      .catch((e) => {
        if (!ctl.signal.aborted)
          setNotice(
            `Computer move failed (${e instanceof Error ? e.message : e}). You can keep playing two-player.`,
          );
      })
      .finally(() => {
        if (!ctl.signal.aborted) setThinking(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, rule, botSide, botStrength]);

  const move = (uci: string) => {
    try {
      const next = variantPlay(pos, uci);
      setPos(next.pos);
      setHistory((h) => [...h, next.san]);
      setSelected(null);
      setDrop(null);
      setPromotion([]);
      setNotice("");
    } catch (e) {
      setNotice(String(e));
    }
  };
  const choose = (sq: number) => {
    if (thinking || (botSide && pos.turn === botSide)) return;
    const prefix = drop
      ? {
          pawn: "P",
          knight: "N",
          bishop: "B",
          rook: "R",
          queen: "Q",
          king: "K",
        }[drop] + "@"
      : selected === null
        ? ""
        : makeSquare(selected);
    const options = legal.filter((u) => u.startsWith(prefix + makeSquare(sq)));
    if (prefix && options.length) {
      if (options.length > 1) setPromotion(options);
      else move(options[0]);
      return;
    }
    setDrop(null);
    setSelected(pos.board.get(sq)?.color === pos.turn ? sq : null);
  };
  return (
    <div className="courtyard play-workspace">
      <header className="court-header">
        <div className="court-brand">
          ♞{" "}
          <span>
            Variant room
            <small>Established rules. Local two-player board.</small>
          </span>
        </div>
        <div className="court-header-actions">
          <button onClick={open}>Settings</button>
          <button onClick={onExit}>Back home</button>
        </div>
      </header>
      <main className="court-match">
        <section className="board-column">
          <div className="match-heading">
            <div>
              <div className="eyebrow">CHESSOPS 0.15.1 · GPLv3+</div>
              <h1>{catalog.name}</h1>
            </div>
          </div>
          <div className="study-status" role="status">
            {outcome
              ? outcome.winner
                ? `${outcome.winner} wins`
                : "Draw"
              : `${pos.turn} to move${pos.isCheck() ? " · Check" : ""}`}
          </div>
          <VariantBoard
            pos={pos}
            selected={selected}
            dests={dests}
            onSquare={choose}
          />
          {pos.pockets && (
            <section className="court-panel">
              <h2>{pos.turn}'s pocket</h2>
              {(["pawn", "knight", "bishop", "rook", "queen"] as Role[]).map(
                (role) => (
                  <button
                    key={role}
                    disabled={!pos.pockets![pos.turn][role] || !!outcome}
                    onClick={() => {
                      setDrop(role);
                      setSelected(null);
                    }}
                  >
                    {role} × {pos.pockets![pos.turn][role]}
                  </button>
                ),
              )}
            </section>
          )}
          {promotion.length > 0 && (
            <section
              className="court-panel"
              role="dialog"
              aria-label="Variant promotion"
            >
              <h2>Choose promotion</h2>
              {promotion.map((u) => (
                <button key={u} onClick={() => move(u)}>
                  {u.slice(4)}
                </button>
              ))}
              <button onClick={() => setPromotion([])}>Cancel</button>
            </section>
          )}
          <p className="local-note">
            Untimed local play, two-player or against the computer. No online
            match, rewind or verified tournament service here yet. For castling,
            select the king then its rook square.
          </p>
        </section>
        <aside className="court-sidebar">
          <section className="court-panel">
            <h2>Choose your rules</h2>
            <label>
              Variant
              <select
                aria-label="Variant"
                value={rule}
                onChange={(e) => {
                  const r = e.target.value as Rules;
                  setRule(r);
                  setPos(variantPosition(r));
                  setHistory([]);
                  setSelected(null);
                  setDrop(null);
                  setPromotion([]);
                }}
              >
                {RULE_VARIANTS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <p>{catalog.summary}</p>
            <button
              onClick={() => {
                setPos(variantPosition(rule));
                setHistory([]);
                setSelected(null);
                setDrop(null);
                setPromotion([]);
              }}
            >
              Reset this variant
            </button>
            <p role="status">{notice}</p>
          </section>
          <section className="court-panel">
            <h2>Play the computer</h2>
            <label>
              Computer plays
              <select
                aria-label="Computer side"
                value={botSide ?? "off"}
                onChange={(e) => {
                  botCtl.current?.abort();
                  lastBotFen.current = "";
                  setThinking(false);
                  const v = e.target.value;
                  setBotSide(v === "off" ? null : (v as "white" | "black"));
                }}
              >
                <option value="off">Off - two players</option>
                <option value="white">White</option>
                <option value="black">Black</option>
              </select>
            </label>
            <label>
              Strength
              <select
                aria-label="Computer strength"
                value={botStrength}
                disabled={!botSide}
                onChange={(e) =>
                  setBotStrength(e.target.value as "casual" | "club" | "strong")
                }
              >
                <option value="casual">Casual</option>
                <option value="club">Club</option>
                <option value="strong">Strong</option>
              </select>
            </label>
            <p role="status">
              {thinking
                ? "Computer is thinking on this device..."
                : "Runs on-device. Uses Fairy-Stockfish WASM when the site is deployed with isolation headers; otherwise the built-in search."}
            </p>
          </section>
          <section className="court-panel">
            <h2>Move list</h2>
            <p>{history.join(" ") || "Make the first move."}</p>
            <label>
              Variant FEN
              <textarea readOnly value={variantFen(pos)} />
            </label>
          </section>
          <section className="court-panel">
            <h2>Coverage, honestly</h2>
            <p>
              Eight upstream rulesets. Bughouse, Duck Chess, historical
              Chaturanga, Spell and Fog require different adapters. This screen
              does not pretend to contain all world variants.
            </p>
            <a
              href="https://github.com/lichess-org/chessops"
              target="_blank"
              rel="noreferrer"
            >
              Rules source and license ↗
            </a>
          </section>
        </aside>
      </main>
    </div>
  );
}
