import { randomBytes } from "node:crypto";
import {
  variantPosition,
  variantPlay,
  variantFen,
} from "../src/chaturanga/variantRules";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";
import { RULE_VARIANTS } from "../src/chaturanga/variantCatalog";
import type {
  PlayerProfile,
  FriendView,
  Rule,
  RoomView,
  OnlineState,
  ChatMessage,
} from "../src/online/types";
import { Store } from "./store";
import {
  fogInitial,
  fogFromFen,
  fogFen,
  fogPlay,
  fogLegalMoves,
  fogView,
  fogPositionKey,
  squareName,
  parseSquare,
  type FogPiece,
} from "../src/online/fogRules";
interface Friend {
  id: string;
  from: string;
  to: string;
  status: "pending" | "accepted";
}
interface Block {
  id: string;
  from: string;
  to: string;
}
interface Room {
  id: string;
  rule: Rule;
  white: string;
  black: string | null;
  invitee: string | null;
  /** Set when this room was created as a rematch of a finished room. */
  rematchOf?: string | null;
  fen: string;
  moves: string[];
  version: number;
  status: "waiting" | "active" | "finished";
  whiteMs: number;
  blackMs: number;
  updatedAt: number;
  result: string | null;
  drawOffer: string | null;
  /** Player id asking to undo the last move, awaiting the opponent. */
  takeback?: string | null;
  initialMs: number;
  /** Increment added to the mover's clock after each move, ms. */
  incrementMs?: number;
  /** Last played move in uci ("e2e4", "e7e8q", "n@e4" for drops). */
  lastMove: string | null;
  /** Rating change applied when a rated game finished, per colour. */
  ratingDelta?: { white: number; black: number } | null;
  /** Last meaningful state change (join, move, offer, finish). Unlike
   * updatedAt, which the clock tick touches on every view. */
  activityAt: number;
  repetition: Record<string, number>;
  chat?: ChatMessage[];
}
const key = (a: string, b: string) => [a, b].sort().join(":");
const clean = (v: unknown, max: number) => {
  if (typeof v !== "string" || v.length > max || /[\x00-\x1F]/.test(v))
    throw Error("Invalid text field.");
  return v.trim();
};
function generateRoomCode(store: Store): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let code = "";
  do {
    const bytes = randomBytes(6);
    code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[bytes[i] % chars.length];
    }
  } while (store.get("room", code));
  return code;
}

const PLAYER_ID_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
function generatePlayerId(): string {
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += PLAYER_ID_CHARSET[Math.floor(Math.random() * PLAYER_ID_CHARSET.length)];
  }
  return id;
}

