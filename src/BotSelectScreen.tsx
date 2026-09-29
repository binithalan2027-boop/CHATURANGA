import { useState } from 'react';
import { getBotByElo } from './ai/useStockfish';

export interface BotSelectScreenProps {
  onStart: (elo: number, timeMinutes: number, gameMode: string) => void;
  onBack: () => void;
}

interface TimeOption {
  label: string;
  value: number;
}

const TIME_OPTIONS: TimeOption[] = [
  { label: '1 min', value: 1 },
  { label: '3 min', value: 3 },
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: 'No Limit', value: 0 },
];

const GAME_MODES = [
  { id: 'standard', icon: '⚔️', name: 'Ranked Classic', desc: 'True tactical combat' },
  { id: 'chess960', icon: '🔮', name: 'Fischer Chaos', desc: 'Randomized back rank' },
  { id: 'fog', icon: '🌑', name: 'Stealth Ambush', desc: 'Pitch-black visibility' },
  { id: 'atomic', icon: '☠️', name: 'Cursed Blast', desc: 'Explosive sacrifices' },
];

export default function BotSelectScreen({ onStart, onBack }: BotSelectScreenProps) {
  const [elo, setElo] = useState<number>(1300);
  const [selectedTime, setSelectedTime] = useState<number>(10);
  const [selectedMode, setSelectedMode] = useState<string>('standard');

  const bot = getBotByElo(elo);

  return (
    <div className="min-h-screen bg-void-black flex flex-col items-center py-space-xl px-space-md w-full font-body-md text-on-surface">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-space-lg">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-space-sm mb-space-md">
          <h1 className="font-display-lg text-display-lg text-bone-ivory uppercase tracking-tight">Grim AI Arena</h1>
          <p className="font-body-md text-on-surface-variant max-w-2xl">Tune the entity's neural capacity. Lower ratings will act erratic and sacrifice pieces; higher ratings command absolute foresight.</p>
        </div>

        {/* Dynamic AI Core */}
        <div className="w-full bg-surface-card border border-surface-container-high rounded-xl p-space-xl flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-primary-container/10 to-transparent pointer-events-none" />
          
          <div className="text-[120px] leading-none mb-space-sm filter drop-shadow-2xl animate-pulse">
            {bot.avatar}
          </div>
          
          <h2 className="font-headline-lg text-headline-lg text-bone-ivory uppercase tracking-wide mb-2">{bot.name}</h2>
          
          <div className="font-label-sm uppercase tracking-widest text-primary bg-primary-container/20 border border-primary/30 px-6 py-2 rounded-full mb-space-md">
            ESTIMATED ELO: {elo}
          </div>
          
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-space-xl">
            "{bot.description}"
          </p>

          <div className="w-full max-w-3xl flex flex-col gap-4">
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant uppercase">
              <span>Mindless (1)</span>
              <span>Godlike (3500)</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="3500" 
              value={elo} 
              onChange={(e) => setElo(parseInt(e.target.value))}
              className="w-full h-3 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-crimson-glow"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-gutter justify-between items-stretch">
          {/* Game Mode Section */}
          <div className="flex-1 bg-surface-card p-space-md rounded-lg border border-surface-container-low flex flex-col gap-space-md">
            <h3 className="font-headline-sm text-bone-ivory uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">sports_esports</span>
              Game Mode
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GAME_MODES.map((mode) => (
                <button
                  key={mode.id}
                  className={`flex flex-col items-start p-3 rounded border text-left transition-colors ${
                    selectedMode === mode.id
                      ? 'bg-surface-container-high border-secondary text-bone-ivory shadow-lg'
                      : 'bg-surface-container-lowest border-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-white'
                  }`}
                  onClick={() => setSelectedMode(mode.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{mode.icon}</span>
                    <span className="font-headline-sm text-sm uppercase tracking-wider">{mode.name}</span>
                  </div>
                  <span className="font-body-sm text-xs opacity-80">{mode.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time Control Section */}
          <div className="flex-1 bg-surface-card p-space-md rounded-lg border border-surface-container-low flex flex-col gap-space-md">
            <h3 className="font-headline-sm text-bone-ivory uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">timer</span>
              Time Control
            </h3>
            <div className="flex flex-wrap gap-3">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`px-4 py-3 rounded font-label-sm uppercase tracking-widest transition-colors ${
                    selectedTime === opt.value
                      ? 'bg-crimson-glow text-bone-ivory shadow-md shadow-crimson-glow/30'
                      : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-white border border-surface-container-low'
                  }`}
                  onClick={() => setSelectedTime(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mt-space-sm">
          <button
            onClick={onBack}
            className="px-space-md py-3 font-label-sm uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Back to Hub
          </button>
          
          <button
            onClick={() => onStart(elo, selectedTime, selectedMode)}
            className="px-space-xl py-4 bg-bone-ivory text-void-black hover:bg-white font-headline-md text-headline-md uppercase tracking-wider rounded flex items-center gap-space-sm transition-transform active:scale-95 shadow-[0_0_20px_rgba(232,221,200,0.3)]"
          >
            <span className="material-symbols-outlined text-[24px]">swords</span>
            ENTER ARENA
          </button>
        </div>
      </div>
    </div>
  );
}
