import { useEffect, useMemo, useRef, useState } from "react";
import { usePreferences } from "./preferences";
import { diffGlides, type Glide, type GlidePiece } from "./pieceGlide";
import PieceGlideLayer, { GLIDE_MS, motionOK } from "./PieceGlideLayer";
import {
  fogFromFen,
  squareName,
  colorOf,
  type FogPiece,
} from "../online/fogRules";

const OUTLINE: Record<string, string> = {
  p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔",
};
const SOLID: Record<string, string> = {
  p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚",
};
const ROLE: Record<string, string> = {
  p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
};
const LETTER: Record<string, string> = {
  pawn: "p", knight: "n", bishop: "b", rook: "r", queen: "q", king: "k",
};

/**
 * Board for online Fog of War. Renders only what the server projected:
 * visible pieces plus fogged squares. Hidden information is not in the
 * client at all, so this component cannot leak it.
 */
export default function FogBoard({
  fen,
  fogSquares,
  selected,
  dests,
  onSquare,
  flip = false,
}: {
  fen: string;
  fogSquares: number[];
  selected: number | null;
  dests: number[];
  onSquare: (sq: number) => void;
  flip?: boolean;
}) {
  const { prefs } = usePreferences();
  const state = fogFromFen(fen);
  const fog = new Set(fogSquares);
  const boardArr = useMemo<(GlidePiece | null)[]>(
    () =>
      Array.from({ length: 64 }, (_, sq) => {
        const p: FogPiece | null = state.board[sq];
        return p
          ? {
              color: colorOf(p) === "w" ? "white" : "black",
              role: ROLE[p.toLowerCase()],
            }
          : null;
      }),
    [fen],
  );
  const animRef = useRef({ board: boardArr, batch: 0 });
  const [glides, setGlides] = useState<Glide[]>([]);
  if (animRef.current.board !== boardArr) {
    const g = motionOK() ? diffGlides(animRef.current.board, boardArr) : [];
    animRef.current = { board: boardArr, batch: animRef.current.batch + 1 };
    if (g.length) setGlides(g);
  }
  useEffect(() => {
    if (!glides.length) return;
    const t = setTimeout(() => setGlides([]), GLIDE_MS + 60);
    return () => clearTimeout(t);
  }, [glides]);
  const hiding = new Set(glides.map((g) => g.to));
  return (
    <div className="court-board" role="group" aria-label="Fog of War chess board">
      {Array.from({ length: 64 }, (_, i) => {
        const sq = flip
            ? Math.floor(i / 8) * 8 + 7 - (i % 8)
            : (7 - Math.floor(i / 8)) * 8 + (i % 8),
          p: FogPiece | null = state.board[sq],
          name = squareName(sq),
          hidden = fog.has(sq);
        const color = p ? colorOf(p) : null;
        return (
          <button
            key={sq}
            className={`square ${(Math.floor(i / 8) + (i % 8)) % 2 ? "dark" : "light"} ${selected === sq ? "selected" : ""} ${hidden ? "fogged" : ""}`}
            aria-label={
              hidden
                ? `${name}, fog`
                : `${name}, ${p ? (color === "w" ? "white" : "black") + " " + ROLE[p.toLowerCase()] : "empty"}`
            }
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
            {p && !hidden && !hiding.has(sq) && (
              <span
                className={`piece ${color === "w" ? "w" : "b"}`}
                aria-hidden="true"
              >
                {(prefs.pieces === "solid" || color === "b" ? SOLID : OUTLINE)[
                  p.toLowerCase()
                ]}
              </span>
            )}
            {prefs.legalDots && dests.includes(sq) && <i className="move-dot" />}
          </button>
        );
      })}
      <PieceGlideLayer
        glides={glides}
        batch={animRef.current.batch}
        flip={flip}
        render={(piece) => ({
          text: (
            prefs.pieces === "solid" || piece.color === "black"
              ? SOLID
              : OUTLINE
          )[LETTER[piece.role]],
          cls: `piece ${piece.color === "white" ? "w" : "b"}`,
        })}
      />
    </div>
  );
}
