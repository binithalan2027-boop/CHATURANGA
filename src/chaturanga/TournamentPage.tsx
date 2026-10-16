import { useState, useEffect } from "react";
import {
  makeTournament,
  standings,
  joinLocalTournament,
  LocalTournament,
  Fixture,
} from "./tournament";
export default function TournamentPage({ onExit }: { onExit: () => void }) {
  const [t, setT] = useState<LocalTournament | null>(() => {
      try {
        return JSON.parse(
          localStorage.getItem("chaturanga-tournament-v1") || "null",
        );
      } catch {
        return null;
      }
    }),
    [name, setName] = useState("Courtyard round robin"),
    [players, setPlayers] = useState(""),
    [join, setJoin] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    if (t) localStorage.setItem("chaturanga-tournament-v1", JSON.stringify(t));
  }, [t]);
  const create = () => {
    try {
      setT(makeTournament(name, players.split("\n")));
      setError("");
    } catch (e) {
      setError(String(e));
    }
  };
  const add = () => {
    try {
      if (t) setT(joinLocalTournament(t, join));
      setJoin("");
      setError("");
    } catch (e) {
      setError(String(e));
    }
  };
  const exportFile = () => {
    if (!t) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(t, null, 2)], { type: "application/json" }),
    );
    a.download = "local-tournament.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="courtyard play-workspace">
      <header className="court-header">
        <div className="court-brand">
          ♞
          <span>
            Tournaments<small>Gather round. Keep score.</small>
          </span>
        </div>
        <button onClick={onExit}>Back home</button>
      </header>
      <main className="tournament-content">
        <div className="eyebrow">LOCAL ORGANIZER · NOT ONLINE MATCHMAKING</div>
        <h1>A game for everyone at the table.</h1>
        <p>
          Create a round-robin schedule and enter results yourself. This local
          tool does not verify players, host matches, award ratings or send
          invitations.
        </p>
        {!t ? (
          <section className="court-panel">
            <h2>Create a local tournament</h2>
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </label>
            <label>
              Players, one per line
              <textarea
                value={players}
                onChange={(e) => setPlayers(e.target.value)}
                placeholder="2–16 distinct player names"
                maxLength={1100}
              />
            </label>
            <button className="primary" onClick={create}>
              Create schedule
            </button>
          </section>
        ) : (
          <>
            <section className="court-panel">
              <div className="settings-title">
                <h2>{t.name}</h2>
                <button
                  onClick={() => {
                    if (window.confirm("Remove this local tournament?")) {
                      setT(null);
                      localStorage.removeItem("chaturanga-tournament-v1");
                    }
                  }}
                >
                  New tournament
                </button>
              </div>
              <p>
                {t.players.length} players · {t.fixtures.length} matches ·{" "}
                {t.fixtures.filter((f) => f.result).length} results recorded
              </p>
              <div className="join-controls">
                <label>
                  Add a player before results start
                  <input
                    value={join}
                    onChange={(e) => setJoin(e.target.value)}
                    maxLength={60}
                  />
                </label>
                <button
                  disabled={t.fixtures.some((f) => f.result)}
                  onClick={add}
                >
                  Join local roster
                </button>
                <button onClick={exportFile}>Export tournament JSON</button>
              </div>
            </section>
            <div className="tournament-grid">
              <section className="court-panel">
                <h2>Pairings & results</h2>
                {Array.from(new Set(t.fixtures.map((f) => f.round))).map(
                  (round) => (
                    <div key={round} className="round">
                      <h3>Round {round}</h3>
                      {t.fixtures
                        .filter((f) => f.round === round)
                        .map((f) => (
                          <div key={f.id} className="fixture">
                            <span>
                              <strong>{f.white}</strong> <small>White</small>
                              <br />
                              <strong>{f.black}</strong> <small>Black</small>
                            </span>
                            <select
                              aria-label={`Result ${f.white} vs ${f.black}`}
                              value={f.result || ""}
                              onChange={(e) =>
                                setT((s) =>
                                  s
                                    ? {
                                        ...s,
                                        fixtures: s.fixtures.map((x) =>
                                          x.id === f.id
                                            ? {
                                                ...x,
                                                result: (e.target.value ||
                                                  null) as Fixture["result"],
                                              }
                                            : x,
                                        ),
                                      }
                                    : s,
                                )
                              }
                            >
                              <option value="">Pending</option>
                              <option value="1-0">White wins</option>
                              <option value="0-1">Black wins</option>
                              <option value="1/2-1/2">Draw</option>
                            </select>
                          </div>
                        ))}
                    </div>
                  ),
                )}
              </section>
              <section className="court-panel">
                <h2>Standings</h2>
                <p>
                  Ties use wins, then name for display only. No rating or
                  official tiebreak claim.
                </p>
                <table className="standings">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Played</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings(t).map((s) => (
                      <tr key={s.name}>
                        <td>{s.name}</td>
                        <td>{s.played}</td>
                        <td>{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          </>
        )}
        <p role="status">{error}</p>
      </main>
    </div>
  );
}
