interface ModesSectionProps {
  onPlayMode?: (mode: string) => void;
}

export default function ModesSection({ onPlayMode }: ModesSectionProps) {
  const modes = [
    {
      id: 'fog',
      name: 'FOG OF WAR',
      tagline: 'See only what you can reach',
      color: 'bento-lavender',
      bgHex: '#A594F0',
      illustration: '/illustrations/fog.svg',
      desc: 'The squares outside your pieces\' legal moves are cloaked in mystery.',
    },
    {
      id: 'chess960',
      name: 'CHESS960',
      tagline: 'Shuffled back rank, fresh every game',
      color: 'bento-teal',
      bgHex: '#66D4C2',
      illustration: '/illustrations/dice.svg',
      desc: 'Fischer random setup prevents memorized opening books.',
    },
    {
      id: 'atomic',
      name: 'ATOMIC CHESS',
      tagline: 'Captures cause violent 3x3 explosions',
      color: 'bento-coral',
      bgHex: '#F07040',
      illustration: '/illustrations/burst.svg',
      desc: 'Detonations destroy both pieces and surrounding non-pawns.',
    },
    {
      id: 'math',
      name: 'CHESS MM',
      tagline: 'Mental math showdowns & spell powers',
      color: 'bento-charcoal',
      bgHex: '#1A1A1A',
      illustration: '/illustrations/pi.svg',
      desc: 'Solve rapid math equations to make moves and unleash Freeze & Jump spells.',
    },
    {
      id: 'cross3',
      name: '3-PLAYER CROSS',
      tagline: 'North runway · King capture elimination',
      color: 'bento-yellow',
      bgHex: '#F2D500',
      illustration: '/illustrations/king.svg',
      desc: 'Three armies clash on a 14x14 cross-grid with an open North runway. Capture kings to eliminate rivals.',
    },
    {
      id: 'cross4',
      name: '4-PLAYER CROSS',
      tagline: 'Four-way free-for-all tactical war',
      color: 'bento-coral',
      bgHex: '#F07040',
      illustration: '/illustrations/shield.svg',
      desc: 'Four monarchs enter the cross arena from South, West, North, and East. Last army standing takes the crown.',
    },
  ];

  return (
    <div id="modes-section" className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Section Header */}
      <div className="flex flex-col items-start mb-8">
        <div className="matiks-kicker mb-1">FEATURED COMBAT MODES</div>
        <h2 className="matiks-headline text-4xl sm:text-5xl text-[#F4F4F4]">
          SEVEN WAYS TO PLAY
        </h2>
        <p className="font-body text-sm text-[#8A8A8A] mt-1 max-w-xl">
          From pure tactical calculation and mental math to explosive atomic blasts and 3 &amp; 4-player cross-board battles.
        </p>
      </div>

      {/* 6 Bento Mode Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modes.map((mode) => (
          <div
            key={mode.id}
            onClick={() => onPlayMode?.(mode.id)}
            className={`bento-card ${mode.color} p-6 sm:p-7 flex flex-col justify-between min-h-[230px] cursor-pointer shadow-xl relative overflow-hidden transition-transform hover:-translate-y-1`}
            style={{ backgroundColor: mode.bgHex }}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    className="matiks-headline text-2xl sm:text-3xl leading-none"
                    style={{ color: mode.id === 'math' ? '#F4F4F4' : '#0E0E0E' }}
                  >
                    {mode.name}
                  </h3>
                  <div
                    className="font-body text-[11px] font-semibold mt-1"
                    style={{ color: mode.id === 'math' ? '#AFF65B' : '#0E0E0E' }}
                  >
                    {mode.tagline}
                  </div>
                </div>

                <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                  <img
                    src={mode.illustration}
                    alt={mode.name}
                    className="w-full h-full object-contain filter drop-shadow-md"
                  />
                </div>
              </div>

              <p
                className="font-body text-xs mt-3 max-w-sm leading-relaxed"
                style={{ color: mode.id === 'math' ? '#8A8A8A' : '#0E0E0E' }}
              >
                {mode.desc}
              </p>
            </div>

            <div className="flex items-center justify-end mt-4">
              <button
                className={`btn-raised text-xs py-2 px-5 font-semibold uppercase tracking-wider rounded-full ${
                  mode.id === 'math'
                    ? 'btn-lime'
                    : 'bg-[#0E0E0E] text-[#F4F4F4] hover:bg-black'
                }`}
              >
                Play Mode →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Self-Hosted Original Pattern Banner (replacing transparenttextures.com) */}
      <div className="mt-16 rounded-3xl bg-[#1A1A1A] border border-white/5 p-8 sm:p-12 relative overflow-hidden bg-diagonal-stripes">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 flex flex-col items-start">
            <span className="matiks-kicker mb-2">COLLECTIBLE REWARDS</span>
            <h3 className="matiks-headline text-3xl sm:text-5xl text-[#F4F4F4]">
              POSTAGE-STAMP ACHIEVEMENTS
            </h3>
            <p className="font-body text-sm text-[#8A8A8A] max-w-lg mt-2 leading-relaxed">
              Earn vintage perforated stamps with custom vector illustrations as you conquer bots, achieve tactical checkmates, and win mental math duels.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <span className="text-xs font-mono text-[#AFF65B] bg-[#262626] px-3 py-1.5 rounded-full border border-white/5">
                49 COLLECTIBLE STAMPS
              </span>
              <span className="text-xs font-mono text-[#F4F4F4]/70 bg-[#262626] px-3 py-1.5 rounded-full border border-white/5">
                SAVED DEVICE-LOCALLY
              </span>
            </div>
          </div>

          <div className="md:col-span-4 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-3 rotate-2">
              <img
                src="/stamps/first-win-unlocked.svg"
                alt="First Win"
                className="w-24 h-32 object-contain drop-shadow-xl"
              />
              <img
                src="/stamps/speed-duel-win-unlocked.svg"
                alt="Speed Duel"
                className="w-24 h-32 object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
