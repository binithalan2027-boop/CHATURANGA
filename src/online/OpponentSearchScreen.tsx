import { useEffect, useState } from "react";
import MatiksPiece from "../components/MatiksPiece";

interface OpponentSearchScreenProps {
  modeName: string;
  timeMinutes: number;
  incrementSeconds?: number;
  playerRating: number;
  onCancel: () => void;
  onPlayBot?: () => void;
  isMatchFound?: boolean;
}

export default function OpponentSearchScreen({
  modeName,
  timeMinutes,
  incrementSeconds = 0,
  playerRating,
  onCancel,
  onPlayBot,
  isMatchFound = false,
}: OpponentSearchScreenProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

  const timeLabel = `${timeMinutes} MIN${incrementSeconds > 0 ? ` + ${incrementSeconds}S` : ""}`;

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0E0E0E] text-[#F4F4F4] flex flex-col justify-between p-6 sm:p-10 select-none overflow-y-auto transition-all duration-300 ${
        isMatchFound ? "bg-[#182a14]" : ""
      }`}
      style={{
        backgroundImage: `radial-gradient(rgba(217,213,199,0.045) 1px, transparent 1px)`,
        backgroundSize: "72px 72px",
      }}
    >
      {/* Top Wordmark */}
      <header className="flex flex-col items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center text-[#AFF65B]">
            <MatiksPiece type="n" color="w" />
          </div>
          <span className="font-heading text-2xl tracking-[5px] text-[#F4F4F4] uppercase">
            CHATURANGA
          </span>
        </div>
        <span className="matiks-kicker text-xs tracking-widest text-[#AFF65B] mt-1 uppercase">
          SEARCHING FOR OPPONENT
        </span>
      </header>

      {/* Main Radar Arena (Responsive Phone + Desktop Card) */}
      <main className="flex-1 flex items-center justify-center my-6">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Radar Visual Area */}
          <div className="md:col-span-7 flex flex-col items-center justify-center">
            <div className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] flex items-center justify-center">
              {/* Ring 3 (Outer) */}
              <div
                className="absolute inset-0 rounded-full border border-white/20 animate-pulse"
                style={{ animationDuration: "3s" }}
              />

              {/* Ring 2 (Middle) */}
              <div
                className="absolute inset-[32px] sm:inset-[42px] rounded-full border border-white/15"
              />

              {/* Ring 1 (Inner) */}
              <div
                className="absolute inset-[64px] sm:inset-[84px] rounded-full border border-white/10"
              />

              {/* Conic Sweep Wedge (~90deg rotating 2.4s linear infinite) */}
              <div
                className={`absolute inset-0 rounded-full pointer-events-none transition-opacity ${
                  isMatchFound ? "opacity-0" : "opacity-100"
                }`}
                style={{
                  background:
                    "conic-gradient(from 0deg, rgba(175,246,91,0.35) 0deg, rgba(175,246,91,0.05) 75deg, transparent 90deg)",
                  animation: "radar-sweep 2.4s linear infinite",
                }}
              />

              {/* Satellite Dots on Rings */}
              {/* Satellite 1: Lime */}
              <div
                className="absolute w-3 h-3 rounded-full bg-[#AFF65B] shadow-[0_0_10px_#AFF65B]"
                style={{ top: "18%", right: "22%" }}
              />
              {/* Satellite 2: Yellow */}
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-[#F2D500] shadow-[0_0_8px_#F2D500]"
                style={{ bottom: "24%", left: "19%" }}
              />
              {/* Satellite 3: Teal */}
              <div
                className="absolute w-2 h-2 rounded-full bg-[#66D4C2] shadow-[0_0_6px_#66D4C2]"
                style={{ top: "45%", left: "10%" }}
              />

              {/* Center Disc (118px #161616 with lime Knight) */}
              <div
                className={`relative z-10 w-[100px] h-[100px] sm:w-[118px] sm:h-[118px] rounded-full bg-[#161616] border-2 border-[#AFF65B]/40 flex items-center justify-center transition-all duration-300 ${
                  isMatchFound
                    ? "scale-125 border-[#AFF65B] shadow-[0_0_60px_rgba(175,246,91,0.8)]"
                    : "shadow-[0_0_44px_rgba(175,246,91,0.22)]"
                }`}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 text-[#AFF65B] filter drop-shadow-[0_0_12px_rgba(175,246,91,0.6)]">
                  <MatiksPiece type="n" color="w" />
                </div>
              </div>
            </div>

            {/* Mobile-only details shown directly under radar */}
            <div className="flex md:hidden flex-col items-center mt-6 space-y-3 text-center">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#262626] text-white font-body text-xs font-bold uppercase tracking-wider border border-white/10">
                  {modeName}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#262626] text-[#AFF65B] font-body text-xs font-bold uppercase tracking-wider border border-[#AFF65B]/30">
                  {timeLabel}
                </span>
              </div>
              <div className="font-heading text-6xl text-white tracking-wider">
                {timeFormatted}
              </div>
              <p className="text-xs text-[#8A8A8A] font-body m-0">
                Matching near your rating ({playerRating})
              </p>
            </div>
          </div>

          {/* Desktop Right Column: Info & Action Table */}
          <div className="hidden md:flex md:col-span-5 flex-col justify-between space-y-6 bg-[#1A1A1A] p-8 rounded-3xl border border-white/10 shadow-2xl">
            <div>
              <div className="matiks-kicker text-[#AFF65B] mb-1">GLOBAL MATCHMAKING</div>
              <h2 className="font-heading text-5xl leading-none text-white tracking-wide uppercase m-0 mb-4">
                FINDING YOUR NEXT RIVAL.
              </h2>
              <p className="text-xs text-[#8A8A8A] font-body m-0 leading-relaxed">
                Scanning the global queue for live players near your skill rating. As soon as an opponent is found, the board will open automatically.
              </p>
            </div>

            {/* Fact Table with Hairline Dividers */}
            <div className="border-t border-b border-white/10 divide-y divide-white/10 font-body text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-[#8A8A8A]">Game Mode</span>
                <span className="font-bold text-white uppercase">{modeName}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#8A8A8A]">Time Control</span>
                <span className="font-bold text-[#AFF65B]">{timeLabel}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#8A8A8A]">Target Rating</span>
                <span className="font-bold text-white">~{playerRating} ELO</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#8A8A8A]">Elapsed Time</span>
                <span className="font-heading text-2xl leading-none text-[#AFF65B] tracking-wider">
                  {timeFormatted}
                </span>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-3.5 bg-[#262626] hover:bg-[#333] text-white font-body text-xs font-bold uppercase tracking-wider rounded-xl border border-white/10 cursor-pointer transition-all active:scale-95 shadow-md"
              >
                Cancel Search
              </button>
              {onPlayBot && (
                <button
                  type="button"
                  onClick={onPlayBot}
                  className="w-full py-3 bg-transparent hover:bg-[#AFF65B]/10 text-[#AFF65B] font-body text-xs font-bold uppercase tracking-wider rounded-xl border border-[#AFF65B]/40 cursor-pointer transition-all"
                >
                  Play a Bot While You Wait →
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer (Mobile Controls & Tips) */}
      <footer className="w-full max-w-sm mx-auto flex flex-col items-center space-y-3 md:hidden">
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-3.5 bg-[#262626] hover:bg-[#333] text-white font-body text-xs font-bold uppercase tracking-wider rounded-xl border border-white/10 cursor-pointer transition-all active:scale-95 shadow-md"
        >
          Cancel Search
        </button>
        {onPlayBot && (
          <button
            type="button"
            onClick={onPlayBot}
            className="text-xs text-[#AFF65B] font-body underline cursor-pointer bg-transparent border-0 p-1"
          >
            Play a bot while you wait
          </button>
        )}
        <p className="text-[11px] text-[#666] font-body italic text-center m-0">
          Tip: Solve tactics drills or review past mistakes while waiting for a match.
        </p>
      </footer>

      {/* Keyframe animation for radar sweep in CSS */}
      <style>{`
        @keyframes radar-sweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
