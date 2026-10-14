import { useEffect, useMemo, useRef, useState } from "react";
import { Position } from "chessops/variant";
import { makeSquare } from "chessops/util";
import { usePreferences } from "./preferences";
import { diffGlides, type Glide, type GlidePiece } from "./pieceGlide";
import PieceGlideLayer, { GLIDE_MS, motionOK } from "./PieceGlideLayer";
const glyphs = {
  white: {
    pawn: "♙",
    knight: "♘",
    bishop: "♗",
    rook: "♖",
    queen: "♕",
    king: "♔",
  },
  black: {
    pawn: "♟",
    knight: "♞",
    bishop: "♝",
    rook: "♜",
    queen: "♛",
    king: "♚",
  },
};
export default function VariantBoard({
  pos,
  selected,
  dests,
  onSquare,
  flip = false,
  lastMove = [],
  checkSq = null,
}: {
  pos: Position;
  selected: number | null;
  dests: number[];
  onSquare: (sq: number) => void;
  flip?: boolean;
  /** Squares the last move touched (from/to, or to for drops). */
  lastMove?: number[];
  /** King square to flag when the side to move is in check. */
  checkSq?: number | null;
}) {
  const { prefs } = usePreferences();
  const boardArr = useMemo<(GlidePiece | null)[]>(
    () =>
      Array.from({ length: 64 }, (_, sq) => {
        const p = pos.board.get(sq);
        return p ? { color: p.color as GlidePiece["color"], role: p.role } : null;
      }),
    [pos],
  );
  const prevBoard = useRef(boardArr);
  const [glides, setGlides] = useState<Glide[]>([]);
  const [batch, setBatch] = useState(0);
  useEffect(() => {
    if (prevBoard.current === boardArr) return;
    const g = motionOK() ? diffGlides(prevBoard.current, boardArr) : [];
    prevBoard.current = boardArr;
    if (!g.length) return;
    setGlides(g);
    setBatch((x) => x + 1);
  }, [boardArr]);
  useEffect(() => {
    if (!glides.length) return;
    const t = setTimeout(() => setGlides([]), GLIDE_MS + 80);
    return () => clearTimeout(t);
  }, [glides]);
  const hiding = new Set(glides.map((g) => g.to));
  return (
    <div className="court-board" role="group" aria-label="Variant chess board">
      {Array.from({ length: 64 }, (_, i) => {
        const sq = flip
            ? Math.floor(i / 8) * 8 + 7 - (i % 8)
            : (7 - Math.floor(i / 8)) * 8 + (i % 8),
          p = pos.board.get(sq),
          name = makeSquare(sq);
        return (
          <button
            key={sq}
            className={`square ${(Math.floor(i / 8) + (i % 8)) % 2 ? "dark" : "light"} ${selected === sq ? "selected" : ""} ${lastMove.includes(sq) ? "last-move" : ""} ${checkSq === sq ? "in-check" : ""}`}
            aria-label={`${name}, ${p ? p.color + " " + p.role : "empty"}${checkSq === sq ? ", in check" : ""}`}
            onClick={() => onSquare(sq)}
            onKeyDown={(e) => {
              const delta: { [key: string]: number } = {
                ArrowRight: 1,
                ArrowLeft: -1,
                ArrowDown: 8,
                ArrowUp: -8,
              };
              if (e.key in delta) {
                e.preventDefault();
                const b =
                  e.currentTarget.parentElement!.querySelectorAll("button");
                b[Math.min(63, Math.max(0, i + delta[e.key]))].focus();
              }
            }}
          >
            {prefs.coordinates && i % 8 === 0 && (
              <small className="rank" aria-hidden="true">
                {flip ? Math.floor(i / 8) + 1 : 8 - Math.floor(i / 8)}
              </small>
            )}
            {prefs.coordinates && i >= 56 && (
              <small className="file" aria-hidden="true">
                {name[0]}
              </small>
            )}
            {p && !hiding.has(sq) && (
              <span
                className={`piece ${p.color === "white" ? "w" : "b"}`}
                aria-hidden="true"
              >
                {glyphs[prefs.pieces === "solid" ? "black" : p.color][p.role]}
              </span>
            )}
            {prefs.legalDots && dests.includes(sq) && (
              <i className="move-dot" />
            )}
          </button>
        );
      })}
      <PieceGlideLayer
        glides={glides}
        batch={batch}
        flip={flip}
        render={(piece) => ({
          text: glyphs[prefs.pieces === "solid" ? "black" : piece.color][
            piece.role as keyof (typeof glyphs)["white"]
          ],
          cls: `piece ${piece.color === "white" ? "w" : "b"}`,
        })}
      />
    </div>
  );
}
