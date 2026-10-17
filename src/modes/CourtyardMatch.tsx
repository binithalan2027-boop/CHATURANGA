import { ReactNode } from "react";
import { usePreferences } from "../chaturanga/preferences";
import "../chaturanga/courtyard.css";

const FILES = [..."abcdefgh"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];
const PIECE_SYMBOLS: Record<string, string> = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟",
};
const CAPTURED_SYMBOLS: Record<string, string> = {
  p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚",
};
const PIECE_NAMES: Record<string, string> = {
  k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn",
};

export interface SquareMark {
  className?: string;
  icon?: string;
}

export interface CourtyardMatchProps {
  /** Small uppercase line above the title, e.g. "ATOMIC · THE CLASSIC COLLECTION". */
  eyebrow: string;
  title: string;
  board: ({ type: string; color: string } | null)[][];
  selectedSquare: string | null;
  legalMoves: Set<string>;
  lastMove: { from: string; to: string } | null;
  checkSquare: string | null;
  onSquareClick: (sq: string) => void;
  /** Squares the player cannot see (Fog of War). They are not clickable. */
  hiddenSquares?: Set<string> | null;
  /** Extra marks per square: frozen, jumped, exploding, poisoned... */
  squareMarks?: Record<string, SquareMark>;
  botName: string;
  botElo?: number;
  isBotThinking?: boolean;
  capturedByWhite: string[];
  capturedByBlack: string[];
  materialAdvantage: number;
  botActive: boolean;
  playerActive: boolean;
  /** Small status sentence shown under the board heading. */
  status?: string;
  /** Extra buttons next to New game / Resign. */
  tools?: ReactNode;
  /** Mode-specific sidebar panels rendered above the move list. */
  sidePanels?: ReactNode;
  /** Modal overlays (maths questions etc.), rendered inside the courtyard root. */
  overlays?: ReactNode;
  history: string[];
  winner: "w" | "b" | null;
  resultTitle?: string;
  onNewGame: () => void;
  onExit: () => void;
}

function CapturedRow({ pieces }: { pieces: string[] }) {
  return (
    <span aria-label={`${pieces.length} captured`} style={{ letterSpacing: 1 }}>
      {pieces.map((p, i) => (
        <span key={i}>{CAPTURED_SYMBOLS[p] || p}</span>
      ))}
    </span>
  );
}

