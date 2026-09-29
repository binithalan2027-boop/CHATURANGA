import { useState } from 'react';
import { BotPersonality, BOTS } from './ai/useStockfish';

export interface BotSelectScreenProps {
  onStart: (botId: BotPersonality, timeMinutes: number, gameMode: string) => void;
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

const BOT_ELO: Record<BotPersonality, string> = {
  martin: '~250',
  nelson: '~1300',
  mittens: '~3200',
};

const GAME_MODES = [
  { id: 'standard', icon: '♟️', name: 'Standard', desc: 'Classic 8×8 chess' },
  { id: 'chess960', icon: '🎲', name: 'Chess960', desc: 'Randomized back rank' },
  { id: 'fog', icon: '🌫️', name: 'Fog of War', desc: 'Limited visibility' },
  { id: 'atomic', icon: '💥', name: 'Atomic', desc: 'Explosive captures' },
];

const BOT_KEYS: BotPersonality[] = ['martin', 'nelson', 'mittens'];

export default function BotSelectScreen({ onStart, onBack }: BotSelectScreenProps) {
  const [selectedBot, setSelectedBot] = useState<BotPersonality>('martin');
  const [selectedTime, setSelectedTime] = useState<number>(10);
  const [selectedMode, setSelectedMode] = useState<string>('standard');

  const handleCardClick = (botId: BotPersonality) => {
    setSelectedBot(botId);
  };

  const handlePlayOnCard = (e: React.MouseEvent, botId: BotPersonality) => {
    e.stopPropagation();
    setSelectedBot(botId);
    onStart(botId, selectedTime, selectedMode);
  };

  const handleMainPlay = () => {
    onStart(selectedBot, selectedTime, selectedMode);
  };

  const currentBotConfig = BOTS[selectedBot];
  const currentMode = GAME_MODES.find((m) => m.id === selectedMode) || GAME_MODES[0];

  return (
    <div className="min-h-screen bg-void-black flex flex-col items-center p-8">
      <div className="w-full max-w-6xl flex flex-col gap-12">
        <header className="flex flex-col items-center text-center gap-4 py-8">
          <div className="font-label-sm uppercase tracking-widest text-on-surface-variant bg-surface-container-low px-4 py-1 rounded">SINGLEPLAYER PRACTICE</div>
          <h1 className="font-display-lg text-bone-ivory uppercase tracking-tight">CHOOSE YOUR OPPONENT</h1>
          <p className="font-body-md text-on-surface-variant">Select a chess bot personality and time control to begin</p>
        </header>

        {/* 3-Column Bot Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {BOT_KEYS.map((botId) => {
            const bot = BOTS[botId];
            const isSelected = selectedBot === botId;
            const elo = BOT_ELO[botId];

            return (
              <div
                key={botId}
                className={`bg-gradient-to-b from-surface-card to-void-black p-8 rounded-lg border flex flex-col items-center text-center transition-all cursor-pointer hover:shadow-primary-container/30 ${
                  isSelected 
                    ? 'border-primary-container shadow-[0_0_15px_rgba(var(--color-primary-container),0.3)]' 
                    : 'border-surface-container-low'
                }`}
                onClick={() => handleCardClick(botId)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(botId);
                  }
                }}
              >
                {isSelected ? (
                  <div className="font-label-sm uppercase tracking-widest bg-primary-container text-on-primary-container px-3 py-1 rounded mb-6">SELECTED</div>
                ) : (
                  <div className="h-7 mb-6"></div>
                )}
                
                <div className="text-7xl mb-6" aria-label={`${bot.name} avatar`}>
                  {bot.avatar}
                </div>

                <h2 className="font-headline-md text-bone-ivory uppercase mb-3">{bot.name}</h2>

                <div className="font-label-sm uppercase tracking-widest text-on-surface-variant bg-surface-container-low px-4 py-1 rounded-full mb-6">
                  <span>⚡ Rating: {elo}</span>
                </div>

                <p className="font-body-md text-on-surface-variant mb-8 flex-grow">{bot.description}</p>

                <div className="w-full">
                  <button
                    type="button"
                    className="w-full font-label-sm uppercase tracking-widest bg-primary-container text-on-primary-container hover:bg-crimson-glow py-3 rounded transition-colors"
                    onClick={(e) => handlePlayOnCard(e, botId)}
                    title={`Start match against ${bot.name}`}
                  >
                    Play
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row gap-gutter justify-between items-stretch">
          {/* Game Mode Section */}
          <section className="flex flex-col gap-6 w-full md:w-1/2">
            <div className="flex justify-between items-end">
              <span className="font-headline-md text-bone-ivory uppercase">🎮 GAME MODE</span>
              <span className="font-body-md text-on-surface-variant">
                {currentMode.name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {GAME_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={`bg-surface-container-lowest flex gap-2 flex-col items-center p-4 rounded border transition-colors ${
                    selectedMode === mode.id 
                      ? 'border-primary-container text-bone-ivory' 
                      : 'border-surface-container-low text-on-surface-variant hover:border-primary-container/50'
                  }`}
                  onClick={() => setSelectedMode(mode.id)}
                >
                  <span className="text-3xl mb-2">{mode.icon}</span>
                  <span className="font-label-sm uppercase tracking-widest mb-1">{mode.name}</span>
                  <span className="text-xs opacity-75">{mode.desc}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Time Control Section */}
          <section className="flex flex-col gap-6 w-full md:w-1/2">
            <div className="flex justify-between items-end">
              <span className="font-headline-md text-bone-ivory uppercase">⏱️ TIME CONTROL</span>
              <span className="font-body-md text-on-surface-variant">
                {selectedTime === 0 ? 'Unlimited Clock' : `${selectedTime} minutes per side`}
              </span>
            </div>

            <div className="bg-surface-container-lowest flex gap-2 flex-wrap p-6 rounded border border-surface-container-low">
              {TIME_OPTIONS.map((opt) => {
                const isActive = selectedTime === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`font-label-sm uppercase tracking-widest px-4 py-2 rounded transition-colors ${
                      isActive 
                        ? 'bg-primary-container text-on-primary-container' 
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-card'
                    }`}
                    onClick={() => setSelectedTime(opt.value)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Bottom Actions Row */}
        <footer className="flex justify-between items-center border-t border-surface-container-low pt-8 mt-4 pb-12">
          <button
            type="button"
            className="font-label-sm uppercase tracking-widest text-on-surface-variant hover:text-bone-ivory transition-colors"
            onClick={onBack}
          >
            ← Back
          </button>

          <button
            type="button"
            className="font-label-sm uppercase tracking-widest bg-primary-container text-on-primary-container hover:bg-crimson-glow px-8 py-4 rounded transition-colors text-lg"
            onClick={handleMainPlay}
          >
            PLAY {currentMode.name.toUpperCase()} VS {currentBotConfig?.name.split(' ')[0].toUpperCase()} ({selectedTime === 0 ? 'NO LIMIT' : `${selectedTime}M`}) ⚔️
          </button>
        </footer>
      </div>
    </div>
  );
}

export { BotSelectScreen };
