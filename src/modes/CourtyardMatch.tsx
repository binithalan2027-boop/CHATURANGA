import { useState, useEffect, useRef, useMemo, ReactNode } from "react";
import { usePreferences } from "../chaturanga/preferences";
import MatiksPiece from "../components/MatiksPiece";
import PieceGlideLayer, { GLIDE_MS, motionOK } from "../chaturanga/PieceGlideLayer";
import { diffGlides, type Glide, type GlidePiece } from "../chaturanga/pieceGlide";
import { playSound } from "../online/sounds";

const FILES = [..."abcdefgh"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

function flattenBoard(board: ({ type: string; color: string } | null)[][]): (GlidePiece | null)[] {
  const flat: (GlidePiece | null)[] = new Array(64).fill(null);
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r]?.[f];
      const sq = (7 - r) * 8 + f;
      flat[sq] = p
        ? {
            color: p.color === "w" ? "white" : "black",
            role: p.type.toLowerCase(),
          }
        : null;
    }
  }
  return flat;
}

export interface SquareMark {
  className?: string;
  icon?: string;
}

export interface CourtyardMatchProps {
  /** Small uppercase line above the title, e.g. "ATOMIC · THE CLASSIC COLLECTION". */
  eyebrow: string;
  title: string;
  board: ({ type: string; color: string } | null)[][];
  selectedSquare: string | null;
  legalMoves: Set<string>;
  lastMove: { from: string; to: string } | null;
  checkSquare: string | null;
  onSquareClick: (sq: string) => void;
  /** Squares the player cannot see (Fog of War). They are not clickable. */
  hiddenSquares?: Set<string> | null;
  /** Extra marks per square: frozen, jumped, exploding, poisoned... */
  squareMarks?: Record<string, SquareMark>;
  botName: string;
  botElo?: number;
  isBotThinking?: boolean;
  capturedByWhite: string[];
  capturedByBlack: string[];
  materialAdvantage: number;
  botActive: boolean;
  playerActive: boolean;
  /** Clocks for timed matches */
  playerClock?: string;
  botClock?: string;
  duelCountdown?: string;
  /** In-screen board overlay for Math Showdown / Mind Gate */
  boardOverlay?: ReactNode;
  /** Small status sentence shown under the board heading. */
  status?: string;
  /** Extra buttons next to New game / Resign. */
  tools?: ReactNode;
  /** Mode-specific sidebar panels rendered above the move list. */
  sidePanels?: ReactNode;
  /** Modal overlays (maths questions etc.), rendered inside the courtyard root. */
  overlays?: ReactNode;
  history: string[];
  winner: "w" | "b" | null;
  resultTitle?: string;
  onNewGame: () => void;
  onExit: () => void;
}

function CapturedRow({ pieces, color }: { pieces: string[]; color: string }) {
  if (pieces.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 flex-wrap" aria-label={`${pieces.length} captured`}>
      {pieces.map((p, i) => (
        <span key={i} className="inline-block w-4 h-4 opacity-85">
          <MatiksPiece type={p} color={color} />
        </span>
      ))}
    </span>
  );
}

