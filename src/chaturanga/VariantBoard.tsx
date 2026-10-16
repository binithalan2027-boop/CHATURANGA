import { useEffect, useMemo, useRef, useState } from "react";
import { Position } from "chessops/variant";
import { makeSquare } from "chessops/util";
import { navIndex } from "./boardNav";
import { usePreferences } from "./preferences";
import { diffGlides, type Glide, type GlidePiece } from "./pieceGlide";
import PieceGlideLayer, { GLIDE_MS, motionOK } from "./PieceGlideLayer";
/** Display-grid position of a square, honouring the board flip. */
function drawXY(sq: number, flip: boolean) {
  const row = Math.floor(sq / 8),
    col = sq % 8;
  return flip ? { x: 7 - col, y: row } : { x: col, y: 7 - row };
}
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
  premove = [],
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
  /** Squares of a queued premove (from/to), shown as a blue ring. */
  premove?: number[];
}) {
  const { prefs } = usePreferences();
  // Player-drawn annotations, chess.com style: right-click a square to
  // highlight it, right-drag between squares to draw an arrow. Drawings
  // are personal, local to this board, and clear on the next move or
  // left-click - they never leave the client.
  const [marks, setMarks] = useState<number[]>([]);
  const [arrows, setArrows] = useState<[number, number][]>([]);
  const dragStart = useRef<number | null>(null);
  const clearDrawings = () => {
    setMarks((m) => (m.length ? [] : m));
    setArrows((a) => (a.length ? [] : a));
  };
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
    clearDrawings();
  }, [boardArr]);
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
            className={`square ${(Math.floor(i / 8) + (i % 8)) % 2 ? "dark" : "light"} ${selected === sq ? "selected" : ""} ${lastMove.includes(sq) ? "last-move" : ""} ${checkSq === sq ? "in-check" : ""} ${premove.includes(sq) ? "premove" : ""}`}
            aria-label={`${name}, ${p ? p.color + " " + p.role : "empty"}${checkSq === sq ? ", in check" : ""}`}
            onClick={() => {
              clearDrawings();
              onSquare(sq);
            }}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              if (e.button === 2) dragStart.current = sq;
            }}
            onPointerUp={(e) => {
              if (e.button !== 2 || dragStart.current === null) return;
              const from = dragStart.current;
              dragStart.current = null;
              if (from === sq) {
                setMarks((m) =>
                  m.includes(sq) ? m.filter((x) => x !== sq) : [...m, sq],
                );
              } else {
                setArrows((a) => {
                  const dup = a.findIndex(
                    ([f, t]) => f === from && t === sq,
                  );
                  if (dup >= 0) return a.filter((_, i) => i !== dup);
                  return [...a, [from, sq]];
                });
              }
            }}
            onKeyDown={(e) => {
              const next = navIndex(i, e.key);
              if (next === null) return;
              e.preventDefault();
              const b =
                e.currentTarget.parentElement!.querySelectorAll("button");
              b[next].focus();
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
      {(marks.length > 0 || arrows.length > 0) && (
        <svg
          className="draw-layer"
          viewBox="0 0 8 8"
          aria-hidden="true"
        >
          {marks.map((sq) => {
            const { x, y } = drawXY(sq, flip);
            return (
              <rect
                key={sq}
                className="draw-mark"
                x={x}
                y={y}
                width={1}
                height={1}
              />
            );
          })}
          {arrows.map(([from, to]) => {
            const a = drawXY(from, flip),
              b = drawXY(to, flip);
            const ax = a.x + 0.5,
              ay = a.y + 0.5,
              bx = b.x + 0.5,
              by = b.y + 0.5;
            const dx = bx - ax,
              dy = by - ay,
              len = Math.hypot(dx, dy);
            if (len < 0.2) return null;
            const ux = dx / len,
              uy = dy / len,
              px = -uy,
              py = ux;
            const tipX = bx - ux * 0.08,
              tipY = by - uy * 0.08,
              baseX = tipX - ux * 0.42,
              baseY = tipY - uy * 0.42;
            return (
              <g key={`${from}-${to}`} className="draw-arrow">
                <line x1={ax} y1={ay} x2={baseX} y2={baseY} />
                <polygon
                  points={`${tipX},${tipY} ${baseX + px * 0.3},${baseY + py * 0.3} ${baseX - px * 0.3},${baseY - py * 0.3}`}
                />
              </g>
            );
          })}
        </svg>
      )}
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
