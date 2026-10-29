import { useEffect, useMemo, useRef, useState } from "react";
import { roomLabel, sortRooms, filterRooms, timeAgo, ruleLabel, timeControlLabel } from "./roomList";
import type { LobbyFilter } from "./roomList";
import { RULE_VARIANTS } from "../chaturanga/variantCatalog";
import { getLocalStats, recordMatchRating } from "../chaturanga/stats";
import { formatPlayerId } from "../services/playerId";
import {
  api,
  createGuestSession,
  clearLocalTokens,
  localSignIn,
  socialSignIn,
  signOut,
  subscribe,
  token,
  LIVE_RENDER_SERVER_URL,
  setForcedBaseUrl,
  getActiveServerMode,
} from "./client";
import type { OnlineState, PlayerProfile, Provider, Rule } from "./types";
import "./online.css";
// Unified Custom & Variant Modes: Exactly 6 active modes, all others coming soon
export interface UnifiedModeItem {
  id: string;
  name: string;
  tag: string;
  summary: string;
  category: "active" | "coming_soon";
  isCustom?: boolean;
}

const UNIFIED_MODES: UnifiedModeItem[] = [
  // 6 Active Playable Modes
  {
    id: "chess",
    name: "Standard Chess",
    tag: "Classic FIDE",
    summary: "Checkmate the opposing king under classic FIDE rules.",
    category: "active",
  },
  {
    id: "mind",
    name: "Chess MM",
    tag: "Mental Math",
    summary: "Solve mental math challenges to unlock chess moves and cast spell drops.",
    category: "active",
    isCustom: true,
  },
  {
    id: "fog",
    name: "Fog of War",
    tag: "Hidden Vision",
    summary: "See only what you can reach. Enemy pieces stay hidden until capturable - take the king to win.",
    category: "active",
  },
  {
    id: "atomic",
    name: "Atomic Chess",
    tag: "3x3 Blast",
    summary: "Captures cause violent 3x3 explosions destroying adjacent pieces.",
    category: "active",
  },
  {
    id: "cross3",
    name: "3-Player Cross-Board",
    tag: "3-Army Battle",
    summary: "Three-player battle on an expanded cross board with king-capture rules. North arm open runway.",
    category: "active",
    isCustom: true,
  },
  {
    id: "cross4",
    name: "4-Player Cross-Board",
    tag: "4-Way FFA",
    summary: "Four-player free-for-all battlefield. Capture kings, eliminate rivals, last army standing wins.",
    category: "active",
    isCustom: true,
  },

  // Other Variants (Coming Soon)
  {
    id: "mantra",
    name: "Mantra Duel",
    tag: "Spell Duels",
    summary: "Tactical chess duel with magical powers & spell cards every 90 seconds (Coming Soon).",
    category: "coming_soon",
    isCustom: true,
  },
  {
    id: "crazyhouse",
    name: "Crazyhouse",
    tag: "Pocket Drops",
    summary: "Captured pieces join your pocket. Drop them on legal squares (Coming Soon).",
    category: "coming_soon",
  },
  {
    id: "kingofthehill",
    name: "King of the Hill",
    tag: "Center Control",
    summary: "Win by reaching d4, e4, d5 or e5 with your king, or by checkmate (Coming Soon).",
    category: "coming_soon",
  },
  {
    id: "3check",
    name: "Three-Check Chess",
    tag: "3 Checks Win",
    summary: "Win by giving three checks, or checkmate (Coming Soon).",
    category: "coming_soon",
  },
  {
    id: "antichess",
    name: "Antichess",
    tag: "Giveaway",
    summary: "Captures are compulsory. Shed your pieces; kings are not royal (Coming Soon).",
    category: "coming_soon",
  },
  {
    id: "horde",
    name: "Horde Chess",
    tag: "Pawn Wall",
    summary: "White has a pawn horde; Black has a standard army (Coming Soon).",
    category: "coming_soon",
  },
  {
    id: "racingkings",
    name: "Racing Kings",
    tag: "King Race",
    summary: "Race kings to the eighth rank without giving check (Coming Soon).",
    category: "coming_soon",
  },
];

