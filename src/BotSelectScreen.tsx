import { useState } from 'react';

export interface BotSelectScreenProps {
  onStart: (elo: number, timeMinutes: number, gameMode: string) => void;
  onBack: () => void;
}

interface GameModeOption {
  id: string;
  name: string;
  subtitle: string;
  desc: string;
  colorClass: string;
  bgHex: string;
  textColor: string;
  illustration: string;
}

const GAME_MODES: GameModeOption[] = [
  {
    id: 'standard',
    name: 'CLASSIC',
    subtitle: 'Standard chess',
    desc: 'Pure calculation, FIDE rules, 64 squares.',
    colorClass: 'bento-yellow',
    bgHex: '#F2D500',
    textColor: '#0E0E0E',
    illustration: '/illustrations/king.svg',
  },
  {
    id: 'chess960',
    name: 'CHESS960',
    subtitle: 'Randomised back rank',
    desc: 'Fischer 960 positions shuffled fresh every game.',
    colorClass: 'bento-lavender',
    bgHex: '#A594F0',
    textColor: '#0E0E0E',
    illustration: '/illustrations/dice.svg',
  },
  {
    id: 'fog',
    name: 'FOG OF WAR',
    subtitle: 'Limited visibility',
    desc: 'See only the squares your pieces can physically reach.',
    colorClass: 'bento-teal',
    bgHex: '#66D4C2',
    textColor: '#0E0E0E',
    illustration: '/illustrations/fog.svg',
  },
  {
    id: 'atomic',
    name: 'ATOMIC',
    subtitle: 'Captures explode',
    desc: 'Captures trigger devastating 3x3 blast detonations.',
    colorClass: 'bento-coral',
    bgHex: '#F07040',
    textColor: '#0E0E0E',
    illustration: '/illustrations/burst.svg',
  },
  {
    id: 'math',
    name: 'CHESS MM',
    subtitle: 'Maths and chess together',
    desc: 'Mental arithmetic mind gate + speed duel power-up showdowns.',
    colorClass: 'bento-charcoal',
    bgHex: '#1A1A1A',
    textColor: '#F4F4F4',
    illustration: '/illustrations/pi.svg',
  },
];

interface BotProfile {
  name: string;
  elo: number;
  tier: string;
  quote: string;
}

const BOTS: BotProfile[] = [
  { name: 'Apprentice Bot', elo: 600, tier: 'TIER 1', quote: 'Learning fundamental lines & simple captures.' },
  { name: 'Tactical Bot', elo: 1200, tier: 'TIER 2', quote: 'Calculates forks, pins, and pawn structure.' },
  { name: 'Master Bot', elo: 1850, tier: 'TIER 3', quote: 'Relentless strategic pressure & king attacks.' },
  { name: 'Grandmaster Bot', elo: 2400, tier: 'TIER 4', quote: 'Deep 20-ply search and positional sacrifices.' },
  { name: 'Stockfish Singular', elo: 3000, tier: 'MAX', quote: 'Inhuman calculation with near-zero blunders.' },
];

