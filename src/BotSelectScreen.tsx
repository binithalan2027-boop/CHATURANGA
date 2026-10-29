import { useState } from 'react';

export interface BotSelectScreenProps {
  onStart: (elo: number, timeMinutes: number, gameMode: string, subMode?: 'showdown' | 'gate') => void;
  onBack: () => void;
  initialTimeMinutes?: number;
  onPlayOnline?: () => void;
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
    name: 'STANDARD CHESS',
    subtitle: 'Classic FIDE rules',
    desc: 'Pure calculation, classic FIDE rules, 64 squares, zero gimmicks.',
    colorClass: 'bento-yellow',
    bgHex: '#F2D500',
    textColor: '#0E0E0E',
    illustration: '/illustrations/king.svg',
  },
  {
    id: 'math',
    name: 'CHESS MM',
    subtitle: 'Mental math & spells',
    desc: 'Mental arithmetic mind gate + speed duel power-up showdowns.',
    colorClass: 'bento-charcoal',
    bgHex: '#1A1A1A',
    textColor: '#F4F4F4',
    illustration: '/illustrations/pi.svg',
  },
  {
    id: 'fog',
    name: 'FOG OF WAR',
    subtitle: 'Hidden piece vision',
    desc: 'See only the squares your pieces can physically reach. Take the king to win.',
    colorClass: 'bento-lavender',
    bgHex: '#A594F0',
    textColor: '#0E0E0E',
    illustration: '/illustrations/fog.svg',
  },
  {
    id: 'atomic',
    name: 'ATOMIC CHESS',
    subtitle: '3x3 Explosive blast',
    desc: 'Captures trigger devastating 3x3 blast detonations destroying adjacent pieces.',
    colorClass: 'bento-coral',
    bgHex: '#F07040',
    textColor: '#0E0E0E',
    illustration: '/illustrations/burst.svg',
  },
  {
    id: 'cross3',
    name: '3-PLAYER CROSS-BOARD',
    subtitle: '3-Army tactical battle',
    desc: 'Three armies clash on a 14x14 cross-grid with an open North runway. King-capture elimination.',
    colorClass: 'bento-teal',
    bgHex: '#66D4C2',
    textColor: '#0E0E0E',
    illustration: '/illustrations/rook.svg',
  },
  {
    id: 'cross4',
    name: '4-PLAYER CROSS-BOARD',
    subtitle: '4-Way free-for-all',
    desc: 'Four monarchs enter the cross arena from South, West, North, and East. Last army standing takes the crown.',
    colorClass: 'bento-coral',
    bgHex: '#F07040',
    textColor: '#0E0E0E',
    illustration: '/illustrations/shield.svg',
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

export default function BotSelectScreen({ onStart, onBack, initialTimeMinutes = 10, onPlayOnline }: BotSelectScreenProps) {
  const [selectedMode, setSelectedMode] = useState<string>('standard');
  const [elo, setElo] = useState<number>(1850);
  const [timeMinutes, setTimeMinutes] = useState<number>(initialTimeMinutes);
  const [mathFormat, setMathFormat] = useState<'showdown' | 'gate'>('showdown');

  const currentBot = BOTS.reduce((prev, curr) => 
    Math.abs(curr.elo - elo) < Math.abs(prev.elo - elo) ? curr : prev
  );

  const handleCommence = () => {
    onStart(elo, timeMinutes, selectedMode, selectedMode === 'math' ? mathFormat : undefined);
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
            Pick from 6 official active modes. All rules execute purely client-side via Stockfish WASM.
          </p>

          {/* Mode Type & Online Link */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#AFF65B] shadow-[0_0_8px_#AFF65B]" />
              <span className="font-mono text-xs text-[#AFF65B] font-bold uppercase tracking-wider">
                6 Offline-Ready Bot Modes
              </span>
            </div>
            {onPlayOnline && (
              <button
                type="button"
                onClick={onPlayOnline}
                className="text-xs font-semibold text-[#8A8A8A] hover:text-[#AFF65B] bg-[#1A1A1A] hover:bg-[#222] border border-white/10 px-3.5 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Looking for human duels? Play Online PvP</span>
                <span>→</span>
              </button>
            )}
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

              {/* Chess MM Format Selector (Prior to Game) */}
              {selectedMode === 'math' && (
                <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-[11px] font-semibold text-[#AFF65B] uppercase tracking-wider">
                      CHESS MM FORMAT
                    </span>
                    <span className="text-[10px] text-[#8A8A8A] font-mono">
                      Selected prior to match
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMathFormat('showdown')}
                      className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                        mathFormat === 'showdown'
                          ? 'bg-[#AFF65B]/15 border-[#AFF65B] text-[#F4F4F4]'
                          : 'bg-[#1A1A1A] border-white/5 text-[#8A8A8A] hover:text-[#F4F4F4]'
                      }`}
                    >
                      <div className="font-heading text-xs text-[#F4F4F4] flex items-center justify-between mb-0.5">
                        <span>SPEED DUEL</span>
                        {mathFormat === 'showdown' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#AFF65B] animate-pulse" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#8A8A8A] m-0 leading-tight">
                        90s showdown duels with spell drops.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMathFormat('gate')}
                      className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                        mathFormat === 'gate'
                          ? 'bg-[#AFF65B]/15 border-[#AFF65B] text-[#F4F4F4]'
                          : 'bg-[#1A1A1A] border-white/5 text-[#8A8A8A] hover:text-[#F4F4F4]'
                      }`}
                    >
                      <div className="font-heading text-xs text-[#F4F4F4] flex items-center justify-between mb-0.5">
                        <span>MIND GATE</span>
                        {mathFormat === 'gate' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#AFF65B] animate-pulse" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#8A8A8A] m-0 leading-tight">
                        Solve quick mental math per move.
                      </p>
                    </button>
                  </div>
                </div>
              )}

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
