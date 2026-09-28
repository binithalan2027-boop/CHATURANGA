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

  if (!connected) {
    return <div className="game-loading">Connecting to server...</div>;
  }

  if (!gameState) {
    return <div className="game-loading">Waiting for opponent to join...</div>;
  }

  const handleSquareClick = (sq: string) => {
    if (playerColor === 'spectator') return;

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

  // If player is black, flip the board visually
  const renderRanks = playerColor === 'b' ? [...RANKS].reverse() : RANKS;
  const renderFiles = playerColor === 'b' ? [...FILES].reverse() : FILES;

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <div className="status-badge">
          <span className="status-dot"></span>
          Live Match ({playerColor === 'w' ? 'White' : playerColor === 'b' ? 'Black' : 'Spectating'})
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

                return (
                  <div 
                    key={sq} 
                    className={`board-sq ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${piece === undefined ? 'fogged' : ''}`}
                    onClick={() => handleSquareClick(sq)}
                  >
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
      </div>
      
      <div className="game-footer">
        <h3>{gameState.status === 'playing' ? `${gameState.turn === 'w' ? "White's" : "Black's"} Turn` : `Game Over - ${gameState.status}`}</h3>
      </div>
    </div>
  );
}