export class Service {
  /** Last contact with each player (API call or live socket), epoch ms.
   * In-memory only: a restart simply starts the grace window fresh. */
  private seenAt = new Map<string, number>();
  constructor(
    public store: Store,
    private now = () => Date.now(),
    /** Grace before a gone player forfeits, chess.com style (ms). */
    private abandonMs = 60_000,
  ) {}
  touch(id: string) {
    this.seenAt.set(id, this.now());
  }
  /** Forfeit active rooms where one player has been gone past the grace
   * window while the opponent is still around. Both gone pauses the
   * game instead - whoever returns first finds it waiting. */
  sweep() {
    const now = this.now();
    for (const r of this.store.all<Room>("room")) {
      if (r.status !== "active" || !r.black) continue;
      for (const [gone, present] of [
        [r.white, r.black],
        [r.black, r.white],
      ] as const) {
        const g = this.seenAt.get(gone);
        if (g === undefined || now - g <= this.abandonMs) continue;
        const p = this.seenAt.get(present);
        if (p === undefined || now - p > this.abandonMs) continue;
        const winner = r.white === present ? "white" : "black";
        this.finish(r, `${winner} wins (opponent disconnected)`, winner);
        break;
      }
    }
  }
  requireUser(id: string) {
    const u = this.store.get<PlayerProfile>("profile", id);
    if (!u) throw Error("Player profile not found.");
    return u;
  }
  ensureUser(id: string) {
    let p = this.store.get<PlayerProfile>("profile", id);
    if (!p) {
      p = {
        id,
        playerId: generatePlayerId(),
        username: `player_${randomBytes(5).toString("hex")}`,
        displayName: "Player",
        bio: "",
        country: "",
        timezone: "UTC",
        discoverable: false,
        adultConfirmed: false,
        createdAt: this.now(),
        rating: 1200,
        ratedGames: 0,
        fideRating: null,
        games: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      };
      this.store.put("profile", id, p);
    } else if (!p.playerId) {
      p.playerId = generatePlayerId();
      this.store.put("profile", id, p);
    }
    return p;
  }
  profile(id: string, input: Record<string, unknown>, localTest = false) {
    const p = this.requireUser(id),
      username = clean(input.username, 24).toLowerCase(),
      displayName = clean(input.displayName, 40);
    if (!/^[a-z][a-z0-9_]{2,23}$/.test(username))
      throw Error(
        "Username must be 3-24 letters, numbers or underscores, starting with a letter.",
      );
    if (!displayName) throw Error("Choose a display name.");
    if (
      this.store
        .all<PlayerProfile>("profile")
        .some((u) => u.id !== id && u.username === username)
    )
      throw Error("That username is taken.");
    const playerId = typeof input.playerId === "string" && input.playerId.trim().length === 8 ? input.playerId.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") : (p.playerId || generatePlayerId());
    const bio = clean(input.bio ?? "", 160),
      country = clean(input.country ?? "", 2).toUpperCase(),
      timezone = clean(input.timezone ?? "UTC", 60);
    if (country && !/^[A-Z]{2}$/.test(country))
      throw Error("Country must be a two-letter code.");
    try {
      new Intl.DateTimeFormat("en", { timeZone: timezone });
    } catch {
      throw Error("Choose a valid timezone.");
    }
    if (
      typeof input.discoverable !== "boolean" ||
      (!localTest && input.adultConfirmed !== true)
    )
      throw Error(
        "This beta is for adults 18+. Confirm before joining online play.",
      );
    const fideRating =
      input.fideRating == null ? null : Number(input.fideRating);
    if (
      fideRating !== null &&
      (!Number.isInteger(fideRating) || fideRating < 1 || fideRating > 4000)
    )
      throw Error("Invalid self-reported FIDE rating.");
    const next = {
      ...p,
      playerId,
      fideRating,
      username,
      displayName,
      bio,
      country,
      timezone,
      discoverable: input.discoverable,
      adultConfirmed: !localTest && input.adultConfirmed === true,
      profileReady: true,
    };
    this.store.put("profile", id, next);
    return next;
  }
  blocked(a: string, b: string) {
    return this.store
      .all<Block>("block")
      .some(
        (r) => (r.from === a && r.to === b) || (r.from === b && r.to === a),
      );
  }
  friend(a: string, b: string) {
    return (
      this.store.get<Friend>("friend", key(a, b))?.status === "accepted" &&
      !this.blocked(a, b)
    );
  }
  lookup(id: string, query: string) {
    const raw = (query || "").trim();
    const cleanLower = raw.toLowerCase();
    const cleanId = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const p = this.store
      .all<PlayerProfile>("profile")
      .find((p) => {
        if (p.id === id || this.blocked(id, p.id)) return false;
        // Direct 8-digit alphanumeric Player ID match allows friends to connect directly via their ID
        if (cleanId.length === 8 && p.playerId && p.playerId.toUpperCase() === cleanId) {
          return true;
        }
        // Username search requires discovery to be enabled and profile ready
        return (
          p.username.toLowerCase() === cleanLower &&
          p.discoverable &&
          (p.adultConfirmed || p.profileReady)
        );
      });
    return p
      ? {
          id: p.id,
          playerId: p.playerId,
          username: p.username,
          displayName: p.displayName,
          rating: p.rating,
        }
      : null;
  }
  friends(id: string): FriendView[] {
    const rows: FriendView[] = [];
    for (const f of this.store.all<Friend>("friend"))
      if ((f.from === id || f.to === id) && !this.blocked(f.from, f.to)) {
        const p = this.requireUser(f.from === id ? f.to : f.from);
        rows.push({
          id: p.id,
          playerId: p.playerId,
          username: p.username,
          displayName: p.displayName,
          rating: p.rating,
          state:
            f.status === "accepted"
              ? "friend"
              : f.from === id
                ? "outgoing"
                : "incoming",
        });
      }
    for (const b of this.store.all<Block>("block"))
      if (b.from === id) {
        const p = this.requireUser(b.to);
        rows.push({
          id: p.id,
          username: p.username,
          displayName: p.displayName,
          state: "blocked",
        });
      }
    return rows;
  }
  friendAction(id: string, action: string, target: string) {
    this.requireUser(id);
    this.requireUser(target);
    if (id === target) throw Error("Choose another player.");
    const k = key(id, target),
      f = this.store.get<Friend>("friend", k);
    if (action === "block") {
      this.store.put("block", `${id}:${target}`, {
        id: `${id}:${target}`,
        from: id,
        to: target,
      });
      this.store.delete("friend", k);
      return;
    }
    if (action === "unblock") {
      this.store.delete("block", `${id}:${target}`);
      return;
    }
    if (this.blocked(id, target)) throw Error("Player unavailable.");
    if (action === "request") {
      if (
        !(this.requireUser(id).adultConfirmed || this.requireUser(id).profileReady) ||
        !(this.requireUser(target).adultConfirmed || this.requireUser(target).profileReady) ||
        !this.requireUser(target).discoverable
      )
        throw Error("Player unavailable.");
      if (f) throw Error("A friendship or request already exists.");
      this.store.put("friend", k, {
        id: k,
        from: id,
        to: target,
        status: "pending",
      });
      return;
    }
    if (action === "accept") {
      if (!f || f.to !== id || f.status !== "pending")
        throw Error("No incoming request.");
      this.store.put("friend", k, { ...f, status: "accepted" });
      return;
    }
    if (action === "remove") {
      if (!f || (f.from !== id && f.to !== id))
        throw Error("No request or friendship.");
      this.store.delete("friend", k);
      return;
    }
    throw Error("Unknown friend action.");
  }
  create(
    id: string,
    rule: Rule,
    minutes: number,
    invitee?: string,
    opts: { skipFriendCheck?: boolean; rematchOf?: string; incrementSeconds?: number } = {},
  ) {
    const incrementSeconds = opts.incrementSeconds ?? 0;
    if (!(this.requireUser(id).adultConfirmed || this.requireUser(id).profileReady))
      throw Error("Complete your player profile first.");
    if (
      rule !== "fog" &&
      !RULE_VARIANTS.some((v) => v.id === rule)
    )
      throw Error("Invalid game settings.");
    if (![3, 5, 10, 15].includes(minutes))
      throw Error("Invalid game settings.");
    if (![0, 1, 2, 3, 5, 10, 15].includes(incrementSeconds))
      throw Error("Invalid game settings.");
    if (invitee && !opts.skipFriendCheck && !this.friend(id, invitee))
      throw Error("Only accepted friends can be challenged.");
    const userRooms = this.store
      .all<Room>("room")
      .filter((r) => r.white === id && r.status !== "finished");
    if (userRooms.length >= 5) {
      // Auto-cancel older waiting rooms so users are never permanently blocked from creating new rooms
      const waiting = userRooms.filter((r) => r.status === "waiting");
      if (waiting.length > 0) {
        for (const w of waiting.slice(0, Math.max(1, userRooms.length - 4))) {
          w.status = "finished";
          w.result = "Room cancelled";
          w.version++;
          w.activityAt = this.now();
          this.store.put("room", w.id, w);
        }
      } else {
        throw Error("Finish or cancel an existing game first.");
      }
    }
    const r: Room = {
      id: generateRoomCode(this.store),
      rule,
      white: id,
      black: null,
      invitee: invitee ?? null,
      rematchOf: opts.rematchOf ?? null,
      fen:
        rule === "fog"
          ? fogFen(fogInitial())
          : variantFen(variantPosition(rule as never)),
      moves: [],
      version: 0,
      status: "waiting",
      whiteMs: minutes * 60000,
      blackMs: minutes * 60000,
      updatedAt: this.now(),
      initialMs: minutes * 60000,
      incrementMs: incrementSeconds * 1000,
      result: null,
      drawOffer: null,
      takeback: null,
      lastMove: null,
      activityAt: this.now(),
      repetition: {},
    };
    r.repetition[this.positionKey(r.fen)] = 1;
    this.store.put("room", r.id, r);
    return r.id;
  }
  join(id: string, code: string) {
    if (!(this.requireUser(id).adultConfirmed || this.requireUser(id).profileReady))
      throw Error("Complete your player profile first.");
    const r = this.getRoom(code);
    if (r.white === id || r.black === id) return;
    if (
      r.status !== "waiting" ||
      r.black ||
      this.blocked(id, r.white) ||
      (r.invitee && r.invitee !== id)
    )
      throw Error("Room unavailable.");
    if (r.invitee && !r.rematchOf && !this.friend(id, r.white))
      throw Error("Friend challenge unavailable.");
    if (r.rematchOf) {
      const old = this.store.get<Room>("room", r.rematchOf);
      if (old && old.white === r.white) {
        // Colour swap: the previous game's White takes Black in the rematch.
        r.black = r.white;
        r.white = id;
      } else {
        r.black = id;
      }
    } else {
      r.black = id;
    }
    r.status = "active";
    r.updatedAt = this.now();
    r.version++;
    r.activityAt = this.now();
    this.store.put("room", r.id, r);
  }
  getRoom(code: string) {
    const r = this.store.get<Room>("room", code);
    if (!r) throw Error("Room not found.");
    return r;
  }
  member(id: string, r: Room) {
    if (r.white !== id && r.black !== id)
      throw Error("Not a player in this room.");
  }
  chat(id: string, code: string, text: string) {
    const r = this.getRoom(code);
    this.member(id, r);
    const cleanText = text.trim().slice(0, 200);
    if (!cleanText) return;
    const senderName = this.requireUser(id).displayName;
    r.chat = r.chat ?? [];
    r.chat.push({
      id: randomBytes(6).toString("hex"),
      sender: id,
      senderName,
      text: cleanText,
      at: this.now(),
    });
    if (r.chat.length > 100) r.chat.splice(0, r.chat.length - 100);
    this.store.put("room", r.id, r);
  }
  matchmake(id: string, rule: Rule = "chess", minutes: number = 5): { room: string; matched: boolean } {
    if (!(this.requireUser(id).adultConfirmed || this.requireUser(id).profileReady)) {
      throw Error("Complete your player profile first.");
    }
    const myRooms = this.store.all<Room>("room").filter(
      (r) => r.white === id && r.status === "waiting" && !r.invitee && r.rule === rule
    );
    const candidate = this.store.all<Room>("room").find(
      (r) =>
        r.status === "waiting" &&
        r.white !== id &&
        !r.invitee &&
        r.rule === rule &&
        !this.blocked(id, r.white) &&
        !this.blocked(r.white, id)
    );
    if (candidate) {
      this.join(id, candidate.id);
      return { room: candidate.id, matched: true };
    }
    if (myRooms.length > 0) {
      return { room: myRooms[0].id, matched: false };
    }
    const roomId = this.create(id, rule, minutes, null);
    return { room: roomId, matched: false };
  }
  /**
   * Undo the last move by replaying the remaining SAN list from the
   * variant's initial position. Rebuilds the repetition table so
   * automatic draws keep counting honestly. Clocks are not restored -
   * a takeback costs the time already spent, as on chess.com.
   */
  undoLastMove(r: Room) {
    const sans = r.moves.slice(0, -1);
    const pos = variantPosition(r.rule as never);
    const rep: Record<string, number> = {
      [this.positionKey(variantFen(pos))]: 1,
    };
    let last: string | null = null;
    for (const san of sans) {
      const mv = parseSan(pos, san);
      if (!mv) throw Error("Cannot rebuild this game for a takeback.");
      last = makeUci(mv);
      pos.play(mv);
      const k = this.positionKey(variantFen(pos));
      rep[k] = (rep[k] ?? 0) + 1;
    }
    r.moves = sans;
    r.fen = variantFen(pos);
    r.lastMove = last;
    r.repetition = rep;
    r.takeback = null;
    r.drawOffer = null;
    r.version++;
    r.activityAt = this.now();
    this.store.put("room", r.id, r);
  }
  positionKey(fen: string) {
    return fen.split(" ").slice(0, 4).join(" ");
  }
  tick(r: Room) {
    if (r.status !== "active") return;
    const whiteToMove =
      r.rule === "fog"
        ? fogFromFen(r.fen).turn === "w"
        : variantPosition(r.rule, r.fen).turn === "white";
    const dt = Math.max(0, this.now() - r.updatedAt);
    if (whiteToMove) r.whiteMs = Math.max(0, r.whiteMs - dt);
    else r.blackMs = Math.max(0, r.blackMs - dt);
    r.updatedAt = this.now();
    if (r.whiteMs === 0 || r.blackMs === 0) {
      const winner = r.whiteMs === 0 ? "black" : "white";
      if (
        r.rule === "chess" &&
        variantPosition(r.rule, r.fen).hasInsufficientMaterial(winner)
      )
        this.finish(r, "Draw on time (opponent cannot mate)", null);
      else this.finish(r, `${winner} wins on time`, winner);
    }
  }
  finish(
    r: Room,
    result: string,
    winner: "white" | "black" | null,
    opts: { rated?: boolean; counted?: boolean } = {},
  ) {
    if (r.status === "finished") return;
    r.status = "finished";
    r.result = result;
    r.drawOffer = null;
    r.version++;
    r.activityAt = this.now();
    if (r.rule === "chess" && r.black && opts.rated !== false) {
      const white = this.requireUser(r.white),
        black = this.requireUser(r.black),
        score = winner === "white" ? 1 : winner === "black" ? 0 : 0.5,
        expected = 1 / (1 + 10 ** ((black.rating - white.rating) / 400)),
        delta = Math.round(24 * (score - expected));
      r.ratingDelta = { white: delta, black: -delta };
      white.rating = Math.max(1, white.rating + delta);
      black.rating = Math.max(1, black.rating - delta);
      white.ratedGames++;
      black.ratedGames++;
      this.store.put("profile", white.id, white);
      this.store.put("profile", black.id, black);
    }
    for (const [id, color] of opts.counted === false
      ? []
      : [
          [r.white, "white"],
          [r.black, "black"],
        ] as const)
      if (id) {
        const p = this.requireUser(id);
        p.games++;
        if (!winner) p.draws++;
        else if (color === winner) p.wins++;
        else p.losses++;
        this.store.put("profile", id, p);
      }
    this.store.put("room", r.id, r);
  }
  act(
    id: string,
    code: string,
    version: number,
    action: string,
    uci?: string,
  ): { room: string } | undefined {
    const r = this.getRoom(code);
    this.member(id, r);
    this.tick(r);
    // Persist elapsed time even if the incoming move is rejected.
    this.store.put("room", r.id, r);
    if (r.version !== version)
      throw Error("Position changed. Wait for the latest board.");
    if (action === "rematch") {
      if (r.status !== "finished" || !r.black || r.result === "Room cancelled")
        throw Error("Rematch is available after a played game.");
      // Idempotent: a double-click or both players clicking rematch must not
      // spawn duplicate rooms - return the pending rematch room instead.
      const existing = this.store
        .all<Room>("room")
        .find(
          (x) =>
            x.rematchOf === r.id &&
            x.status !== "finished" &&
            (x.white === id || x.black === id || x.invitee === id),
        );
      if (existing) return { room: existing.id };
      const opponent = r.white === id ? r.black : r.white;
      const room = this.create(
        id,
        r.rule,
        Math.round(r.initialMs / 60000),
        opponent,
        {
          skipFriendCheck: true,
          rematchOf: r.id,
          incrementSeconds: Math.round((r.incrementMs ?? 0) / 1000),
        },
      );
      return { room };
    }
    if (action === "cancel" && r.status === "waiting" && r.white === id) {
      r.status = "finished";
      r.result = "Room cancelled";
      r.version++;
      r.activityAt = this.now();
      this.store.put("room", r.id, r);
      return;
    }
    if (r.status !== "active") throw Error("This game is not active.");
    const color = r.white === id ? "white" : "black";
    if (action === "resign") {
      this.finish(
        r,
        `${color === "white" ? "black" : "white"} wins by resignation`,
        color === "white" ? "black" : "white",
      );
      return;
    }
    if (action === "abort") {
      // Either player may walk away before each side has moved once;
      // aborted games are unrated and do not touch the players' records.
      if (r.moves.length >= 2)
        throw Error("Abort is only available before each player has moved.");
      this.finish(r, "Game aborted", null, { rated: false, counted: false });
      return;
    }
    if (action === "offerDraw") {
      // Offering back while an opponent offer is open accepts it,
      // chess.com style - mutual offers settle the game at once.
      if (r.drawOffer && r.drawOffer !== id) {
        this.finish(r, "Draw by agreement", null);
        return;
      }
      r.drawOffer = id;
      r.version++;
      r.activityAt = this.now();
    } else if (action === "declineDraw") {
      // The recipient declines, or the offerer withdraws their own offer.
      if (!r.drawOffer) throw Error("No draw offer to decline.");
      r.drawOffer = null;
      r.version++;
      r.activityAt = this.now();
      this.store.put("room", r.id, r);
      return;
    } else if (action === "acceptDraw") {
      if (!r.drawOffer || r.drawOffer === id)
        throw Error("No opponent draw offer.");
      this.finish(r, "Draw by agreement", null);
      return;
    } else if (action === "requestTakeback") {
      if (r.rule === "fog")
        throw Error("Takebacks are not available in Fog of War.");
      if (r.moves.length === 0) throw Error("No moves to take back.");
      if (r.takeback === id) throw Error("Takeback already requested.");
      r.takeback = id;
      r.version++;
      r.activityAt = this.now();
      this.store.put("room", r.id, r);
      return;
    } else if (action === "declineTakeback") {
      // The recipient declines, or the requester withdraws their own ask.
      if (!r.takeback) throw Error("No takeback request to decline.");
      r.takeback = null;
      r.version++;
      r.activityAt = this.now();
      this.store.put("room", r.id, r);
      return;
    } else if (action === "acceptTakeback") {
      if (!r.takeback || r.takeback === id)
        throw Error("No opponent takeback request.");
      this.undoLastMove(r);
      return;
    } else if (action === "move") {
      if (r.rule === "fog") {
        this.fogMove(r, color, uci);
        return;
      }
      const pos = variantPosition(r.rule, r.fen);
      if (pos.turn !== color) throw Error("Not your turn.");
      if (typeof uci !== "string" || uci.length > 8)
        throw Error("Invalid move.");
      const next = variantPlay(pos, uci);
      r.fen = variantFen(next.pos);
      r.moves.push(next.san);
      r.lastMove = uci;
      const inc = r.incrementMs ?? 0;
      if (inc > 0) {
        if (color === "white") r.whiteMs += inc;
        else r.blackMs += inc;
      }
      r.version++;
      r.activityAt = this.now();
      r.drawOffer = null;
      r.takeback = null;
      const outcome = next.pos.outcome();
      if (outcome) {
        const reason = next.pos.isCheckmate()
          ? "checkmate"
          : next.pos.isStalemate()
            ? "stalemate"
            : next.pos.isInsufficientMaterial()
              ? "insufficient material"
              : null;
        this.finish(
          r,
          outcome.winner
            ? `${outcome.winner} wins${reason ? ` by ${reason}` : ""}`
            : reason
              ? `Draw by ${reason}`
              : "Draw",
          outcome.winner ?? null,
        );
        return;
      }
      const k = this.positionKey(r.fen);
      r.repetition[k] = (r.repetition[k] ?? 0) + 1;
      if (r.rule === "chess" && r.repetition[k] >= 3) {
        this.finish(r, "Draw by repetition", null);
        return;
      }
      if (r.rule === "chess" && next.pos.halfmoves >= 100) {
        this.finish(r, "Draw by fifty-move rule", null);
        return;
      }
    } else throw Error("Unknown game action.");
    this.store.put("room", r.id, r);
  }
  view(id: string, r: Room): RoomView {
    this.member(id, r);
    this.tick(r);
    this.store.put("room", r.id, r);
    if (r.rule === "fog") return this.fogRoomView(id, r);
    return {
      id: r.id,
      rule: r.rule,
      white: r.white,
      black: r.black,
      whiteName: this.requireUser(r.white).displayName,
      blackName: r.black ? this.requireUser(r.black).displayName : null,
      fen: r.fen,
      moves: r.moves,
      version: r.version,
      status: r.status,
      turn: variantPosition(r.rule, r.fen).turn,
      whiteMs: r.whiteMs,
      blackMs: r.blackMs,
      serverTime: this.now(),
      // Rooms persisted before activityAt existed fall back to updatedAt.
      activityAt: r.activityAt ?? r.updatedAt,
      initialMs: r.initialMs,
      incrementMs: r.incrementMs ?? 0,
      result: r.result,
      drawOffer: r.drawOffer,
      takeback: r.takeback ?? null,
      yourColor: r.white === id ? "white" : "black",
      invitee: r.invitee,
      lastMove: r.lastMove,
      ratingDelta: r.ratingDelta ?? null,
      chat: r.chat ? r.chat.slice(-50) : [],
    };
  }
  state(id: string, mode: "local" | "supabase"): OnlineState {
    const rooms = this.store
      .all<Room>("room")
      .filter(
        (r) =>
          r.white === id ||
          r.black === id ||
          (r.invitee === id &&
            r.status === "waiting" &&
            !this.blocked(id, r.white)),
      );
    return {
      profile: this.requireUser(id),
      friends: this.friends(id),
      rooms: rooms
        .slice(-50)
        .map((r) =>
          r.white === id || r.black === id
            ? this.view(id, r)
            : { ...this.inviteView(id, r) },
        ),
      mode,
    };
  }
  inviteView(id: string, r: Room): RoomView {
    return {
      id: r.id,
      rule: r.rule,
      white: r.white,
      black: null,
      whiteName: this.requireUser(r.white).displayName,
      blackName: null,
      fen: r.fen,
      moves: [],
      version: r.version,
      status: r.status,
      turn: "white",
      whiteMs: r.whiteMs,
      blackMs: r.blackMs,
      serverTime: this.now(),
      // Rooms persisted before activityAt existed fall back to updatedAt.
      activityAt: r.activityAt ?? r.updatedAt,
      initialMs: r.initialMs,
      result: null,
      drawOffer: null,
      yourColor: "black",
      invitee: id,
    };
  }
  /** Fog of War move handling (house rules; see src/online/fogRules.ts). */
  private fogMove(r: Room, color: "white" | "black", uci: unknown) {
    const state = fogFromFen(r.fen);
    const c = color === "white" ? "w" : "b";
    if (state.turn !== c) throw Error("Not your turn.");
    if (typeof uci !== "string" || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci))
      throw Error("Invalid move.");
    const from = parseSquare(uci.slice(0, 2)),
      to = parseSquare(uci.slice(2, 4));
    const capture =
      state.board[to] !== null ||
      (state.ep === to && state.board[from]?.toLowerCase() === "p");
    const next = fogPlay(state, {
      from,
      to,
      promotion: (uci[4] as "q" | "r" | "b" | "n" | undefined) ?? undefined,
    });
    r.fen = fogFen(next);
    const castle =
      state.board[from]?.toLowerCase() === "k" &&
      Math.abs((to % 8) - (from % 8)) === 2;
    r.moves.push(
      castle
        ? to % 8 === 6
          ? "O-O"
          : "O-O-O"
        : `${squareName(from)}${capture ? "x" : "-"}${squareName(to)}${next.board[to] !== state.board[from] && next.board[to] ? "=" + next.board[to]!.toUpperCase() : ""}`,
    );
    r.version++;
    r.activityAt = this.now();
    r.drawOffer = null;
    r.lastMove = uci;
    if (next.result) {
      const winner = next.result.startsWith("White")
        ? "white"
        : next.result.startsWith("Black")
          ? "black"
          : null;
      this.finish(r, next.result, winner);
      return;
    }
    const k = fogPositionKey(next);
    r.repetition[k] = (r.repetition[k] ?? 0) + 1;
    if (r.repetition[k] >= 3) {
      this.finish(r, "Draw (threefold repetition)", null);
      return;
    }
    this.store.put("room", r.id, r);
  }

  /** Fog of War per-player view: hidden enemy pieces and moves stay server-side. */
  private fogRoomView(id: string, r: Room): RoomView {
    const state = fogFromFen(r.fen);
    const yourColor = r.white === id ? ("white" as const) : ("black" as const);
    const c = yourColor === "white" ? ("w" as const) : ("b" as const);
    const projection = fogView(state, c);
    const visible: (FogPiece | null)[] = new Array(64).fill(null);
    for (const { square, piece } of projection.pieces)
      visible[square] = piece;
    // Castling rights and en-passant are blanked: they leak hidden positions.
    const fen = fogFen({ ...state, board: visible, castling: "", ep: null });
    return {
      id: r.id,
      rule: r.rule,
      white: r.white,
      black: r.black,
      whiteName: this.requireUser(r.white).displayName,
      blackName: r.black ? this.requireUser(r.black).displayName : null,
      fen,
      moves: r.moves.map((san, i) =>
        i % 2 === (c === "w" ? 0 : 1) ? san : "?",
      ),
      version: r.version,
      status: r.status,
      turn: state.turn === "w" ? "white" : "black",
      whiteMs: r.whiteMs,
      blackMs: r.blackMs,
      serverTime: this.now(),
      // Rooms persisted before activityAt existed fall back to updatedAt.
      activityAt: r.activityAt ?? r.updatedAt,
      initialMs: r.initialMs,
      result: r.result,
      drawOffer: r.drawOffer,
      yourColor,
      invitee: r.invitee,
      fogSquares: projection.fog,
      chat: r.chat ? r.chat.slice(-50) : [],
      // Last move only when both its squares are visible to the viewer -
      // revealing the origin of a move made in the dark would leak position.
      lastMove: (() => {
        if (!r.lastMove || r.lastMove.includes("@")) return null;
        const from = parseSquare(r.lastMove.slice(0, 2)),
          to = parseSquare(r.lastMove.slice(2, 4));
        const hidden = new Set(projection.fog);
        return !hidden.has(from) && !hidden.has(to) ? r.lastMove : null;
      })(),
      fogMoves:
        r.status === "active" && state.turn === c
          ? fogLegalMoves(state).map(
              (m) =>
                squareName(m.from) +
                squareName(m.to) +
                (m.promotion ?? ""),
            )
          : [],
    };
  }

  report(id: string, input: Record<string, unknown>) {
    this.requireUser(id);
    const category=String(input.category ?? "");
    if(!["harassment","cheating","privacy","copyright","child-safety","other"].includes(category))throw Error("Choose a report category.");
    const details=clean(input.details,2000);
    if(details.length<10)throw Error("Describe the issue without passwords or sensitive documents.");
    const target=clean(input.target ?? "",100);
    const recent=this.store.all<{reporter:string;at:number}>("report").filter(r=>r.reporter===id && this.now()-r.at<86400000);
    if(recent.length>=10)throw Error("Daily report limit reached. Contact support for urgent safety concerns.");
    const ticket=randomBytes(12).toString("hex");
    this.store.put("report",ticket,{id:ticket,reporter:id,category,details,target,at:this.now(),status:"received",updatedAt:this.now(),decision:""});
    return {ticket,status:"received",message:"Stored in the local review queue. No email or staffed response is implied."};
  }
  reports(id:string) {return this.store.all<{id:string;reporter:string;category:string;at:number;status:string;decision:string}>("report").filter(r=>r.reporter===id).map(r=>({id:r.id,category:r.category,at:r.at,status:r.status,decision:r.decision}));}
  export(id: string) {
    return {
      profile: this.requireUser(id),
      reports: this.reports(id),
      friends: this.friends(id),
      games: this.store
        .all<Room>("room")
        .filter((r) => r.white === id || r.black === id)
        // Unfinished Fog of War rooms export as the player's safe projection:
        // the raw record would reveal every hidden enemy piece and move.
        .map((r) =>
          r.rule === "fog" && r.status !== "finished"
            ? (this.view(id, r) as unknown as Room)
            : r,
        ),
    };
  }
  deleteUser(id: string) {
    for(const r of this.store.all<{id:string;reporter:string;details:string;target:string}>("report")) if(r.reporter===id){r.reporter="deleted";r.details="Removed with profile deletion";r.target="";this.store.put("report",r.id,r);}

    for (const r of this.store.all<Room>("room"))
      if (r.white === id || r.black === id) {
        if (r.status === "active")
          // Unrated: deleting a profile must not hand rating points to opponents.
          this.finish(
            r,
            "Opponent deleted profile",
            r.white === id ? "black" : "white",
            { rated: false },
          );
        if (r.status === "waiting") {
          r.status = "finished";
          r.result = "Room cancelled";
        }
        if (r.white === id) r.white = "deleted";
        if (r.black === id) r.black = "deleted";
        this.store.put("room", r.id, r);
      }
    for (const f of this.store.all<Friend>("friend"))
      if (f.from === id || f.to === id) this.store.delete("friend", f.id);
    for (const b of this.store.all<Block>("block"))
      if (b.from === id || b.to === id) this.store.delete("block", b.id);
    for (const r of this.store.all<Room>("room"))
      if (r.invitee === id) {
        r.invitee = null;
        if (r.status === "waiting") {
          r.status = "finished";
          r.result = "Invite cancelled";
        }
        this.store.put("room", r.id, r);
      }
    this.ensureUser("deleted");
    this.store.put("profile", "deleted", {
      ...this.requireUser("deleted"),
      displayName: "Deleted player",
    });
    this.store.delete("profile", id);
  }
}
