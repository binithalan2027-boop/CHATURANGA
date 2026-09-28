import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { getBestMove } from './ai/Engine';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const PIECE_SYMBOLS: Record<string, string> = {
  'w-p': '♙', 'w-n': '♘', 'w-b': '♗', 'w-r': '♖', 'w-q': '♕', 'w-k': '♔',
  'b-p': '♟', 'b-n': '♞', 'b-b': '♝', 'b-r': '♜', 'b-q': '♛', 'b-k': '♚',
};

export default function OfflineGameView({ onExit }: { onExit: () => void }) {
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState(2); // Depth 2 is Medium
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    if (chess.turn() === 'b' && !chess.isGameOver()) {
      setIsThinking(true);
      // Use setTimeout to allow UI to render the "Thinking..." state
      setTimeout(() => {
        const bestMoveLan = getBestMove(chess.fen(), difficulty);
        if (bestMoveLan) {
          try {
            chess.move(bestMoveLan);
            setFen(chess.fen());
          } catch(e) { console.error("AI tried invalid move", bestMoveLan) }
        }
        setIsThinking(false);
      }, 100);
    }
  }, [fen, chess, difficulty]);

  const handleSquareClick = (sq: string) => {
    if (chess.turn() === 'b' || chess.isGameOver()) return; // AI's turn or game over

    if (selectedSquare) {
      if (selectedSquare !== sq) {
        try {
          chess.move({ from: selectedSquare, to: sq, promotion: 'q' });
          setFen(chess.fen());
        } catch (e) {
          // Invalid move
        }
      }
      setSelectedSquare(null);
    } else {
      const piece = chess.get(sq as any);
      if (piece && piece.color === 'w') {
        setSelectedSquare(sq);
      }
    }
  };

  const board = chess.board();

  return (
    <div className="game-wrapper">
      <div className="game-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="status-badge">
          <span className="status-dot"></span>
          Offline AI Mode
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ fontWeight: 800 }}>Difficulty (Depth):</label>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(parseInt(e.target.value))}
            style={{ padding: '0.5rem', border: '3px solid #000', fontWeight: 800 }}
            disabled={isThinking}
          >
            <option value={1}>Easy (Depth 1)</option>
            <option value={2}>Medium (Depth 2)</option>
            <option value={3}>Hard (Depth 3)</option>
            <option value={4}>Grandmaster (Depth 4)</option>
          </select>
          <button onClick={onExit} style={{ padding: '0.5rem 1rem', background: '#FF3366', color: 'white', border: '3px solid #000', fontWeight: 800, cursor: 'pointer' }}>
            Exit
          </button>
        </div>
      </div>

      <div className="board-container-active">
        <div className="active-board">
          {RANKS.map((r, rIdx) => (
            <div className="board-row" key={r}>
              {FILES.map((f, fIdx) => {
                const sq = `${f}${r}`;
                const piece = board[rIdx][fIdx];
                const isLight = (rIdx + fIdx) % 2 === 0;
                const isSelected = selectedSquare === sq;

                return (
                  <div 
                    key={sq} 
                    className={`board-sq ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''}`}
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
        <h3>
          {chess.isGameOver() 
            ? "Game Over!" 
            : isThinking 
              ? "AI is thinking..." 
              : "Your Turn (White)"}
        </h3>
      </div>
    </div>
  );
}
