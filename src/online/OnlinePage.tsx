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
  onExit,
  initialTab = "play",
}: {
  onExit: () => void;
  initialTab?: "play" | "friends" | "profile";
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
    [copiedPgn, setCopiedPgn] = useState(false),
    [muted, setMuted] = useState(
      () => localStorage.getItem("chaturanga-muted") === "1",
    ),
    [hintsOff, setHintsOff] = useState(
      () => localStorage.getItem("chaturanga-hints-dismissed") === "1",
    ),
    [reviewPly, setReviewPly] = useState<number | null>(null),
    [premove, setPremove] = useState<string | null>(null),
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
    setCopiedPgn(false);
    setTickTs(0);
    setReviewPly(null);
    setPremove(null);
  }, [selectedRoom]);
  useEffect(() => {
    void api<{ mode: string; providers: string[] }>("config")
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    let disposed = false;
    let off = () => {};
    void token().then((t) => {
      if (disposed) return;
      if (!t) {
        setNotice("Sign in to play online.");
        return;
      }
      void api<OnlineState>("state")
        .then((s) => {
          setState(s);
          setProfile((p) => p ?? s.profile);
        })
        .catch((e) => setError(e.message));
      off = subscribe((s) => {
        setState(s);
        setProfile((p) => p ?? s.profile);
      }, setNotice);
    });
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
  const opening = useMemo(
    () =>
      room && room.rule === "chess" && room.moves.length > 0
        ? openingForMoves(room.moves)
        : null,
    [room?.id, room?.rule, room?.moves],
  );
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
  const challenge = (id?: string) =>
    void run(async () => {
      const r = await api<{ room: string }>("create", {
        rule,
        minutes,
        invitee: id,
      });
      setSelectedRoom(r.room);
      setTab("play");
    });
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
    <main className="online-shell">
      <header className="online-header">
        <div>
          <p className="online-kicker">CHATURANGA / CONNECT</p>
          <h1>
            {tab === "play"
              ? "Play together"
              : tab === "friends"
                ? "Friends"
                : "Player profile"}
          </h1>
          <p>Server-checked moves. Your account, your circle.</p>
        </div>
        <button onClick={onExit}>Back to courtyard</button>
      </header>
      <div className="online-status" role="status">
        {config?.mode === "local"
          ? "LOCAL DEVELOPMENT ONLY · No real social login · This server is on your computer"
          : "Online account service"}{" "}
        · {notice}
      </div>
      {error && (
        <p className="online-error" role="alert">
          {error}
        </p>
      )}
      {!state ? (
        <section className="online-card">
          <h2>Choose how to sign in</h2>
          <p>
            Google includes Gmail accounts. Social login is enabled only after
            the provider is configured.
          </p>
          <div className="online-actions">
            {(["google", "facebook", "discord"] as Provider[]).map((p) => (
              <button
                key={p}
                disabled={
                  busy ||
                  !config?.providers.includes(p) ||
                  config.mode === "local"
                }
                onClick={() => void login(p)}
              >
                Continue with{" "}
                {p === "google"
                  ? "Google"
                  : p === "facebook"
                    ? "Facebook"
                    : "Discord"}
              </button>
            ))}
          </div>
          <p>
            Instagram sign-in is not supported for ordinary personal accounts
            here. You can use Google, Facebook or Discord instead.
          </p>
          {config?.mode === "local" && (
            <>
              <hr />
              <p>
                Create a test player for local testing. This is not a
                Google/Facebook/Discord account. Separate browser windows can
                play each other.
              </p>
              <button disabled={busy} onClick={() => void login()}>
                Create local test player
              </button>
            </>
          )}
        </section>
      ) : (
        <>
          <div
            className="online-tabs"
            role="group"
            aria-label="Online sections"
          >
            {(["play", "friends", "profile"] as const).map((t) => (
              <button
                key={t}
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
              >
                {t === "play" ? "PvP" : t === "friends" ? "Friends" : "Profile"}
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
            >
              Sign out
            </button>
          </div>
          {!state.profile.adultConfirmed && state.mode !== "local" && (
            <p className="online-status">
              Complete your profile and confirm you are 18 or older before
              online play or friend requests.{" "}
              <button onClick={() => setTab("profile")}>Set up profile</button>
            </p>
          )}
          {tab === "profile" && profile && (
            <section className="online-card">
              <h2>{state.profile.displayName}</h2>
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
                  <label>
                    Time per side
                    <select
                      aria-label="Time per side"
                      value={minutes}
                      onChange={(e) => setMinutes(Number(e.target.value))}
                    >
                      {[3, 5, 10, 15].map((m) => (
                        <option key={m} value={m}>
                          {m} minutes, no increment
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    disabled={busy || (state.mode !== "local" && !state.profile.adultConfirmed)}
                    onClick={() => challenge()}
                  >
                    Create private room
                  </button>
                  <label>
                    Room code
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.trim())}
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
                      {ruleLabel(r.rule)} · {timeControlLabel(r.initialMs)} ·{" "}
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
              </section>
              <section className="online-card online-game">
                {filterRooms(sortedRooms, state.profile.id, lobbyFilter).length ===
                  0 && (
                  <p className="fine-print">No games in this view.</p>
                )}
                {room && (pos || isFog) ? (
                  <>
                    <h2>
                      {room.whiteName} vs{" "}
                      {room.blackName ?? "waiting for Black"}
                    </h2>
                    <p>
                      You are {room.yourColor}. Room: <code>{room.id}</code>{" "}
                      <button
                        className="online-copy"
                        disabled={busy}
                        onClick={() => {
                          void navigator.clipboard
                            ?.writeText(room.id)
                            .then(() => setCopied(true))
                            .catch(() => setError("Copy failed. Select and copy the room code above."));
                        }}
                      >
                        {copied ? "Copied" : "Copy code"}
                      </button>
                    </p>
                    {room.result ? (
                      <div className="online-result" role="status">
                        <strong>{room.result}</strong>
                        {room.rule === "chess" &&
                          room.result !== "Room cancelled" && (
                            <span>
                              Standard chess uses provisional private-match ratings.
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
                            Promote to {m[4]}
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
                          <button
                            disabled={busy}
                            onClick={() => {
                              if (confirm("Resign this game?"))
                                gameAction("resign");
                            }}
                          >
                            Resign
                          </button>
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
                    <div className="online-moves" aria-label="Move list">
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
    </main>
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
