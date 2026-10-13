import { Position } from "chessops/variant";
import { makeSquare } from "chessops/util";
import { usePreferences } from "./preferences";
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
}: {
  pos: Position;
  selected: number | null;
  dests: number[];
  onSquare: (sq: number) => void;
  flip?: boolean;
}) {
  const { prefs } = usePreferences();
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
            className={`square ${(Math.floor(i / 8) + (i % 8)) % 2 ? "dark" : "light"} ${selected === sq ? "selected" : ""}`}
            aria-label={`${name}, ${p ? p.color + " " + p.role : "empty"}`}
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
    </div>
  );
}
