import { useEffect, useMemo, useRef, useState } from "react";
import { usePreferences } from "./preferences";
import { diffGlides, type Glide, type GlidePiece } from "./pieceGlide";
import PieceGlideLayer, { GLIDE_MS, motionOK } from "./PieceGlideLayer";
import MatiksPiece from "../components/MatiksPiece";
import {
  fogFromFen,
  squareName,
  colorOf,
  type FogPiece,
} from "../online/fogRules";

const ROLE: Record<string, string> = {
  p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
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
  lastMove = [],
}: {
  fen: string;
  fogSquares: number[];
  selected: number | null;
  dests: number[];
  onSquare: (sq: number) => void;
  flip?: boolean;
  /** Squares the last move touched - only sent when visible to the viewer. */
  lastMove?: number[];
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
    <div className="matiks-board-wrap w-full max-w-[640px] aspect-square">
      <div className="matiks-board court-board relative" role="group" aria-label="Fog of War chess board">
        {Array.from({ length: 64 }, (_, i) => {
          const sq = flip
              ? Math.floor(i / 8) * 8 + 7 - (i % 8)
              : (7 - Math.floor(i / 8)) * 8 + (i % 8),
            p: FogPiece | null = state.board[sq],
            name = squareName(sq),
            hidden = fog.has(sq);
          const color = p ? colorOf(p) : null;
          const isCapture = Boolean(p && !hidden);

          return (
            <button
              key={sq}
              className={`matiks-square square ${(Math.floor(i / 8) + (i % 8)) % 2 ? "dark" : "light"} ${selected === sq ? "selected" : ""} ${hidden ? "fogged opacity-30" : ""} ${lastMove.includes(sq) ? "last-move last" : ""}`}
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
                <small className="rank coord-rank" aria-hidden="true">
                  {flip ? Math.floor(i / 8) + 1 : 8 - Math.floor(i / 8)}
                </small>
              )}
              {prefs.coordinates && i >= 56 && (
                <small className="file coord-file" aria-hidden="true">
                  {name[0]}
                </small>
              )}
              {p && !hidden && !hiding.has(sq) && (
                <div className="piece-wrapper" aria-hidden="true">
                  <MatiksPiece
                    type={p.toLowerCase()}
                    color={color === "w" ? "w" : "b"}
                  />
                </div>
              )}
              {prefs.legalDots && dests.includes(sq) && (
                isCapture ? (
                  <span className="matiks-capture-ring" aria-hidden="true" />
                ) : (
                  <i className="matiks-move-dot move-dot" aria-hidden="true" />
                )
              )}
            </button>
          );
        })}
        <PieceGlideLayer
          glides={glides}
          batch={batch}
          flip={flip}
          render={(piece) => ({
            text: (
              <div className="piece-wrapper" aria-hidden="true">
                <MatiksPiece
                  type={piece.role.slice(0, 1).toLowerCase()}
                  color={piece.color === "white" ? "w" : "b"}
                />
              </div>
            ),
            cls: `piece ${piece.color === "white" ? "w" : "b"}`,
          })}
        />
      </div>
    </div>
  );
}
