import { useEffect, useMemo, useRef, useState } from "react";
import { liveClock, formatClock } from "./liveClock";
import { moveRows } from "./moveList";
import { buildPgn } from "./pgn";
import { roomLabel, sortRooms, filterRooms, lastMoveSquares, timeAgo, ruleLabel, timeControlLabel } from "./roomList";
import type { LobbyFilter } from "./roomList";
import { premoveUci } from "./premove";
import { matchMoveInput } from "./keyboardMove";
import { makeSan } from "chessops/san";
import { replayTo } from "./replay";
import { nextReviewPly } from "./reviewNav";
import { playSound, soundForSan } from "./sounds";
import { openingForMoves } from "./opening";
import { materialFromFen } from "./material";
import { makeSquare, parseUci } from "chessops/util";
import VariantBoard from "../chaturanga/VariantBoard";
import FogBoard from "../chaturanga/FogBoard";
import { colorOf, fogFromFen } from "../online/fogRules";
const fogState = fogFromFen;
import { variantPosition, variantFen, variantMoves } from "../chaturanga/variantRules";
import { RULE_VARIANTS } from "../chaturanga/variantCatalog";
import {
  api,
  createGuestSession,
  localSignIn,
  socialSignIn,
  signOut,
  subscribe,
  token,
} from "./client";
import type { OnlineState, PlayerProfile, Provider, Rule } from "./types";
import "./online.css";
import CustomRoomPanel from "./CustomRoomPanel";
import ReportPanel from "./ReportPanel";
export default function OnlinePage({
  user,
  onExit,
  onPlayBot,
  onOpenAuth,
  initialTab = "play",
  autoCreateRoom = false,
}: {
  user?: { id: string; name: string; email: string } | null;
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
      username: string;
      displayName: string;
    } | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null),
    [selected, setSelected] = useState<number | null>(null),
    [promotion, setPromotion] = useState<string[]>([]),
    [drop, setDrop] = useState(""),
    [flipped, setFlipped] = useState(false),
    [copied, setCopied] = useState(false),
    [copiedLink, setCopiedLink] = useState(false),
    [copiedPgn, setCopiedPgn] = useState(false),
    [muted, setMuted] = useState(
      () => localStorage.getItem("chaturanga-muted") === "1",
    ),
    [hintsOff, setHintsOff] = useState(
      () => localStorage.getItem("chaturanga-hints-dismissed") === "1",
    ),
    [reviewPly, setReviewPly] = useState<number | null>(null),
    [premove, setPremove] = useState<string | null>(null),
    [confirmResign, setConfirmResign] = useState(false),
    [confirmAbort, setConfirmAbort] = useState(false),
    [lobbyFilter, setLobbyFilter] = useState<LobbyFilter>("all"),
    [moveInput, setMoveInput] = useState(""),
    [moveInputError, setMoveInputError] = useState(""),
    [, setTickTs] = useState(0);
  // Local clock baseline: re-anchored whenever the server sends a new
  // board version, then decremented locally so clocks tick smoothly.
  const clockBase = useRef({ room: "", serverTime: -1, at: Date.now() });
  useEffect(() => {
    setFlipped(false);
    setCopied(false);
    setCopiedLink(false);
    setCopiedPgn(false);
    setTickTs(0);
    setReviewPly(null);
    setPremove(null);
    setConfirmResign(false);
    setConfirmAbort(false);
  }, [selectedRoom]);
  useEffect(() => {
    void api<{ mode: string; providers: string[] }>("config")
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, []);
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
          setState(s);
          setProfile((p) => p ?? s.profile);
        }
      } catch (e) {
        if (!disposed) setError(e instanceof Error ? e.message : "Unable to load online state.");
      }

      off = subscribe((s) => {
        if (!disposed) {
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
  if (room && (clockBase.current.room !== room.id || clockBase.current.serverTime !== room.serverTime))
    clockBase.current = { room: room.id, serverTime: room.serverTime, at: Date.now() };
  useEffect(() => {
    if (room?.status !== "active") return;
    const t = setInterval(() => setTickTs((x) => x + 1), 200);
    return () => clearInterval(t);
  }, [room?.status]);
  // Arrow-key review: step through the move list without the mouse.
  // Fog of War is excluded (masked move list); typing in a field, or
  // holding a modifier, leaves the key to the browser.
  useEffect(() => {
    if (!room || room.rule === "fog") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable))
        return;
      // Board squares own their arrow keys (focus movement); review
      // navigation applies everywhere else.
      if (t?.closest(".court-board")) return;
      const next = nextReviewPly(reviewPly, room.moves.length, e.key);
      if (next === undefined) return;
      e.preventDefault();
      setReviewPly(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [room?.id, room?.rule, room?.moves.length, reviewPly]);
  // Move sounds: play a cue when a move lands or the game ends. The
  // baseline is set silently when a room first loads, so opening a
  // game mid-way never replays its history.
  const soundBase = useRef({ room: "", moves: 0, result: null as string | null });
  useEffect(() => {
    if (!room) return;
    const prev = soundBase.current;
    const firstLoad = prev.room !== room.id;
    const landed = !firstLoad && room.moves.length > prev.moves;
    const ended = !firstLoad && !prev.result && !!room.result;
    if ((landed || ended) && !muted)
      playSound(soundForSan(room.moves[room.moves.length - 1], ended));
    soundBase.current = {
      room: room.id,
      moves: room.moves.length,
      result: room.result,
    };
  }, [room?.id, room?.moves.length, room?.result, muted]);
  const live = room
    ? liveClock(room, Date.now() - clockBase.current.at)
    : null;
  const boardFlip = (room?.yourColor === "black") !== flipped;
  const isFog = room?.rule === "fog";
  const pos = useMemo(() => room && room.rule !== "fog" ? variantPosition(room.rule, room.fen) : null, [room?.id, room?.rule, room?.fen]),
    legal = isFog ? (room?.fogMoves ?? []) : pos ? variantMoves(pos) : [];
  const sortedRooms = useMemo(
    () => (state ? sortRooms(state.rooms, state.profile.id) : []),
    [state],
  );
  // Screen-reader announcements: the latest move or the result, in a
  // visually hidden live region. Fog moves that are masked stay
  // masked here too - hidden information never reaches the announce
  // channel either.
  const announcement = useMemo(() => {
    if (!room) return "";
    if (room.result) return `Game over: ${room.result}.`;
    const n = room.moves.length;
    if (n === 0) return "";
    const san = room.moves[n - 1];
    const mover = n % 2 === 1 ? room.whiteName : (room.blackName ?? "Black");
    if (san === "?") return `${mover} moved.`;
    return `${mover} played ${san}.`;
  }, [room?.id, room?.result, room?.moves, room?.whiteName, room?.blackName]);
  // Move list follows the game: it auto-scrolls to the newest move while
  // live, and scrolls the reviewed move into view while stepping through
  // history. While reviewing, live moves never yank the scroll away.
  const movesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = movesRef.current;
    if (!el) return;
    if (reviewPly) {
      el.querySelector(".reviewing")?.scrollIntoView({ block: "nearest" });
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [room?.id, room?.moves.length, reviewPly]);
  const [opening, setOpening] = useState<{
    eco: string;
    name: string;
  } | null>(null);
  useEffect(() => {
    let live = true;
    if (!room || room.rule !== "chess" || room.moves.length === 0) {
      setOpening(null);
      return;
    }
    void openingForMoves(room.moves).then((o) => {
      if (live) setOpening(o);
    });
    return () => {
      live = false;
    };
  }, [room?.id, room?.rule, room?.moves]);
  const review = useMemo(
    () =>
      room && room.rule !== "fog" && reviewPly
        ? replayTo(room.rule, room.moves, reviewPly)
        : null,
    [room?.id, room?.rule, room?.moves, reviewPly],
  );
  const displayPos = review?.pos ?? pos;
  const lastMove = useMemo(
    () => (review ? review.last : lastMoveSquares(room?.lastMove)),
    [review, room?.lastMove],
  );
  const checkSq = useMemo(() => {
    if (!displayPos) return null;
    try {
      if (typeof displayPos.isCheck === "function" && displayPos.isCheck()) {
        const k = displayPos.board.kingOf(displayPos.turn);
        return typeof k === "number" ? k : null;
      }
    } catch {
      // Kingless variants (antichess) throw or lack kings - no check UI.
    }
    return null;
  }, [displayPos]);
  const material =
    room?.rule === "chess"
      ? materialFromFen(review ? variantFen(review.pos) : room.fen)
      : null;
  const sanOf = useMemo(() => {
    if (!pos || isFog) return () => null;
    const cache = new Map<string, string | null>();
    return (uci: string) => {
      if (!cache.has(uci)) {
        let san: string | null = null;
        try {
          const m = parseUci(uci);
          if (m) san = makeSan(pos.clone(), m);
        } catch {
          san = null;
        }
        cache.set(uci, san);
      }
      return cache.get(uci) ?? null;
    };
  }, [pos, isFog]);
  const submitMoveInput = () => {
    const uci = matchMoveInput(moveInput, legal, sanOf);
    if (!uci) {
      setMoveInputError("Not a legal move here.");
      return;
    }
    setMoveInput("");
    setMoveInputError("");
    doMove(uci);
  };
  const active =
    !review &&
    room?.status === "active" &&
    room.yourColor === room.turn &&
    notice === "Connected";
  const doMove = (uci: string) =>
    void run(async () => {
      if (!room) return;
      await api("game", {
        room: room.id,
        version: room.version,
        action: "move",
        uci,
      });
      setSelected(null);
      setPromotion([]);
      setDrop("");
    });
  function square(sq: number) {
    if (!active) {
      // Premove: game running, your seat, not your turn, live board.
      if (
        !room ||
        isFog ||
        review ||
        !pos ||
        room.status !== "active" ||
        notice !== "Connected"
      )
        return;
      if (premove) {
        setPremove(null);
        setSelected(null);
        return;
      }
      if (selected === null) {
        setSelected(
          pos.board.get(sq)?.color === room.yourColor ? sq : null,
        );
        return;
      }
      const uci = premoveUci(pos, selected, sq, room.yourColor);
      if (uci) setPremove(uci);
      setSelected(null);
      return;
    }
    const moves = legal
      .filter((u) =>
        u.startsWith(
          drop ? drop + "@" : selected === null ? "!" : makeSquare(selected),
        ),
      )
      .filter((u) => parseUci(u)?.to === sq);
    if (moves.length > 1) {
      setPromotion(moves);
      return;
    }
    if (moves.length) {
      doMove(moves[0]);
      return;
    }
    if (isFog && room) {
      const p = fogState(room.fen).board[sq];
      setSelected(
        p && colorOf(p) === (room.yourColor === "white" ? "w" : "b")
          ? sq
          : null,
      );
    } else {
      setSelected(pos?.board.get(sq)?.color === room?.yourColor ? sq : null);
    }
    setDrop("");
  }
  const dests = legal
    .filter((u) =>
      u.startsWith(
        drop ? drop + "@" : selected === null ? "!" : makeSquare(selected),
      ),
    )
    .map((u) => parseUci(u)!.to);
  // Fire a queued premove the moment the opponent's move makes it our
  // turn; discard it if the new position made it illegal.
  useEffect(() => {
    if (!active || !premove) return;
    const uci = premove;
    setPremove(null);
    if (legal.includes(uci)) doMove(uci);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  const gameAction = (action: string) =>
    void run(() =>
      api("game", { room: room!.id, version: room!.version, action }),
    );
  const getInviteLink = (roomId: string) => {
    try {
      return `${window.location.origin}/?room=${encodeURIComponent(roomId)}`;
    } catch {
      return `?room=${roomId}`;
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
      setTab("play");
      setTimeout(() => {
        const el = document.getElementById("online-game-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
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
          setTimeout(() => {
            const el = document.getElementById("online-game-section");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 150);
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
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0E0E0E] text-[#F4F4F4] font-body p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
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
              Back to Home
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
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setRevision((r) => r + 1)}
                className="btn-lime py-2 px-4 text-xs font-bold cursor-pointer"
              >
                Retry Connection
              </button>
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
              <button
                onClick={() =>
                  void signOut().then(() => {
                    setState(null);
                    setProfile(null);
                    setRevision((x) => x + 1);
                  })
                }
                className="py-2 px-4 rounded-full text-xs font-semibold bg-[#1A1A1A] text-[#8A8A8A] hover:text-[#FF8080] border border-white/5 cursor-pointer ml-auto"
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
            <section className="online-card">
              <div className="flex items-center justify-between mb-4">
                <h2>{user?.name || state.profile.displayName}</h2>
                {user ? (
                  <span className="px-2.5 py-1 rounded-full bg-[#AFF65B]/20 text-[#AFF65B] text-xs font-mono">
                    Signed in: {user.email}
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#262626] text-[#8A8A8A] text-xs font-mono">
                      Guest Player
                    </span>
                    <button
                      onClick={() => void login("google")}
                      className="btn-lime py-1 px-3 text-xs font-bold cursor-pointer"
                    >
                      Sign in with Google
                    </button>
                  </div>
                )}
              </div>
              <p>
                Chaturanga rating: {state.profile.rating ?? 1200} (provisional
                private-match Elo, standard chess only). {state.profile.games}{" "}
                {state.profile.games === 1 ? "game" : "games"} ·{" "}
                {state.profile.wins} wins · {state.profile.draws} draws ·{" "}
                {state.profile.losses} losses
              </p>
              {state.entitlement && (
                <p role="status">
                  {state.entitlement.unlocked
                    ? "Online play unlocked. Thank you."
                    : `Free online games left: ${state.entitlement.remaining}. Unlocks are not on sale yet - the owner has not chosen a payment model.`}
                </p>
              )}
              <p>
                FIDE:{" "}
                {state.profile.fideRating
                  ? `${state.profile.fideRating} (self-reported, not verified)`
                  : "Not supplied / unrated"}
                . App ratings are not FIDE ratings.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(() => api("profile", profile));
                }}
                className="online-form"
              >
                <label>
                  Username
                  <input
                    required
                    aria-label="Username"
                    minLength={3}
                    maxLength={24}
                    value={profile.username}
                    onChange={(e) =>
                      setProfile({ ...profile, username: e.target.value })
                    }
                  />
                  <small>Exact username search only. No email search.</small>
                </label>
                <label>
                  Display name
                  <input
                    required
                    maxLength={40}
                    value={profile.displayName}
                    onChange={(e) =>
                      setProfile({ ...profile, displayName: e.target.value })
                    }
                  />
                </label>
                <label>
                  About you (optional)
                  <textarea
                    maxLength={160}
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                  />
                </label>
                <label>
                  Country code (optional)
                  <input
                    maxLength={2}
                    placeholder="IN"
                    value={profile.country}
                    onChange={(e) =>
                      setProfile({ ...profile, country: e.target.value })
                    }
                  />
                </label>
                <label>
                  Timezone
                  <input
                    value={profile.timezone}
                    onChange={(e) =>
                      setProfile({ ...profile, timezone: e.target.value })
                    }
                  />
                </label>
                <label>
                  FIDE rating (optional, self-reported)
                  <input
                    type="number"
                    min={1}
                    max={4000}
                    value={profile.fideRating ?? ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        fideRating: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  />
                </label>
                <label className="online-check">
                  <input
                    type="checkbox"
                    checked={profile.discoverable}
                    onChange={(e) =>
                      setProfile({ ...profile, discoverable: e.target.checked })
                    }
                  />
                  Allow people who know my exact username to find me and send a
                  friend request.
                </label>
                {state.mode !== "local" && <label className="online-check"><input type="checkbox" required checked={profile.adultConfirmed} onChange={e=>setProfile({...profile,adultConfirmed:e.target.checked})}/>I am 18 or older (public beta safeguard pending audience review).</label>}
                {state.mode === "local" && <p>Local test profile. No age gate; use invented test data, not children's information.</p>}
                <button disabled={busy}>Save profile</button>
              </form>
              <hr />
              <p>
                Stored: player ID, username, display name, optional
                bio/country/FIDE, timezone, discovery choice, profile readiness (and age confirmation only if applicable), game results, friendships and blocks. Your email
                and OAuth credentials are not stored in this game database. Your
                sign-in provider keeps its own identity record.
              </p>
              <div className="online-actions">
                <button onClick={() => void download()}>
                  Export my game data
                </button>
                <button
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
                >
                  Delete player profile
                </button>
              </div>
            </section>
          )}
          {tab === "friends" && (
            <div className="online-grid">
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
              <section className="online-card">
                <h2>Add someone you know</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(async () =>
                      setFound(await api("find", { username: query })),
                    );
                  }}
                  className="online-form"
                >
                  <label>
                    Exact username
                    <input
                      maxLength={24}
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setFound(null);
                      }}
                    />
                  </label>
                  <button disabled={busy}>Find player</button>
                </form>
                {found ? (
                  <p>
                    {found.displayName} · @{found.username}{" "}
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
                    >
                      Send request
                    </button>
                  </p>
                ) : (
                  <p>
                    Search only finds adult players who choose to be
                    discoverable.
                  </p>
                )}
              </section>
              <section className="online-card">
                <h2>Your circle</h2>
                {!state.friends.length && (
                  <p>
                    No friends yet. Requests must be accepted before a
                    challenge.
                  </p>
                )}
                {state.friends.map((f) => (
                  <div className="online-person" key={f.id}>
                    <strong>{f.displayName}</strong>
                    <span>
                      @{f.username} · {f.state}
                    </span>
                    <div className="online-actions">
                      {f.state === "incoming" && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void run(() =>
                              api("friend", { action: "accept", target: f.id }),
                            )
                          }
                        >
                          Accept
                        </button>
                      )}
                      {f.state === "friend" && (
                        <button disabled={busy} onClick={() => challenge(f.id)}>
                          Challenge (selected PvP settings)
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
                          >
                            {f.state === "friend"
                              ? "Remove friend"
                              : f.state === "incoming"
                                ? "Decline"
                                : "Cancel request"}
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
          {tab === "play" && <CustomRoomPanel rooms={state.customRooms ?? []} run={run} />}
          {tab === "play" && (
            <div className="online-grid">
              <section className="online-card">
                <h2>Create or join a game</h2>
                <div className="online-form">
                  <label>
                    Variant
                    <select
                      aria-label="Variant"
                      value={rule}
                      onChange={(e) => setRule(e.target.value as Rule)}
                    >
                      <option value="fog">
                        Fog of War (house rules: capture the king)
                      </option>
                      {RULE_VARIANTS.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="fine-print online-variant-summary" aria-live="polite">
                    {rule === "fog"
                      ? "Enemy pieces stay hidden until you can capture them - take the king to win."
                      : (RULE_VARIANTS.find((v) => v.id === rule)?.summary ??
                        "")}
                  </p>
                  <label>
                    Time per side
                    <select
                      aria-label="Time per side"
                      value={`${minutes}|${increment}`}
                      onChange={(e) => {
                        const [m, i] = e.target.value.split("|").map(Number);
                        setMinutes(m);
                        setIncrement(i);
                      }}
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
                          {m} minutes{i > 0 ? ` + ${i}s per move` : ", no increment"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    disabled={busy || (state.mode !== "local" && !state.profile.adultConfirmed && !state.profile.profileReady)}
                    onClick={() => challenge()}
                  >
                    {busy ? "Creating room…" : "Create private room"}
                  </button>
                  {room && room.status === "waiting" && room.white === state.profile.id && (
                    <div className="p-3 my-2 rounded-xl bg-[#1E2616] border border-[#AFF65B]/40 text-xs">
                      <div className="flex items-center justify-between font-bold text-[#AFF65B] mb-1">
                        <span>🟢 PRIVATE ROOM CREATED</span>
                        <span className="font-mono text-white text-xs bg-black/60 px-2 py-0.5 rounded border border-[#AFF65B]/20">
                          {room.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A3A3A3] m-0 mb-2">
                        Waiting for opponent. Share the invite link or code with your friend:
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
                          onClick={() => {
                            const el = document.getElementById("online-game-section");
                            el?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          className="px-2.5 py-1 bg-transparent text-[#AFF65B] text-[11px] border border-[#AFF65B]/30 rounded cursor-pointer hover:bg-[#AFF65B]/10"
                        >
                          View Board ↓
                        </button>
                      </div>
                    </div>
                  )}
                  <label>
                    Room code
                    <input
                      value={code}
                      maxLength={18}
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="e.g. 8ITRU8"
                      className="uppercase font-mono"
                      onChange={(e) =>
                        setCode(e.target.value.trim().toLowerCase())
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && code && !busy) {
                          e.preventDefault();
                          void run(async () => {
                            await api("join", { room: code });
                            setSelectedRoom(code);
                          });
                        }
                      }}
                    />
                  </label>
                  <button
                    disabled={busy || !code}
                    onClick={() =>
                      void run(async () => {
                        await api("join", { room: code });
                        setSelectedRoom(code);
                      })
                    }
                  >
                    Join room
                  </button>
                </div>
                <p>
                  Room codes grant the second seat. Share privately. Friend
                  challenges are restricted to the invited friend.
                </p>
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
                        setSelected(null);
                        setPromotion([]);
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
              <section id="online-game-section" className="online-card online-game">
                {room && (pos || isFog) ? (
                  <>
                    <h2>
                      {room.whiteName} vs{" "}
                      {room.blackName ?? "waiting for Black"}
                    </h2>
                    {room.status === "waiting" && (
                      <div className="p-4 rounded-xl bg-[#1E2616] border border-[#AFF65B]/30 my-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#AFF65B] animate-ping" />
                            <strong className="text-white text-sm">Waiting for opponent to join…</strong>
                          </div>
                          <span className="font-mono text-[#AFF65B] font-bold text-xs bg-black/60 px-2.5 py-1 rounded border border-[#AFF65B]/20">
                            Room: {room.id}
                          </span>
                        </div>
                        <p className="text-xs text-[#A3A3A3] mb-3">
                          Send this invite link or room code to a friend. The game clock starts as soon as Black makes their first move.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyInviteLink(room.id)}
                            className="btn-lime px-3 py-1.5 text-xs font-bold rounded cursor-pointer"
                          >
                            {copiedLink ? "✓ Invite Link Copied!" : "📋 Copy Invite Link"}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyRoomCode(room.id)}
                            className="px-3 py-1.5 bg-[#262626] text-white text-xs rounded border border-white/10 hover:bg-[#333] cursor-pointer"
                          >
                            {copied ? "✓ Code Copied" : "Copy Code"}
                          </button>
                          {room.white === state.profile.id && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => gameAction("cancel")}
                              className="px-3 py-1.5 bg-transparent text-[#FF8080] text-xs border border-[#E5484D]/30 hover:bg-[#E5484D]/10 rounded cursor-pointer ml-auto"
                            >
                              Cancel Room
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    {room.status === "active" &&
                      (room.yourColor === "white"
                        ? room.black !== null && room.blackOnline === false
                        : room.whiteOnline === false) && (
                        <p className="online-offline" role="status">
                          {room.yourColor === "white"
                            ? room.blackName
                            : room.whiteName}{" "}
                          is offline - their clock keeps running and they can
                          rejoin anytime.
                        </p>
                      )}
                    <p>
                      You are {room.yourColor}. Room: <code>{room.id}</code>{" "}
                      <button
                        className="online-copy"
                        disabled={busy}
                        onClick={() => copyRoomCode(room.id)}
                      >
                        {copied ? "Copied" : "Copy code"}
                      </button>{" "}
                      <button
                        className="online-copy"
                        disabled={busy}
                        onClick={() => copyInviteLink(room.id)}
                      >
                        {copiedLink ? "Link copied" : "Copy invite link"}
                      </button>
                    </p>
                    {room.result ? (
                      <div className="online-result" role="status">
                        <strong>{room.result}</strong>
                        <span>
                          {room.moves.length}{" "}
                          {room.moves.length === 1 ? "move" : "moves"} played
                          {opening ? ` · ${opening.name}` : ""}
                        </span>
                        {room.rule === "chess" &&
                          room.result !== "Room cancelled" &&
                          room.result !== "Game aborted" && (
                            <span>
                              Standard chess uses provisional private-match
                              ratings.
                              {room.ratingDelta &&
                                (() => {
                                  const d =
                                    room.ratingDelta[room.yourColor];
                                  return ` Rating change: ${
                                    d > 0 ? `+${d}` : d === 0 ? "no change" : d
                                  }.`;
                                })()}
                            </span>
                          )}
                        {room.black && room.result !== "Room cancelled" && (
                          <button
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                const out = await api<{ room?: string }>(
                                  "game",
                                  {
                                    room: room.id,
                                    version: room.version,
                                    action: "rematch",
                                  },
                                );
                                if (out?.room) setSelectedRoom(out.room);
                              })
                            }
                          >
                            Rematch (colours swap)
                          </button>
                        )}
                        {room.rule !== "fog" &&
                          room.result !== "Room cancelled" &&
                          room.moves.length > 0 && (
                            <button
                              className="online-copy-pgn"
                              disabled={busy}
                              title="Copy this game's score in PGN, the standard chess record format. Not offered for Fog of War: players only see a filtered move list there."
                              onClick={() => {
                                void navigator.clipboard
                                  ?.writeText(buildPgn(room))
                                  .then(() => setCopiedPgn(true))
                                  .catch(() =>
                                    setError("Copy failed - your browser blocked clipboard access."),
                                  );
                              }}
                            >
                              {copiedPgn ? "PGN copied" : "Copy PGN"}
                            </button>
                          )}
                      </div>
                    ) : (
                      <p>
                        {room.status === "waiting"
                          ? "Share the room code."
                          : `${room.turn} to move`}
                        .
                      </p>
                    )}
                    {room.status === "active" && room.takeback && (
                      <div className="online-draw" role="status">
                        {room.takeback === state.profile.id ? (
                          <>
                            <span>You asked to undo the last move.</span>
                            <button
                              disabled={busy}
                              onClick={() => gameAction("declineTakeback")}
                            >
                              Withdraw request
                            </button>
                          </>
                        ) : (
                          <>
                            <span>
                              {room.yourColor === "white"
                                ? room.blackName
                                : room.whiteName}{" "}
                              asks to undo the last move.
                            </span>
                            <button
                              disabled={busy}
                              onClick={() => gameAction("acceptTakeback")}
                            >
                              Accept
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => gameAction("declineTakeback")}
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {room.status === "active" && room.drawOffer && (
                      <div className="online-draw" role="status">
                        {room.drawOffer === state.profile.id ? (
                          <>
                            <span>You offered a draw.</span>
                            <button
                              disabled={busy}
                              onClick={() => gameAction("declineDraw")}
                            >
                              Withdraw offer
                            </button>
                          </>
                        ) : (
                          <>
                            <span>
                              {room.yourColor === "white"
                                ? room.blackName
                                : room.whiteName}{" "}
                              offers a draw.
                            </span>
                            <button
                              disabled={busy}
                              onClick={() => gameAction("acceptDraw")}
                            >
                              Accept
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => gameAction("declineDraw")}
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    <div className="online-clocks">
                      <span
                        className={`${room.status === "active" && room.turn === "white" ? "online-clock-active" : ""} ${live && live.whiteMs <= 10000 && room.status === "active" ? "online-clock-low" : ""}`}
                      >
                        White {formatClock(live?.whiteMs ?? room.whiteMs)}
                      </span>
                      <span
                        className={`${room.status === "active" && room.turn === "black" ? "online-clock-active" : ""} ${live && live.blackMs <= 10000 && room.status === "active" ? "online-clock-low" : ""}`}
                      >
                        Black {formatClock(live?.blackMs ?? room.blackMs)}
                      </span>
                    </div>
                    <div className="sr-only" role="status" aria-live="polite">
                      {announcement}
                    </div>
                    {material && (
                      <div className="online-material" aria-label="Material balance" title="Missing starting pieces inferred from the board; promotions can change these icons.">
                        <Captured label="White took" pieces={material.capturedByWhite} color="b" />
                        <span className="online-material-lead">
                          {material.lead === 0
                            ? "Level material"
                            : material.lead > 0
                              ? `White +${material.lead}`
                              : `Black +${-material.lead}`}
                        </span>
                        <Captured label="Black took" pieces={material.capturedByBlack} color="w" />
                      </div>
                    )}
                    {isFog ? (
                      <FogBoard
                        fen={room.fen}
                        fogSquares={room.fogSquares ?? []}
                        flip={boardFlip}
                        selected={selected}
                        dests={active ? dests : []}
                        onSquare={square}
                        lastMove={lastMove}
                      />
                    ) : pos ? (
                      <VariantBoard
                        flip={boardFlip}
                        pos={displayPos!}
                        selected={selected}
                        dests={active ? dests : []}
                        onSquare={square}
                        lastMove={lastMove}
                        checkSq={checkSq}
                        premove={premove ? lastMoveSquares(premove) : []}
                      />
                    ) : null}
                    {isFog && (
                      <p className="fine-print">
                        Fog of War house rules: capture the king to win - there
                        is no check or checkmate. Enemy pieces stay hidden
                        unless your pieces can see their square.
                      </p>
                    )}
                    {room.rule === "crazyhouse" && pos && pos.pockets && (
                      <label>
                        Drop from your pocket
                        <select
                          value={drop}
                          onChange={(e) => {
                            setDrop(e.target.value);
                            setSelected(null);
                          }}
                        >
                          <option value="">Choose a piece</option>
                          {(
                            [
                              "pawn",
                              "knight",
                              "bishop",
                              "rook",
                              "queen",
                            ] as const
                          )
                            .filter(
                              (role) => pos.pockets![room.yourColor][role] > 0,
                            )
                            .map((role) => (
                              <option
                                key={role}
                                value={
                                  {
                                    pawn: "P",
                                    knight: "N",
                                    bishop: "B",
                                    rook: "R",
                                    queen: "Q",
                                  }[role]
                                }
                              >
                                {role} ({pos.pockets![room.yourColor][role]})
                              </option>
                            ))}
                        </select>
                      </label>
                    )}
                    {active && !isFog && (
                      <form
                        className="online-keyboard"
                        onSubmit={(e) => {
                          e.preventDefault();
                          submitMoveInput();
                        }}
                      >
                        <label>
                          Type a move
                          <input
                            value={moveInput}
                            onChange={(e) => {
                              setMoveInput(e.target.value);
                              setMoveInputError("");
                            }}
                            placeholder="e4, Nf3, O-O, e2e4"
                            aria-label="Type a move"
                            autoComplete="off"
                            spellCheck={false}
                          />
                        </label>
                        <button type="submit" disabled={busy || !moveInput.trim()}>
                          Play move
                        </button>
                      </form>
                    )}
                    {active && isFog && (
                      <form
                        className="online-keyboard"
                        onSubmit={(e) => {
                          e.preventDefault();
                          submitMoveInput();
                        }}
                      >
                        <label>
                          Type a move
                          <input
                            value={moveInput}
                            onChange={(e) => {
                              setMoveInput(e.target.value);
                              setMoveInputError("");
                            }}
                            placeholder="e2e4"
                            aria-label="Type a move"
                            autoComplete="off"
                            spellCheck={false}
                          />
                        </label>
                        <button type="submit" disabled={busy || !moveInput.trim()}>
                          Play move
                        </button>
                      </form>
                    )}
                    {moveInputError && (
                      <p className="online-keyboard-error" role="alert">
                        {moveInputError}
                      </p>
                    )}
                    {promotion.length > 0 && (
                      <div
                        className="online-actions"
                        aria-label="Promotion choice"
                      >
                        {promotion.map((m) => (
                          <button
                            key={m}
                            disabled={busy}
                            onClick={() => doMove(m)}
                          >
                            Promote to{" "}
                            {{
                              q: "queen",
                              r: "rook",
                              b: "bishop",
                              n: "knight",
                            }[m[4]] ?? m[4]}
                          </button>
                        ))}
                      </div>
                    )}
                    {premove && (
                      <p className="online-premove" role="status">
                        Premove set - it plays automatically when your
                        opponent moves. Click the board to cancel it.
                      </p>
                    )}
                    <p aria-live="polite">
                      {busy
                        ? "Waiting for server confirmation"
                        : room.status === "active"
                          ? active
                            ? "Your turn"
                            : "Waiting for opponent"
                          : "Game not active"}
                    </p>
                    <div className="online-actions">
                      <button
                        disabled={busy}
                        onClick={() => setFlipped((f) => !f)}
                      >
                        Flip board
                      </button>
                      <button
                        aria-pressed={!muted}
                        title="Move sounds. Your choice is remembered on this device."
                        onClick={() => {
                          const next = !muted;
                          setMuted(next);
                          localStorage.setItem(
                            "chaturanga-muted",
                            next ? "1" : "0",
                          );
                          if (!next) playSound("move");
                        }}
                      >
                        {muted ? "Sound off" : "Sound on"}
                      </button>
                      {room.status === "active" && (
                        <>
                          {confirmResign ? (
                            <>
                              <button
                                className="online-danger"
                                disabled={busy}
                                onClick={() => {
                                  setConfirmResign(false);
                                  gameAction("resign");
                                }}
                              >
                                Confirm resign
                              </button>
                              <button
                                disabled={busy}
                                onClick={() => setConfirmResign(false)}
                              >
                                Keep playing
                              </button>
                            </>
                          ) : (
                            <button
                              disabled={busy}
                              onClick={() => setConfirmResign(true)}
                            >
                              Resign
                            </button>
                          )}
                          {room.moves.length < 2 &&
                            (confirmAbort ? (
                              <>
                                <button
                                  className="online-danger"
                                  disabled={busy}
                                  onClick={() => {
                                    setConfirmAbort(false);
                                    gameAction("abort");
                                  }}
                                >
                                  Confirm abort
                                </button>
                                <button
                                  disabled={busy}
                                  onClick={() => setConfirmAbort(false)}
                                >
                                  Keep playing
                                </button>
                              </>
                            ) : (
                              <button
                                disabled={busy}
                                title="End the game with no result. Only available before each player has moved."
                                onClick={() => setConfirmAbort(true)}
                              >
                                Abort
                              </button>
                            ))}
                          <button
                            disabled={busy}
                            onClick={() => gameAction("offerDraw")}
                          >
                            Offer draw
                          </button>
                          {!isFog && room.moves.length > 0 && (
                            <button
                              disabled={busy || room.takeback === state.profile.id}
                              title="Ask your opponent to undo the last move. Casual rooms only - the clock time already spent is not restored."
                              onClick={() => gameAction("requestTakeback")}
                            >
                              Takeback
                            </button>
                          )}
                        </>
                      )}
                      {room.status === "waiting" &&
                        room.white === state.profile.id && (
                          <button
                            disabled={busy}
                            onClick={() => gameAction("cancel")}
                          >
                            Cancel room
                          </button>
                        )}
                    </div>
                    {reviewPly && (
                      <p className="online-review" role="status">
                        Viewing move {reviewPly} of {room.moves.length} - the
                        board is read-only. Arrow keys step through moves.{" "}
                        <button
                          className="online-review-exit"
                          onClick={() => setReviewPly(null)}
                        >
                          Back to live
                        </button>
                      </p>
                    )}
                    {opening && (
                      <p className="online-opening" title="Named from the ECO opening table while the game follows a book line.">
                        {opening.name} <small>{opening.eco}</small>
                      </p>
                    )}
                    <div className="online-moves" aria-label="Move list" ref={movesRef}>
                      {room.moves.length === 0 && <p>No moves yet</p>}
                      {moveRows(room.moves).map(([n, w, b], i) => (
                        <div className="online-move-row" key={n}>
                          <span>{n}</span>
                          {isFog ? (
                            <>
                              <span>{w}</span>
                              <span>{b ?? ""}</span>
                            </>
                          ) : (
                            <>
                              <button
                                className={reviewPly === i * 2 + 1 ? "reviewing" : ""}
                                title="View the board after this move"
                                onClick={() => setReviewPly(i * 2 + 1)}
                              >
                                {w}
                              </button>
                              {b !== null && (
                                <button
                                  className={reviewPly === i * 2 + 2 ? "reviewing" : ""}
                                  title="View the board after this move"
                                  onClick={() => setReviewPly(i * 2 + 2)}
                                >
                                  {b}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    <small>
                      Server clocks keep running when a player disconnects.
                      Reconnect restores the latest board. These private games
                      are not official FIDE games.
                    </small>
                  </>
                ) : (
                  <>
                    <h2>Your next game starts here</h2>
                    <p>
                      Create a private room or open a game from the list.
                      Standard chess, seven established variants and Fog of
                      War (house rules) use the server rule engine.
                      Maths/spells and three/four-player house rules are above.
                    </p>
                    {!hintsOff && (
                      <div className="online-hints" role="note">
                        <h3>Getting started</h3>
                        <ul>
                          <li>
                            Create a room and share its code - your friend
                            joins from the lobby.
                          </li>
                          <li>
                            Move three ways: click or tap the board, type the
                            move (e2e4 or Nf3), or use the keyboard - Tab to
                            the board, arrows, Enter.
                          </li>
                          <li>
                            Casual rooms allow takebacks and draw offers;
                            either player can decline.
                          </li>
                          <li>
                            Finished a game? Copy its PGN from the result
                            panel, and step back through it with the arrow
                            keys.
                          </li>
                        </ul>
                        <button
                          onClick={() => {
                            setHintsOff(true);
                            localStorage.setItem(
                              "chaturanga-hints-dismissed",
                              "1",
                            );
                          }}
                        >
                          Got it
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
function Captured({
  label,
  pieces,
  color,
}: {
  label: string;
  pieces: string[];
  color: "w" | "b";
}) {
  const FILE: Record<string, string> = {
    p: "P",
    n: "N",
    b: "B",
    r: "R",
    q: "Q",
  };
  return (
    <span className="online-captured" aria-label={label} title={label}>
      {pieces.map((role, i) => (
        <img
          key={`${role}-${i}`}
          src={`/pieces/${color}${FILE[role]}.svg`}
          alt={role}
        />
      ))}
    </span>
  );
}