export default function CourtyardMatch({
  eyebrow,
  title,
  board,
  selectedSquare,
  legalMoves,
  lastMove,
  checkSquare,
  onSquareClick,
  hiddenSquares = null,
  squareMarks = {},
  botName,
  botElo,
  isBotThinking = false,
  capturedByWhite,
  capturedByBlack,
  materialAdvantage,
  botActive,
  playerActive,
  playerClock,
  botClock,
  duelCountdown,
  boardOverlay,
  status,
  tools,
  sidePanels,
  overlays,
  history,
  winner,
  resultTitle,
  onNewGame,
  onExit,
}: CourtyardMatchProps) {
  const { prefs, open } = usePreferences();

  const flatBoard = useMemo(() => flattenBoard(board), [board]);
  const prevFlatBoard = useRef<(GlidePiece | null)[]>(flatBoard);
  const [glides, setGlides] = useState<Glide[]>([]);
  const [batch, setBatch] = useState<number>(0);
  const [justMovedSq, setJustMovedSq] = useState<string | null>(null);
  const [justCapturedSq, setJustCapturedSq] = useState<string | null>(null);
  const prevCapturedCount = useRef<number>(0);

  useEffect(() => {
    if (prevFlatBoard.current === flatBoard) return;
    const g = motionOK() ? diffGlides(prevFlatBoard.current, flatBoard) : [];
    prevFlatBoard.current = flatBoard;

    const currentCaptures = capturedByWhite.length + capturedByBlack.length;
    const wasCapture = currentCaptures > prevCapturedCount.current;
    prevCapturedCount.current = currentCaptures;

    if (lastMove) {
      setJustMovedSq(lastMove.to);
      if (wasCapture) {
        setJustCapturedSq(lastMove.to);
      }
      if (prefs.sound) {
        if (checkSquare) {
          playSound("check");
        } else if (wasCapture) {
          playSound("capture");
        } else {
          playSound("move");
        }
      }
    }

    if (g.length > 0) {
      setGlides(g);
      setBatch((b) => b + 1);
    }
  }, [flatBoard, lastMove, checkSquare, prefs.sound, capturedByWhite.length, capturedByBlack.length]);

  useEffect(() => {
    if (!glides.length) return;
    const t = setTimeout(() => {
      setGlides([]);
    }, GLIDE_MS + 40);
    return () => clearTimeout(t);
  }, [glides]);

  useEffect(() => {
    if (!justMovedSq && !justCapturedSq) return;
    const timer = setTimeout(() => {
      setJustMovedSq(null);
      setJustCapturedSq(null);
    }, 450);
    return () => clearTimeout(timer);
  }, [justMovedSq, justCapturedSq]);

  const hidingSquares = useMemo(() => {
    const set = new Set<string>();
    for (const g of glides) {
      const row = Math.floor(g.to / 8);
      const col = g.to % 8;
      set.add(`${FILES[col]}${RANKS[7 - row]}`);
    }
    return set;
  }, [glides]);

  const pairs: { num: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ num: i / 2 + 1, white: history[i], black: history[i + 1] });
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0E0E0E] text-[#F4F4F4] font-body p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Board Column */}
        <section className="lg:col-span-8 flex flex-col items-center">
          
          {/* Header & Status */}
          <div className="w-full max-w-[640px] flex items-center justify-between mb-3">
            <div>
              <span className="font-body text-[11px] font-semibold tracking-[2px] text-[#AFF65B] uppercase block">
                {eyebrow}
              </span>
              <h1 className="font-heading text-2xl lg:text-3xl tracking-wide text-[#F4F4F4] m-0">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {duelCountdown && (
                <span className="text-xs font-mono font-bold text-[#AFF65B] bg-[#262626] border border-[#AFF65B]/30 py-1 px-3 rounded-full flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#AFF65B] animate-pulse" />
                  DUEL IN {duelCountdown}
                </span>
              )}
              {status && (
                <span className="text-xs text-[#8A8A8A] bg-[#1A1A1A] border border-white/5 py-1 px-3 rounded-full">
                  {status}
                </span>
              )}
            </div>
          </div>

          {/* Opponent (Black) Line */}
          <div className={`w-full max-w-[640px] flex items-center justify-between px-4 py-2.5 rounded-t-xl transition-colors ${
            botActive ? "bg-[#1F1F1F] border-b border-[#AFF65B]/40" : "bg-[#161616]"
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#262626] border border-white/10 flex items-center justify-center text-sm font-heading">
                ●
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-base tracking-wide text-[#F4F4F4]">{botName}</span>
                  {botElo !== undefined && !prefs.hideRatings && (
                    <span className="text-xs text-[#8A8A8A] font-body">({botElo})</span>
                  )}
                  {botActive && (
                    <span className="w-2 h-2 rounded-full bg-[#AFF65B] animate-pulse" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8A8A8A]">
                  {isBotThinking ? (
                    <span className="inline-flex items-center gap-1.5 text-[#AFF65B] font-semibold bg-[#AFF65B]/10 px-2.5 py-0.5 rounded-full border border-[#AFF65B]/30 shadow-sm animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#AFF65B] animate-ping" />
                      Thinking…
                    </span>
                  ) : (
                    <span>{botActive ? "To move" : "Waiting"}</span>
                  )}
                  {capturedByBlack.length > 0 && (
                    <>
                      <span>·</span>
                      <CapturedRow pieces={capturedByBlack} color="w" />
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {botClock && (
                <span className={`font-mono text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                  botActive
                    ? "bg-[#262626] border-[#AFF65B]/40 text-[#AFF65B] shadow-sm"
                    : "bg-[#262626] border-white/5 text-[#F4F4F4]"
                }`}>
                  {botClock}
                </span>
              )}
              {materialAdvantage < 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-[#F4F4F4]">
                  +{ -materialAdvantage }
                </span>
              )}
            </div>
          </div>

          {/* Chess Board */}
          <div className="matiks-board-wrap w-full max-w-[640px]">
            <div
              className="matiks-board court-board relative"
              role="group"
              aria-label={`${title} chess board`}
            >
              {RANKS.map((rank, r) =>
                FILES.map((file, f) => {
                  const sq = `${file}${rank}`;
                  const piece = board[r][f];
                  const hidden = hiddenSquares ? !hiddenSquares.has(sq) : false;
                  const mark = squareMarks[sq];
                  const isLast =
                    prefs.lastMove &&
                    (lastMove?.from === sq || lastMove?.to === sq);
                  const isLegal = legalMoves.has(sq) && !hidden;
                  const isCapture = isLegal && Boolean(piece);
                  const isHiding = hidingSquares.has(sq);
                  const isJustMoved = justMovedSq === sq;
                  const isJustCaptured = justCapturedSq === sq;

                  return (
                    <button
                      key={sq}
                      className={`matiks-square square ${(r + f) % 2 ? "dark" : "light"} ${
                        selectedSquare === sq ? "selected" : ""
                      } ${isLast ? "last-move last" : ""} ${
                        checkSquare === sq ? "in-check check" : ""
                      } ${hidden ? "fogged" : ""} ${isHiding ? "hiding-piece" : ""} ${
                        isJustMoved ? "just-moved" : ""
                      } ${isJustCaptured ? "just-captured" : ""} ${mark?.className || ""}`}
                      aria-label={`${sq}, ${
                        hidden
                          ? "hidden by fog"
                          : piece
                            ? `${piece.color === "w" ? "White" : "Black"} ${piece.type}`
                            : "empty"
                      }`}
                      onClick={() => !hidden && onSquareClick(sq)}
                      onKeyDown={(e) => {
                        const shifts: Record<string, number> = {
                          ArrowRight: 1,
                          ArrowLeft: -1,
                          ArrowDown: 8,
                          ArrowUp: -8,
                        };
                        if (e.key in shifts) {
                          e.preventDefault();
                          const nodes = Array.from(
                            e.currentTarget.parentElement!.querySelectorAll("button"),
                          );
                          const i = nodes.indexOf(e.currentTarget);
                          nodes[
                            Math.max(0, Math.min(63, i + shifts[e.key]))
                          ]?.focus();
                        }
                      }}
                    >
                      {/* Coordinates matching 15-mode-classic.svg */}
                      {prefs.coordinates && f === 0 && (
                        <small aria-hidden="true" className="rank coord-rank">
                          {rank}
                        </small>
                      )}
                      {prefs.coordinates && r === 7 && (
                        <small aria-hidden="true" className="file coord-file">
                          {file}
                        </small>
                      )}

                      {/* Vector Piece */}
                      {piece && !hidden && (
                        <div className="piece-wrapper" aria-hidden="true">
                          <MatiksPiece type={piece.type} color={piece.color} />
                        </div>
                      )}

                      {/* Move Destination Markers matching design spec */}
                      {prefs.legalDots && isLegal && (
                        isCapture ? (
                          <span className="matiks-capture-ring" aria-hidden="true" />
                        ) : (
                          <i className="matiks-move-dot move-dot" aria-hidden="true" />
                        )
                      )}

                      {mark?.icon && (
                        <span
                          aria-hidden="true"
                          className={`effect ${mark.className || ""}`}
                        >
                          {mark.icon}
                        </span>
                      )}
                    </button>
                  );
                }),
              )}

              {/* Smooth Vector Piece Glide Layer Overlay */}
              <PieceGlideLayer
                glides={glides}
                batch={batch}
                render={(p) => ({
                  text: (
                    <div className="piece-wrapper" aria-hidden="true">
                      <MatiksPiece type={p.role} color={p.color === "white" ? "w" : "b"} />
                    </div>
                  ),
                })}
              />
            </div>

            {/* Main Screen In-Place Overlay (Maths Duel / Mind Gate) */}
            {boardOverlay && (
              <div
                className="absolute inset-0 z-30 bg-[#0E0E0E]/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
              >
                {boardOverlay}
              </div>
            )}

            {/* Game Over Modal */}
            {winner && (
              <div
                className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                role="dialog"
                aria-modal="true"
              >
                <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                  <span className="font-body text-[11px] font-semibold tracking-[2px] text-[#AFF65B] uppercase block mb-1">
                    GAME OVER
                  </span>
                  <h2 className="font-heading text-3xl tracking-wide text-[#F4F4F4] mb-3">
                    {resultTitle ||
                      (winner === "w" ? "VICTORY · YOU WON" : "DEFEAT · BOT WINS")}
                  </h2>
                  <p className="text-sm text-[#8A8A8A] mb-6">
                    {winner === "w"
                      ? "Flawlessly executed. A fine performance on the board."
                      : "A challenging match. Review the positions and try again!"}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      className="btn-lime py-3 px-6 text-sm"
                      onClick={onNewGame}
                    >
                      Play Again
                    </button>
                    <button
                      className="btn-raised py-3 px-6 text-sm"
                      onClick={onExit}
                    >
                      Exit to Modes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Player (White) Line */}
          <div className={`w-full max-w-[640px] flex items-center justify-between px-4 py-2.5 rounded-b-xl transition-colors ${
            playerActive ? "bg-[#1F1F1F] border-t border-[#AFF65B]/40" : "bg-[#161616]"
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FAFAFA] text-[#0E0E0E] flex items-center justify-center text-sm font-heading font-bold">
                ○
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-base tracking-wide text-[#F4F4F4]">You</span>
                  {playerActive && (
                    <span className="w-2 h-2 rounded-full bg-[#AFF65B] animate-pulse" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8A8A8A]">
                  <span>{playerActive ? "Your turn" : "Waiting"}</span>
                  {capturedByWhite.length > 0 && (
                    <>
                      <span>·</span>
                      <CapturedRow pieces={capturedByWhite} color="b" />
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {playerClock && (
                <span className={`font-mono text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                  playerActive
                    ? "bg-[#262626] border-[#AFF65B]/40 text-[#AFF65B] shadow-sm"
                    : "bg-[#262626] border-white/5 text-[#F4F4F4]"
                }`}>
                  {playerClock}
                </span>
              )}
              {materialAdvantage > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-[#AFF65B]">
                  +{ materialAdvantage }
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Sidebar Controls Column matching 15-mode-classic.svg */}
        <aside className="lg:col-span-4 flex flex-col gap-5 w-full [&_.court-panel]:bg-[#1A1A1A] [&_.court-panel]:border [&_.court-panel]:border-white/5 [&_.court-panel]:rounded-2xl [&_.court-panel]:p-5 [&_.eyebrow]:text-[10px] [&_.eyebrow]:tracking-[2px] [&_.eyebrow]:text-[#AFF65B] [&_.eyebrow]:font-semibold [&_.eyebrow]:uppercase">
          {sidePanels}

          {/* Mode Bento Card */}
          <div className="bento-card bento-yellow p-6 flex flex-col justify-between min-h-[120px]">
            <div>
              <span className="font-heading text-3xl tracking-wide text-[#0E0E0E] block leading-none">
                {title.toUpperCase()}
              </span>
              <p className="text-xs font-body text-[#0E0E0E]/80 mt-1 mb-0">
                {eyebrow}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#0E0E0E] text-[#F2D500]">
                ACTIVE MATCH
              </span>
            </div>
          </div>

          {/* Engine & Captured Stats Card */}
          <div className="bento-card bento-charcoal p-6 flex flex-col gap-4">
            <div>
              <span className="matiks-kicker text-[10px] block mb-1">
                BOT STRENGTH
              </span>
              <div className="flex items-center justify-between">
                <span className="font-body text-sm font-semibold text-[#F4F4F4]">
                  Engine target: {botElo !== undefined ? botElo : 1100}
                </span>
                <span className="text-xs text-[#8A8A8A]">
                  {isBotThinking ? "Evaluating..." : "Idle"}
                </span>
              </div>
              <div className="w-full bg-[#262626] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#AFF65B] h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(10, ((botElo || 1100) / 2000) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <span className="matiks-kicker text-[10px] block mb-1">
                MATERIAL STATUS
              </span>
              <p className="text-xs text-[#8A8A8A] m-0">
                {materialAdvantage === 0
                  ? "Material balance is level."
                  : materialAdvantage > 0
                    ? `You have a +${materialAdvantage} piece advantage.`
                    : `Bot has a +${-materialAdvantage} piece advantage.`}
              </p>
            </div>
          </div>

          {/* Action Buttons Row matching 15-mode-classic.svg */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={onNewGame}
              className="bg-[#262626] hover:bg-[#333333] border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
              title="Start a new game"
            >
              <img src="/icons/plus.svg" alt="" className="w-5 h-5 opacity-90" />
              <span className="text-[9px] font-semibold tracking-wider text-[#8A8A8A] uppercase">
                NEW GAME
              </span>
            </button>

            {tools ? (
              <div className="contents [&>button]:bg-[#262626] [&>button]:hover:bg-[#333333] [&>button]:border [&>button]:border-white/5 [&>button]:rounded-2xl [&>button]:p-3 [&>button]:flex [&>button]:flex-col [&>button]:items-center [&>button]:justify-center [&>button]:gap-1.5 [&>button]:cursor-pointer [&>button]:transition-colors [&>button]:text-[9px] [&>button]:font-semibold [&>button]:tracking-wider [&>button]:text-[#8A8A8A] [&>button]:uppercase">
                {tools}
              </div>
            ) : (
              <button
                onClick={() => {
                  /* Undo action if available */
                }}
                className="bg-[#262626] hover:bg-[#333333] border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors opacity-75"
                title="Take back last move"
              >
                <img src="/icons/undo.svg" alt="" className="w-5 h-5 opacity-90" />
                <span className="text-[9px] font-semibold tracking-wider text-[#8A8A8A] uppercase">
                  TAKEBACK
                </span>
              </button>
            )}

            <button
              onClick={() => {
                if (window.confirm("Resign and exit this game?")) onExit();
              }}
              className="bg-[#262626] hover:bg-[#3a1d1d] border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
              title="Resign game"
            >
              <img src="/icons/flag.svg" alt="" className="w-5 h-5 opacity-90" />
              <span className="text-[9px] font-semibold tracking-wider text-[#8A8A8A] uppercase">
                RESIGN
              </span>
            </button>

            <button
              onClick={open}
              className="bg-[#262626] hover:bg-[#333333] border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
              title="Open preferences"
            >
              <img src="/icons/gear.svg" alt="" className="w-5 h-5 opacity-90" />
              <span className="text-[9px] font-semibold tracking-wider text-[#8A8A8A] uppercase">
                SETTINGS
              </span>
            </button>
          </div>

          {/* Turn Status Action Pill */}
          <div
            className={`w-full py-4 rounded-full flex items-center justify-center font-heading text-lg tracking-wider transition-colors ${
              playerActive
                ? "bg-[#AFF65B] text-[#0E0E0E] shadow-lg shadow-[#AFF65B]/20"
                : isBotThinking
                  ? "bg-[#262626] text-[#AFF65B] border border-[#AFF65B]/30"
                  : "bg-[#1A1A1A] text-[#8A8A8A]"
            }`}
          >
            {playerActive ? "YOUR MOVE" : isBotThinking ? "ENGINE THINKING..." : "WAITING FOR MOVE"}
          </div>

          {/* Move History Log */}
          <div className="bento-card bento-charcoal p-5 max-h-[220px] flex flex-col">
            <span className="matiks-kicker text-[10px] block mb-2">
              MOVE HISTORY
            </span>
            <div className="overflow-y-auto space-y-1 text-xs pr-1 flex-1">
              {pairs.length === 0 ? (
                <span className="text-[#8A8A8A] italic">No moves yet. Make your opening move.</span>
              ) : (
                pairs.map((p) => (
                  <div key={p.num} className="flex items-center justify-between py-0.5 border-b border-white/5">
                    <span className="text-[#8A8A8A] w-6 font-mono">{p.num}.</span>
                    <span className="font-semibold text-[#F4F4F4] flex-1">{p.white}</span>
                    <span className="font-semibold text-[#8A8A8A] flex-1">{p.black || ""}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {overlays}
    </div>
  );
}