const TIME_OPTIONS = [
  { minutes: 3, increment: 0, label: "3 Minutes", tag: "Blitz" },
  { minutes: 3, increment: 2, label: "3 Minutes + 2s", tag: "Blitz" },
  { minutes: 5, increment: 0, label: "5 Minutes", tag: "Rapid" },
  { minutes: 5, increment: 3, label: "5 Minutes + 3s", tag: "Rapid" },
  { minutes: 10, increment: 0, label: "10 Minutes", tag: "Rapid" },
  { minutes: 10, increment: 5, label: "10 Minutes + 5s", tag: "Classical" },
  { minutes: 15, increment: 10, label: "15 Minutes + 10s", tag: "Classical" },
];
import ReportPanel from "./ReportPanel";
import OnlineMatchView from "./OnlineMatchView";
import OpponentSearchScreen from "./OpponentSearchScreen";
export default function OnlinePage({
  user,
  onExit,
  onPlayBot,
  onOpenAuth,
  initialTab = "play",
  autoCreateRoom = false,
}: {
  user?: { id?: string; playerId?: string; name: string; email: string; provider?: string } | null;
  onExit: () => void;
  onPlayBot?: () => void;
  onOpenAuth?: () => void;
  initialTab?: "play" | "friends" | "profile";
  autoCreateRoom?: boolean;
}) {
  const [state, setState] = useState<OnlineState | null>(null),
    [config, setConfig] = useState<{
      mode: string;
      providers: string[];
    } | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("Connecting"),
    [tab, setTab] = useState(initialTab),
    [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false),
    [selectedRoom, setSelectedRoom] = useState(""),
    [code, setCode] = useState(""),
    [rule, setRule] = useState<Rule>("chess"),
    [minutes, setMinutes] = useState(5),
    [increment, setIncrement] = useState(0),
    [query, setQuery] = useState(""),
    [found, setFound] = useState<{
      id: string;
      playerId?: string;
      username: string;
      displayName: string;
      rating?: number;
    } | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null),
    [copied, setCopied] = useState(false),
    [copiedLink, setCopiedLink] = useState(false),
    [lobbyFilter, setLobbyFilter] = useState<LobbyFilter>("all"),
    [matchmaking, setMatchmaking] = useState(false),
    [isMatchFound, setIsMatchFound] = useState(false),
    [matchViewRoom, setMatchViewRoom] = useState<string | null>(null),
    [selectedCustomRoomId, setSelectedCustomRoomId] = useState<string | null>(null),
    [inCustomMatchScreen, setInCustomMatchScreen] = useState(false),
    [unifiedMode, setUnifiedMode] = useState<string>("chess"),
    [modeDropdownOpen, setModeDropdownOpen] = useState(false),
    [timeDropdownOpen, setTimeDropdownOpen] = useState(false);

  const modeDropdownRef = useRef<HTMLDivElement>(null);
  const timeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target as Node)) {
        setModeDropdownOpen(false);
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target as Node)) {
        setTimeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCopied(false);
    setCopiedLink(false);
  }, [selectedRoom]);
  useEffect(() => {
    void api<{ mode: string; providers: string[] }>("config")
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, [revision]);
  useEffect(() => {
    let disposed = false;
    let off = () => {};

    const setupSession = async () => {
      let t = await token();
      // If user has no active token (neither social login nor existing guest session),
      // automatically assign a Guest ID so they can compete online immediately!
      if (!t) {
        setNotice("Assigning guest ID…");
        try {
          const guestToken = await createGuestSession();
          if (guestToken) {
            t = guestToken;
          }
        } catch {
          // If server is not responding, fallback to notice
        }
      }

      if (disposed) return;
      if (!t) {
        setNotice("Server offline. Run npm run server to start the game server.");
        return;
      }

      try {
        const s = await api<OnlineState>("state");
        if (!disposed) {
          setError("");
          setState(s);
          setProfile((p) => p ?? s.profile);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to load online state.";
        if (msg.includes("expired") || msg.includes("required")) {
          clearLocalTokens();
          try {
            const guestToken = await createGuestSession();
            if (guestToken && !disposed) {
              const s = await api<OnlineState>("state");
              setError("");
              setState(s);
              setProfile((p) => p ?? s.profile);
            }
          } catch (retryErr) {
            if (!disposed) setError(retryErr instanceof Error ? retryErr.message : "Unable to load online state.");
          }
        } else {
          if (!disposed) setError(msg);
        }
      }

      off = subscribe((s) => {
        if (!disposed) {
          setError("");
          setState(s);
          setProfile((p) => p ?? s.profile);
        }
      }, setNotice);
    };

    void setupSession();

    return () => {
      disposed = true;
      off();
    };
  }, [revision]);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      const s = await api<OnlineState>("state");
      setState(s);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const room = state?.rooms.find((r) => r.id === selectedRoom);

    // Auto-record finished online games into local match history
  const recordedRoomsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!room || !room.result) return;
    if (room.result === "Room cancelled" || room.result === "Game aborted") return;
    if (recordedRoomsRef.current.has(room.id)) return;
    recordedRoomsRef.current.add(room.id);

    const yourColor = room.yourColor;
    const oppColor = yourColor === "white" ? "black" : "white";
    const oppName = (yourColor === "white" ? room.blackName : room.whiteName) || "Online Opponent";

    let outcome: "win" | "loss" | "draw" = "draw";
    if (room.ratingDelta && typeof room.ratingDelta[yourColor] === "number") {
      const delta = room.ratingDelta[yourColor];
      if (delta > 0) outcome = "win";
      else if (delta < 0) outcome = "loss";
      else outcome = "draw";
    } else {
      const resLower = room.result.toLowerCase();
      if (resLower.includes(yourColor) && resLower.includes("win")) outcome = "win";
      else if (resLower.includes(oppColor) && resLower.includes("win")) outcome = "loss";
      else if (resLower.includes("draw") || resLower.includes("stalemate")) outcome = "draw";
    }

    const oppRating = 1200;
    const ruleName = room.rule === "chess" ? "Online PvP (Standard)" : `Online PvP (${room.rule.toUpperCase()})`;
    recordMatchRating(oppName, oppRating, outcome, 88.5, ruleName);
  }, [room?.id, room?.result, room?.yourColor, room?.ratingDelta, room?.rule, room?.whiteName, room?.blackName]);

  // Check if active matchmaking room found an opponent
  useEffect(() => {
    if (matchmaking && selectedRoom && state?.rooms) {
      const r = state.rooms.find((rm) => rm.id === selectedRoom);
      if (r && r.status === "active" && r.black) {
        setIsMatchFound(true);
        const timer = setTimeout(() => {
          setMatchmaking(false);
          setIsMatchFound(false);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [matchmaking, selectedRoom, state?.rooms]);

  const startMatchmaking = async (chosenMinutes = minutes, chosenRule = rule) => {
    setMatchmaking(true);
    setIsMatchFound(false);
    try {
      const res = await api<{ room: string; matched: boolean }>("matchmake", {
        rule: chosenRule,
        minutes: chosenMinutes,
      });
      setSelectedRoom(res.room);
      if (res.matched) {
        setIsMatchFound(true);
        setTimeout(() => {
          setMatchmaking(false);
          setIsMatchFound(false);
        }, 1200);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Matchmaking error.");
      setMatchmaking(false);
      setIsMatchFound(false);
    }
  };
  const sortedRooms = useMemo(
    () => (state ? sortRooms(state.rooms, state.profile.id) : []),
    [state],
  );
  const gameAction = (action: string) =>
    void run(() => {
      const target = state?.rooms.find((r) => r.id === (matchViewRoom || selectedRoom)) || room;
      if (!target) return Promise.resolve();
      return api("game", { room: target.id, version: target.version, action });
    });
  const getInviteLink = (roomId: string) => {
    try {
      const baseOrigin =
        typeof window !== "undefined" && window.location.origin.includes("onrender.com")
          ? window.location.origin
          : "https://chaturanga-jpy3.onrender.com";
      return `${baseOrigin}/?room=${encodeURIComponent(roomId)}`;
    } catch {
      return `https://chaturanga-jpy3.onrender.com/?room=${encodeURIComponent(roomId)}`;
    }
  };

  const copyInviteLink = (roomId: string) => {
    const link = getInviteLink(roomId);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }).catch(() => {
        setError(`Invite link: ${link}`);
      });
    } else {
      setError(`Invite link: ${link}`);
    }
  };

  const copyRoomCode = (roomId: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(roomId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }).catch(() => {
        setError("Room code: " + roomId);
      });
    } else {
      setError("Room code: " + roomId);
    }
  };

  const challenge = (id?: string) =>
    void run(async () => {
      const r = await api<{ room: string }>("create", {
        rule,
        minutes,
        incrementSeconds: increment,
        invitee: id,
      });
      setSelectedRoom(r.room);
      setMatchViewRoom(r.room);
    });

  const [autoJoined, setAutoJoined] = useState(false);
  useEffect(() => {
    if (!state || autoJoined) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const joinCode = (params.get("room") || params.get("join"))?.trim().toLowerCase();
      if (joinCode) {
        setAutoJoined(true);
        setCode(joinCode);
        void run(async () => {
          await api("join", { room: joinCode });
          setSelectedRoom(joinCode);
          setMatchViewRoom(joinCode);
        });
      }
    } catch {}
  }, [state, autoJoined]);

  const [hasAutoCreated, setHasAutoCreated] = useState(false);
  useEffect(() => {
    if (!state || hasAutoCreated || !autoCreateRoom) return;
    setHasAutoCreated(true);
    challenge();
  }, [state, hasAutoCreated, autoCreateRoom]);
  async function login(provider?: Provider) {
    setError("");
    setBusy(true);
    try {
      if (provider) await socialSignIn(provider);
      else await localSignIn();
      setProfile(null);
      setRevision((x) => x + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const download = async () => {
    await run(async () => {
      const data = await api("export");
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "chaturanga-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const activeRoomId = matchViewRoom || selectedRoom;
  const currentActiveRoom = activeRoomId && state?.rooms
    ? state.rooms.find((r) => r.id === activeRoomId) || room
    : room;

  if (activeRoomId && state) {
    if (currentActiveRoom) {
      return (
        <OnlineMatchView
          standardRoom={currentActiveRoom}
          currentUserId={state.profile.id}
          run={run}
          gameAction={gameAction}
          busy={busy}
          onExit={() => {
            setMatchViewRoom(null);
            setSelectedRoom("");
          }}
        />
      );
    }
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0E0E0E] text-[#F4F4F4] flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-[#AFF65B]/30 flex items-center justify-center mb-4 shadow-xl">
          <span className="w-6 h-6 rounded-full border-2 border-[#AFF65B] border-t-transparent animate-spin" />
        </div>
        <div className="matiks-kicker text-[#AFF65B] text-xs tracking-widest mb-1">
          MATCH ARENA
        </div>
        <h2 className="matiks-headline text-2xl sm:text-3xl text-white mb-2 uppercase">
          CONNECTING TO ROOM {activeRoomId}
        </h2>
        <p className="text-xs text-[#8A8A8A] max-w-sm mb-6">
          Synchronizing board position and clocks from the server...
        </p>
        <button
          type="button"
          onClick={() => {
            setMatchViewRoom(null);
            setSelectedRoom("");
          }}
          className="btn-raised px-5 py-2.5 text-xs font-bold rounded-full cursor-pointer hover:border-white/30"
        >
          ← Return to Lobby
        </button>
      </div>
    );
  }

  const activeCustomRoom = state?.customRooms?.find((r) => r.id === selectedCustomRoomId);
  if ((inCustomMatchScreen || selectedCustomRoomId) && state) {
    if (activeCustomRoom) {
      return (
        <OnlineMatchView
          customRoom={activeCustomRoom}
          currentUserId={state.profile.id}
          run={run}
          busy={busy}
          onExit={() => {
            setInCustomMatchScreen(false);
            setSelectedCustomRoomId(null);
          }}
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
          ENTERING CUSTOM ARENA {selectedCustomRoomId}
        </h2>
        <p className="text-xs text-[#8A8A8A] max-w-sm mb-6">
          Connecting to multiplayer battlefield...
        </p>
        <button
          type="button"
          onClick={() => {
            setInCustomMatchScreen(false);
            setSelectedCustomRoomId(null);
          }}
          className="btn-raised px-5 py-2.5 text-xs font-bold rounded-full cursor-pointer hover:border-white/30"
        >
          ← Return to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0E0E0E] text-[#F4F4F4] font-body p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        {/* Hub Back Navigation Row */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-[#8A8A8A] hover:text-[#AFF65B] font-body text-xs font-semibold uppercase tracking-widest bg-transparent border-none cursor-pointer transition-colors"
          >
            ← Return to Hub
          </button>
          <div className="hidden sm:block matiks-kicker">ONLINE MULTIPLAYER ARENA</div>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <span className="matiks-kicker block mb-1">
              MULTIPLAYER · SERVER-CHECKED COMPETE
            </span>
            <h1 className="matiks-headline text-4xl lg:text-5xl text-[#F4F4F4] m-0">
              {tab === "play"
                ? "PLAY TOGETHER"
                : tab === "friends"
                  ? "YOUR CIRCLE"
                  : "PLAYER PROFILE"}
            </h1>
            <p className="text-sm text-[#8A8A8A] mt-2 mb-0 max-w-xl">
              Server-checked moves, real-time clocks, and live matchmaking. Play instantly as a guest or sign in to track your competitive rating.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="btn-raised py-2.5 px-5 text-xs font-semibold cursor-pointer"
            >
              ← Return to Hub
            </button>
          </div>
        </div>

        {/* Connection & Account Status Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#1A1A1A] border border-white/5">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                notice === "Connected" ? "bg-[#AFF65B] animate-pulse" : "bg-[#F2D500]"
              }`}
            />
            <span className="text-xs text-[#F4F4F4] font-medium">
              {notice === "Connected" ? "Online Server Connected" : notice}
            </span>
            <span className="text-[11px] text-[#8A8A8A] font-mono">
              · {config?.mode === "local" ? "Local Development Server" : "Live Game Server"}
            </span>
          </div>

          {state?.profile ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#262626] border border-white/10 text-xs">
                <span className="text-[#8A8A8A]">Playing as:</span>
                <strong className="text-[#AFF65B]">{state.profile.displayName}</strong>
                {state.profile.displayName.startsWith("Guest") ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#AFF65B]/10 text-[#AFF65B] font-mono">
                    GUEST ID
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#66D4C2]/15 text-[#66D4C2] font-mono">
                    VERIFIED
                  </span>
                )}
              </div>
              {state.profile.displayName.startsWith("Guest") && onOpenAuth && (
                <button
                  onClick={onOpenAuth}
                  className="btn-lime py-1 px-3 text-[11px] font-bold cursor-pointer"
                >
                  Sign in / Register
                </button>
              )}
            </div>
          ) : null}
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#262626] border border-[#E5484D]/40 text-xs text-[#FF8080] flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-[#8A8A8A] hover:text-[#F4F4F4] cursor-pointer ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {!state ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-4 bg-[#1A1A1A] rounded-2xl border border-white/5 my-4">
            <div className="w-10 h-10 border-2 border-[#AFF65B] border-t-transparent rounded-full animate-spin" />
            <h2 className="font-heading text-2xl text-[#F4F4F4] m-0">Connecting to Online Compete…</h2>
            <p className="text-xs text-[#8A8A8A] max-w-md m-0">
              {notice || "Establishing connection with game server."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <button
                onClick={() => {
                  setError("");
                  clearLocalTokens();
                  setNotice("Reconnecting…");
                  setRevision((r) => r + 1);
                }}
                className="btn-lime py-2 px-4 text-xs font-bold cursor-pointer"
              >
                Retry Connection
              </button>
              <button
                onClick={() => {
                  setError("");
                  clearLocalTokens();
                  setForcedBaseUrl(LIVE_RENDER_SERVER_URL);
                  setNotice("Connecting to Live Cloud Server…");
                  setRevision((r) => r + 1);
                }}
                className="btn-raised py-2 px-4 text-xs font-semibold cursor-pointer text-[#AFF65B] border border-[#AFF65B]/30"
              >
                ☁ Connect to Cloud Server
              </button>
              {getActiveServerMode() === "cloud" && (
                <button
                  onClick={() => {
                    setError("");
                    clearLocalTokens();
                    setForcedBaseUrl("http://127.0.0.1:8787");
                    setNotice("Connecting to Local Server…");
                    setRevision((r) => r + 1);
                  }}
                  className="btn-raised py-2 px-4 text-xs font-semibold cursor-pointer text-[#65D1C1] border border-[#65D1C1]/30"
                >
                  💻 Connect to Local Server
                </button>
              )}
              {onPlayBot && (
                <button
                  onClick={onPlayBot}
                  className="btn-raised py-2 px-4 text-xs font-semibold cursor-pointer"
                >
                  Play Bots While Waiting →
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div
              className="flex items-center gap-2 border-b border-white/5 pb-2 overflow-x-auto"
              role="group"
              aria-label="Online sections"
            >
              {(["play", "friends", "profile"] as const).map((t) => (
                <button
                  key={t}
                  aria-pressed={tab === t}
                  onClick={() => setTab(t)}
                  className={`py-2 px-5 rounded-full text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                    tab === t
                      ? "bg-[#AFF65B] text-[#0E0E0E] font-bold"
                      : "bg-[#1A1A1A] text-[#8A8A8A] hover:text-[#F4F4F4] border border-white/5"
                  }`}
                >
                  {t === "play" ? "PvP Compete" : t === "friends" ? "Friends Sanctum" : "Player Profile"}
                </button>
              ))}
              <span className="text-[11px] font-mono font-semibold text-[#AFF65B] bg-[#262626] px-3 py-1.5 rounded-full border border-white/5 ml-auto flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#AFF65B] animate-pulse" />
                {getActiveServerMode() === "cloud" ? "Cloud 24/7" : "Local 8787"}
              </span>
              <button
                onClick={() =>
                  void signOut().then(() => {
                    setState(null);
                    setProfile(null);
                    setRevision((x) => x + 1);
                  })
                }
                className="py-2 px-4 rounded-full text-xs font-semibold bg-[#1A1A1A] text-[#8A8A8A] hover:text-[#FF8080] border border-white/5 cursor-pointer shrink-0"
              >
                Sign out / New Guest
              </button>
            </div>
          {!state.profile.adultConfirmed &&
            state.mode !== "local" &&
            !state.profile.displayName.startsWith("Guest") && (
              <p className="online-status">
                Complete your profile and confirm you are 18 or older before
                online play or friend requests.{" "}
                <button onClick={() => setTab("profile")}>Set up profile</button>
              </p>
            )}
          {tab === "profile" && profile && (
            <div className="space-y-6">
              {/* Hero Profile Banner matching ProfilePage.tsx */}
              <div className="relative rounded-3xl bg-[#F07040] text-[#0E0E0E] p-6 sm:p-10 overflow-hidden shadow-2xl bg-diagonal-stripes">
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
                  {/* Avatar Circle with Knight illustration */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#F4F4F4] border-4 border-[#0E0E0E] flex items-center justify-center p-3 shadow-xl shrink-0">
                    <img
                      src="/illustrations/knight.svg"
                      alt="Avatar"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Profile Info */}
                  <div className="flex flex-col text-center sm:text-left">
                    <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                      <h1 className="matiks-headline text-4xl sm:text-6xl text-[#0E0E0E] leading-none m-0">
                        {user?.name || state.profile.displayName}
                      </h1>
                      {user && (user.provider === "google" || !user.email.includes("@chaturanga.local")) ? (
                        <span className="px-3 py-1 rounded-full bg-[#0E0E0E] text-[#AFF65B] text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" aria-hidden="true">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.36 24 12 24z"/>
                            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.89 0 12c0 2.11.45 3.86 1.24 5.42l4.04-3.15z"/>
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                          </svg>
                          Google: {user.email}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-[#0E0E0E]/80 text-white text-xs font-mono">
                            Guest Player
                          </span>
                          <button
                            type="button"
                            onClick={() => (onOpenAuth ? onOpenAuth() : void login("google"))}
                            className="btn-lime py-1 px-3 text-xs font-bold cursor-pointer flex items-center gap-1.5"
                          >
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" aria-hidden="true">
                              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.36 24 12 24z"/>
                              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.89 0 12c0 2.11.45 3.86 1.24 5.42l4.04-3.15z"/>
                              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                            </svg>
                            Sign in with Google
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="font-body text-sm font-semibold text-[#0E0E0E]/80 mt-1">
                      @{profile.username} • Player ID: {formatPlayerId(state.profile.playerId || user?.playerId || "")} • Rating: {state.profile.rating ?? 1200} Elo
                    </span>
                    <span className="font-body text-xs text-[#0E0E0E]/60 mt-0.5">
                      Online competitive account • Server authoritative
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Bento Stat Tiles matching ProfilePage.tsx */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Tile 1: Rating (Yellow) */}
                <div className="bento-card bento-yellow p-6 sm:p-8 flex flex-col justify-between min-h-[150px] rounded-3xl shadow-xl">
                  <span className="matiks-kicker text-[#0E0E0E]/80 tracking-[2px]">CHATURANGA RATING</span>
                  <div className="font-heading text-5xl sm:text-6xl leading-none text-[#0E0E0E] mt-3">
                    {state.profile.rating ?? 1200}
                  </div>
                  <span className="text-xs font-body text-[#0E0E0E]/70 mt-1">
                    Provisional private-match Elo
                  </span>
                </div>

                {/* Tile 2: Games (Lavender) */}
                <div className="bento-card bento-lavender p-6 sm:p-8 flex flex-col justify-between min-h-[150px] rounded-3xl shadow-xl">
                  <span className="matiks-kicker text-[#0E0E0E]/80 tracking-[2px]">GAMES PLAYED</span>
                  <div className="font-heading text-5xl sm:text-6xl leading-none text-[#0E0E0E] mt-3">
                    {state.profile.games}
                  </div>
                  <span className="text-xs font-body text-[#0E0E0E]/70 mt-1">
                    {state.profile.wins}W · {state.profile.draws}D · {state.profile.losses}L
                  </span>
                </div>

                {/* Tile 3: Win Rate (Teal) */}
                <div className="bento-card bento-teal p-6 sm:p-8 flex flex-col justify-between min-h-[150px] rounded-3xl shadow-xl">
                  <span className="matiks-kicker text-[#0E0E0E]/80 tracking-[2px]">ONLINE WIN RATE</span>
                  <div className="font-heading text-5xl sm:text-6xl leading-none text-[#0E0E0E] mt-3">
                    {state.profile.games > 0 ? Math.round((state.profile.wins / state.profile.games) * 100) : 0}%
                  </div>
                  <span className="text-xs font-body text-[#0E0E0E]/70 mt-1">
                    FIDE: {state.profile.fideRating ? `${state.profile.fideRating} (self-reported)` : "Unrated"}
                  </span>
                </div>
              </div>

              
              {/* Online & Competitive Match History */}
              <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                  <div>
                    <div className="matiks-kicker text-[#AFF65B] mb-1">ONLINE MATCH LOG</div>
                    <h2 className="matiks-headline text-3xl sm:text-4xl text-[#F4F4F4] m-0">
                      COMPETITIVE MATCH HISTORY
                    </h2>
                    <p className="text-xs text-[#8A8A8A] mt-1 mb-0">
                      View recent encounters, rating adjustments, and request post-game reviews.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const localHistory = getLocalStats().history;
                    if (localHistory.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <p className="text-xs text-[#8A8A8A] m-0">
                            No match records found yet. Challenge players or join open rooms to build your match history!
                          </p>
                        </div>
                      );
                    }
                    return localHistory.map((match) => (
                      <div
                        key={match.id}
                        className="p-4 rounded-2xl bg-[#141414] border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-heading font-black text-xs ${
                              match.result === "win"
                                ? "bg-[#AFF65B]/15 text-[#AFF65B] border border-[#AFF65B]/30"
                                : match.result === "loss"
                                ? "bg-[#F07040]/15 text-[#F07040] border border-[#F07040]/30"
                                : "bg-white/10 text-[#8A8A8A] border border-white/10"
                            }`}
                          >
                            <span className="text-[9px] uppercase tracking-wider">{match.result}</span>
                            <span className="font-mono text-xs font-bold">
                              {match.delta > 0 ? `+${match.delta}` : match.delta === 0 ? "±0" : match.delta}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-heading text-base sm:text-lg text-[#F4F4F4]">
                                vs. {match.opponentName}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#262626] text-[#8A8A8A] font-mono text-[11px]">
                                {match.opponentRating} Elo
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#262626] text-[#AFF65B] font-mono text-[9px] uppercase tracking-wider">
                                {match.mode}
                              </span>
                            </div>
                            <div className="font-body text-xs text-[#8A8A8A] mt-1 flex items-center gap-2 flex-wrap">
                              <span>{match.date}</span>
                              <span>•</span>
                              <span>Rating: {match.ratingBefore} → {match.ratingAfter} ELO</span>
                              {match.accuracy && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#66D4C2] font-mono font-semibold">
                                    {match.accuracy}% Acc
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              alert(
                                `Match Review for ${match.opponentName} (${match.date}):\n\nDeep Stockfish engine move-by-move evaluation, blunder analysis, and brilliance detection is coming soon in the next major update!`
                              )
                            }
                            className="px-3.5 py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] border border-white/10 text-xs font-semibold text-[#F4F4F4] flex items-center gap-2 transition-all cursor-pointer group"
                            title="Deep engine game review is coming soon"
                          >
                            <span>Match Review</span>
                            <span className="px-2 py-0.5 rounded-full bg-[#AFF65B]/15 text-[#AFF65B] text-[9px] font-mono font-bold tracking-wider uppercase group-hover:bg-[#AFF65B] group-hover:text-[#0E0E0E] transition-colors">
                              Coming Soon
                            </span>
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Profile Settings Form Card */}
              <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div>
                  <div className="matiks-kicker mb-1">PLAYER IDENTITY</div>
                  <h2 className="matiks-headline text-3xl sm:text-4xl text-[#F4F4F4] m-0">
                    PROFILE SETTINGS & DISCOVERY
                  </h2>
                  <p className="text-xs text-[#8A8A8A] mt-1 mb-0 max-w-xl">
                    Configure your display name, username, and discovery preferences for online match invites.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(() => api("profile", profile));
                  }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                        Username
                      </label>
                      <input
                        required
                        aria-label="Username"
                        minLength={3}
                        maxLength={24}
                        value={profile.username}
                        onChange={(e) =>
                          setProfile({ ...profile, username: e.target.value })
                        }
                        className="w-full bg-[#242424] text-white text-xs font-semibold px-4 py-3 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none"
                      />
                      <small className="text-[10px] text-[#777] mt-1 block">
                        Exact username search only. No email search.
                      </small>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                        Display name
                      </label>
                      <input
                        required
                        maxLength={40}
                        value={profile.displayName}
                        onChange={(e) =>
                          setProfile({ ...profile, displayName: e.target.value })
                        }
                        className="w-full bg-[#242424] text-white text-xs font-semibold px-4 py-3 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                      About you (optional)
                    </label>
                    <textarea
                      maxLength={160}
                      rows={3}
                      value={profile.bio}
                      onChange={(e) =>
                        setProfile({ ...profile, bio: e.target.value })
                      }
                      className="w-full bg-[#242424] text-white text-xs font-semibold px-4 py-3 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                        Country code (optional)
                      </label>
                      <input
                        maxLength={2}
                        placeholder="IN"
                        value={profile.country}
                        onChange={(e) =>
                          setProfile({ ...profile, country: e.target.value })
                        }
                        className="w-full bg-[#242424] text-white text-xs font-semibold px-4 py-3 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                        Timezone
                      </label>
                      <input
                        value={profile.timezone}
                        onChange={(e) =>
                          setProfile({ ...profile, timezone: e.target.value })
                        }
                        className="w-full bg-[#242424] text-white text-xs font-semibold px-4 py-3 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                        FIDE rating (optional)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={4000}
                        placeholder="e.g. 1500"
                        value={profile.fideRating ?? ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            fideRating: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="w-full bg-[#242424] text-white text-xs font-semibold px-4 py-3 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-[#222222] border border-white/5 rounded-2xl space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.discoverable}
                        onChange={(e) =>
                          setProfile({ ...profile, discoverable: e.target.checked })
                        }
                        className="w-4 h-4 rounded accent-[#AFF65B] cursor-pointer"
                      />
                      <span className="text-xs text-[#E0E0E0] font-medium select-none">
                        Allow players who know my exact username to find me and send match challenges.
                      </span>
                    </label>

                    {state.mode !== "local" && (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          required
                          checked={profile.adultConfirmed}
                          onChange={(e) =>
                            setProfile({ ...profile, adultConfirmed: e.target.checked })
                          }
                          className="w-4 h-4 rounded accent-[#AFF65B] cursor-pointer"
                        />
                        <span className="text-xs text-[#E0E0E0] font-medium select-none">
                          I am 18 or older (public beta safeguard pending audience review).
                        </span>
                      </label>
                    )}
                  </div>

                  <button
                    disabled={busy}
                    type="submit"
                    className="py-3.5 px-8 bg-[#AFF65B] hover:bg-white text-black font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>✓ Save Profile</span>
                  </button>
                </form>

                <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <p className="text-[11px] text-[#777] m-0 max-w-lg leading-relaxed">
                    Account ID, display name, and match history are stored in the server database. Sign-in credentials remain with your OAuth provider.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void download()}
                      className="px-3.5 py-2 rounded-xl bg-[#252525] hover:bg-[#333] text-white text-xs font-semibold border border-white/10 cursor-pointer"
                    >
                      Export Game Data
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            "Delete your player profile and friendships? Game history is anonymized and your game sign-in identity is removed. This cannot be undone.",
                          )
                        )
                          void run(async () => {
                            const r = await api<{ authIdentity?: string }>(
                              "delete",
                              {},
                            );
                            await signOut();
                            setState(null);
                            setProfile(null);
                            if (r.authIdentity === "manual-step-required")
                              setNotice(
                                "Profile deleted. The operator still needs to remove your sign-in identity by hand.",
                              );
                            else if (r.authIdentity === "failed")
                              setNotice(
                                "Profile deleted. Sign-in identity removal failed; the operator will retry.",
                              );
                            setRevision((x) => x + 1);
                          });
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#252525] hover:bg-red-950/60 text-[#FF8080] text-xs font-semibold border border-red-500/20 cursor-pointer"
                    >
                      Delete Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {tab === "friends" && (
            <div className="w-full">
              {/* Top Banner: Your 8-Digit Player ID */}
              <section className="online-card bg-[#1A1A1A] border border-[#AFF65B]/30 rounded-2xl p-5 mb-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono tracking-widest text-[#AFF65B] uppercase font-bold flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-[#AFF65B] animate-pulse" />
                      YOUR 8-DIGIT PLAYER ID
                    </div>
                    <div className="font-mono text-2xl font-black text-[#AFF65B] tracking-widest select-all">
                      {formatPlayerId(state.profile.playerId || user?.playerId || "CH8K9A2M")}
                    </div>
                    <p className="text-xs text-[#8A8A8A] mt-1 mb-0">
                      Share this 8-digit alphanumeric ID with friends so they can add and match with you in real-time.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(state.profile.playerId || user?.playerId || "");
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="btn-lime py-2 px-4 text-xs font-bold rounded cursor-pointer self-start sm:self-auto"
                  >
                    {copied ? "✓ Copied ID" : "📋 Copy Your Player ID"}
                  </button>
                </div>
              </section>

              <section className="online-card">
                <div className="section-kicker">INSTANT MATCH</div>
                <h2>Play via Private Room Code</h2>
                <p className="text-xs text-[#8A8A8A] mb-3">
                  Want to play immediately with a friend without waiting for friend requests? Create a private room and share the link or code.
                </p>
                <button
                  disabled={busy}
                  onClick={() => {
                    setTab("play");
                    challenge();
                  }}
                  className="btn-lime py-2 px-4 text-xs font-bold rounded cursor-pointer"
                >
                  Create Private Room & Share Code →
                </button>
              </section>

              {/* Add someone by 8-Digit Player ID or Username */}
              <section className="online-card">
                <h2>Add Friends by 8-Digit Player ID or Username</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(async () =>
                      setFound(await api("find", { query, username: query })),
                    );
                  }}
                  className="online-form"
                >
                  <label>
                    Friend's 8-Digit Player ID or Username
                    <input
                      maxLength={32}
                      placeholder="e.g. K9X2M7P4 or username"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setFound(null);
                      }}
                    />
                  </label>
                  <button disabled={busy} className="cursor-pointer">Find Player</button>
                </form>
                {found ? (
                  <div className="bg-[#121212] p-4 rounded-xl border border-[#AFF65B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        {found.displayName}
                        {found.playerId && (
                          <span className="font-mono text-[10px] text-[#AFF65B] bg-[#0E0E0E] px-2 py-0.5 rounded border border-white/10 font-bold">
                            ID: {formatPlayerId(found.playerId)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#888] font-mono mt-0.5">
                        @{found.username} {found.rating ? "• " + found.rating + " Elo" : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(() =>
                            api("friend", {
                              action: "request",
                              target: found.id,
                            }),
                          )
                        }
                        className="btn-raised py-1.5 px-3 text-xs font-bold rounded cursor-pointer"
                      >
                        ➕ Add Friend
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => challenge(found.id)}
                        className="btn-lime py-1.5 px-3 text-xs font-bold rounded cursor-pointer shadow-md"
                      >
                        ⚔️ Match Now
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#777] mt-2">
                    Enter an 8-digit Player ID to match directly, or search by exact username.
                  </p>
                )}
              </section>

              {/* Your circle of friends with Match button */}
              <section className="online-card">
                <h2>Your Circle</h2>
                {!state.friends.length && (
                  <p>
                    No friends yet. Add friends above using their 8-digit Player ID to challenge them.
                  </p>
                )}
                {state.friends.map((f) => (
                  <div className="online-person flex items-center justify-between py-2 border-b border-white/5" key={f.id}>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-sm">{f.displayName}</strong>
                        {f.playerId && (
                          <span className="font-mono text-[10px] text-[#AFF65B] bg-[#0E0E0E] px-1.5 py-0.5 rounded border border-white/10">
                            ID: {formatPlayerId(f.playerId)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#888]">
                        @{f.username} · <span className="capitalize">{f.state}</span>
                      </span>
                    </div>
                    <div className="online-actions flex items-center gap-2">
                      {f.state === "incoming" && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void run(() =>
                              api("friend", { action: "accept", target: f.id }),
                            )
                          }
                          className="btn-lime py-1 px-3 text-xs font-bold rounded cursor-pointer"
                        >
                          Accept
                        </button>
                      )}
                      {f.state === "friend" && (
                        <button
                          disabled={busy}
                          onClick={() => challenge(f.id)}
                          className="btn-lime py-1.5 px-3.5 text-xs font-bold rounded cursor-pointer shadow-md flex items-center gap-1 active:scale-95"
                        >
                          ⚔️ Match with Friend
                        </button>
                      )}
                      {f.state !== "blocked" && (
                        <>
                          <button
                            disabled={busy}
                            onClick={() =>
                              void run(() =>
                                api("friend", {
                                  action: "remove",
                                  target: f.id,
                                }),
                              )
                            }
                            className="text-[#8A8A8A] hover:text-[#E5484D] text-xs bg-transparent border-none cursor-pointer py-1 px-2"
                          >
                            {f.state === "friend"
                              ? "Remove"
                              : f.state === "incoming"
                                ? "Decline"
                                : "Cancel"}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() =>
                              void run(() =>
                                api("friend", {
                                  action: "block",
                                  target: f.id,
                                }),
                              )
                            }
                          >
                            Block
                          </button>
                        </>
                      )}
                      {f.state === "blocked" && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void run(() =>
                              api("friend", {
                                action: "unblock",
                                target: f.id,
                              }),
                            )
                          }
                        >
                          Unblock
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            </div>
          )}
          <ReportPanel/>
          {tab === "play" && (
            <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 mb-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="matiks-kicker text-xs text-[#AFF65B] block mb-1">
                    GLOBAL MATCHMAKING
                  </span>
                  <h2 className="font-heading text-2xl text-white tracking-wide uppercase m-0">
                    PLAY RANDOM OPPONENT (PVP)
                  </h2>
                  <p className="text-xs text-[#8A8A8A] font-body m-0 mt-1">
                    Queue instantly against live players worldwide matching your skill rating.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void startMatchmaking(minutes, rule)}
                    className="btn-lime py-3 px-6 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>⚔️</span>
                    <span>Find Opponent Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          {tab === "play" && (
            <div className="space-y-6 mb-6">
              {/* Unified 2-Card Row: Create Private Room & Join Room */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CARD 1: CREATE A PRIVATE ROOM */}
                <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="matiks-kicker text-[#AFF65B] tracking-widest text-[11px]">
                        PRIVATE MATCH
                      </div>
                      <span className="font-mono text-[10px] text-white/50 uppercase">
                        Instant Link / Code
                      </span>
                    </div>

                    <h2 className="matiks-headline text-3xl sm:text-4xl text-[#F4F4F4] m-0">
                      CREATE A PRIVATE ROOM
                    </h2>

                    <div className="space-y-4">
                      {/* Modern Elevated Mode Dropdown */}
                      <div className="relative" ref={modeDropdownRef}>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888]">
                            Game Mode / Variant
                          </label>
                          <span className="text-[10px] font-mono text-[#AFF65B] bg-[#AFF65B]/10 px-2.5 py-0.5 rounded-full border border-[#AFF65B]/20">
                            6 Active Modes
                          </span>
                        </div>

                        {/* Elevated Trigger Button */}
                        <button
                          type="button"
                          onClick={() => setModeDropdownOpen((prev) => !prev)}
                          className="w-full min-h-[56px] px-4 py-3 bg-[#202020] hover:bg-[#262626] text-white rounded-2xl border border-white/10 hover:border-[#AFF65B]/60 focus:border-[#AFF65B] transition-all flex items-center justify-between cursor-pointer shadow-lg select-none group"
                          aria-haspopup="listbox"
                          aria-expanded={modeDropdownOpen}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#AFF65B] shadow-[0_0_8px_#AFF65B] shrink-0" />
                            <div className="text-left">
                              <span className="font-heading text-lg sm:text-xl tracking-wide text-[#F4F4F4] group-hover:text-[#AFF65B] transition-colors block leading-tight">
                                {UNIFIED_MODES.find((m) => m.id === unifiedMode)?.name || "Standard Chess"}
                              </span>
                              <span className="text-[10px] font-mono text-[#8A8A8A] uppercase">
                                {UNIFIED_MODES.find((m) => m.id === unifiedMode)?.tag || "Combat Mode"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className={`w-5 h-5 text-[#888] transition-transform duration-200 ${
                                modeDropdownOpen ? "rotate-180 text-[#AFF65B]" : ""
                              }`}
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </button>

                        {/* Hidden Native Select for Automated Testing and Form Interoperability */}
                        <select
                          aria-label="Game Mode"
                          value={unifiedMode}
                          onChange={(e) => {
                            const val = e.target.value;
                            setUnifiedMode(val);
                            if (val !== "mind" && val !== "mantra" && val !== "cross3" && val !== "cross4") {
                              setRule(val as Rule);
                            }
                          }}
                          className="sr-only"
                          tabIndex={-1}
                        >
                          <optgroup label="6 Active Modes">
                            {UNIFIED_MODES.filter((m) => m.category === "active").map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Coming Soon">
                            {UNIFIED_MODES.filter((m) => m.category === "coming_soon").map((m) => (
                              <option key={m.id} value={m.id} disabled>
                                {m.name} (Coming Soon)
                              </option>
                            ))}
                          </optgroup>
                        </select>

                        {/* Floating Custom Dropdown Panel */}
                        {modeDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-[#171717] border border-white/15 rounded-2xl p-2.5 shadow-2xl backdrop-blur-2xl max-h-[380px] overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
                            <div className="px-3 py-1.5 text-[10px] font-mono tracking-widest text-[#AFF65B] uppercase font-bold flex items-center justify-between border-b border-white/5 pb-2 mb-1">
                              <span>ACTIVE COMBAT MODES (6)</span>
                              <span className="text-[#888]">100% READY</span>
                            </div>

                            {/* 6 Active Playable Modes */}
                            {UNIFIED_MODES.filter((m) => m.category === "active").map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setUnifiedMode(m.id);
                                  if (m.id !== "mind" && m.id !== "cross3" && m.id !== "cross4") {
                                    setRule(m.id as Rule);
                                  }
                                  setModeDropdownOpen(false);
                                }}
                                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between border ${
                                  unifiedMode === m.id
                                    ? "bg-[#242424] border-[#AFF65B]/60 text-white shadow-inner"
                                    : "bg-transparent border-transparent hover:bg-[#202020] text-[#CCC] hover:text-white"
                                }`}
                              >
                                <div>
                                  <div className="font-heading text-lg tracking-wide flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${unifiedMode === m.id ? "bg-[#AFF65B]" : "bg-white/30"}`} />
                                    <span className={unifiedMode === m.id ? "text-[#AFF65B]" : "text-white"}>{m.name}</span>
                                    <span className="text-[10px] font-mono text-[#777] uppercase ml-1">[{m.tag}]</span>
                                  </div>
                                  <div className="text-[11px] text-[#888] mt-0.5 line-clamp-1">{m.summary}</div>
                                </div>
                                {unifiedMode === m.id && (
                                  <span className="text-[#AFF65B] font-bold text-sm shrink-0 ml-2">✓</span>
                                )}
                              </button>
                            ))}

                            {/* Other Variants Mentioned As Coming Soon */}
                            <div className="px-3 py-2 text-[10px] font-mono tracking-widest text-[#888] uppercase font-bold flex items-center justify-between border-t border-white/5 pt-3 mt-2">
                              <span>OTHER VARIANTS · COMING SOON</span>
                              <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-[#777]">IN DEVELOPMENT</span>
                            </div>
                            {UNIFIED_MODES.filter((m) => m.category === "coming_soon").map((m) => (
                              <div
                                key={m.id}
                                className="w-full text-left p-2.5 rounded-xl flex items-center justify-between opacity-50 bg-[#121212]/50 border border-transparent cursor-not-allowed select-none"
                              >
                                <div>
                                  <div className="font-heading text-base text-[#AAA]">{m.name}</div>
                                  <div className="text-[10px] text-[#666] line-clamp-1">{m.summary}</div>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-[#888] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full shrink-0 ml-2">
                                  Coming Soon
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Dynamic Mode Summary Pill */}
                      <div className="p-3.5 bg-[#202020] border border-white/5 rounded-2xl text-xs text-[#CCC] leading-relaxed flex items-center justify-between">
                        <span>{UNIFIED_MODES.find((m) => m.id === unifiedMode)?.summary ?? "Select a mode to view details."}</span>
                        <span className="text-[10px] font-mono text-[#AFF65B] shrink-0 ml-2">Playable</span>
                      </div>

                      {/* Modern Elevated Clock Time Dropdown */}
                      <div className="relative" ref={timeDropdownRef}>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                          Clock Time per Side
                        </label>
                        <button
                          type="button"
                          onClick={() => setTimeDropdownOpen((prev) => !prev)}
                          className="w-full min-h-[56px] px-4 py-3 bg-[#202020] hover:bg-[#262626] text-white rounded-2xl border border-white/10 hover:border-[#AFF65B]/60 focus:border-[#AFF65B] transition-all flex items-center justify-between cursor-pointer shadow-lg select-none group"
                          aria-haspopup="listbox"
                          aria-expanded={timeDropdownOpen}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">⏱️</span>
                            <div className="text-left">
                              <span className="font-heading text-lg sm:text-xl tracking-wide text-[#F4F4F4] group-hover:text-[#AFF65B] transition-colors block leading-tight">
                                {minutes} Minutes {increment > 0 ? `+ ${increment}s` : ""}
                              </span>
                              <span className="text-[10px] font-mono text-[#8A8A8A] uppercase">
                                {minutes < 5 ? "Blitz Clock" : minutes <= 10 ? "Rapid Clock" : "Classical Clock"}
                              </span>
                            </div>
                          </div>
                          <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className={`w-5 h-5 text-[#888] transition-transform duration-200 ${
                              timeDropdownOpen ? "rotate-180 text-[#AFF65B]" : ""
                            }`}
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>

                        {/* Hidden Native Select for Playwright test compatibility */}
                        <select
                          aria-label="Time per side"
                          value={`${minutes}|${increment}`}
                          onChange={(e) => {
                            const [m, i] = e.target.value.split("|").map(Number);
                            setMinutes(m);
                            setIncrement(i);
                          }}
                          className="sr-only"
                          tabIndex={-1}
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={`${t.minutes}|${t.increment}`} value={`${t.minutes}|${t.increment}`}>
                              {t.minutes} minutes{t.increment > 0 ? ` + ${t.increment}s increment` : ", no increment"}
                            </option>
                          ))}
                        </select>

                        {/* Floating Time Dropdown Panel */}
                        {timeDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-[#171717] border border-white/15 rounded-2xl p-2.5 shadow-2xl backdrop-blur-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
                            {TIME_OPTIONS.map((t) => {
                              const isSelected = minutes === t.minutes && increment === t.increment;
                              return (
                                <button
                                  key={`${t.minutes}|${t.increment}`}
                                  type="button"
                                  onClick={() => {
                                    setMinutes(t.minutes);
                                    setIncrement(t.increment);
                                    setTimeDropdownOpen(false);
                                  }}
                                  className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between border ${
                                    isSelected
                                      ? "bg-[#242424] border-[#AFF65B]/60 text-white"
                                      : "bg-transparent border-transparent hover:bg-[#202020] text-[#CCC] hover:text-white"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="font-heading text-lg tracking-wide text-white">{t.label}</span>
                                    <span className="text-[10px] font-mono text-[#AFF65B] bg-[#AFF65B]/10 px-2 py-0.5 rounded-full border border-[#AFF65B]/20">
                                      {t.tag}
                                    </span>
                                  </div>
                                  {isSelected && <span className="text-[#AFF65B] font-bold text-sm">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Dynamic Mode Summary Pill */}
                      <div className="p-3 bg-[#222222] border border-white/5 rounded-xl text-xs text-[#CCC] leading-relaxed">
                        {UNIFIED_MODES.find((m) => m.id === unifiedMode)?.summary ??
                          "Select a mode to view details."}
                      </div>

                      {/* Time per player */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                          Clock Time
                        </label>
                        <select
                          aria-label="Time per side"
                          value={`${minutes}|${increment}`}
                          onChange={(e) => {
                            const [m, i] = e.target.value.split("|").map(Number);
                            setMinutes(m);
                            setIncrement(i);
                          }}
                          className="w-full bg-[#242424] text-white text-xs font-semibold px-4 py-3 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none"
                        >
                          {[
                            [3, 0],
                            [3, 2],
                            [5, 0],
                            [5, 3],
                            [10, 0],
                            [10, 5],
                            [15, 10],
                          ].map(([m, i]) => (
                            <option key={`${m}|${i}`} value={`${m}|${i}`}>
                              {m} minutes{i > 0 ? ` + ${i}s increment` : ", no increment"}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      disabled={busy || (state.mode !== "local" && !state.profile.adultConfirmed && !state.profile.profileReady)}
                      onClick={() => {
                        const modeObj = UNIFIED_MODES.find((m) => m.id === unifiedMode);
                        if (modeObj?.isCustom) {
                          void run(async () => {
                            const r = await api<{ room: string }>("custom-create", {
                              kind: unifiedMode,
                              minutes,
                            });
                            setSelectedCustomRoomId(r.room);
                            setInCustomMatchScreen(true);
                          });
                        } else {
                          void challenge();
                        }
                      }}
                      className="w-full py-3.5 px-6 bg-[#AFF65B] hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>➕</span>
                      <span>{busy ? "Creating Room…" : "Create Private Room"}</span>
                    </button>

                    {/* Created Standard Room Inline Banner */}
                    {room && room.status === "waiting" && room.white === state.profile.id && (
                      <div className="p-3 mt-3 rounded-xl bg-[#1E2616] border border-[#AFF65B]/40 text-xs">
                        <div className="flex items-center justify-between font-bold text-[#AFF65B] mb-1">
                          <span>🟢 PRIVATE ROOM CREATED</span>
                          <span className="font-mono text-white text-xs bg-black/60 px-2 py-0.5 rounded border border-[#AFF65B]/20">
                            {room.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#A3A3A3] m-0 mb-2">
                          Share this invite link or room code with your friend:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => copyInviteLink(room.id)}
                            className="px-2.5 py-1 bg-[#AFF65B] text-black font-bold text-[11px] rounded cursor-pointer hover:bg-white"
                          >
                            {copiedLink ? "✓ Link Copied!" : "📋 Copy Invite Link"}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyRoomCode(room.id)}
                            className="px-2.5 py-1 bg-[#2A2A2A] text-white text-[11px] rounded border border-white/10 cursor-pointer hover:bg-[#333]"
                          >
                            {copied ? "✓ Code Copied" : "Copy Code"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setMatchViewRoom(room.id)}
                            className="px-2.5 py-1 bg-transparent text-[#AFF65B] text-[11px] border border-[#AFF65B]/30 rounded cursor-pointer hover:bg-[#AFF65B]/10"
                          >
                            Enter Arena ⚔️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 2: JOIN WITH ROOM CODE */}
                <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="matiks-kicker text-[#AFF65B] tracking-widest text-[11px]">
                        ENTER CODE
                      </div>
                      <span className="font-mono text-[10px] text-white/50 uppercase">
                        Standard & Custom
                      </span>
                    </div>

                    <h2 className="matiks-headline text-3xl sm:text-4xl text-[#F4F4F4] m-0">
                      JOIN WITH ROOM CODE
                    </h2>

                    <p className="text-xs text-[#8A8A8A] m-0 leading-relaxed">
                      Enter the 6-character room code shared by your friend to jump straight into the match.
                    </p>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                        Room Code
                      </label>
                      <input
                        value={code}
                        maxLength={18}
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="e.g. 8ITRU8"
                        className="w-full bg-[#242424] text-white text-sm font-mono font-bold tracking-widest uppercase px-4 py-3 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none"
                        onChange={(e) => setCode(e.target.value.trim().toLowerCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && code && !busy) {
                            e.preventDefault();
                            const trimmed = code.trim().toLowerCase();
                            const isCustom = state.customRooms?.some(
                              (r) => r.id.toLowerCase() === trimmed
                            );
                            if (isCustom) {
                              void run(async () => {
                                await api("custom-join", { room: trimmed });
                                setSelectedCustomRoomId(trimmed);
                                setInCustomMatchScreen(true);
                              });
                            } else {
                              void run(async () => {
                                try {
                                  await api("join", { room: trimmed });
                                  setSelectedRoom(trimmed);
                                  setMatchViewRoom(trimmed);
                                } catch (err) {
                                  try {
                                    await api("custom-join", { room: trimmed });
                                    setSelectedCustomRoomId(trimmed);
                                    setInCustomMatchScreen(true);
                                  } catch {
                                    throw err;
                                  }
                                }
                              });
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      disabled={busy || !code}
                      onClick={() => {
                        const trimmed = code.trim().toLowerCase();
                        const isCustom = state.customRooms?.some(
                          (r) => r.id.toLowerCase() === trimmed
                        );
                        if (isCustom) {
                          void run(async () => {
                            await api("custom-join", { room: trimmed });
                            setSelectedCustomRoomId(trimmed);
                            setInCustomMatchScreen(true);
                          });
                        } else {
                          void run(async () => {
                            try {
                              await api("join", { room: trimmed });
                              setSelectedRoom(trimmed);
                              setMatchViewRoom(trimmed);
                            } catch (err) {
                              try {
                                await api("custom-join", { room: trimmed });
                                setSelectedCustomRoomId(trimmed);
                                setInCustomMatchScreen(true);
                              } catch {
                                throw err;
                              }
                            }
                          });
                        }
                      }}
                      className="w-full py-3.5 px-6 bg-[#AFF65B] hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>🚀</span>
                      <span>Join Game</span>
                    </button>
                    <p className="text-[11px] text-[#666] mt-2 mb-0 text-center">
                      Room codes grant the player seat. Works for 2-player, 3-player & 4-player rooms.
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Custom Arenas Section (if any custom rooms exist) */}
              {state.customRooms && state.customRooms.length > 0 && (
                <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="matiks-kicker text-[#AFF65B] tracking-widest text-[11px]">
                        OPEN ARENAS
                      </div>
                      <h3 className="matiks-headline text-2xl sm:text-3xl text-[#F4F4F4] m-0">
                        ACTIVE CUSTOM ROOMS
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-[#8A8A8A]">
                      {state.customRooms.length} Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {state.customRooms.map((r) => {
                      const modeInfo = UNIFIED_MODES.find((m) => m.id === r.kind);
                      return (
                        <div
                          key={r.id}
                          className="p-4 bg-[#222222] border border-white/5 rounded-2xl flex flex-col justify-between space-y-3 hover:border-[#AFF65B]/30 transition-all shadow-md"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-sm text-white">
                                {modeInfo?.name ?? r.kind.toUpperCase()}
                              </div>
                              <div className="text-[11px] text-[#888] mt-0.5">
                                Host: {r.players[0]?.name ?? "Open Room"} · {r.status.toUpperCase()}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-black/60 text-[#AFF65B] text-[10px] font-mono font-bold border border-[#AFF65B]/20 shrink-0">
                              {r.players.length}/{r.capacity} Seats
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <code className="text-xs font-mono text-[#AAA]">
                              {r.id}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCustomRoomId(r.id);
                                setInCustomMatchScreen(true);
                              }}
                              className="px-3 py-1 bg-[#AFF65B] hover:bg-white text-black font-bold text-xs rounded-lg transition-all cursor-pointer shadow active:scale-95"
                            >
                              Play Match Now ⚔️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === "play" && (
            <div className="online-grid">
              <section className="online-card">
                <h2>Your games</h2>
                <div className="online-chips" role="group" aria-label="Filter games">
                  {(
                    [
                      ["all", "All"],
                      ["needsYou", "Needs you"],
                      ["waiting", "Waiting"],
                      ["finished", "Finished"],
                    ] as [LobbyFilter, string][]
                  ).map(([f, label]) => (
                    <button
                      key={f}
                      aria-pressed={lobbyFilter === f}
                      className={lobbyFilter === f ? "chip-active" : ""}
                      onClick={() => setLobbyFilter(f)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {filterRooms(sortedRooms, state.profile.id, lobbyFilter).map((r) => (
                  <div className="online-person" key={r.id}>
                    <button
                      onClick={() => {
                        setSelectedRoom(r.id);
                        setMatchViewRoom(r.id);
                      }}
                    >
                      {r.whiteName} vs {r.blackName ?? "waiting"} ·{" "}
                      {ruleLabel(r.rule)} · {timeControlLabel(r.initialMs, r.incrementMs)} ·{" "}
                      {roomLabel(r, state.profile.id)}
                      {timeAgo(Date.now(), r.activityAt) &&
                        ` · ${timeAgo(Date.now(), r.activityAt)}`}
                    </button>
                    {r.invitee === state.profile.id && !r.black && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await api("join", { room: r.id });
                            setSelectedRoom(r.id);
                            setMatchViewRoom(r.id);
                          })
                        }
                      >
                        Accept challenge
                      </button>
                    )}
                  </div>
                ))}
                {filterRooms(sortedRooms, state.profile.id, lobbyFilter)
                  .length === 0 && (
                  <p className="online-empty" role="status">
                    {sortedRooms.length === 0
                      ? "No games yet. Create a private room above, or join one with a friend's code."
                      : lobbyFilter === "needsYou"
                        ? "Nothing waiting on your move."
                        : lobbyFilter === "waiting"
                          ? "No games waiting on your opponent."
                          : lobbyFilter === "finished"
                            ? "No finished games yet."
                            : "No games in this view."}
                  </p>
                )}
              </section>
            </div>
          )}
        </>
      )}
      </div>

      {/* Screen 1: Opponent Search Radar Overlay */}
      {matchmaking && (
        <OpponentSearchScreen
          modeName={
            rule === "fog"
              ? "Fog of War"
              : RULE_VARIANTS.find((v) => v.id === rule)?.name || "Standard Chess"
          }
          timeMinutes={minutes}
          incrementSeconds={increment}
          playerRating={state?.profile?.rating || 1200}
          isMatchFound={isMatchFound}
          onCancel={() => {
            setMatchmaking(false);
            setIsMatchFound(false);
          }}
          onPlayBot={onPlayBot}
        />
      )}
    </div>
  );
}

