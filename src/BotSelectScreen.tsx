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
    <div className="bs-screen">
      <div className="bs-container">
        <header className="bs-header">
          <div className="bs-badge">SINGLEPLAYER PRACTICE</div>
          <h1 className="bs-title">CHOOSE YOUR OPPONENT</h1>
          <p className="bs-subtitle">Select a chess bot personality and time control to begin</p>
        </header>

        {/* 3-Column Bot Cards Grid */}
        <div className="bs-grid">
          {BOT_KEYS.map((botId) => {
            const bot = BOTS[botId];
            const isSelected = selectedBot === botId;
            const elo = BOT_ELO[botId];

            return (
              <div
                key={botId}
                className={`bs-card ${isSelected ? 'active' : ''}`}
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
                {isSelected && <div className="bs-selected-banner">SELECTED</div>}
                
                <div className="bs-avatar" aria-label={`${bot.name} avatar`}>
                  {bot.avatar}
                </div>

                <h2 className="bs-name">{bot.name}</h2>

                <div className={`bs-elo bs-elo-${botId}`}>
                  <span>⚡ Rating: {elo}</span>
                </div>

                <p className="bs-desc">{bot.description}</p>

                <div className="bs-card-footer">
                  <button
                    type="button"
                    className="bs-card-play"
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

        {/* Game Mode Section */}
        <section className="bs-mode-section">
          <div className="bs-time-header">
            <span className="bs-time-label">🎮 GAME MODE</span>
            <span className="bs-time-selected-hint">
              {currentMode.name}
            </span>
          </div>

          <div className="bs-mode-grid">
            {GAME_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`bs-mode-card ${selectedMode === mode.id ? 'active' : ''}`}
                onClick={() => setSelectedMode(mode.id)}
              >
                <span className="bs-mode-icon">{mode.icon}</span>
                <span className="bs-mode-name">{mode.name}</span>
                <span className="bs-mode-desc">{mode.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Time Control Section */}
        <section className="bs-time-section">
          <div className="bs-time-header">
            <span className="bs-time-label">⏱️ TIME CONTROL</span>
            <span className="bs-time-selected-hint">
              {selectedTime === 0 ? 'Unlimited Clock' : `${selectedTime} minutes per side`}
            </span>
          </div>

          <div className="bs-time-toggles">
            {TIME_OPTIONS.map((opt) => {
              const isActive = selectedTime === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`bs-time-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedTime(opt.value)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Bottom Actions Row */}
        <footer className="bs-actions">
          <button
            type="button"
            className="bs-btn-back"
            onClick={onBack}
          >
            ← Back
          </button>

          <button
            type="button"
            className="bs-btn-play"
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
