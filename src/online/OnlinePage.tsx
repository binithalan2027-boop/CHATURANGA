import { usePreferences } from "../chaturanga/preferences";
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
// Unified Custom & Variant Modes
const UNIFIED_MODES: Array<{ id: string; name: string; summary: string; category: "custom" | "variant" }> = [
  // Custom & Multi-Player
  { id: "mind", name: "Chess MM (Mind Before Move)", summary: "Solve mental math challenges to unlock chess moves and cast spell drops.", category: "custom" },
  { id: "mantra", name: "Mantra Duel", summary: "Fast-paced tactical chess duel with magical powers & spell cards every 90 seconds.", category: "custom" },
  { id: "cross3", name: "3-Player Cross-Board", summary: "Three-player battle on an expanded cross board with king-capture rules. North arm open runway.", category: "custom" },
  { id: "cross4", name: "4-Player Cross-Board", summary: "Four-player free-for-all battlefield. Capture kings, eliminate rivals, last army standing wins.", category: "custom" },
  // Classic & Rule Variants
  { id: "chess", name: "Standard Chess", summary: "Checkmate the opposing king under classic FIDE rules.", category: "variant" },
  { id: "fog", name: "Fog of War", summary: "See only what you can reach. Enemy pieces stay hidden until capturable - take the king to win.", category: "variant" },
  { id: "chess960", name: "Chess960", summary: "Fischer Random setup with shuffled back rank every game.", category: "variant" },
  { id: "atomic", name: "Atomic Chess", summary: "Captures cause violent 3x3 explosions destroying adjacent pieces.", category: "variant" },
  { id: "crazyhouse", name: "Crazyhouse", summary: "Captured pieces join your pocket. Drop them on legal squares.", category: "variant" },
  { id: "kingofthehill", name: "King of the Hill", summary: "Win by reaching d4, e4, d5 or e5 with your king, or by checkmate.", category: "variant" },
  { id: "3check", name: "Three-Check Chess", summary: "Win by giving three checks, or checkmate.", category: "variant" },
  { id: "antichess", name: "Antichess", summary: "Captures are compulsory. Shed your pieces; kings are not royal.", category: "variant" },
  { id: "horde", name: "Horde Chess", summary: "White has a pawn horde; Black has a standard army.", category: "variant" },
  { id: "racingkings", name: "Racing Kings", summary: "Race kings to the eighth rank without giving check.", category: "variant" },
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
  const { prefs } = usePreferences();
  const [premoveQueue, setPremoveQueue] = useState<string[]>([]);  const [state, setState] = useState<OnlineState | null>(null),
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
    [reviewPly, setReviewPly] = useState<number | null>(null),
    [premove, setPremove] = useState<string | null>(null),
    [confirmResign, setConfirmResign] = useState(false),
    [confirmAbort, setConfirmAbort] = useState(false),
    [lobbyFilter, setLobbyFilter] = useState<LobbyFilter>("all"),
    [moveInput, setMoveInput] = useState(""),
    [moveInputError, setMoveInputError] = useState(""),
    [matchmaking, setMatchmaking] = useState(false),
    [isMatchFound, setIsMatchFound] = useState(false),
    [matchViewRoom, setMatchViewRoom] = useState<string | null>(null),
    [selectedCustomRoomId, setSelectedCustomRoomId] = useState<string | null>(null),
    [inCustomMatchScreen, setInCustomMatchScreen] = useState(false),
    [unifiedMode, setUnifiedMode] = useState<string>("chess"),
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
    setPremoveQueue([]);
    setConfirmResign(false);
    setConfirmAbort(false);
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
      if (selected === null) {
        setSelected(
          pos.board.get(sq)?.color === room.yourColor ? sq : null,
        );
        return;
      }
      const uci = premoveUci(pos, selected, sq, room.yourColor);
      if (uci) {
        if (prefs.premoveLimit === "limitless") {
          setPremoveQueue((prev) => [...prev, uci]);
          setPremove(uci);
        } else {
          setPremoveQueue([uci]);
          setPremove(uci);
        }
      }
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
    if (!active) return;
    const currentQueue = premoveQueue.length > 0 ? premoveQueue : (premove ? [premove] : []);
    if (currentQueue.length === 0) return;

    const nextUci = currentQueue[0];
    if (legal.includes(nextUci)) {
      // Valid premove! Cross-check passed
      setPremoveQueue((prev) => prev.slice(1));
      setPremove(currentQueue[1] || null);
      doMove(nextUci);
    } else {
      // Invalid premove: illegal move! Discard queue
      setPremoveQueue([]);
      setPremove(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, legal]);
  const gameAction = (action: string) =>
    void run(() =>
      api("game", { room: room!.id, version: room!.version, action }),
    );
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

  const activeRoomId = matchViewRoom || selectedRoom;
  const currentActiveRoom = activeRoomId && state?.rooms
    ? state.rooms.find((r) => r.id === activeRoomId) || room
    : room;

  if (activeRoomId && currentActiveRoom && state) {
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

  const activeCustomRoom = state?.customRooms?.find((r) => r.id === selectedCustomRoomId);
  if (inCustomMatchScreen && activeCustomRoom && state) {
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
            <div className={room && (pos || isFog) ? "online-grid" : "w-full"}>
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
                      {/* Mode / Variant Selector with actual names */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                          Game Mode / Variant
                        </label>
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
                          className="w-full bg-[#242424] text-white text-xs font-semibold px-4 py-3 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none"
                        >
                          <optgroup label="Multiplayer & Special Cross-Board">
                            <option value="cross3">3-Player Cross-Board</option>
                            <option value="cross4">4-Player Cross-Board</option>
                            <option value="mind">Chess MM (Mind Before Move)</option>
                            <option value="mantra">Mantra Duel</option>
                          </optgroup>
                          <optgroup label="Standard Chess & Variants">
                            <option value="chess">Standard Chess</option>
                            <option value="fog">Fog of War</option>
                            <option value="chess960">Chess960</option>
                            <option value="atomic">Atomic Chess</option>
                            <option value="crazyhouse">Crazyhouse</option>
                            <option value="kingofthehill">King of the Hill</option>
                            <option value="3check">Three-Check Chess</option>
                            <option value="antichess">Antichess</option>
                            <option value="horde">Horde Chess</option>
                            <option value="racingkings">Racing Kings</option>
                          </optgroup>
                        </select>
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
                        if (modeObj?.category === "custom") {
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
              {room && (pos || isFog) && (
                <section id="online-game-section" className="online-card online-game">
                  <>
                    <h2>
                      {room.whiteName} vs{" "}
                      {room.blackName ?? "waiting for Black"}
                    </h2>
                    <div className="flex items-center justify-between gap-3 my-2">
                      <button
                        type="button"
                        onClick={() => setMatchViewRoom(room.id)}
                        className="btn-lime py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-md flex items-center gap-2"
                      >
                        <span>⚔️</span>
                        <span>Open Full Match View & Live Chat →</span>
                      </button>
                    </div>
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
                        {room.result !== "Room cancelled" &&
                          room.result !== "Game aborted" &&
                          room.moves.length > 0 && (
                            <button
                              type="button"
                              disabled={busy}
                              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                              title="Match review with deep engine analysis is coming soon"
                              onClick={() =>
                                alert(
                                  `Match Review for Online Game vs ${
                                    (room.yourColor === "white" ? room.blackName : room.whiteName) || "Opponent"
                                  }:\n\nDeep Stockfish engine move-by-move evaluation, blunder analysis, and brilliance detection is coming soon in the next major update!`
                                )
                              }
                            >
                              <span>Match Review</span>
                              <span style={{ fontSize: "10px", background: "rgba(175, 246, 91, 0.2)", color: "#AFF65B", padding: "2px 6px", borderRadius: "999px", fontWeight: "bold" }}>
                                Coming Soon
                              </span>
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
                        premove={premoveQueue.length > 0 ? premoveQueue.flatMap(lastMoveSquares) : (premove ? lastMoveSquares(premove) : [])}
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
                    {(premoveQueue.length > 0 || premove) && (
                      <div className="online-premove flex items-center justify-between" role="status">
                        <span>
                          {premoveQueue.length > 1
                            ? `${premoveQueue.length} premoves queued (${prefs.premoveLimit === "limitless" ? "limitless" : "1-move"})`
                            : "Premove set (1)"} - plays automatically if legal.
                        </span>
                        <button
                          onClick={() => {
                            setPremoveQueue([]);
                            setPremove(null);
                          }}
                          className="text-xs text-red-400 hover:text-red-300 font-bold ml-2 underline cursor-pointer"
                        >
                          Cancel [✕]
                        </button>
                      </div>
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
                </section>
              )}
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
