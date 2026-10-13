import { useState } from "react";
import { Chess, Square } from "chess.js";
import PositionBoard from "./PositionBoard";
export default function HomeBoard() {
  const [fen, setFen] = useState(() => new Chess().fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const c = new Chess(fen);
  const legal = selected
    ? c.moves({ square: selected, verbose: true }).map((m) => m.to)
    : [];
  return (
    <section className="home-board-live" aria-label="Instant local board">
      <div className="section-line">
        <strong>Your board is already open.</strong>
        <button
          onClick={() => {
            setFen(new Chess().fen());
            setSelected(null);
          }}
        >
          Reset board
        </button>
      </div>
      <PositionBoard
        fen={fen}
        selected={selected}
        legal={legal}
        onSquare={(sq) => {
          if (selected && legal.includes(sq)) {
            c.move({ from: selected, to: sq, promotion: "q" });
            setFen(c.fen());
            setSelected(null);
          } else setSelected(c.get(sq)?.color === c.turn() ? sq : null);
        }}
      />
      <p role="status">
        {c.isCheckmate()
          ? "Checkmate"
          : c.isDraw()
            ? "Draw"
            : `${c.turn() === "w" ? "White" : "Black"} to move${c.isCheck() ? " · Check" : ""}`}
      </p>
      <small>
        Free local board for two people. No clock, rating or computer. Pawns
        promote to queen here; full play has a choice.
      </small>
    </section>
  );
}
