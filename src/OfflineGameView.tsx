import StandardMode from './modes/StandardMode';
import AtomicMode from './modes/AtomicMode';
import FogMode from './modes/FogMode';
import Chess960Mode from './modes/Chess960Mode';
import SpellMode from './modes/SpellMode';

interface OfflineGameViewProps {
  onExit: () => void;
  botElo?: number;
  timeMinutes?: number;
  gameMode?: 'standard' | 'chess960' | 'fog' | 'atomic' | 'spell';
}

export default function OfflineGameView({ onExit, botElo = 250, gameMode = 'standard' }: OfflineGameViewProps) {
  // Delegate the logic to highly-isolated mode components to ensure 
  // variants do not corrupt the standard game logic.
  
  if (gameMode === 'atomic') {
    return <AtomicMode onExit={onExit} botElo={botElo} />;
  }
  
  if (gameMode === 'fog') {
    return <FogMode onExit={onExit} botElo={botElo} />;
  }

  if (gameMode === 'chess960') {
    return <Chess960Mode onExit={onExit} botElo={botElo} />;
  }

  if (gameMode === 'spell') {
    return <SpellMode onExit={onExit} botElo={botElo} />;
  }

  // Fallback to Standard
  return <StandardMode onExit={onExit} botElo={botElo} />;
}
