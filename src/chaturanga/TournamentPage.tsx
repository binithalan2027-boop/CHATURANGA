import { useState, useEffect } from "react";
import {
  makeTournament,
  standings,
  joinLocalTournament,
  LocalTournament,
  Fixture,
} from "./tournament";

export default function TournamentPage({
  onExit,
  onPlayBot,
}: {
  onExit: () => void;
  onPlayBot?: () => void;
}) {
  const [t, setT] = useState<LocalTournament | null>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("chaturanga-tournament-v1") || "null",
      );
    } catch {
      return null;
    }
  });
  const [name, setName] = useState("Courtyard Round Robin");
  const [players, setPlayers] = useState("");
  const [join, setJoin] = useState("");
  const [error, setError] = useState("");
  const [showOrganizer, setShowOrganizer] = useState(false);

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
    <div className="min-h-[calc(100vh-64px)] bg-[#0E0E0E] text-[#F4F4F4] font-body p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <span className="matiks-kicker block mb-1">
              FUTURE CONCEPT · COMING LATER
            </span>
            <h1 className="matiks-headline text-4xl lg:text-5xl text-[#F4F4F4] m-0">
              TOURNAMENTS
            </h1>
            <p className="text-sm text-[#8A8A8A] mt-2 mb-0 max-w-xl">
              Competitive arena events and Swiss brackets are coming later. In the meantime, challenge local bots or organize an offline round robin.
            </p>
          </div>
          <button onClick={onExit} className="btn-raised py-2.5 px-4 text-xs">
            Back to Home
          </button>
        </div>

        {/* Hero Bento Banner matching 09-web-events-coming-soon.svg */}
        <div className="bento-card bento-teal p-8 lg:p-12 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl z-10">
            <span className="text-[11px] font-bold tracking-[2px] text-[#0E0E0E]/70 uppercase block mb-2">
              THE NEXT CHALLENGE · FUTURE RELEASE
            </span>
            <h2 className="font-heading text-4xl lg:text-6xl text-[#0E0E0E] m-0 leading-none mb-3">
              COMING LATER
            </h2>
            <p className="font-body text-sm lg:text-base text-[#0E0E0E]/85 m-0 mb-6">
              No scheduled events until online hosting is ready. We never fabricate fake participants, countdown timers, or mock join queues. All bots, training drills, and study tools remain 100% accessible offline right now.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onPlayBot || onExit}
                className="py-3.5 px-8 rounded-full bg-[#0E0E0E] hover:bg-[#1A1A1A] text-[#AFF65B] font-body text-sm font-bold cursor-pointer border-none shadow-lg transition-transform hover:scale-[1.02]"
              >
                Play a Bot Instead →
              </button>
              <button
                onClick={() => setShowOrganizer(!showOrganizer)}
                className="py-3.5 px-6 rounded-full bg-white/20 hover:bg-white/30 text-[#0E0E0E] font-body text-xs font-semibold cursor-pointer border-none transition-colors"
              >
                {showOrganizer ? "Hide Local Organizer" : "Organize Local Round Robin ▾"}
              </button>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center w-64 h-64 opacity-90">
            <img
              src="/illustrations/trophy.svg"
              alt="Tournament Trophy"
              className="w-full h-full object-contain filter drop-shadow-xl"
            />
          </div>
        </div>

        {/* 3 Concept Cards matching design spec */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bento-card bento-charcoal p-6 flex flex-col justify-between min-h-[170px]">
            <div>
              <span className="matiks-kicker text-[10px] block mb-1">
                ONLINE ARENAS
              </span>
              <h3 className="font-heading text-2xl text-[#F4F4F4] m-0">
                ARENA BLITZ
              </h3>
              <p className="text-xs text-[#8A8A8A] mt-2 mb-0">
                Non-stop fast pairings. Win streaks award bonus points over a timed arena duration.
              </p>
            </div>
            <span className="text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-wider">
              Requires live server
            </span>
          </div>

          <div className="bento-card bento-charcoal p-6 flex flex-col justify-between min-h-[170px]">
            <div>
              <span className="matiks-kicker text-[10px] block mb-1">
                FORMAL BRACKETS
              </span>
              <h3 className="font-heading text-2xl text-[#F4F4F4] m-0">
                SWISS TOURNAMENTS
              </h3>
              <p className="text-xs text-[#8A8A8A] mt-2 mb-0">
                Multi-round classical Swiss pairing system. Fair competition with no early elimination.
              </p>
            </div>
            <span className="text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-wider">
              Requires live server
            </span>
          </div>

          <div className="bento-card bento-charcoal p-6 flex flex-col justify-between min-h-[170px]">
            <div>
              <span className="matiks-kicker text-[10px] block mb-1">
                TIERED DIVISIONS
              </span>
              <h3 className="font-heading text-2xl text-[#F4F4F4] m-0">
                RATING TIERS
              </h3>
              <p className="text-xs text-[#8A8A8A] mt-2 mb-0">
                Compete against players in your target rating bracket: Under 1200, Under 1600, and Open.
              </p>
            </div>
            <span className="text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-wider">
              Requires live server
            </span>
          </div>
        </div>

        {/* Local Offline Round Robin Organizer */}
        {showOrganizer && (
          <div className="bento-card bento-charcoal p-6 lg:p-8 mt-2">
            <div className="border-b border-white/5 pb-4 mb-6 flex items-center justify-between">
              <div>
                <span className="matiks-kicker text-[10px] block mb-1">
                  OFFLINE CLUB UTILITY
                </span>
                <h3 className="font-heading text-2xl text-[#F4F4F4] m-0">
                  LOCAL ROUND ROBIN ORGANIZER
                </h3>
                <p className="text-xs text-[#8A8A8A] mt-1 mb-0">
                  Keep score for players gathering at the same physical chessboard.
                </p>
              </div>
              {t && (
                <button onClick={exportFile} className="btn-raised py-2 px-3 text-xs">
                  Export JSON
                </button>
              )}
            </div>

            {!t ? (
              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                    Tournament Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    className="w-full p-2.5 rounded-lg bg-[#262626] border border-white/10 text-xs text-[#F4F4F4] focus:outline-none focus:border-[#AFF65B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                    Player Names (one per line, 2-16 players)
                  </label>
                  <textarea
                    value={players}
                    onChange={(e) => setPlayers(e.target.value)}
                    placeholder="Alice&#10;Bob&#10;Charlie&#10;Diana"
                    rows={5}
                    maxLength={1100}
                    className="w-full p-2.5 rounded-lg bg-[#262626] border border-white/10 text-xs text-[#F4F4F4] focus:outline-none focus:border-[#AFF65B] resize-none"
                  />
                </div>
                <button onClick={create} className="btn-lime py-3 px-6 text-xs font-semibold">
                  Generate Tournament Schedule
                </button>
                {error && <p className="text-xs text-[#E5484D] m-0">{error}</p>}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading text-xl text-[#AFF65B] m-0">{t.name}</h4>
                  <button
                    onClick={() => {
                      if (window.confirm("Reset and clear this tournament?")) {
                        setT(null);
                        localStorage.removeItem("chaturanga-tournament-v1");
                      }
                    }}
                    className="text-xs text-[#E5484D] hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Clear tournament
                  </button>
                </div>

                {/* Standings Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-[#8A8A8A]">
                        <th className="py-2 pr-4 font-semibold">Player</th>
                        <th className="py-2 px-3 font-semibold">Played</th>
                        <th className="py-2 px-3 font-semibold">Wins</th>
                        <th className="py-2 pl-3 font-semibold text-[#AFF65B]">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings(t).map((s) => (
                        <tr key={s.name} className="border-b border-white/5">
                          <td className="py-2.5 pr-4 font-semibold text-[#F4F4F4]">{s.name}</td>
                          <td className="py-2.5 px-3 text-[#8A8A8A]">{s.played}</td>
                          <td className="py-2.5 px-3 text-[#8A8A8A]">{s.wins}</td>
                          <td className="py-2.5 pl-3 font-bold text-[#AFF65B]">{s.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Late Join Player if no results yet */}
                {t.fixtures.every((f) => !f.result) && (
                  <div className="flex items-center gap-2 max-w-sm">
                    <input
                      value={join}
                      onChange={(e) => setJoin(e.target.value)}
                      placeholder="Add player name"
                      className="flex-1 p-2 rounded-lg bg-[#262626] border border-white/10 text-xs text-[#F4F4F4] focus:outline-none focus:border-[#AFF65B]"
                    />
                    <button onClick={add} className="btn-raised py-2 px-3 text-xs whitespace-nowrap">
                      + Add Player
                    </button>
                  </div>
                )}

                {/* Fixtures List */}
                <div>
                  <span className="matiks-kicker text-[10px] block mb-2">
                    MATCH FIXTURES & RESULTS
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
                    {t.fixtures.map((f: Fixture, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-[#262626] border border-white/5 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-[#F4F4F4]">
                          {f.white} vs {f.black}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const next = { ...t };
                              next.fixtures[i].result = "1-0";
                              setT({ ...next });
                            }}
                            className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer border-none ${
                              f.result === "1-0" ? "bg-[#AFF65B] text-[#0E0E0E] font-bold" : "bg-[#1A1A1A] text-[#8A8A8A]"
                            }`}
                          >
                            1-0
                          </button>
                          <button
                            onClick={() => {
                              const next = { ...t };
                              next.fixtures[i].result = "1/2-1/2";
                              setT({ ...next });
                            }}
                            className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer border-none ${
                              f.result === "1/2-1/2" ? "bg-[#AFF65B] text-[#0E0E0E] font-bold" : "bg-[#1A1A1A] text-[#8A8A8A]"
                            }`}
                          >
                            ½-½
                          </button>
                          <button
                            onClick={() => {
                              const next = { ...t };
                              next.fixtures[i].result = "0-1";
                              setT({ ...next });
                            }}
                            className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer border-none ${
                              f.result === "0-1" ? "bg-[#AFF65B] text-[#0E0E0E] font-bold" : "bg-[#1A1A1A] text-[#8A8A8A]"
                            }`}
                          >
                            0-1
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
