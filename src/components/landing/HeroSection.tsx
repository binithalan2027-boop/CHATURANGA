import { useState } from 'react';

interface HeroSectionProps {
  onPlay: () => void;
  onSearchMatch: () => void;
  onCancelMatch: () => void;
  matchStatus: 'idle' | 'searching' | 'found';
  onOpenFriendsSanctum?: () => void;
  onCreatePrivateRoom?: () => void;
}

export default function HeroSection({
  onPlay,
  onSearchMatch,
  onCancelMatch,
  matchStatus,
  onOpenFriendsSanctum,
  onCreatePrivateRoom,
}: HeroSectionProps) {
  const [timeControl, setTimeControl] = useState('10');

  const handleMatchmaking = () => {
    if (matchStatus === 'idle') {
      onSearchMatch();
    } else if (matchStatus === 'searching') {
      onCancelMatch();
    }
  };

  let matchBtnText = 'FIND ONLINE MATCH';
  if (matchStatus === 'searching') matchBtnText = 'SEARCHING COMBATANTS...';
  if (matchStatus === 'found') matchBtnText = 'OPPONENT FOUND! ENTERING ARENA...';

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
      {/* Kicker */}
      <div className="matiks-kicker mb-3">EVERY CHESS VARIANT. ONE PLACE.</div>

      {/* Main Grid: Headline Left, Large Yellow Hero Bento Tile Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Huge Headline & Actions */}
        <div className="lg:col-span-7 flex flex-col items-start">
          <h1 className="matiks-headline text-6xl sm:text-7xl lg:text-8xl text-[#F4F4F4] leading-[0.92] tracking-tight select-none">
            CHESS, <br />
            <span className="text-[#AFF65B]">REIMAGINED.</span>
          </h1>

          <p className="font-body text-base sm:text-lg text-[#8A8A8A] max-w-xl mt-6 leading-relaxed">
            Classic, Chess960, Fog of War, Atomic and Chess MM. Challenge Stockfish bots offline or duel friends in private rooms. 100% free, no login required.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-8 w-full sm:w-auto">
            <button
              onClick={onPlay}
              className="btn-lime text-base py-3.5 sm:py-4 px-6 sm:px-8 uppercase font-semibold tracking-wider shadow-xl text-center"
            >
              Play a Bot Free
            </button>
            <a
              href="#modes-section"
              className="btn-raised text-base py-3.5 sm:py-4 px-6 sm:px-8 uppercase font-semibold tracking-wider no-underline text-center"
            >
              Explore Modes
            </a>
          </div>

          {/* Quick specs / trust points */}
          <div className="flex flex-wrap items-center gap-6 mt-8 pt-6 border-t border-white/5 text-xs font-body text-[#8A8A8A]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#AFF65B]" />
              <span>STOCKFISH WASM v16</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#66D4C2]" />
              <span>5 ZERO-LATENCY MODES</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F07040]" />
              <span>LOCAL STAMPS & STATS</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Yellow Bento Tile */}
        <div className="lg:col-span-5">
          <div className="bento-card bento-yellow p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative min-h-[380px] bg-dot-matrix">
            {/* Top pill inside card */}
            <div className="flex items-center justify-between z-10">
              <span className="bg-[#0E0E0E] text-[#AFF65B] font-body text-[11px] font-semibold tracking-wider px-3 py-1 rounded-full uppercase">
                FREE TO PLAY
              </span>
              <span className="font-heading text-lg text-[#0E0E0E] tracking-wider">
                CHAMBER 01
              </span>
            </div>

            {/* Illustration */}
            <div className="my-6 flex items-center justify-center z-10">
              <img
                src="/illustrations/knight.svg"
                alt="Chaturanga Knight"
                className="w-40 h-40 sm:w-48 sm:h-48 object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
              />
            </div>

            {/* Card Content & Matchmaker */}
            <div className="z-10 bg-[#0E0E0E]/90 backdrop-blur-md rounded-2xl p-4 border border-black/10">
              <div className="flex items-center justify-between mb-3 text-xs font-body text-[#F4F4F4]">
                <span className="font-semibold uppercase tracking-wider">Time Control</span>
                <span className="text-[#AFF65B] font-mono">{timeControl} Min Rapid</span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                {['1', '3', '5', '10'].map((time) => (
                  <button
                    key={time}
                    onClick={() => setTimeControl(time)}
                    className={`py-1.5 rounded-lg font-heading text-sm border-none cursor-pointer transition-all ${
                      timeControl === time
                        ? 'bg-[#AFF65B] text-[#0E0E0E] font-bold'
                        : 'bg-[#262626] text-[#F4F4F4] hover:bg-[#333333]'
                    }`}
                  >
                    {time}M
                  </button>
                ))}
              </div>

              <button
                onClick={handleMatchmaking}
                className={`w-full py-3 rounded-xl font-heading text-lg uppercase tracking-wider border-none cursor-pointer transition-all ${
                  matchStatus !== 'idle'
                    ? 'bg-[#262626] text-[#AFF65B] animate-pulse'
                    : 'bg-[#F4F4F4] text-[#0E0E0E] hover:bg-white shadow-md'
                }`}
              >
                {matchBtnText}
              </button>

              {(onCreatePrivateRoom || onOpenFriendsSanctum) && (
                <button
                  onClick={onCreatePrivateRoom ?? onOpenFriendsSanctum}
                  className="w-full text-center text-[11px] font-body text-[#8A8A8A] hover:text-[#AFF65B] mt-2 bg-transparent border-none cursor-pointer"
                >
                  Create Private Room for a Friend →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
