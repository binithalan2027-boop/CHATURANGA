import { useState, useEffect, useMemo, useRef } from "react";
import { Chess, Square } from "chess.js";
import type { RoomView } from "./types";
import type { CustomView, CustomKind } from "./customTypes";
import { formatClock, liveClock } from "./liveClock";
import { lastMoveSquares, ruleLabel, timeControlLabel } from "./roomList";
import { POWERS, type Power } from "../chaturanga/engine";
import { validCell, crossMoves } from "./crossRules";
import VariantBoard from "../chaturanga/VariantBoard";
import FogBoard from "../chaturanga/FogBoard";
import MatiksPiece from "../components/MatiksPiece";
import InGameChat from "./InGameChat";
import { api } from "./client";
import { variantPosition, variantMoves } from "../chaturanga/variantRules";
import { parseUci } from "chessops/util";

const glyph: Record<string, string> = {
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
  k: "♚",
};

const customNames: Record<CustomKind, string> = {
  mind: "Mind Before Move",
  mantra: "Mantra Duel + spells",
  cross3: "Three-player cross-board",
  cross4: "Four-player cross-board",
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

interface OnlineMatchViewProps {
  standardRoom?: RoomView;
  customRoom?: CustomView;
  currentUserId: string;
  onExit: () => void;
  run: (f: () => Promise<unknown>) => Promise<boolean>;
  gameAction?: (action: string, uci?: string) => void;
  busy?: boolean;
}

export default function OnlineMatchView({
  standardRoom,
  customRoom,
  currentUserId,
  onExit,
  run,
  gameAction,
  busy = false,
}: OnlineMatchViewProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "moves">("chat");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [muted, setMuted] = useState(
    () => localStorage.getItem("chaturanga-muted") === "1"
  );
  const [unreadChat, setUnreadChat] = useState(0);
  const prevChatCount = useRef(0);

  // Custom game state
  const [customFrom, setCustomFrom] = useState<string | number | null>(null);
  const [mathAnswer, setMathAnswer] = useState("");
  const [selectedPower, setSelectedPower] = useState<Power | null>(null);

  // Standard game state
  const [selectedSq, setSelectedSq] = useState<number | null>(null);

  // Ticking state for live clocks
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 300);
    return () => clearInterval(t);
  }, []);

  const isCustom = !!customRoom;
  const roomCode = standardRoom ? standardRoom.id : customRoom?.id ?? "";

  // Chat messages list
  const chatMessages = useMemo(() => {
    if (standardRoom?.chat) return standardRoom.chat;
    if (customRoom?.chat) return customRoom.chat;
    return [];
  }, [standardRoom?.chat, customRoom?.chat]);

  // Track unread messages when not on chat tab
  useEffect(() => {
    if (chatMessages.length > prevChatCount.current) {
      if (activeTab !== "chat") {
        setUnreadChat((u) => u + (chatMessages.length - prevChatCount.current));
      }
    }
    prevChatCount.current = chatMessages.length;
  }, [chatMessages.length, activeTab]);

  const handleTabChange = (tab: "chat" | "moves") => {
    setActiveTab(tab);
    if (tab === "chat") setUnreadChat(0);
  };

  const copyInvite = () => {
    const link = `https://chaturanga-jpy3.onrender.com/?room=${encodeURIComponent(roomCode)}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // --- CUSTOM MODE LOGIC ---
  const math = customRoom?.math;
  const customChess = useMemo(
    () => (math?.fen ? new Chess(math.fen) : null),
    [math?.fen]
  );
  const customLegalMoves = useMemo(() => {
    if (!customChess || !customFrom || typeof customFrom !== "string") return new Set<string>();
    try {
      const moves = customChess.moves({ square: customFrom as Square, verbose: true });
      return new Set(moves.map((m) => m.to));
    } catch {
      return new Set<string>();
    }
  }, [customChess, customFrom]);

  const crossLegalMoves = useMemo(() => {
    if (!customRoom?.cross || typeof customFrom !== "number") return [];
    return crossMoves(customRoom.cross, customFrom);
  }, [customRoom?.cross, customFrom]);

  const customAct = (data: Record<string, unknown>) =>
    void run(async () => {
      if (!customRoom) return;
      await api("custom-action", {
        room: customRoom.id,
        version: customRoom.version,
        ...data,
      });
      setCustomFrom(null);
      setMathAnswer("");
      setSelectedPower(null);
      setConfirmResign(false);
    });

  const customCommand = (cmd: Record<string, unknown>) =>
    customAct({ action: "command", command: cmd });

  const handleCustomSquareClick = (sq: string | number) => {
    if (customRoom?.status !== "active" || customRoom.turn !== customRoom.yourSeat) return;

    if (customRoom.cross && typeof sq === "number") {
      if (typeof customFrom === "number" && crossLegalMoves.includes(sq)) {
        customAct({ action: "move", from: customFrom, to: sq });
      } else if (customRoom.cross.board[sq]?.seat === customRoom.yourSeat) {
        setCustomFrom(sq);
      }
      return;
    }

    if (math) {
      if (selectedPower) {
        customCommand({ type: "cast", power: selectedPower, target: sq, promotion: "q" });
        return;
      }
      if (typeof customFrom === "string") {
        customCommand({ type: "move", from: customFrom, to: sq, promotion: "q" });
      } else if (customChess?.get(sq as Square)?.color === customRoom.yourSeat) {
        setCustomFrom(sq);
      }
    }
  };

  // --- STANDARD MODE LOGIC ---
  const standardPos = useMemo(
    () =>
      standardRoom && standardRoom.rule !== "fog"
        ? variantPosition(standardRoom.rule, standardRoom.fen)
        : null,
    [standardRoom?.id, standardRoom?.rule, standardRoom?.fen]
  );

  const standardDests = useMemo(() => {
    if (!standardPos || selectedSq === null) return [];
    const moves = variantMoves(standardPos);
    const dests: number[] = [];
    for (const uci of moves) {
      const parsed = parseUci(uci);
      if (parsed && "from" in parsed && parsed.from === selectedSq) {
        dests.push(parsed.to);
      }
    }
    return dests;
  }, [standardPos, selectedSq]);

  const standardLastMove = useMemo(
    () => lastMoveSquares(standardRoom?.lastMove),
    [standardRoom?.lastMove]
  );

  const handleStandardSquareClick = (sq: number) => {
    if (!standardRoom || standardRoom.status !== "active" || busy) return;
    if (standardRoom.turn !== standardRoom.yourColor) return;

    if (selectedSq === null) {
      if (standardPos && standardPos.board.get(sq)?.color === standardPos.turn) {
        setSelectedSq(sq);
      }
      return;
    }

    if (sq === selectedSq) {
      setSelectedSq(null);
      return;
    }

    if (standardDests.includes(sq)) {
      const fromName = FILES[selectedSq % 8] + (Math.floor(selectedSq / 8) + 1);
      const toName = FILES[sq % 8] + (Math.floor(sq / 8) + 1);
      const uci = `${fromName}${toName}`;
      gameAction?.("move", uci);
      setSelectedSq(null);
    } else if (standardPos && standardPos.board.get(sq)?.color === standardPos.turn) {
      setSelectedSq(sq);
    } else {
      setSelectedSq(null);
    }
  };

  // Clocks
  const standardLive = standardRoom ? liveClock(standardRoom, 0) : null;
  const yourColor = standardRoom?.yourColor ?? (customRoom?.yourSeat === "w" ? "white" : "black");
  const isYourTurn = standardRoom
    ? standardRoom.turn === yourColor
    : customRoom
      ? customRoom.turn === customRoom.yourSeat
      : false;

  const opponentName = standardRoom
    ? (yourColor === "white" ? standardRoom.blackName : standardRoom.whiteName) ?? "Opponent"
    : customRoom
      ? customRoom.players.find((p) => p.seat !== customRoom.yourSeat)?.name ?? "Opponent"
      : "Opponent";

  const yourName = standardRoom
    ? (yourColor === "white" ? standardRoom.whiteName : standardRoom.blackName) ?? "You"
    : customRoom
      ? customRoom.players.find((p) => p.seat === customRoom.yourSeat)?.name ?? "You"
      : "You";

  const title = standardRoom
    ? `${ruleLabel(standardRoom.rule)} · ${timeControlLabel(standardRoom.initialMs, standardRoom.incrementMs)}`
    : customRoom
      ? `${customNames[customRoom.kind]} · ${customRoom.players.length}/${customRoom.capacity} Active`
      : "Online Match";

  const isFinished = standardRoom?.status === "finished" || customRoom?.status === "finished";
  const resultText = standardRoom?.result ?? customRoom?.result;

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#F4F4F4] flex flex-col font-sans select-none">
      {/* Top Header Bar */}
      <header className="px-4 py-3 bg-[#161616] border-b border-white/10 flex items-center justify-between flex-wrap gap-2 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="px-3 py-1.5 bg-[#242424] hover:bg-[#333] text-white text-xs font-semibold rounded-xl border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            ← Back to Lobby
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#AFF65B] animate-pulse" />
              <h1 className="m-0 text-sm font-bold tracking-wider uppercase text-white">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#888]">
              <span>Room:</span>
              <code className="text-[#AFF65B] font-mono font-bold tracking-widest bg-black/50 px-1.5 py-0.2 rounded border border-[#AFF65B]/20">
                {roomCode}
              </code>
              <button
                type="button"
                onClick={copyCode}
                className="text-[#AAA] hover:text-white underline cursor-pointer bg-transparent border-0 p-0 text-[11px]"
              >
                {copiedCode ? "✓ Copied" : "Copy Code"}
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={copyInvite}
                className="text-[#AFF65B] hover:text-white underline cursor-pointer bg-transparent border-0 p-0 text-[11px] font-medium"
              >
                {copiedLink ? "✓ Invite Copied!" : "Copy Invite Link"}
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            title="Flip board orientation"
            className="px-2.5 py-1.5 bg-[#222] hover:bg-[#333] text-[#DDD] text-xs rounded-xl border border-white/10 cursor-pointer"
          >
            🔄 Flip
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !muted;
              setMuted(next);
              localStorage.setItem("chaturanga-muted", next ? "1" : "0");
            }}
            title={muted ? "Unmute sounds" : "Mute sounds"}
            className="px-2.5 py-1.5 bg-[#222] hover:bg-[#333] text-[#DDD] text-xs rounded-xl border border-white/10 cursor-pointer"
          >
            {muted ? "🔇" : "🔊"}
          </button>

          {!isFinished && (
            <>
              {isCustom ? (
                <>
                  <button
                    type="button"
                    onClick={() => customAct({ action: "draw" })}
                    className="px-3 py-1.5 bg-[#262626] hover:bg-[#333] text-white text-xs font-semibold rounded-xl border border-white/10 cursor-pointer"
                  >
                    Draw Offer
                  </button>
                  {!confirmResign ? (
                    <button
                      type="button"
                      onClick={() => setConfirmResign(true)}
                      className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-semibold rounded-xl border border-red-500/30 cursor-pointer"
                    >
                      Resign
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => customAct({ action: "resign" })}
                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Confirm Resign
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmResign(false)}
                        className="px-2 py-1.5 bg-[#222] text-[#AAA] text-xs rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => gameAction?.("offerDraw")}
                    className="px-3 py-1.5 bg-[#262626] hover:bg-[#333] text-white text-xs font-semibold rounded-xl border border-white/10 cursor-pointer disabled:opacity-40"
                  >
                    Draw
                  </button>
                  {!confirmResign ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmResign(true)}
                      className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-semibold rounded-xl border border-red-500/30 cursor-pointer disabled:opacity-40"
                    >
                      Resign
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          gameAction?.("resign");
                          setConfirmResign(false);
                        }}
                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmResign(false)}
                        className="px-2 py-1.5 bg-[#222] text-[#AAA] text-xs rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main Playing Field */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left/Center Column: Chess Arena */}
        <section className="lg:col-span-8 flex flex-col items-center">
          {/* Opponent Card Bar */}
          <div className="w-full max-w-[720px] lg:max-w-[760px] mb-2 px-4 py-2.5 bg-[#181818] border border-white/10 rounded-2xl flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-500 flex items-center justify-center font-bold text-xs text-white shadow-inner">
                {opponentName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white">{opponentName}</span>
                  {!isYourTurn && !isFinished && (
                    <span className="w-2 h-2 rounded-full bg-[#AFF65B] animate-ping" />
                  )}
                </div>
                <span className="text-[10px] text-[#888] uppercase tracking-wider">
                  {yourColor === "white" ? "Black Army" : "White Army"}
                </span>
              </div>
            </div>

            {/* Opponent Digital Clock */}
            <div
              className={`px-3 py-1 rounded-xl font-mono font-bold text-base border transition-all ${
                !isYourTurn && !isFinished
                  ? "bg-[#252525] border-[#AFF65B]/60 text-[#AFF65B] shadow-[0_0_12px_rgba(175,246,91,0.2)]"
                  : "bg-[#141414] border-white/10 text-[#888]"
              }`}
            >
              {standardRoom && standardLive
                ? formatClock(yourColor === "white" ? standardLive.blackMs : standardLive.whiteMs)
                : math
                  ? `${Math.ceil((yourColor === "white" ? math.clocks.b : math.clocks.w) / 1000)}s`
                  : "--:--"}
            </div>
          </div>

          {/* Math Mode Active Challenge Banner (For Mind Before Move / Mantra Duel) */}
          {math && (
            <div className="w-full max-w-[720px] lg:max-w-[760px] mb-3">
              {math.question ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (math.question && mathAnswer.trim()) {
                      customCommand({
                        type: "answer",
                        token: math.question.id,
                        answer: mathAnswer.trim(),
                      });
                    }
                  }}
                  className="p-3.5 bg-gradient-to-r from-[#182312] to-[#141d0f] border-2 border-[#AFF65B]/50 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🧠</span>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-[#AFF65B] font-bold block">
                        Mental Math Challenge
                      </span>
                      <strong className="text-white text-base font-mono">
                        {math.question.text} = ?
                      </strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      inputMode="numeric"
                      value={mathAnswer}
                      onChange={(e) => setMathAnswer(e.target.value)}
                      placeholder="Answer"
                      autoFocus
                      autoComplete="off"
                      className="w-24 bg-black/80 text-[#AFF65B] font-mono font-bold text-base px-3 py-1.5 rounded-xl border border-[#AFF65B]/40 focus:border-[#AFF65B] focus:outline-none text-center"
                    />
                    <button
                      type="submit"
                      disabled={!mathAnswer.trim()}
                      className="px-4 py-1.5 bg-[#AFF65B] hover:bg-white text-black font-bold text-xs rounded-xl cursor-pointer transition-all disabled:opacity-40"
                    >
                      Solve
                    </button>
                  </div>
                </form>
              ) : (
                <div className="px-3 py-2 bg-[#1B1B1B] border border-white/10 rounded-xl text-xs text-[#AAA] flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span>⚡ Phase: {math.phase}</span>
                    <span>·</span>
                    <span>{math.canAct ? "Your turn to move a piece" : "Waiting for opponent"}</span>
                  </span>
                  {math.notice && <span className="text-[#AFF65B] font-semibold">{math.notice}</span>}
                </div>
              )}

              {/* Power inventory */}
              {math.inventory && customRoom?.yourSeat && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-[#777] uppercase font-bold mr-1">Your Powers:</span>
                  {(math.inventory[customRoom.yourSeat as "w" | "b"] || []).length === 0 ? (
                    <span className="text-[11px] text-[#555] italic">Solve duels to unlock spells</span>
                  ) : (
                    math.inventory[customRoom.yourSeat as "w" | "b"].map((p, i) => (
                      <button
                        key={`${p}-${i}`}
                        type="button"
                        aria-pressed={selectedPower === p}
                        onClick={() => {
                          if (["add", "cut", "double", "rewind"].includes(p)) {
                            customCommand({ type: "cast", power: p });
                          } else {
                            setSelectedPower(selectedPower === p ? null : p);
                          }
                        }}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          selectedPower === p
                            ? "bg-[#AFF65B] text-black border-[#AFF65B]"
                            : "bg-[#252525] text-white border-white/10 hover:border-[#AFF65B]/50"
                        }`}
                      >
                        ✨ {POWERS[p]?.name ?? p}
                      </button>
                    ))
                  )}
                  {math.submove === 1 && (
                    <button
                      type="button"
                      onClick={() => customCommand({ type: "endTurn" })}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#AFF65B] text-black cursor-pointer"
                    >
                      End Bonus Move
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* THE CHESS BOARD CONTAINER */}
          <div className="w-full max-w-[720px] lg:max-w-[760px] aspect-square bg-[#1A1A1A] p-2 sm:p-3 rounded-2xl border-2 border-white/10 shadow-2xl relative">
            {/* Custom Math Mode Board (Mind Before Move / Mantra Duel) */}
            {math && customChess && (
              <div
                className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden border border-white/10"
                role="group"
                aria-label="Mind Before Move Chess Board"
              >
                {RANKS.map((rank, rIdx) =>
                  FILES.map((file, fIdx) => {
                    const actualRank = flipped ? RANKS[7 - rIdx] : rank;
                    const actualFile = flipped ? FILES[7 - fIdx] : file;
                    const sq = `${actualFile}${actualRank}` as Square;
                    const piece = customChess.get(sq);
                    const isDark = (FILES.indexOf(actualFile) + Number(actualRank)) % 2 === 0;
                    const isSelected = customFrom === sq;
                    const isLegal = customLegalMoves.has(sq);
                    const isWhitePiece = piece?.color === "w";

                    return (
                      <button
                        key={sq}
                        type="button"
                        aria-label={`${sq}, ${piece ? `${piece.color} ${piece.type}` : "empty"}`}
                        onClick={() => handleCustomSquareClick(sq)}
                        className={`relative flex items-center justify-center p-0 border-0 outline-none cursor-pointer transition-colors ${
                          isDark ? "bg-[#33302B]" : "bg-[#B0A79A]"
                        } ${isSelected ? "ring-4 ring-[#AFF65B] z-10" : ""}`}
                      >
                        {/* File & Rank Coordinate Labels */}
                        {actualFile === "a" && (
                          <span
                            className={`absolute top-0.5 left-1 text-[9px] font-bold select-none ${
                              isDark ? "text-[#B0A79A]/50" : "text-[#33302B]/50"
                            }`}
                          >
                            {actualRank}
                          </span>
                        )}
                        {actualRank === "1" && (
                          <span
                            className={`absolute bottom-0.5 right-1 text-[9px] font-bold select-none ${
                              isDark ? "text-[#B0A79A]/50" : "text-[#33302B]/50"
                            }`}
                          >
                            {actualFile}
                          </span>
                        )}

                        {/* Chess Piece Vector Icon */}
                        {piece && (
                          <div
                            className={`w-[85%] h-[85%] flex items-center justify-center transform transition-transform active:scale-95 ${
                              isSelected ? "scale-110 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" : ""
                            }`}
                          >
                            <MatiksPiece type={piece.type} color={isWhitePiece ? "w" : "b"} />
                          </div>
                        )}

                        {/* Legal Move Destination Dots */}
                        {isLegal && (
                          <span
                            className={`absolute rounded-full ${
                              piece
                                ? "w-full h-full border-4 border-[#AFF65B]/80 rounded-none bg-[#AFF65B]/20"
                                : "w-3 h-3 bg-[#AFF65B] shadow-md animate-pulse"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Custom Cross Board (Three/Four Player) */}
            {customRoom?.cross && (
              <div className="w-full h-full flex flex-col items-center justify-center overflow-auto p-2">
                <div
                  className="grid grid-cols-14 gap-0.5 bg-[#252525] p-1 rounded-xl"
                  style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}
                >
                  {Array.from({ length: 196 }, (_, i) => {
                    const r = Math.floor(i / 14);
                    const c = i % 14;
                    const p = customRoom.cross!.board[i];
                    const isValid = validCell(r, c);
                    const isSelected = customFrom === i;
                    const isLegal = crossLegalMoves.includes(i);

                    if (!isValid) return <span key={i} className="w-5 h-5 bg-transparent" />;

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleCustomSquareClick(i)}
                        className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold rounded-sm cursor-pointer ${
                          (r + c) % 2 ? "bg-[#333]" : "bg-[#555]"
                        } ${isSelected ? "ring-2 ring-[#AFF65B]" : ""} ${
                          isLegal ? "bg-[#AFF65B]/50" : ""
                        }`}
                      >
                        {p ? glyph[p.kind] : isLegal ? "·" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Standard Mode Board (Chess & Variants) */}
            {standardRoom && standardPos && (
              <div className="w-full h-full">
                <VariantBoard
                  pos={standardPos}
                  selected={selectedSq}
                  dests={standardDests}
                  onSquare={handleStandardSquareClick}
                  flip={yourColor === "black" !== flipped}
                  lastMove={standardLastMove}
                />
              </div>
            )}

            {/* Fog of War Board */}
            {standardRoom && standardRoom.rule === "fog" && (
              <div className="w-full h-full">
                <FogBoard
                  fen={standardRoom.fen}
                  fogSquares={standardRoom.fogSquares ?? []}
                  flip={yourColor === "black" !== flipped}
                  selected={selectedSq}
                  dests={standardDests}
                  onSquare={handleStandardSquareClick}
                  lastMove={standardLastMove}
                />
              </div>
            )}
          </div>

          {/* Player Card Bar */}
          <div className="w-full max-w-[720px] lg:max-w-[760px] mt-2 px-4 py-2.5 bg-[#181818] border border-white/10 rounded-2xl flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#AFF65B] to-emerald-400 flex items-center justify-center font-bold text-xs text-black shadow-inner">
                {yourName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white">{yourName} (You)</span>
                  {isYourTurn && !isFinished && (
                    <span className="w-2 h-2 rounded-full bg-[#AFF65B] animate-ping" />
                  )}
                </div>
                <span className="text-[10px] text-[#888] uppercase tracking-wider">
                  {yourColor === "white" ? "White Army" : "Black Army"}
                </span>
              </div>
            </div>

            {/* Player Digital Clock */}
            <div
              className={`px-3 py-1 rounded-xl font-mono font-bold text-base border transition-all ${
                isYourTurn && !isFinished
                  ? "bg-[#252525] border-[#AFF65B]/60 text-[#AFF65B] shadow-[0_0_12px_rgba(175,246,91,0.2)]"
                  : "bg-[#141414] border-white/10 text-[#888]"
              }`}
            >
              {standardRoom && standardLive
                ? formatClock(yourColor === "white" ? standardLive.whiteMs : standardLive.blackMs)
                : math
                  ? `${Math.ceil((yourColor === "white" ? math.clocks.w : math.clocks.b) / 1000)}s`
                  : "--:--"}
            </div>
          </div>
        </section>

        {/* Right Column: In-Game Live Chat & Moves Panel */}
        <aside className="lg:col-span-4 flex flex-col h-[580px] bg-[#161616] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {/* Tabs Selector */}
          <div className="flex border-b border-white/10 bg-[#1D1D1D]">
            <button
              type="button"
              onClick={() => handleTabChange("chat")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border-0 border-b-2 ${
                activeTab === "chat"
                  ? "border-[#AFF65B] text-white bg-[#222]"
                  : "border-transparent text-[#777] hover:text-[#AAA] bg-transparent"
              }`}
            >
              <span>💬 Live Chat</span>
              {unreadChat > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#AFF65B] text-black font-bold text-[10px]">
                  {unreadChat}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("moves")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border-0 border-b-2 ${
                activeTab === "moves"
                  ? "border-[#AFF65B] text-white bg-[#222]"
                  : "border-transparent text-[#777] hover:text-[#AAA] bg-transparent"
              }`}
            >
              <span>📜 Move History</span>
            </button>
          </div>

          {/* Tab Content 1: Live Chat */}
          {activeTab === "chat" && (
            <div className="flex-1 p-2 flex flex-col overflow-hidden">
              <InGameChat
                roomCode={roomCode}
                messages={chatMessages}
                currentUserId={currentUserId}
                isCustom={isCustom}
              />
            </div>
          )}

          {/* Tab Content 2: Move History & Match Info */}
          {activeTab === "moves" && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#888] mb-2">
                  Match Details
                </h4>
                <div className="p-3 bg-[#1F1F1F] rounded-xl border border-white/5 space-y-1.5 text-xs text-[#CCC]">
                  <div className="flex justify-between">
                    <span className="text-[#777]">Mode</span>
                    <span className="font-semibold text-white">{title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777]">Turn</span>
                    <span className="font-semibold text-[#AFF65B]">
                      {isYourTurn ? "Your turn to move" : `${opponentName}'s turn`}
                    </span>
                  </div>
                  {standardRoom && (
                    <div className="flex justify-between">
                      <span className="text-[#777]">Total Moves</span>
                      <span className="font-mono text-white">{standardRoom.moves.length}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Moves Notation */}
              {standardRoom && standardRoom.moves.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#888] mb-2">
                    Played Moves
                  </h4>
                  <div className="grid grid-cols-2 gap-1 max-h-[220px] overflow-y-auto p-2 bg-[#121212] rounded-xl border border-white/5 text-xs font-mono">
                    {standardRoom.moves.map((m, idx) => (
                      <div
                        key={idx}
                        className={`px-2 py-1 rounded ${
                          idx % 2 === 0 ? "text-white" : "text-[#AAA]"
                        }`}
                      >
                        {Math.floor(idx / 2) + 1}. {m}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom mode events */}
              {math?.events && math.events.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#888] mb-2">
                    Game Events
                  </h4>
                  <div className="space-y-1 text-xs text-[#AAA] p-2 bg-[#121212] rounded-xl border border-white/5 max-h-[200px] overflow-y-auto">
                    {math.events.map((e, idx) => (
                      <div key={idx} className="p-1 border-b border-white/5">
                        {e}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </main>

      {/* Game Over Dialog */}
      {isFinished && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-[#1C1C1C] border border-[#AFF65B]/40 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <span className="text-4xl block animate-bounce">🏆</span>
            <h2 className="text-2xl font-black text-white m-0 tracking-wide uppercase">
              Match Finished
            </h2>
            <p className="text-sm font-semibold text-[#AFF65B] m-0 bg-[#AFF65B]/10 py-2 px-3 rounded-xl border border-[#AFF65B]/20">
              {resultText || "Game Over"}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={onExit}
                className="w-full py-3 bg-[#AFF65B] hover:bg-white text-black font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
              >
                Return to Online Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
