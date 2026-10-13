import { useState, useEffect, useRef } from "react";
import PositionBoard from "./PositionBoard";
import { Chess, Square } from "chess.js";
import { parsePgn, fromFen, studyMove, materialEval, StudyLine } from "./study";
import { OPENINGS } from "./openings";
import { LIBRARY } from "./library";
import { usePreferences } from "./preferences";
export default function StudyBoard({ onExit }: { onExit: () => void }) {
  const { open } = usePreferences();
  const [line, setLine] = useState<StudyLine>(() => parsePgn("")),
    [index, setIndex] = useState(0),
    [selected, setSelected] = useState<Square | null>(null),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [flip, setFlip] = useState(false),
    [engine, setEngine] = useState(false),
    [evaluation, setEvaluation] = useState("Engine off"),
    [best, setBest] = useState("");
  const worker = useRef<Worker | null>(null),
    fen = line.fens[index],
    chess = new Chess(fen),
    legal = selected
      ? chess.moves({ square: selected, verbose: true }).map((m) => m.to)
      : [];
  useEffect(() => {
    setBest("");
    if (!engine) {
      setEvaluation("Engine off");
      return;
    }
    const w = new Worker("/stockfish.js");
    worker.current = w;
    let ready = false,
      scored = false;
    setEvaluation("Starting engine…");
    w.onmessage = (e) => {
      const s = String(e.data);
      if (s.includes("uciok")) {
        ready = true;
        w.postMessage("position fen " + fen);
        w.postMessage("go depth 8");
      }
      const cp = s.match(/score cp (-?\d+)/),
        mate = s.match(/score mate (-?\d+)/),
        depth = s.match(/depth (\d+)/);
      if (cp || mate) {
        scored = true;
        const sign = new Chess(fen).turn() === "w" ? 1 : -1;
        setEvaluation(
          mate
            ? `Mate ${Number(mate[1]) * sign}`
            : `${((Number(cp![1]) * sign) / 100).toFixed(2)} pawns · depth ${depth?.[1] || "?"}`,
        );
      }
      if (s.startsWith("bestmove")) setBest(s.split(" ")[1]);
    };
    w.onerror = () =>
      setEvaluation("Engine unavailable. Material balance is still shown.");
    w.postMessage("uci");
    const timer = setTimeout(() => {
      if (!ready || !scored) {
        setEvaluation(
          "Engine did not return a score. Try again or use material balance.",
        );
        w.terminate();
      }
    }, 7000);
    return () => {
      clearTimeout(timer);
      w.terminate();
      worker.current = null;
    };
  }, [engine, fen]);
  const load = (kind: "pgn" | "fen") => {
    try {
      const next = kind === "pgn" ? parsePgn(text) : fromFen(text);
      setLine(next);
      setIndex(0);
      setSelected(null);
      setError("");
      setBest("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot load this game.");
    }
  };
  const move = (sq: Square) => {
    if (selected && legal.includes(sq)) {
      try {
        let promotion = "q";
        if (chess.get(selected)?.type === "p" && ["1", "8"].includes(sq[1])) {
          const requested = window.prompt("Promote to q, r, b or n", "q");
          if (!requested) return;
          if (!["q", "r", "b", "n"].includes(requested)) {
            setError("Choose q, r, b or n.");
            return;
          }
          promotion = requested;
        }
        const next = studyMove(line, index, selected, sq, promotion);
        setLine(next);
        setIndex(index + 1);
        setSelected(null);
        setError("");
      } catch (e) {
        setError(String(e));
      }
      return;
    }
    setSelected(chess.get(sq)?.color === chess.turn() ? sq : null);
  };
  const exportPgn = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([line.pgn], { type: "application/x-chess-pgn" }),
    );
    a.download = "chaturanga-study.pgn";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="courtyard play-workspace">
      <header className="court-header">
        <div className="court-brand">
          ♞
          <span>
            Study room<small>Explore a line, not a live match.</small>
          </span>
        </div>
        <div className="court-header-actions">
          <button onClick={open}>⚙ Settings</button>
          <button onClick={onExit}>Back home</button>
        </div>
      </header>
      <main className="court-match">
        <section className="board-column">
          <div className="match-heading">
            <div>
              <div className="eyebrow">ANALYSIS · PGN REPLAY · FEN SANDBOX</div>
              <h1>
                {line.headers.White && line.headers.White !== "?"
                  ? `${line.headers.White} vs ${line.headers.Black}`
                  : "Your analysis board"}
              </h1>
            </div>
            <button onClick={() => setFlip(!flip)}>↻ Rotate</button>
          </div>
          <div className="study-status">
            {chess.isCheckmate()
              ? "Checkmate"
              : chess.isCheck()
                ? "Check"
                : `${chess.turn() === "w" ? "White" : "Black"} to move`}{" "}
            · ply {index}/{line.sans.length}
          </div>
          <PositionBoard
            fen={fen}
            selected={selected}
            legal={legal}
            onSquare={move}
            flip={flip}
          />
          <div className="replay-bar">
            <button
              onClick={() => {
                setIndex(0);
                setSelected(null);
              }}
            >
              ⏮ First
            </button>
            <button
              disabled={!index}
              onClick={() => {
                setIndex(index - 1);
                setSelected(null);
              }}
            >
              ‹ Previous
            </button>
            <button
              disabled={index === line.sans.length}
              onClick={() => {
                setIndex(index + 1);
                setSelected(null);
              }}
            >
              Next ›
            </button>
            <button
              onClick={() => {
                setIndex(line.sans.length);
                setSelected(null);
              }}
            >
              Last ⏭
            </button>
          </div>
          <p className="local-note">
            Move from any viewed position to replace its continuation.
            Import/export currently keeps the main line, not nested variations.
          </p>
        </section>
        <aside className="court-sidebar">
          <section className="court-panel">
            <div className="eyebrow">YOUR OWN WORKBENCH</div>
            <h2>Position & evaluation</h2>
            <p>
              Material balance: {materialEval(fen).toFixed(1)} pawns (White
              positive). This is not an engine score.
            </p>
            <label>
              <input
                type="checkbox"
                checked={engine}
                onChange={(e) => {
                  setEngine(e.target.checked);
                  setBest("");
                }}
              />{" "}
              Enable existing Stockfish engine
            </label>
            <p className="engine-eval" role="status">
              {evaluation}
            </p>
            {best && (
              <p>
                Suggested move: {best}. Analysis only, never shown during live
                maths games.
              </p>
            )}
            <label>
              Current FEN
              <textarea readOnly value={fen} />
            </label>
          </section>
          <section className="court-panel">
            <h2>Import a game or position</h2>
            <label>
              PGN or FEN
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={1000000}
                placeholder="Paste one PGN game or a valid FEN"
              />
            </label>
            <div className="import-actions">
              <button className="primary" onClick={() => load("pgn")}>
                Load PGN
              </button>
              <button onClick={() => load("fen")}>Load FEN</button>
              <button onClick={exportPgn}>Export PGN</button>
              <button
                onClick={() => {
                  setLine(parsePgn(""));
                  setIndex(0);
                  setError("");
                }}
              >
                New board
              </button>
            </div>
            <p role="status">{error}</p>
          </section>
          <section className="court-panel">
            <h2>Move list</h2>
            <div className="study-moves">
              {line.sans.map((san, i) => (
                <button
                  className={index === i + 1 ? "current" : ""}
                  key={i}
                  onClick={() => {
                    setIndex(i + 1);
                    setSelected(null);
                  }}
                >
                  {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ""}
                  {san}
                </button>
              ))}
            </div>
          </section>
          <section className="court-panel">
            <h2>Games library</h2>
            <p>
              A small sourced collection. Import any other tournament PGN above.
              This is not an exhaustive archive.
            </p>
            {LIBRARY.map((g) => (
              <div className="library-card" key={g.id}>
                <button
                  onClick={() => {
                    setLine(parsePgn(g.pgn));
                    setIndex(0);
                    setError("");
                  }}
                >
                  <strong>{g.title}</strong>
                  <small>
                    {g.event} · {g.result}
                  </small>
                </button>
                <a href={g.source} target="_blank" rel="noreferrer">
                  Game-score source ↗
                </a>
              </div>
            ))}
          </section>
          <section className="court-panel">
            <h2>Opening starter explorer</h2>
            <p>
              Three source-checked starting lines. No database statistics or
              exhaustive repertoire claim.
            </p>
            {OPENINGS.map((o) => (
              <div className="library-card" key={o.name}>
                <button
                  onClick={() => {
                    const next = parsePgn(o.moves);
                    setLine(next);
                    setIndex(next.sans.length);
                    setSelected(null);
                  }}
                >
                  <strong>{o.name}</strong>
                  <small>{o.moves.replace(" *", "")}</small>
                </button>
                <a href={o.source} target="_blank" rel="noreferrer">
                  Opening source ↗
                </a>
              </div>
            ))}
          </section>
        </aside>
      </main>
    </div>
  );
}