export default function BotSelectScreen({ onStart, onBack }: BotSelectScreenProps) {
  const [selectedMode, setSelectedMode] = useState<string>('standard');
  const [elo, setElo] = useState<number>(1850);
  const [timeMinutes, setTimeMinutes] = useState<number>(10);
  const [category, setCategory] = useState<'bots' | 'local' | 'online'>('bots');

  const currentBot = BOTS.reduce((prev, curr) => 
    Math.abs(curr.elo - elo) < Math.abs(prev.elo - elo) ? curr : prev
  );

  const handleCommence = () => {
    onStart(elo, timeMinutes, selectedMode);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#F4F4F4] pb-24 lg:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/5">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#8A8A8A] hover:text-[#AFF65B] font-body text-xs font-semibold uppercase tracking-widest bg-transparent border-none cursor-pointer transition-colors"
          >
            ← Return Home
          </button>
          <div className="hidden sm:block matiks-kicker">SELECT COMBAT MODE</div>
        </div>

        {/* Title & Filter Chips */}
        <div className="mt-8 mb-6">
          <div className="matiks-kicker mb-1">MODE PICKER • OFFLINE READY</div>
          <h1 className="matiks-headline text-4xl sm:text-6xl text-[#F4F4F4]">
            CHOOSE YOUR GAME
          </h1>
          <p className="font-body text-sm text-[#8A8A8A] mt-1 max-w-xl">
            Pick from 5 official modes. All rules execute purely client-side via Stockfish WASM.
          </p>

          {/* Mode Type Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setCategory('bots')}
              className={`chip-raised text-xs font-medium border-none cursor-pointer ${
                category === 'bots' ? 'bg-[#262626] text-[#AFF65B]' : 'bg-[#1A1A1A] text-[#8A8A8A]'
              }`}
            >
              Bots
            </button>
            <button
              onClick={() => setCategory('local')}
              className={`chip-raised text-xs font-medium border-none cursor-pointer ${
                category === 'local' ? 'bg-[#262626] text-[#AFF65B]' : 'bg-[#1A1A1A] text-[#8A8A8A]'
              }`}
            >
              Local Pass & Play
            </button>
            <button
              onClick={() => setCategory('online')}
              className={`chip-raised text-xs font-medium border-none cursor-pointer ${
                category === 'online' ? 'bg-[#262626] text-[#AFF65B]' : 'bg-[#1A1A1A] text-[#8A8A8A]'
              }`}
            >
              Online Duel
            </button>
          </div>
        </div>

        {/* 5-Mode Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {GAME_MODES.map((mode) => {
            const isSelected = selectedMode === mode.id;

            return (
              <div
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`bento-card ${mode.colorClass} p-6 flex flex-col justify-between min-h-[200px] cursor-pointer shadow-xl relative overflow-hidden transition-all ${
                  isSelected ? 'ring-4 ring-[#AFF65B] scale-[1.02]' : 'opacity-90 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: mode.bgHex,
                  color: mode.textColor,
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-2xl sm:text-3xl tracking-wide uppercase leading-none">
                      {mode.name}
                    </span>
                    {isSelected && (
                      <span className="bg-[#0E0E0E] text-[#AFF65B] text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="font-body text-xs font-semibold mt-1 opacity-90">
                    {mode.subtitle}
                  </div>
                  <p className="font-body text-xs mt-3 opacity-90 leading-relaxed max-w-xs">
                    {mode.desc}
                  </p>
                </div>

                <div className="flex items-end justify-between mt-6">
                  <div className="w-16 h-16 opacity-90 flex items-center justify-center">
                    <img
                      src={mode.illustration}
                      alt={mode.name}
                      className="w-full h-full object-contain filter"
                    />
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMode(mode.id);
                    }}
                    className={`btn-raised text-xs py-2 px-5 font-semibold uppercase tracking-wider rounded-full ${
                      isSelected
                        ? 'btn-lime text-[#0E0E0E]'
                        : 'bg-[#262626]/40 text-current hover:bg-[#262626]/70'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tactical Parameters Panel (Bot Strength, Time Control, Launch) */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl p-6 sm:p-8 mt-10 shadow-2xl">
          <div className="matiks-kicker mb-2">ENGAGEMENT SETUP</div>
          <h2 className="matiks-headline text-2xl sm:text-3xl text-[#F4F4F4] mb-6">
            BOT STRENGTH & TIME CONTROL
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* ELO Slider & Profile */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="font-heading text-lg text-[#F4F4F4] tracking-wide">
                    {currentBot.name}
                  </span>
                  <span className="text-[10px] font-mono text-[#AFF65B] ml-2 px-2 py-0.5 bg-[#262626] rounded">
                    {currentBot.tier}
                  </span>
                </div>
                <div className="font-heading text-3xl text-[#AFF65B]">
                  {elo} <span className="text-sm font-mono text-[#8A8A8A]">ELO</span>
                </div>
              </div>

              <input
                type="range"
                min="400"
                max="3000"
                step="50"
                value={elo}
                onChange={(e) => setElo(Number(e.target.value))}
                className="w-full h-2 bg-[#262626] rounded-lg appearance-none cursor-pointer accent-[#AFF65B]"
              />

              <div className="flex justify-between text-[10px] font-mono text-[#8A8A8A]">
                <span>400 (Novice)</span>
                <span>1500 (Intermediate)</span>
                <span>3000 (Grandmaster WASM)</span>
              </div>

              <p className="font-body text-xs text-[#8A8A8A] italic mt-1">
                "{currentBot.quote}"
              </p>
            </div>

            {/* Time Controls & Action Button */}
            <div className="lg:col-span-5 flex flex-col gap-4 bg-[#262626]/50 p-5 rounded-2xl border border-white/5">
              <span className="font-body text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider">
                Clock Preset
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { mins: 1, label: '1m', sub: 'Bullet' },
                  { mins: 3, label: '3m', sub: 'Blitz' },
                  { mins: 10, label: '10m', sub: 'Rapid' },
                  { mins: 30, label: '30m', sub: 'Classic' },
                ].map((t) => (
                  <button
                    key={t.mins}
                    onClick={() => setTimeMinutes(t.mins)}
                    className={`py-2 px-1 rounded-xl text-center border-none cursor-pointer transition-all ${
                      timeMinutes === t.mins
                        ? 'bg-[#AFF65B] text-[#0E0E0E] font-bold shadow-md'
                        : 'bg-[#1A1A1A] text-[#F4F4F4] hover:bg-[#333333]'
                    }`}
                  >
                    <div className="font-heading text-lg leading-none">{t.label}</div>
                    <div className="text-[9px] font-body opacity-80 mt-0.5">{t.sub}</div>
                  </button>
                ))}
              </div>

              {/* The ONE lime action button */}
              <button
                onClick={handleCommence}
                className="btn-lime w-full py-4 text-base font-semibold uppercase tracking-wider shadow-xl mt-2"
              >
                START BATTLE ({timeMinutes}M • {elo} ELO)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
