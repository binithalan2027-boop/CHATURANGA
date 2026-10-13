import { useState } from "react";
import { Chess, Square } from "chess.js";
import { MistakePuzzle } from "./mistakeDetector";
import PositionBoard from "./PositionBoard";
import { readableSuggestion } from "./AnalysisCoach";
export default function MistakePuzzlePractice({
  puzzle,
  onResult,
}: {
  puzzle: MistakePuzzle;
  onResult?: (solved: boolean) => void;
}) {
  const [selected, setSelected] = useState<Square | null>(null),
    [notice, setNotice] = useState(""),
    [show, setShow] = useState(false);
  const c = new Chess(puzzle.fen);
  const legal = selected
    ? c.moves({ square: selected, verbose: true }).map((m) => m.to)
    : [];
  return (
    <div className="mistake-practice">
      <h3>Revisit ply {puzzle.ply}</h3>
      <p>
        Your line played {puzzle.played}. Depth-8 estimate dropped{" "}
        {(puzzle.loss / 100).toFixed(2)} pawns. Find the stored engine
        candidate.
      </p>
      <PositionBoard
        fen={puzzle.fen}
        selected={selected}
        legal={legal}
        onSquare={(sq) => {
          if (selected && legal.includes(sq)) {
            const ok = selected + sq === puzzle.best.slice(0, 4);
            setNotice(
              ok
                ? "That matches the stored candidate."
                : "Legal move, but not the stored candidate. Alternatives have not been graded.",
            );
            if (onResult) onResult(ok);
            setSelected(null);
          } else setSelected(c.get(sq)?.color === c.turn() ? sq : null);
        }}
      />
      <button onClick={() => setShow(!show)}>
        {show ? "Hide candidate" : "Show candidate"}
      </button>
      {show && <p>{readableSuggestion(puzzle.fen, puzzle.best)}</p>}
      <p role="status">{notice}</p>
      <small>
        One low-depth candidate, not a verified unique solution. Promotions are
        not graded here.
      </small>
    </div>
  );
}
