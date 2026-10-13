import { usePreferences } from "./preferences";
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
            {p && (
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
    </div>
  );
}
