import { useState, useEffect, useMemo, useRef } from "react";
import { Chess, Square } from "chess.js";
import type { RoomView } from "./types";
import type { CustomView, CustomKind } from "./customTypes";
import { formatClock, liveClock } from "./liveClock";
import { lastMoveSquares, ruleLabel, timeControlLabel } from "./roomList";
import { type Power } from "../chaturanga/engine";
import { crossGame, crossMoves, type CrossState } from "./crossRules";
import VariantBoard from "../chaturanga/VariantBoard";
import FogBoard from "../chaturanga/FogBoard";
import MatiksPiece from "../components/MatiksPiece";
import MatiksCrossBoard from "./MatiksCrossBoard";
import InGameChat from "./InGameChat";
import { api } from "./client";
import { variantPosition, variantMoves } from "../chaturanga/variantRules";
import { parseUci } from "chessops/util";
import { materialFromFen } from "./material";

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

function CapturedRow({ pieces, color }: { pieces: string[]; color: string }) {
  if (pieces.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 flex-wrap" aria-label={`${pieces.length} captured`}>
      {pieces.map((p, i) => (
        <span key={i} className="inline-block w-3.5 h-3.5 opacity-85">
          <MatiksPiece type={p} color={color} />
        </span>
      ))}
    </span>
  );
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
    () => (typeof localStorage !== "undefined" && localStorage.getItem("chaturanga-muted") === "1")
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

  // Cross mode state
  const isCross = customRoom?.kind === "cross3" || customRoom?.kind === "cross4";
  const crossState: CrossState | null =
    customRoom?.cross ??
    (isCross
      ? crossGame(customRoom?.kind === "cross3" ? 3 : 4, 300000, Date.now())
      : null);

  const crossLegalMoves = useMemo(() => {
    if (!crossState || typeof customFrom !== "number") return [];
    return crossMoves(crossState, customFrom);
  }, [crossState, customFrom]);

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
    ? `${ruleLabel(standardRoom.rule)}`
    : customRoom
      ? `${customNames[customRoom.kind]}`
      : "Online Match";

  const timeControl = standardRoom
    ? timeControlLabel(standardRoom.initialMs, standardRoom.incrementMs)
    : "5 min";

  const isFinished = standardRoom?.status === "finished" || customRoom?.status === "finished";
  const resultText = standardRoom?.result ?? customRoom?.result;

  // Material & captured pieces for standard chess
  const material = useMemo(
    () => (standardRoom?.fen ? materialFromFen(standardRoom.fen) : null),
    [standardRoom?.fen]
  );
  const capturedByOpponent = yourColor === "white" ? (material?.capturedByBlack ?? []) : (material?.capturedByWhite ?? []);
  const capturedByYou = yourColor === "white" ? (material?.capturedByWhite ?? []) : (material?.capturedByBlack ?? []);
  const materialLead = yourColor === "white" ? (material?.lead ?? 0) : -(material?.lead ?? 0);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0E0E0E] text-[#F4F4F4] font-body p-4 lg:p-8 select-none">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Chess Board Column (Matching CourtyardMatch 8-col grid) */}
        <section className="lg:col-span-8 flex flex-col items-center">
          {/* Header & Status matching CourtyardMatch */}
          <div className="w-full max-w-[640px] flex items-center justify-between mb-3">
            <div>
              <span className="font-body text-[11px] font-semibold tracking-[2px] text-[#AFF65B] uppercase block">
                ONLINE MULTIPLAYER · RATED MATCH
              </span>
              <h1 className="font-heading text-2xl lg:text-3xl tracking-wide text-[#F4F4F4] m-0 uppercase">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8A8A8A] bg-[#1A1A1A] border border-white/5 py-1 px-3 rounded-full flex items-center gap-1.5 font-mono">
                <span>⏱️</span>
                <span>{timeControl}</span>
              </span>
              <button
                type="button"
                onClick={onExit}
                className="text-xs text-[#8A8A8A] hover:text-white bg-[#1A1A1A] border border-white/10 py-1 px-3 rounded-full transition-colors cursor-pointer"
              >
                ← Lobby
              </button>
            </div>
          </div>

          {/* Waiting Room Banner (when status === "waiting") */}
          {standardRoom?.status === "waiting" && (
            <div className="w-full max-w-[640px] mb-3 p-4 bg-[#1E2616] border border-[#AFF65B]/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#AFF65B] animate-ping" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#AFF65B]">
                    WAITING FOR OPPONENT TO JOIN
                  </div>
                  <div className="text-xs text-[#AAA] mt-0.5">
                    Share the invite link or code. Clocks start on first move.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={copyInvite}
                  className="btn-lime px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {copiedLink ? "✓ Invite Copied!" : "📋 Copy Invite Link"}
                </button>
                <button
                  type="button"
                  onClick={copyCode}
                  className="px-3 py-1.5 bg-[#262626] text-white text-xs rounded-xl border border-white/10 hover:bg-[#333] cursor-pointer"
                >
                  {copiedCode ? "✓ Code Copied" : "Copy Code"}
                </button>
                {standardRoom.white === currentUserId && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => gameAction?.("cancel")}
                    className="px-3 py-1.5 bg-transparent text-[#FF8080] text-xs border border-[#E5484D]/30 hover:bg-[#E5484D]/10 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Match Concluded Banner */}
          {isFinished && resultText && (
            <div className="w-full max-w-[640px] mb-3 p-4 bg-[#181818] border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#AFF65B]">
                  MATCH CONCLUDED
                </div>
                <div className="font-heading text-xl text-white mt-0.5">
                  {resultText}
                </div>
                {standardRoom?.ratingDelta && (
                  <div className="text-xs font-mono text-[#AFF65B] mt-0.5">
                    Rating Change: {standardRoom.ratingDelta[yourColor] > 0 ? `+${standardRoom.ratingDelta[yourColor]}` : standardRoom.ratingDelta[yourColor]}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {standardRoom?.black && standardRoom.result !== "Room cancelled" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const out = await api<{ room?: string }>("game", {
                          room: standardRoom.id,
                          version: standardRoom.version,
                          action: "rematch",
                        });
                        if (out?.room) onExit();
                      })
                    }
                    className="btn-lime px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Rematch
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      `Match Review for Online Game vs ${opponentName}:\n\nDeep Stockfish engine move-by-move evaluation, blunder analysis, and brilliance detection is coming soon in the next major update!`
                    )
                  }
                  className="px-3 py-1.5 bg-[#262626] hover:bg-[#333] border border-white/10 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Match Review</span>
                  <span className="px-1.5 py-0.5 bg-[#AFF65B]/20 text-[#AFF65B] text-[9px] font-bold rounded-full">
                    Coming Soon
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Opponent (Top) Bar matching CourtyardMatch */}
          {!isCross && (
            <div className={`w-full max-w-[640px] flex items-center justify-between px-4 py-2.5 rounded-t-xl transition-colors ${
              !isYourTurn && !isFinished ? "bg-[#1F1F1F] border-b border-[#AFF65B]/40" : "bg-[#161616]"
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#262626] border border-white/10 flex items-center justify-center font-heading text-sm text-white">
                  {opponentName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-base tracking-wide text-[#F4F4F4]">{opponentName}</span>
                    <span className="text-xs text-[#8A8A8A] font-body">(1200)</span>
                    {!isYourTurn && !isFinished && (
                      <span className="w-2 h-2 rounded-full bg-[#AFF65B] animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#8A8A8A]">
                    <span>{!isYourTurn && !isFinished ? "To move" : "Waiting"}</span>
                    {capturedByOpponent.length > 0 && (
                      <>
                        <span>·</span>
                        <CapturedRow pieces={capturedByOpponent} color={yourColor === "white" ? "w" : "b"} />
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                  !isYourTurn && !isFinished
                    ? "bg-[#262626] border-[#AFF65B]/40 text-[#AFF65B] shadow-sm"
                    : "bg-[#262626] border-white/5 text-[#F4F4F4]"
                }`}>
                  {standardRoom && standardLive
                    ? formatClock(yourColor === "white" ? standardLive.blackMs : standardLive.whiteMs)
                    : math
                      ? `${Math.ceil((yourColor === "white" ? math.clocks.b : math.clocks.w) / 1000)}s`
                      : "--:--"}
                </span>
                {materialLead < 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-[#F4F4F4]">
                    +{ -materialLead }
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Math Mode Active Challenge Banner */}
          {math && (
            <div className="w-full max-w-[640px] mb-3">
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
            </div>
          )}

          {/* CHESS BOARD WRAPPER matching CourtyardMatch measurements */}
          <div className="w-full max-w-[640px] aspect-square flex items-center justify-center">
            {/* Standard & Variant Rules with high-res Matiks pieces */}
            {standardRoom && standardRoom.rule !== "fog" && standardPos && (
              <VariantBoard
                pos={standardPos}
                selected={selectedSq}
                dests={standardDests}
                onSquare={handleStandardSquareClick}
                flip={yourColor === "black" !== flipped}
                lastMove={standardLastMove}
              />
            )}

            {/* Fog of War with vector piece fogging */}
            {standardRoom && standardRoom.rule === "fog" && (
              <FogBoard
                fen={standardRoom.fen}
                fogSquares={standardRoom.fogSquares ?? []}
                flip={yourColor === "black" !== flipped}
                selected={selectedSq}
                dests={standardDests}
                onSquare={handleStandardSquareClick}
                lastMove={standardLastMove}
              />
            )}

            {/* Mind Before Move Math Board */}
            {math && customChess && (
              <div className="matiks-board-wrap w-full max-w-[640px] aspect-square">
                <div
                  className="matiks-board court-board relative"
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
                      const isCapture = Boolean(piece && isLegal);

                      return (
                        <button
                          key={sq}
                          type="button"
                          aria-label={`${sq}, ${piece ? `${piece.color} ${piece.type}` : "empty"}`}
                          onClick={() => handleCustomSquareClick(sq)}
                          className={`matiks-square square ${isDark ? "dark" : "light"} ${
                            isSelected ? "selected" : ""
                          }`}
                        >
                          {actualFile === "a" && (
                            <small className="rank coord-rank" aria-hidden="true">
                              {actualRank}
                            </small>
                          )}
                          {actualRank === "1" && (
                            <small className="file coord-file" aria-hidden="true">
                              {actualFile}
                            </small>
                          )}
                          {piece && (
                            <div className="piece-wrapper" aria-hidden="true">
                              <MatiksPiece type={piece.type} color={piece.color === "w" ? "w" : "b"} />
                            </div>
                          )}
                          {isLegal && (
                            isCapture ? (
                              <span className="matiks-capture-ring" aria-hidden="true" />
                            ) : (
                              <i className="matiks-move-dot move-dot" aria-hidden="true" />
                            )
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Cross Board for Three & Four Player */}
            {isCross && crossState && (
              <MatiksCrossBoard
                cross={crossState}
                yourSeat={customRoom?.yourSeat ?? "south"}
                selectedSquare={typeof customFrom === "number" ? customFrom : null}
                legalDests={crossLegalMoves}
                onSquareClick={(sq) => handleCustomSquareClick(sq)}
                players={customRoom?.players ?? []}
                isThreePlayer={customRoom?.kind === "cross3"}
              />
            )}
          </div>

          {/* Player (Bottom) Bar matching CourtyardMatch */}
          {!isCross && (
            <div className={`w-full max-w-[640px] flex items-center justify-between px-4 py-2.5 rounded-b-xl transition-colors ${
              isYourTurn && !isFinished ? "bg-[#1F1F1F] border-t border-[#AFF65B]/40" : "bg-[#161616]"
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#AFF65B] to-emerald-400 flex items-center justify-center font-bold text-xs text-black shadow-inner">
                  {yourName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-base tracking-wide text-[#F4F4F4]">{yourName} (You)</span>
                    <span className="text-xs text-[#8A8A8A] font-body">(1200)</span>
                    {isYourTurn && !isFinished && (
                      <span className="w-2 h-2 rounded-full bg-[#AFF65B] animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#8A8A8A]">
                    <span>{isYourTurn && !isFinished ? "Your turn" : "Waiting for opponent"}</span>
                    {capturedByYou.length > 0 && (
                      <>
                        <span>·</span>
                        <CapturedRow pieces={capturedByYou} color={yourColor === "white" ? "b" : "w"} />
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                  isYourTurn && !isFinished
                    ? "bg-[#262626] border-[#AFF65B]/40 text-[#AFF65B] shadow-sm"
                    : "bg-[#262626] border-white/5 text-[#F4F4F4]"
                }`}>
                  {standardRoom && standardLive
                    ? formatClock(yourColor === "white" ? standardLive.whiteMs : standardLive.blackMs)
                    : math
                      ? `${Math.ceil((yourColor === "white" ? math.clocks.w : math.clocks.b) / 1000)}s`
                      : "--:--"}
                </span>
                {materialLead > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-[#F4F4F4]">
                    +{materialLead}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Under-board Toolbar matching CourtyardMatch */}
          <div className="w-full max-w-[640px] flex items-center justify-between mt-3 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="btn-raised text-xs py-1.5 px-3 font-semibold cursor-pointer"
              >
                🔄 Flip Board
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = !muted;
                  setMuted(next);
                  localStorage.setItem("chaturanga-muted", next ? "1" : "0");
                }}
                className="btn-raised text-xs py-1.5 px-3 font-semibold cursor-pointer"
              >
                {muted ? "🔇 Sound Off" : "🔊 Sound On"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {!isFinished && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (isCustom) customAct({ action: "draw" });
                      else gameAction?.("offerDraw");
                    }}
                    className="btn-raised text-xs py-1.5 px-3 font-semibold cursor-pointer"
                  >
                    Draw Offer
                  </button>
                  {!confirmResign ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmResign(true)}
                      className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-semibold rounded-full border border-red-500/30 cursor-pointer"
                    >
                      Resign
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (isCustom) customAct({ action: "resign" });
                          else gameAction?.("resign");
                          setConfirmResign(false);
                        }}
                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-full cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmResign(false)}
                        className="px-2 py-1.5 bg-[#222] text-[#AAA] text-xs rounded-full cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Match Info Card + Live Chat & Move List Tabs */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          {/* Bento Match Summary Card */}
          <div className="bg-[#161616] border border-white/10 rounded-3xl p-5 shadow-xl space-y-3">
            <div>
              <span className="matiks-kicker text-[#AFF65B] text-[10px]">
                MATCH INFORMATION
              </span>
              <h3 className="matiks-headline text-2xl m-0 text-white leading-tight uppercase">
                {title}
              </h3>
            </div>

            <div className="space-y-2 text-xs text-[#AAA] pt-2 border-t border-white/5">
              <div className="flex justify-between items-center">
                <span>Room Code:</span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="px-2 py-0.5 bg-[#222] text-[#AFF65B] font-mono font-bold rounded border border-white/10 hover:border-[#AFF65B]/40 cursor-pointer"
                >
                  {copiedCode ? "✓ Copied" : roomCode}
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span>Time Format:</span>
                <span className="font-mono text-white">{timeControl}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Rating Status:</span>
                <span className="text-[#AFF65B] font-semibold">Rated (1200 Baseline)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={copyInvite}
              className="btn-lime w-full py-2 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
            >
              {copiedLink ? "✓ Invite Copied!" : "📋 Copy Room Invite Link"}
            </button>
          </div>

          {/* Live Chat & Move History Card */}
          <div className="flex flex-col h-[520px] bg-[#161616] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
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

            {/* Tab 1: Live Chat */}
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

            {/* Tab 2: Move History */}
            {activeTab === "moves" && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#888] mb-2">
                    Played Notation ({standardRoom?.moves.length ?? 0} Plies)
                  </h4>
                  {standardRoom && standardRoom.moves.length > 0 ? (
                    <div className="space-y-1 max-h-[380px] overflow-y-auto p-2.5 bg-[#121212] rounded-xl border border-white/5 text-xs font-mono">
                      {Array.from({ length: Math.ceil(standardRoom.moves.length / 2) }).map((_, moveIdx) => {
                        const whiteMove = standardRoom.moves[moveIdx * 2];
                        const blackMove = standardRoom.moves[moveIdx * 2 + 1];
                        return (
                          <div
                            key={moveIdx}
                            className="grid grid-cols-6 py-1 px-2 rounded hover:bg-white/5 transition-colors"
                          >
                            <span className="text-[#666] col-span-1">{moveIdx + 1}.</span>
                            <span className="text-white font-semibold col-span-2">{whiteMove}</span>
                            <span className="text-[#AAA] col-span-3">{blackMove ?? ""}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-[#666]">
                      No moves played yet. First move starts the game clock!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
