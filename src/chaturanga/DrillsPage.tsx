import { useState } from "react";
import {
  Drill, dailyDrills, drillStats, loadStore, recordAttempt, saveStore,
} from "./drills";
import MistakePuzzlePractice from "./MistakePuzzlePractice";

export default function DrillsPage({ onExit }: { onExit: () => void }) {
  const [store, setStore] = useState(loadStore);
  const [current, setCurrent] = useState<Drill | null>(null);
  const stats = drillStats(store);
  const due = dailyDrills(store, 5);

  const attempt = (drill: Drill, solved: boolean) => {
    const next = { ...store, drills: [...store.drills] };
    recordAttempt(next, drill.id, solved);
    saveStore(next);
    setStore(next);
    if (solved) setCurrent(null);
  };

  return (
    <div className="courtyard play-workspace">
      <header className="court-header">
        <div className="court-brand">
          ♞{" "}
          <span>
            Daily drills
            <small>Puzzles from your own mistakes. On this device only.</small>
          </span>
        </div>
        <div className="court-header-actions">
          <button onClick={onExit}>Back home</button>
        </div>
      </header>
      <main className="court-match">
        <section className="board-column">
          <div className="match-heading">
            <div>
              <div className="eyebrow">PRACTICE FROM YOUR OWN GAMES</div>
              <h1>Daily drills</h1>
            </div>
          </div>
          {current ? (
            <div className="court-panel">
              <MistakePuzzlePractice
                puzzle={current}
                onResult={(ok) => attempt(current, ok)}
              />
              <button onClick={() => setCurrent(null)}>Back to today's set</button>
            </div>
          ) : (
            <section className="court-panel">
              <h2>Today's set ({due.length})</h2>
              {due.length === 0 ? (
                <p>
                  Nothing due. Scan one of your games in Study ("Practice a
                  missed opportunity") and save the results as drills - your
                  own mistakes become tomorrow's puzzles.
                </p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {due.map((d) => (
                    <li key={d.id} style={{ marginBottom: 8 }}>
                      <button onClick={() => setCurrent(d)}>
                        Ply {d.ply} - dropped {(d.loss / 100).toFixed(1)} pawns
                        {d.fails > 0 ? ` (retry, ${d.fails} misses)` : ""}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </section>
        <aside className="court-sidebar">
          <section className="court-panel">
            <h2>Your progress</h2>
            <p>
              {stats.solved} solved of {stats.total} drills. {stats.due} still
              due.
            </p>
            <p>
              {stats.streak > 0
                ? `${stats.streak}-day streak.`
                : "Solve one drill today to start a streak."}
            </p>
          </section>
          <section className="court-panel">
            <h2>How this works</h2>
            <p>
              Drills come from the mistake scanner in Study. Everything stays
              in this browser: no account, no upload, no rating.
            </p>
          </section>
        </aside>
      </main>
    </div>
  );
}
