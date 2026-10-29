import StandardMode from './modes/StandardMode';
import AtomicMode from './modes/AtomicMode';
import FogMode from './modes/FogMode';
import Chess960Mode from './modes/Chess960Mode';
import MathChessMode from './modes/MathChessMode';
import CrossBoardMode from './modes/CrossBoardMode';

export interface OfflineGameViewProps {
  onExit: () => void;
  botElo?: number;
  timeMinutes?: number;
  gameMode?: 'standard' | 'chess' | 'chess960' | 'fog' | 'atomic' | 'math' | 'mind' | 'matiks' | 'cross3' | 'cross4';
  mathSubMode?: 'showdown' | 'gate';
  onPlayOnline?: (mode: "cross3" | "cross4") => void;
}

export default function OfflineGameView({
  onExit,
  botElo = 250,
  timeMinutes = 10,
  gameMode = 'standard',
  mathSubMode = 'showdown',
  onPlayOnline,
}: OfflineGameViewProps) {
  if (gameMode === 'cross3') {
    return <CrossBoardMode count={3} onExit={onExit} onPlayOnline={onPlayOnline} timeMinutes={timeMinutes} />;
  }

  if (gameMode === 'cross4') {
    return <CrossBoardMode count={4} onExit={onExit} onPlayOnline={onPlayOnline} timeMinutes={timeMinutes} />;
  }

  if (gameMode === 'math' || gameMode === 'mind' || gameMode === 'matiks') {
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
