import { Rules } from "chessops/types";
export const RULE_VARIANTS: { id: Rules; name: string; summary: string }[] = [
  { id: "chess", name: "Standard Chess", summary: "Checkmate the opposing king under classic FIDE rules." },
  {
    id: "crazyhouse",
    name: "Crazyhouse",
    summary: "Captured pieces join your pocket. Drop them on legal squares.",
  },
  {
    id: "kingofthehill",
    name: "King of the Hill",
    summary:
      "Win by reaching d4, e4, d5 or e5 with your king, or by checkmate.",
  },
  {
    id: "3check",
    name: "Three-Check Chess",
    summary: "Win by giving three checks, or checkmate.",
  },
  {
    id: "antichess",
    name: "Antichess",
    summary: "Captures are compulsory. Shed your pieces; kings are not royal.",
  },
  {
    id: "atomic",
    name: "Atomic Chess",
    summary:
      "Captures explode nearby pieces. Pawn-adjacency and king rules use chessops.",
  },
  {
    id: "horde",
    name: "Horde Chess",
    summary: "White has a pawn horde; Black has a standard army.",
  },
  {
    id: "racingkings",
    name: "Racing Kings",
    summary: "Race kings to the eighth rank without giving check.",
  },
];
