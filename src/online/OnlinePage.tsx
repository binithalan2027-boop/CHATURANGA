import { useEffect, useState } from "react";
import { makeSquare, parseUci } from "chessops/util";
import VariantBoard from "../chaturanga/VariantBoard";
import FogBoard from "../chaturanga/FogBoard";
import { colorOf, fogFromFen } from "../online/fogRules";
const fogState = fogFromFen;
import { variantPosition, variantMoves } from "../chaturanga/variantRules";
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
    [drop, setDrop] = useState("");
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
  const isFog = room?.rule === "fog";
  const pos = room && room.rule !== "fog" ? variantPosition(room.rule, room.fen) : null,
    legal = isFog ? (room?.fogMoves ?? []) : pos ? variantMoves(pos) : [];
  const active =
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
    if (!active) return;
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
                        "Delete your player profile and friendships? Game history is anonymized. This does not delete your external sign-in account.",
                      )
                    )
                      void run(async () => {
                        await api("delete", {});
                        await signOut();
                        setState(null);
                        setProfile(null);
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
                {state.rooms.map((r) => (
                  <div className="online-person" key={r.id}>
                    <button
                      onClick={() => {
                        setSelectedRoom(r.id);
                        setSelected(null);
                        setPromotion([]);
                      }}
                    >
                      {r.whiteName} vs {r.blackName ?? "waiting"} · {r.rule} ·{" "}
                      {r.status}
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
                {room && (pos || isFog) ? (
                  <>
                    <h2>
                      {room.whiteName} vs{" "}
                      {room.blackName ?? "waiting for Black"}
                    </h2>
                    <p>
                      You are {room.yourColor}.{" "}
                      {room.result ??
                        (room.status === "waiting"
                          ? "Share the room code."
                          : `${room.turn} to move`)}
                      . Room: <code>{room.id}</code>
                    </p>
                    <div className="online-clocks">
                      <span>White {clock(room.whiteMs)}</span>
                      <span>Black {clock(room.blackMs)}</span>
                    </div>
                    {isFog ? (
                      <FogBoard
                        fen={room.fen}
                        fogSquares={room.fogSquares ?? []}
                        flip={room.yourColor === "black"}
                        selected={selected}
                        dests={active ? dests : []}
                        onSquare={square}
                      />
                    ) : pos ? (
                      <VariantBoard
                        flip={room.yourColor === "black"}
                        pos={pos}
                        selected={selected}
                        dests={active ? dests : []}
                        onSquare={square}
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
                          {room.drawOffer &&
                            room.drawOffer !== state.profile.id && (
                              <button
                                disabled={busy}
                                onClick={() => gameAction("acceptDraw")}
                              >
                                Accept draw
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
                    <p>Moves: {room.moves.join(" · ") || "No moves yet"}</p>
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
function clock(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
