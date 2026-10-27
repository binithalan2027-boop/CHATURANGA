import { useState, useEffect, useMemo } from "react";
import MatiksCrossBoard from "../online/MatiksCrossBoard";
import {
  type CrossState,
  crossGame,
  crossMoves,
  crossPlay,
  crossTick,
} from "../online/crossRules";
import { unlockAchievement } from "../chaturanga/achievements";

export interface CrossBoardModeProps {
  count: 3 | 4;
  onExit: () => void;
  onPlayOnline?: (mode: "cross3" | "cross4") => void;
  timeMinutes?: number;
}

export default function CrossBoardMode({
  count,
  onExit,
  onPlayOnline,
  timeMinutes = 10,
}: CrossBoardModeProps) {
  const isThreePlayer = count === 3;
  const initialMs = timeMinutes * 60 * 1000;

  const [crossState, setCrossState] = useState<CrossState>(() =>
    crossGame(count, initialMs, Date.now())
  );
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [winnerMessage, setWinnerMessage] = useState<string | null>(null);

  const players = useMemo(() => {
    if (isThreePlayer) {
      return [
        { id: "south", name: "South (White)", seat: "south" },
        { id: "west", name: "West (Black)", seat: "west" },
        { id: "east", name: "East (Lavender)", seat: "east" },
      ];
    }
    return [
      { id: "south", name: "South (Coral)", seat: "south" },
      { id: "west", name: "West (Sky Blue)", seat: "west" },
      { id: "north", name: "North (Yellow)", seat: "north" },
      { id: "east", name: "East (Emerald)", seat: "east" },
    ];
  }, [isThreePlayer]);

  // Tick clock for current turn while match is active
  useEffect(() => {
    if (crossState.result) return;
    const interval = setInterval(() => {
      setCrossState((prev) => {
        if (prev.result) return prev;
        const ticked = crossTick(prev, Date.now());
        if (ticked.result && !prev.result) {
          setWinnerMessage(ticked.result);
          unlockAchievement("cross-win");
        }
        return ticked;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [crossState.result]);

  const legalDests = useMemo(() => {
    if (selectedSquare === null || crossState.result) return [];
    return crossMoves(crossState, selectedSquare);
  }, [crossState, selectedSquare]);

  const handleSquareClick = (sq: number) => {
    if (crossState.result) return;

    // Destination clicked
    if (selectedSquare !== null && legalDests.includes(sq)) {
      try {
        const next = crossPlay(crossState, selectedSquare, sq, Date.now());
        setSelectedSquare(null);
        setCrossState(next);

        if (next.result) {
          setWinnerMessage(next.result);
          unlockAchievement("cross-win");
        }
      } catch (err) {
        console.error("Illegal move:", err);
      }
      return;
    }

    // Piece clicked
    const piece = crossState.board[sq];
    if (piece && piece.seat === crossState.turn && !crossState.eliminated.includes(piece.seat)) {
      setSelectedSquare(sq);
      return;
    }

    setSelectedSquare(null);
  };

  const handleRestart = () => {
    setCrossState(crossGame(count, initialMs, Date.now()));
    setSelectedSquare(null);
    setWinnerMessage(null);
  };

  const turnLabel = crossState.turn.toUpperCase();

  return (
    <div className="w-full min-h-screen bg-[#0E0E0E] text-[#F4F4F4] flex flex-col font-sans select-none pb-12">
      {/* Top Header Bar */}
      <header className="px-4 py-3 bg-[#161616] border-b border-white/10 flex items-center justify-between flex-wrap gap-2 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="px-3 py-1.5 bg-[#242424] hover:bg-[#333] text-white text-xs font-semibold rounded-xl border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            ← Exit Match
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#AFF65B] animate-pulse" />
              <h1 className="m-0 text-sm font-bold tracking-wider uppercase text-white font-heading">
                {isThreePlayer ? "3-PLAYER CROSS-BOARD" : "4-PLAYER CROSS-BOARD"} · LOCAL PASS &amp; PLAY
              </h1>
            </div>
            <div className="text-[11px] text-[#888] mt-0.5">
              14x14 Courtyard battlefield · King capture eliminates army
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onPlayOnline && (
            <button
              type="button"
              onClick={() => onPlayOnline(isThreePlayer ? "cross3" : "cross4")}
              className="btn-lime py-1.5 px-3.5 text-xs font-bold rounded-xl cursor-pointer shadow transition-all active:scale-95"
            >
              Play Online Arena →
            </button>
          )}
          <button
            type="button"
            onClick={handleRestart}
            className="px-3 py-1.5 bg-[#242424] hover:bg-[#333] text-[#8A8A8A] hover:text-white text-xs font-semibold rounded-xl border border-white/10 cursor-pointer transition-all active:scale-95"
          >
            ↺ Restart
          </button>
        </div>
      </header>

      {/* Main Board Arena */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-2 sm:px-4 py-4 flex flex-col items-center justify-center">
        {/* Turn & Status Pill */}
        <div className="mb-3 flex items-center gap-3">
          <div className="py-1 px-4 rounded-full bg-[#1A1A1A] border border-white/10 text-xs font-semibold text-[#8A8A8A] flex items-center gap-2 shadow">
            <span>TURN:</span>
            <span className="text-[#AFF65B] font-bold font-mono tracking-wider">{turnLabel}</span>
          </div>
          {crossState.eliminated.length > 0 && (
            <div className="text-xs text-[#FF8080] font-mono font-semibold">
              Eliminated: {crossState.eliminated.join(", ").toUpperCase()}
            </div>
          )}
        </div>

        {/* Board */}
        <div className="w-full flex items-center justify-center">
          <MatiksCrossBoard
            cross={crossState}
            yourSeat={crossState.turn}
            selectedSquare={selectedSquare}
            legalDests={legalDests}
            onSquareClick={handleSquareClick}
            players={players}
            isThreePlayer={isThreePlayer}
          />
        </div>

        {/* Victory Celebration Modal */}
        {winnerMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-[#1A1A1A] border-2 border-[#AFF65B] rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden bg-diagonal-stripes">
              <span className="matiks-kicker text-xs text-[#AFF65B] uppercase block mb-2">
                MATCH COMPLETE
              </span>
              <h2 className="font-heading text-4xl sm:text-5xl text-white uppercase tracking-wider mb-2">
                VICTORY
              </h2>
              <p className="text-base font-semibold text-[#AFF65B] uppercase tracking-widest font-mono mb-4">
                {winnerMessage}
              </p>
              <p className="text-xs text-[#8A8A8A] font-body mb-6">
                The monarch stands victorious over the four corners of the courtyard!
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="btn-lime w-full sm:w-auto py-2.5 px-6 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow active:scale-95"
                >
                  Play Again
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="px-6 py-2.5 bg-[#262626] hover:bg-[#333] text-white text-xs font-semibold uppercase tracking-wider rounded-xl border border-white/10 cursor-pointer w-full sm:w-auto active:scale-95"
                >
                  Back to Hub
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}