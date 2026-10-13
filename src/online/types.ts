export type Provider = "google" | "facebook" | "discord";
export type Rule =
  | "chess"
  | "crazyhouse"
  | "kingofthehill"
  | "3check"
  | "antichess"
  | "atomic"
  | "horde"
  | "racingkings";
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
  result: string | null;
  drawOffer: string | null;
  yourColor: "white" | "black";
  invitee: string | null;
}
export interface OnlineState {
  profile: PlayerProfile;
  friends: FriendView[];
  rooms: RoomView[];
  customRooms?: import("./customTypes").CustomView[];
  mode: "local" | "supabase";
}
