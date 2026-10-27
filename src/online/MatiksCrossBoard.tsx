import MatiksPiece from "../components/MatiksPiece";
import {
  type Seat,
  type CrossState,
  validCell,
  crossSquare,
} from "./crossRules";

export interface MatiksCrossBoardProps {
  cross: CrossState;
  yourSeat: string;
  selectedSquare: number | null;
  legalDests: number[];
  onSquareClick: (sq: number) => void;
  players: Array<{ id: string; name: string; seat: string }>;
  isThreePlayer?: boolean;
}

export function formatTime(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function parseCrossLastMove(
  moves?: string[]
): { from: number; to: number } | null {
  if (!moves || moves.length === 0) return null;
  const last = moves[moves.length - 1];
  const m = last.match(/^[a-z]+\s+([a-n][0-9]+)-([a-n][0-9]+)/);
  if (!m) return null;
  const sqToIdx = (sq: string) => {
    const file = sq.charCodeAt(0) - 97;
    const rank = parseInt(sq.slice(1), 10);
    const r = 14 - rank;
    const c = file;
    return r * 14 + c;
  };
  return { from: sqToIdx(m[1]), to: sqToIdx(m[2]) };
}

export function getSeatTheme(
  seat: Seat,
  isThreePlayer: boolean
): {
  name: string;
  color: string;
  label: string;
  rotation: number;
  mainColor: string;
  detailColor: string;
} {
  // 3-Player Theme Revision:
  // South = White, West = Black, East = Lavender, all upright!
  if (isThreePlayer) {
    if (seat === "south") {
      return {
        name: "South (White)",
        color: "#FAFAFA",
        label: "SOUTH",
        rotation: 0,
        mainColor: "#FAFAFA",
        detailColor: "#1B1B1B",
      };
    }
    if (seat === "west") {
      return {
        name: "West (Black)",
        color: "#FFFFFF",
        label: "WEST",
        rotation: 0,
        mainColor: "#1B1B1B",
        detailColor: "#FAFAFA",
      };
    }
    if (seat === "east") {
      return {
        name: "East (Lavender)",
        color: "#A594F0",
        label: "EAST",
        rotation: 0,
        mainColor: "#A594F0",
        detailColor: "#1B1B1B",
      };
    }
  }

  // 4-Player Palette:
  // South Coral, West Sky, North Bento Yellow, East Emerald
  const themes: Record<
    Seat,
    {
      name: string;
      color: string;
      label: string;
      rotation: number;
      mainColor: string;
      detailColor: string;
    }
  > = {
    south: {
      name: "South",
      color: "#F07040",
      label: "SOUTH",
      rotation: 0,
      mainColor: "#F07040",
      detailColor: "#1B1B1B",
    },
    west: {
      name: "West",
      color: "#50A0F0",
      label: "WEST",
      rotation: 90,
      mainColor: "#50A0F0",
      detailColor: "#1B1B1B",
    },
    north: {
      name: "North",
      color: "#F2D500",
      label: "NORTH",
      rotation: 180,
      mainColor: "#F2D500",
      detailColor: "#1B1B1B",
    },
    east: {
      name: "East",
      color: "#0FB567",
      label: "EAST",
      rotation: 270,
      mainColor: "#0FB567",
      detailColor: "#1B1B1B",
    },
  };
  return themes[seat];
}

export const SEAT_THEMES: Record<
  Seat,
  { name: string; color: string; label: string; rotation: number }
> = {
  south: { name: "South", color: "#F07040", label: "SOUTH", rotation: 0 },
  west: { name: "West", color: "#50A0F0", label: "WEST", rotation: 90 },
  north: { name: "North", color: "#F2D500", label: "NORTH", rotation: 180 },
  east: { name: "East", color: "#0FB567", label: "EAST", rotation: 270 },
};

export default function MatiksCrossBoard({
  cross,
  yourSeat,
  selectedSquare,
  legalDests,
  onSquareClick,
  players,
  isThreePlayer = false,
}: MatiksCrossBoardProps) {
  const lastMove = parseCrossLastMove(cross.moves);

  const getPlayerForSeat = (seat: Seat) =>
    players.find((p) => p.seat === seat)?.name ?? "Waiting for player…";

  // Render a player bar/card
  const renderPlayerBar = (seat: Seat, className: string = "") => {
    const theme = getSeatTheme(seat, isThreePlayer);
    const isTurn = cross.turn === seat && !cross.result;
    const isEliminated = cross.eliminated.includes(seat);
    const isYou = yourSeat === seat;
    const clockMs = cross.clocks[seat] ?? 0;
    const isLowTime = clockMs > 0 && clockMs < 120000;
    const playerName = getPlayerForSeat(seat);

    return (
      <div
        key={seat}
        className={`relative transition-all rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center justify-between shadow-md ${
          isEliminated
            ? "opacity-60 bg-[#161616] border border-white/5"
            : isTurn
            ? "bg-[#1E2319] border-2 border-[#AFF65B] shadow-[0_0_15px_rgba(175,246,91,0.25)]"
            : "bg-[#181818] border border-white/10"
        } ${className}`}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {/* Piece Icon Avatar */}
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center p-1 shrink-0 shadow-inner"
            style={{
              backgroundColor:
                isThreePlayer && seat === "west" ? "#222222" : theme.mainColor,
              border:
                isThreePlayer && seat === "west"
                  ? "1px solid rgba(255,255,255,0.2)"
                  : "none",
            }}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <MatiksPiece
                type="k"
                customColor={theme.mainColor}
                detailColor={theme.detailColor}
              />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="font-heading text-xs uppercase tracking-wider font-bold"
                style={{
                  color: isThreePlayer && seat === "west" ? "#CCCCCC" : theme.color,
                }}
              >
                {theme.label}
              </span>
              {isYou && (
                <span className="bg-[#AFF65B] text-black font-extrabold text-[9px] px-1.5 py-0.2 rounded font-mono uppercase tracking-wider">
                  YOU
                </span>
              )}
              {isTurn && !isEliminated && (
                <span className="w-2 h-2 rounded-full bg-[#AFF65B] animate-ping inline-block" />
              )}
            </div>
            <div className="text-xs font-semibold text-[#F4F4F4] truncate max-w-[85px] sm:max-w-[150px]">
              {playerName}
            </div>
          </div>
        </div>

        {/* Clock / Eliminated Tag */}
        <div className="shrink-0 ml-2">
          {isEliminated ? (
            <span className="px-2 py-0.5 rounded-full bg-[#E5484D]/20 text-[#E5484D] text-[10px] font-bold border border-[#E5484D]/40 uppercase tracking-wider font-mono">
              OUT
            </span>
          ) : (
            <div
              className={`font-mono text-xs font-bold px-2 py-1 rounded-xl border tabular-nums ${
                isLowTime
                  ? "bg-[#F07040]/15 text-[#F07040] border-[#F07040]/40 animate-pulse"
                  : isTurn
                  ? "bg-black/60 text-[#AFF65B] border-[#AFF65B]/40"
                  : "bg-black/40 text-white/80 border-white/10"
              }`}
            >
              {formatTime(clockMs)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* 3-PLAYER THEME REVISION:
          West & East bars share the top row above the board.
          South bar sits full-width directly below the board.
      */}
      {isThreePlayer ? (
        <div className="w-full max-w-[500px] flex flex-col items-center">
          {/* Top Row: West & East bars */}
          <div className="w-full grid grid-cols-2 gap-2 sm:gap-3 mb-2.5">
            {renderPlayerBar("west")}
            {renderPlayerBar("east")}
          </div>

          {/* 14x14 CROSS BOARD */}
          <div
            className="w-full max-w-[370px] sm:max-w-[460px] md:max-w-[500px] aspect-square rounded-xl p-1 bg-[#141414] border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(14, minmax(0, 1fr))",
              gridTemplateRows: "repeat(14, minmax(0, 1fr))",
              gap: "1px",
            }}
          >
            {Array.from({ length: 196 }, (_, i) => {
              const r = Math.floor(i / 14);
              const c = i % 14;
              const isValid = validCell(r, c);

              // 3x3 Dead Corners render transparent app void
              if (!isValid) {
                return (
                  <div
                    key={i}
                    className="w-full h-full bg-[#0E0E0E]"
                    aria-hidden="true"
                  />
                );
              }

              const piece = cross.board[i];
              const isSelected = selectedSquare === i;
              const isLegal = legalDests.includes(i);
              const isLastMove = lastMove?.from === i || lastMove?.to === i;
              const isLight = (r + c) % 2 === 0;

              // Outer valid ring coordinate checks
              const showFile = !validCell(r + 1, c);
              const showRank = !validCell(r, c - 1);
              const fileChar = String.fromCharCode(97 + c);
              const rankNum = 14 - r;
              const coordColor = isLight ? "#5F7A4A" : "#D9D5C7";

              // Piece styling for 3-player
              const seatTheme = piece
                ? getSeatTheme(piece.seat, isThreePlayer)
                : null;

              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`${crossSquare(i)}${
                    piece ? ` ${piece.seat} ${piece.kind}` : ""
                  }`}
                  onClick={() => onSquareClick(i)}
                  className={`relative w-full h-full flex items-center justify-center cursor-pointer transition-all p-0 border-0 outline-none select-none overflow-hidden ${
                    isLight ? "bg-[#D9D5C7]" : "bg-[#5F7A4A]"
                  }`}
                  style={{
                    backgroundColor: isLastMove
                      ? "rgba(242, 213, 0, 0.45)"
                      : undefined,
                    outline: isSelected ? "3.5px solid #AFF65B" : undefined,
                    outlineOffset: isSelected ? "-3.5px" : undefined,
                    boxShadow: isSelected
                      ? "0 0 12px rgba(175, 246, 91, 0.7)"
                      : undefined,
                    zIndex: isSelected ? 20 : isLegal ? 10 : 1,
                  }}
                >
                  {/* Outer edge coordinate labels */}
                  {showRank && (
                    <span
                      className="absolute top-0.5 left-0.5 text-[8px] sm:text-[9px] font-body font-bold leading-none pointer-events-none select-none opacity-80"
                      style={{ color: coordColor }}
                    >
                      {rankNum}
                    </span>
                  )}
                  {showFile && (
                    <span
                      className="absolute bottom-0.5 right-0.5 text-[8px] sm:text-[9px] font-body font-bold leading-none pointer-events-none select-none opacity-80"
                      style={{ color: coordColor }}
                    >
                      {fileChar}
                    </span>
                  )}

                  {/* Render Matiks Piece (Upright for 3-player!) */}
                  {piece && seatTheme && (
                    <div
                      className="w-[88%] h-[88%] flex items-center justify-center transition-transform drop-shadow-md pointer-events-none"
                      style={{
                        transform: `rotate(${seatTheme.rotation}deg)`,
                      }}
                    >
                      <MatiksPiece
                        type={piece.kind}
                        customColor={seatTheme.mainColor}
                        detailColor={seatTheme.detailColor}
                      />
                    </div>
                  )}

                  {/* Legal Destination: Solid #0E0E0E Dot at 32% */}
                  {isLegal && !piece && (
                    <div className="w-[32%] h-[32%] rounded-full bg-[#0E0E0E] shadow-sm pointer-events-none select-none" />
                  )}

                  {/* Capture Indicator if landing on enemy */}
                  {isLegal && piece && (
                    <div className="absolute inset-0 border-2 border-[#0E0E0E] rounded-sm pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Row: South bar */}
          <div className="w-full mt-2.5">
            {renderPlayerBar("south", "w-full")}
          </div>
        </div>
      ) : (
        /* 4-PLAYER LAYOUT:
            North above, West & East flanking, South below.
        */
        <div className="relative w-full max-w-[860px] flex flex-col items-center">
          {/* Mobile Seat Grid (<768px for 4-Player) */}
          <div className="w-full max-w-[540px] md:hidden mb-3">
            <div className="grid grid-cols-2 gap-2">
              {renderPlayerBar("west", "p-2")}
              {renderPlayerBar("north", "p-2")}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {renderPlayerBar("east", "p-2")}
              {renderPlayerBar("south", "p-2")}
            </div>
          </div>

          {/* Desktop North Card */}
          <div className="hidden md:block w-full max-w-[480px] mb-3">
            {renderPlayerBar("north", "w-full")}
          </div>

          {/* Desktop Middle Row: West - Board - East */}
          <div className="w-full flex items-center justify-center gap-3">
            <div className="hidden lg:block w-40 shrink-0">
              {renderPlayerBar("west")}
            </div>

            <div
              className="w-full max-w-[440px] sm:max-w-[480px] md:max-w-[520px] aspect-square rounded-xl p-1 bg-[#141414] border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(14, minmax(0, 1fr))",
                gridTemplateRows: "repeat(14, minmax(0, 1fr))",
                gap: "1px",
              }}
            >
              {Array.from({ length: 196 }, (_, i) => {
                const r = Math.floor(i / 14);
                const c = i % 14;
                const isValid = validCell(r, c);

                if (!isValid) {
                  return (
                    <div
                      key={i}
                      className="w-full h-full bg-[#0E0E0E]"
                      aria-hidden="true"
                    />
                  );
                }

                const piece = cross.board[i];
                const isSelected = selectedSquare === i;
                const isLegal = legalDests.includes(i);
                const isLastMove = lastMove?.from === i || lastMove?.to === i;
                const isLight = (r + c) % 2 === 0;

                const showFile = !validCell(r + 1, c);
                const showRank = !validCell(r, c - 1);
                const fileChar = String.fromCharCode(97 + c);
                const rankNum = 14 - r;
                const coordColor = isLight ? "#5F7A4A" : "#D9D5C7";

                const seatTheme = piece
                  ? getSeatTheme(piece.seat, isThreePlayer)
                  : null;

                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={`${crossSquare(i)}${
                      piece ? ` ${piece.seat} ${piece.kind}` : ""
                    }`}
                    onClick={() => onSquareClick(i)}
                    className={`relative w-full h-full flex items-center justify-center cursor-pointer transition-all p-0 border-0 outline-none select-none overflow-hidden ${
                      isLight ? "bg-[#D9D5C7]" : "bg-[#5F7A4A]"
                    }`}
                    style={{
                      backgroundColor: isLastMove
                        ? "rgba(242, 213, 0, 0.45)"
                        : undefined,
                      outline: isSelected ? "3.5px solid #AFF65B" : undefined,
                      outlineOffset: isSelected ? "-3.5px" : undefined,
                      boxShadow: isSelected
                        ? "0 0 12px rgba(175, 246, 91, 0.7)"
                        : undefined,
                      zIndex: isSelected ? 20 : isLegal ? 10 : 1,
                    }}
                  >
                    {showRank && (
                      <span
                        className="absolute top-0.5 left-0.5 text-[8px] sm:text-[9px] font-body font-bold leading-none pointer-events-none select-none opacity-80"
                        style={{ color: coordColor }}
                      >
                        {rankNum}
                      </span>
                    )}
                    {showFile && (
                      <span
                        className="absolute bottom-0.5 right-0.5 text-[8px] sm:text-[9px] font-body font-bold leading-none pointer-events-none select-none opacity-80"
                        style={{ color: coordColor }}
                      >
                        {fileChar}
                      </span>
                    )}

                    {piece && seatTheme && (
                      <div
                        className="w-[88%] h-[88%] flex items-center justify-center transition-transform drop-shadow-md pointer-events-none"
                        style={{
                          transform: `rotate(${seatTheme.rotation}deg)`,
                        }}
                      >
                        <MatiksPiece
                          type={piece.kind}
                          customColor={seatTheme.mainColor}
                          detailColor={seatTheme.detailColor}
                        />
                      </div>
                    )}

                    {isLegal && !piece && (
                      <div className="w-[32%] h-[32%] rounded-full bg-[#0E0E0E] shadow-sm pointer-events-none select-none" />
                    )}

                    {isLegal && piece && (
                      <div className="absolute inset-0 border-2 border-[#0E0E0E] rounded-sm pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:block w-40 shrink-0">
              {renderPlayerBar("east")}
            </div>
          </div>

          {/* Desktop South Card */}
          <div className="hidden md:block w-full max-w-[500px] mt-3">
            {renderPlayerBar("south", "w-full")}
          </div>
        </div>
      )}
    </div>
  );
}
