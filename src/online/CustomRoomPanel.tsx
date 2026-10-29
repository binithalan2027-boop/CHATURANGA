import { useState } from "react";
import { api } from "./client";
import type { CustomKind, CustomView } from "./customTypes";
import OnlineMatchView from "./OnlineMatchView";

const names: Record<CustomKind, string> = {
  mind: "Chess MM (Mind Before Move)",
  mantra: "Mantra Duel",
  cross3: "3-Player Cross-Board",
  cross4: "4-Player Cross-Board",
};

const kindDescriptions: Record<CustomKind, string> = {
  mind: "Solve mental math challenges to unlock moves and cast power spells.",
  mantra: "Fast-paced tactical chess duel with magical powers & spell cards.",
  cross3: "Three-player battle on an expanded cross board with king-capture rules.",
  cross4: "Four-player free-for-all battlefield. Eliminate rivals to win.",
};

export default function CustomRoomPanel({
  rooms,
  run,
  currentUserId = "",
}: {
  rooms: CustomView[];
  run: (f: () => Promise<unknown>) => Promise<boolean>;
  currentUserId?: string;
}) {
  const [kind, setKind] = useState<CustomKind>("mind");
  const [minutes, setMinutes] = useState(5);
  const [selected, setSelected] = useState("");
  const [code, setCode] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [inMatchScreen, setInMatchScreen] = useState(false);

  const selectedRoom = rooms.find((r) => r.id === selected);

  // If user joins or creates an active room and enters match screen, render OnlineMatchView!
  if (inMatchScreen && selected) {
    if (selectedRoom) {
      return (
        <OnlineMatchView
          customRoom={selectedRoom}
          currentUserId={currentUserId}
          onExit={() => {
            setInMatchScreen(false);
            setSelected("");
          }}
          run={run}
        />
      );
    }
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0E0E0E] text-[#F4F4F4] flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-[#AFF65B]/30 flex items-center justify-center mb-4 shadow-xl">
          <span className="w-6 h-6 rounded-full border-2 border-[#AFF65B] border-t-transparent animate-spin" />
        </div>
        <div className="matiks-kicker text-[#AFF65B] text-xs tracking-widest mb-1">
          CUSTOM ARENA
        </div>
        <h2 className="matiks-headline text-2xl sm:text-3xl text-white mb-2 uppercase">
          ENTERING CUSTOM ARENA {selected}
        </h2>
        <p className="text-xs text-[#8A8A8A] max-w-sm mb-6">
          Connecting to multiplayer battlefield...
        </p>
        <button
          type="button"
          onClick={() => {
            setInMatchScreen(false);
            setSelected("");
          }}
          className="btn-raised px-5 py-2.5 text-xs font-bold rounded-full cursor-pointer hover:border-white/30"
        >
          ← Return to Lobby
        </button>
      </div>
    );
  }

  const handleCreate = () => {
    void run(async () => {
      const r = await api<{ room: string }>("custom-create", { kind, minutes });
      setSelected(r.room);
      setInMatchScreen(true);
    });
  };

  const handleJoin = () => {
    if (!code) return;
    void run(async () => {
      await api("custom-join", { room: code });
      setSelected(code);
      setInMatchScreen(true);
    });
  };

  const copyCode = (roomId: string) => {
    navigator.clipboard?.writeText(roomId);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyInviteLink = (roomId: string) => {
    const link = `https://chaturanga-jpy3.onrender.com/?room=${encodeURIComponent(roomId)}`;
    navigator.clipboard?.writeText(link);
    setCopiedLinkId(roomId);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  return (
    <section className="online-card custom-panel bg-[#141414] border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Section Header */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#AFF65B] mb-1">
          CUSTOM & MULTI-PLAYER COMPETE
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white m-0 tracking-wide uppercase">
          Four Corners, Maths & Special Modes
        </h2>
        <p className="text-xs text-[#8A8A8A] mt-1 max-w-2xl leading-relaxed">
          Private, server-checked rooms. Play "Mind Before Move", tactical spell duels, or 3/4-player cross-boards with friends anywhere in the world.
        </p>
      </div>

      {/* CREATE & JOIN BUTTON CARDS (Separated, High-Impact Modern Neo-Brutalist Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Create Custom Room */}
        <div className="bg-[#1A1A1A] border border-white/10 hover:border-[#AFF65B]/40 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">✨</span>
              <h3 className="text-base font-bold text-white m-0 uppercase tracking-wide">
                Create a Custom Room
              </h3>
            </div>
            <p className="text-xs text-[#888] m-0 mb-4">
              Select your favorite game mode and duration, then invite your friends with a private link.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777] mb-1.5">
                  Custom Game Mode
                </label>
                <select
                  aria-label="Custom mode"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as CustomKind)}
                  className="w-full bg-[#242424] text-white text-xs font-semibold px-4 py-3.5 rounded-2xl text-sm border border-white/10 focus:border-[#AFF65B] focus:outline-none cursor-pointer"
                >
                  {Object.entries(names).map(([k, n]) => (
                    <option key={k} value={k}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="block text-[11px] text-[#AFF65B] mt-1.5 font-medium">
                  {kindDescriptions[kind]}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777] mb-1.5">
                  Time Control
                </label>
                <select
                  aria-label="Time limit"
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="w-full bg-[#242424] text-white text-xs font-semibold px-4 py-3.5 rounded-2xl text-sm border border-white/10 focus:border-[#AFF65B] focus:outline-none cursor-pointer"
                >
                  <option value={3}>3 Minutes (Blitz)</option>
                  <option value={5}>5 Minutes (Rapid)</option>
                  <option value={10}>10 Minutes (Classical)</option>
                  <option value={15}>15 Minutes (Deep Think)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="w-full py-3 bg-[#AFF65B] hover:bg-white text-black font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="text-base font-bold">➕</span>
            <span>Create Custom Room</span>
          </button>
        </div>

        {/* Card 2: Join Custom Room */}
        <div className="bg-[#1A1A1A] border border-white/10 hover:border-white/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🚪</span>
              <h3 className="text-base font-bold text-white m-0 uppercase tracking-wide">
                Join with Room Code
              </h3>
            </div>
            <p className="text-xs text-[#888] m-0 mb-4">
              Enter the 6-character room code shared by your friend to jump straight into their game.
            </p>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777] mb-1.5">
                6-Digit Custom Code
              </label>
              <input
                value={code}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                placeholder="e.g. CPY36E"
                className="w-full bg-[#242424] text-white font-mono font-bold tracking-widest text-base uppercase px-4 py-3.5 rounded-2xl text-sm border border-white/10 focus:border-[#AFF65B] focus:outline-none placeholder:text-[#555]"
                onChange={(e) => setCode(e.target.value.trim().toLowerCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code) {
                    e.preventDefault();
                    handleJoin();
                  }
                }}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={!code}
            onClick={handleJoin}
            className="w-full py-3 bg-[#2A2A2A] hover:bg-[#383838] text-white font-extrabold text-sm rounded-xl border border-white/20 transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="text-base">🚀</span>
            <span>Join Custom Room</span>
          </button>
        </div>
      </div>

      {/* Your Custom Rooms List */}
      {rooms.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#888] m-0">
            Your Active & Waiting Custom Rooms
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rooms.map((r) => {
              const isActive = r.status === "active";
              const isWaiting = r.status === "waiting";
              const isSelected = selected === r.id;

              return (
                <div
                  key={r.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? "bg-[#1E2319] border-[#AFF65B]"
                      : "bg-[#1A1A1A] border-white/10 hover:border-white/25"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isActive ? "bg-[#AFF65B] animate-pulse" : "bg-amber-400"
                          }`}
                        />
                        <span className="font-bold text-sm text-white">{names[r.kind]}</span>
                      </div>
                      <div className="text-xs text-[#888] mt-1">
                        Code:{" "}
                        <code className="text-[#AFF65B] font-mono font-bold bg-black/50 px-1.5 py-0.5 rounded border border-[#AFF65B]/20">
                          {r.id.toUpperCase()}
                        </code>{" "}
                        · {r.players.length}/{r.capacity} Players
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-[#AFF65B]/20 text-[#AFF65B] border border-[#AFF65B]/30"
                          : isWaiting
                            ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                            : "bg-zinc-700/40 text-zinc-400"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                    {/* Enter / Resume Game Screen Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(r.id);
                        setInMatchScreen(true);
                      }}
                      className="flex-1 py-2 px-3 bg-[#AFF65B] hover:bg-white text-black font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>⚔️</span>
                      <span>{isActive ? "Play Match Now" : "Enter Match Room"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyInviteLink(r.id)}
                      className="py-2 px-2.5 bg-[#252525] hover:bg-[#333] text-[#AFF65B] text-xs font-semibold rounded-xl border border-white/10 cursor-pointer"
                    >
                      {copiedLinkId === r.id ? "✓ Link Copied!" : "📋 Invite Link"}
                    </button>

                    <button
                      type="button"
                      onClick={() => copyCode(r.id)}
                      className="py-2 px-2.5 bg-[#252525] hover:bg-[#333] text-white text-xs font-semibold rounded-xl border border-white/10 cursor-pointer"
                    >
                      {copiedId === r.id ? "✓ Copied" : "Copy Code"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
