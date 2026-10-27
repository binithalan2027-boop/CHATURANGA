import StandardMode from './modes/StandardMode';
import AtomicMode from './modes/AtomicMode';
import FogMode from './modes/FogMode';
import Chess960Mode from './modes/Chess960Mode';
import MathChessMode from './modes/MathChessMode';

interface OfflineGameViewProps {
  onExit: () => void;
  botElo?: number;
  timeMinutes?: number;
  gameMode?: 'standard' | 'chess960' | 'fog' | 'atomic' | 'math' | 'matiks';
  mathSubMode?: 'showdown' | 'gate';
}

export default function OfflineGameView({
  onExit,
  botElo = 250,
  timeMinutes = 10,
  gameMode = 'standard',
  mathSubMode = 'showdown',
}: OfflineGameViewProps) {
  if (gameMode === 'math' || gameMode === 'matiks') {
    return <MathChessMode onExit={onExit} botElo={botElo} initialSubMode={mathSubMode} />;
  }

  if (gameMode === 'atomic') {
    return <AtomicMode onExit={onExit} botElo={botElo} timeMinutes={timeMinutes} />;
  }
  
  if (gameMode === 'fog') {
    return <FogMode onExit={onExit} botElo={botElo} timeMinutes={timeMinutes} />;
  }

  if (gameMode === 'chess960') {
    return <Chess960Mode onExit={onExit} botElo={botElo} timeMinutes={timeMinutes} />;
  }

  // Fallback to Standard
  return <StandardMode onExit={onExit} botElo={botElo} timeMinutes={timeMinutes} />;
}
