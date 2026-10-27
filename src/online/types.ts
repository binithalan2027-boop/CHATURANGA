export type Provider = "google" | "facebook" | "discord";
export type Rule =
  | "chess"
  | "crazyhouse"
  | "kingofthehill"
  | "3check"
  | "antichess"
  | "atomic"
  | "horde"
  | "racingkings"
  | "fog";
export interface PlayerProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  country: string;
  timezone: string;
  discoverable: boolean;
  adultConfirmed: boolean;
  profileReady?: boolean;
  createdAt: number;
  rating: number;
  ratedGames: number;
  fideRating: number | null;
  games: number;
  wins: number;
  losses: number;
  draws: number;
}
export interface FriendView {
  id: string;
  username: string;
  displayName: string;
  state: "friend" | "incoming" | "outgoing" | "blocked";
}
export interface ChatMessage {
  id: string;
  sender: string;
  senderName: string;
  text: string;
  at: number;
}

export interface RoomView {
  id: string;
  rule: Rule;
  white: string;
  black: string | null;
  whiteName: string;
  blackName: string | null;
  fen: string;
  moves: string[];
  version: number;
  status: "waiting" | "active" | "finished";
  turn: "white" | "black";
  whiteMs: number;
  blackMs: number;
  serverTime: number;
  /** Last meaningful state change (join, move, offer, finish), ms epoch. */
  activityAt: number;
  /** Initial clock per player in ms (the room's time control). */
  initialMs: number;
  /** Increment added to the mover's clock after each move, ms. */
  incrementMs?: number;
  result: string | null;
  drawOffer: string | null;
  /** Player id asking to undo the last move, awaiting the opponent. */
  takeback?: string | null;
  yourColor: "white" | "black";
  invitee: string | null;
  /** Last played move in uci. Fog of War: only when both its squares are
   * visible to the viewer; drops (crazyhouse) have no from-square. */
  lastMove?: string | null;
  /** Rating change applied when this rated game finished, per colour. */
  ratingDelta?: { white: number; black: number } | null;
  /** Fog of War only: squares hidden from the viewer (0=a1..63=h8). */
  fogSquares?: number[];
  /** Fog of War only: viewer's legal moves (uci) when it is their turn. */
  fogMoves?: string[];
  /** In-game chat messages sent between players */
  chat?: ChatMessage[];
  /** True while that seat has at least one live connection to the server.
   * Undefined when the server predates presence reporting - treat as online. */
  whiteOnline?: boolean;
  blackOnline?: boolean;
}
export interface EntitlementStatus {
  unlocked: boolean;
  played: number;
  remaining: number | null;
}
export interface OnlineState {
  profile: PlayerProfile;
  friends: FriendView[];
  rooms: RoomView[];
  customRooms?: import("./customTypes").CustomView[];
  mode: "local" | "supabase";
  /** Present only when the server entitlement switch is in trial mode. */
  entitlement?: EntitlementStatus | null;
}