export default function CourtyardMatch({
  eyebrow,
  title,
  board,
  selectedSquare,
  legalMoves,
  lastMove,
  checkSquare,
  onSquareClick,
  hiddenSquares = null,
  squareMarks = {},
  botName,
  botElo,
  isBotThinking = false,
  capturedByWhite,
  capturedByBlack,
  materialAdvantage,
  botActive,
  playerActive,
  status,
  tools,
  sidePanels,
  overlays,
  history,
  winner,
  resultTitle,
  onNewGame,
  onExit,
}: CourtyardMatchProps) {
  const { prefs, open } = usePreferences();

  const pairs: { num: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ num: i / 2 + 1, white: history[i], black: history[i + 1] });
  }

  return (
    <div className="courtyard play-workspace">
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

      <main className="court-match">
        <section className="board-column">
          <div className="match-heading">
            <div>
              <div className="eyebrow">{eyebrow}</div>
              <h1>{title}</h1>
            </div>
          </div>
          {status && <p className="match-status">{status}</p>}

          <div className={`player-line ${botActive ? "active" : ""}`}>
            <span>
              ● {botName}
              {botElo !== undefined && !prefs.hideRatings ? ` · ${botElo}` : ""}
              <small>
                {isBotThinking ? "Thinking…" : botActive ? "To move" : "Waiting"}
                {capturedByBlack.length > 0 && (
                  <>
                    {" · "}
                    <CapturedRow pieces={capturedByBlack} />
                  </>
                )}
              </small>
            </span>
            <strong>
              {materialAdvantage < 0 ? `+${-materialAdvantage}` : ""}
            </strong>
          </div>

          <div className="board-wrap">
            <div
              className="court-board"
              role="group"
              aria-label={`${title} chess board`}
            >
              {RANKS.map((rank, r) =>
                FILES.map((file, f) => {
                  const sq = `${file}${rank}`;
                  const piece = board[r][f];
                  const hidden = hiddenSquares ? !hiddenSquares.has(sq) : false;
                  const mark = squareMarks[sq];
                  const isLast =
                    prefs.lastMove &&
                    (lastMove?.from === sq || lastMove?.to === sq);
                  return (
                    <button
                      key={sq}
                      className={`square ${(r + f) % 2 ? "dark" : "light"} ${
                        selectedSquare === sq ? "selected" : ""
                      } ${isLast ? "last" : ""} ${
                        checkSquare === sq ? "check" : ""
                      } ${hidden ? "fogged" : ""} ${mark?.className || ""}`}
                      aria-label={`${sq}, ${
                        hidden
                          ? "hidden by fog"
                          : piece
                            ? `${piece.color === "w" ? "White" : "Black"} ${PIECE_NAMES[piece.type]}`
                            : "empty"
                      }`}
                      onClick={() => !hidden && onSquareClick(sq)}
                      onKeyDown={(e) => {
                        const shifts: Record<string, number> = {
                          ArrowRight: 1,
                          ArrowLeft: -1,
                          ArrowDown: 8,
                          ArrowUp: -8,
                        };
                        if (e.key in shifts) {
                          e.preventDefault();
                          const nodes = Array.from(
                            e.currentTarget.parentElement!.querySelectorAll(
                              "button",
                            ),
                          );
                          const i = nodes.indexOf(e.currentTarget);
                          nodes[
                            Math.max(0, Math.min(63, i + shifts[e.key]))
                          ]?.focus();
                        }
                      }}
                    >
                      {prefs.coordinates && f === 0 && (
                        <small aria-hidden="true" className="rank">
                          {rank}
                        </small>
                      )}
                      {prefs.coordinates && r === 7 && (
                        <small aria-hidden="true" className="file">
                          {file}
                        </small>
                      )}
                      {piece && !hidden && (
                        <span
                          aria-hidden="true"
                          className={`piece ${piece.color}`}
                        >
                          {
                            PIECE_SYMBOLS[
                              (prefs.pieces === "solid" ? "b" : piece.color) +
                                piece.type
                            ]
                          }
                        </span>
                      )}
                      {prefs.legalDots && legalMoves.has(sq) && !hidden && (
                        <i className="move-dot" />
                      )}
                      {mark?.icon && (
                        <span
                          aria-hidden="true"
                          className={`effect ${mark.className || ""}`}
                        >
                          {mark.icon}
                        </span>
                      )}
                    </button>
                  );
                }),
              )}
            </div>

            {winner && (
              <div className="court-overlay" role="dialog" aria-modal="true">
                <div className="court-panel" style={{ textAlign: "center" }}>
                  <div className="eyebrow">GAME OVER</div>
                  <h2>
                    {resultTitle ||
                      (winner === "w" ? "You win. Well played." : "The bot wins this one.")}
                  </h2>
                  <div className="answer-actions" style={{ justifyContent: "center" }}>
                    <button className="primary" onClick={onNewGame}>
                      Play again
                    </button>
                    <button onClick={onExit}>Back to the collection</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`player-line ${playerActive ? "active" : ""}`}>
            <span>
              ○ You
              <small>
                {playerActive ? "Your turn" : "Waiting"}
                {capturedByWhite.length > 0 && (
                  <>
                    {" · "}
                    <CapturedRow pieces={capturedByWhite} />
                  </>
                )}
              </small>
            </span>
            <strong>{materialAdvantage > 0 ? `+${materialAdvantage}` : ""}</strong>
          </div>

          <div className="material-strip">
            {materialAdvantage === 0
              ? "Material is level."
              : materialAdvantage > 0
                ? `You are up ${materialAdvantage} in material.`
                : `The bot is up ${-materialAdvantage} in material.`}
          </div>

          <div className="board-tools">
            <button onClick={onNewGame}>New game</button>
            {tools}
            <button
              onClick={() => {
                if (window.confirm("Resign and leave this game?")) onExit();
              }}
            >
              Resign
            </button>
          </div>
        </section>

        <aside className="court-sidebar">
          {sidePanels}
          <section className="court-panel">
            <div className="eyebrow">MOVES</div>
            <ol className="journal" aria-label="Move list">
              {pairs.length === 0 && (
                <small>No moves yet. Your first move starts the record.</small>
              )}
              {pairs.map((p) => (
                <li key={p.num}>
                  {p.white}
                  {p.black ? ` · ${p.black}` : ""}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </main>
      {overlays}
    </div>
  );
}
