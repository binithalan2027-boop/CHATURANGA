import { Chess, Square } from "chess.js";
import { usePreferences } from "./preferences";
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
export default function PositionBoard({
  fen,
  selected,
  legal,
  onSquare,
  flip = false,
}: {
  fen: string;
  selected: Square | null;
  legal: Square[];
  onSquare: (s: Square) => void;
  flip?: boolean;
}) {
  const { prefs } = usePreferences(),
    c = new Chess(fen);
  return (
    <div className="court-board" role="group" aria-label="Practice chess board">
      {(flip ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]).flatMap(
        (rank, r) =>
          (flip ? [..."hgfedcba"] : [..."abcdefgh"]).map((file, f) => {
            const sq = `${file}${rank}` as Square,
              p = c.get(sq);
            return (
              <button
                key={sq}
                className={`square ${(r + f) % 2 ? "dark" : "light"} ${selected === sq ? "selected" : ""}`}
                aria-label={`${sq}, ${p ? (p.color === "w" ? "White" : "Black") + " " + p.type : "empty"}`}
                onClick={() => onSquare(sq)}
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
                      ),
                      i = nodes.indexOf(e.currentTarget);
                    nodes[Math.max(0, Math.min(63, i + shifts[e.key]))].focus();
                  }
                }}
              >
                {prefs.coordinates && f === 0 && (
                  <small className="rank">{rank}</small>
                )}
                {prefs.coordinates && r === 7 && (
                  <small className="file">{file}</small>
                )}
                {p && (
                  <span className={`piece ${p.color}`}>
                    {
                      symbols[
                        (prefs.pieces === "solid" ? "b" : p.color) + p.type
                      ]
                    }
                  </span>
                )}
                {prefs.legalDots && legal.includes(sq) && (
                  <i className="move-dot" />
                )}
              </button>
            );
          }),
      )}
    </div>
  );
}
