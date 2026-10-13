import { useState } from "react";
import data from "./data/eco.json";
import { StudyLine, parsePgn } from "./study";
import { findOpening } from "./openingLookup";
export default function OpeningExplorer({
  line,
  index,
  onLoad,
}: {
  line: StudyLine;
  index: number;
  onLoad: (line: StudyLine) => void;
}) {
  const [query, setQuery] = useState("");
  const current = findOpening(line.fens.slice(0, index + 1));
  const results = query.trim()
    ? data
        .filter((o) =>
          `${o.eco} ${o.name}`.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 12)
    : [];
  return (
    <section className="court-panel">
      <div className="eyebrow">OPENINGS · LOCAL DATA</div>
      <h2>
        {current ? `${current.eco} · ${current.name}` : "Opening explorer"}
      </h2>
      <p>
        {data.length.toLocaleString()} legal named lines. Position lookup uses
        the most recent named position in your line. No win rates or popularity
        statistics.
      </p>
      <label>
        Find an opening
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or ECO code"
        />
      </label>
      {results.map((o) => (
        <div className="library-card" key={o.name + o.pgn}>
          <button onClick={() => onLoad(parsePgn(o.pgn))}>
            <strong>
              {o.eco} · {o.name}
            </strong>
            <small>{o.pgn}</small>
          </button>
        </div>
      ))}
      <a
        href="https://github.com/lichess-org/chess-openings"
        target="_blank"
        rel="noreferrer"
      >
        Lichess opening names · CC0 ↗
      </a>
    </section>
  );
}
