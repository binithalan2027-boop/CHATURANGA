import React, { useState } from 'react';
import { useSocket } from './SocketContext';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const PIECE_SYMBOLS: Record<string, string> = {
  'w-p': '♙', 'w-n': '♘', 'w-b': '♗', 'w-r': '♖', 'w-q': '♕', 'w-k': '♔',
  'b-p': '♟', 'b-n': '♞', 'b-b': '♝', 'b-r': '♜', 'b-q': '♛', 'b-k': '♚',
};

export default function GameView() {
  const { gameState, playerColor, connected, error, sendCommand } = useSocket();
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [activeSpell, setActiveSpell] = useState<string | null>(null);
  const [mathInput, setMathInput] = useState('');

  if (!connected) {
    return <div className="game-loading">Connecting to server...</div>;
  }

  if (!gameState) {
    return <div className="game-loading">Waiting for opponent to join...</div>;
  }

  const myState = playerColor && gameState.playerStates ? gameState.playerStates[playerColor] : null;

  const handleSquareClick = (sq: string) => {
    if (playerColor === 'spectator') return;

    if (activeSpell) {
      sendCommand({ type: 'cast_spell', playerColor: playerColor!, spellName: activeSpell, target: sq, version: gameState.version });
      setActiveSpell(null);
      setSelectedSquare(null);
      return;
    }

    if (selectedSquare) {
      if (selectedSquare !== sq) {
        sendCommand({ type: 'move', playerColor: playerColor!, from: selectedSquare, to: sq, version: gameState.version });
      }
      setSelectedSquare(null);
    } else {
      const piece = gameState.board[sq];
      if (piece && piece.color === playerColor) {
        setSelectedSquare(sq);
      }
    }
  };

  const submitMath = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerColor && playerColor !== 'spectator') {
      sendCommand({ type: 'answer_trial', playerColor, answer: parseInt(mathInput), version: gameState.version });
      setMathInput('');
    }
  };

  // If player is black, flip the board visually
  const renderRanks = playerColor === 'b' ? [...RANKS].reverse() : RANKS;
  const renderFiles = playerColor === 'b' ? [...FILES].reverse() : FILES;

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <div className="status-badge">
          <span className="status-dot"></span>
          Live Match ({playerColor === 'w' ? 'White' : playerColor === 'b' ? 'Black' : 'Spectating'}) - {gameState.variant}
        </div>
        {error && <div className="error-toast">{error}</div>}
      </div>

      <div className="board-container-active">
        <div className="active-board">
          {renderRanks.map((r, rIdx) => (
            <div className="board-row" key={r}>
              {renderFiles.map((f, fIdx) => {
                const sq = `${f}${r}`;
                const piece = gameState.board[sq];
                const isLight = (rIdx + fIdx) % 2 === 0;
                const isSelected = selectedSquare === sq;
                const isFrozen = gameState.frozenSquares && gameState.frozenSquares[sq] > 0;

                return (
                  <div 
                    key={sq} 
                    className={`board-sq ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${piece === undefined && gameState.variant === 'fog-of-war' ? 'fogged' : ''} ${isFrozen ? 'frozen' : ''}`}
                    onClick={() => handleSquareClick(sq)}
                  >
                    {isFrozen && <div className="freeze-overlay">❄️</div>}
                    {piece && (
                      <span className={`board-piece ${piece.color}-piece-active`}>
                        {PIECE_SYMBOLS[`${piece.color}-${piece.type}`]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {myState?.activeTrial && (
          <div className="math-trial-overlay">
            <h3>MATH TRIAL! ⏳</h3>
            <p>Solve quickly to earn a spell!</p>
            <div className="equation">{myState.activeTrial.question}</div>
            <form onSubmit={submitMath} className="math-form">
              <input type="number" autoFocus value={mathInput} onChange={(e) => setMathInput(e.target.value)} />
              <button type="submit">Cast</button>
            </form>
          </div>
        )}
      </div>
      
      <div className="game-footer">
        <h3>{gameState.status === 'playing' ? `${gameState.turn === 'w' ? "White's" : "Black's"} Turn` : `Game Over - ${gameState.status}`}</h3>
        
        {gameState.variant === 'spell-chess' && playerColor !== 'spectator' && (
          <div className="spell-bar">
            <button 
              className="btn-request-trial"
              onClick={() => sendCommand({ type: 'request_trial', playerColor: playerColor!, version: gameState.version })}
              disabled={!!myState?.activeTrial}
            >
              Generate Spell (Math)
            </button>
            <div className="spell-inventory">
              {myState?.spells.map((s, i) => (
                <button 
                  key={i} 
                  className={`btn-spell ${activeSpell === s ? 'active' : ''}`}
                  onClick={() => setActiveSpell(activeSpell === s ? null : s)}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
