import { useState, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import ChessBoard from '../components/ChessBoard';
import PlayerBar from '../components/PlayerBar';
import MoveHistory from '../components/MoveHistory';
import { supabase } from '../lib/supabase';

interface OnlineGameModeProps {
  matchId: string;
  color: 'w' | 'b';
  opponentName: string;
  playerName: string;
  timeMinutes: number;
  onExit: () => void;
}

export default function OnlineGameMode({
  matchId,
  color,
  opponentName,
  playerName,
  
  onExit
}: OnlineGameModeProps) {
  const [chess] = useState(new Chess());
  const [, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<Set<string>>(new Set());
  const [lastMove, setLastMove] = useState<{from: string, to: string} | null>(null);
  
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]);
  const [winner, setWinner] = useState<'w' | 'b' | null>(null);
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);
  
  const [opponentConnected, setOpponentConnected] = useState(false);

  // Calculate material advantage
  const materialAdvantage = () => {
    const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    let wScore = capturedByBlack.reduce((acc, p) => acc + (values[p.toLowerCase()] || 0), 0);
    let bScore = capturedByWhite.reduce((acc, p) => acc + (values[p.toLowerCase()] || 0), 0);
    return { w: Math.max(0, wScore - bScore), b: Math.max(0, bScore - wScore) };
  };

  // Connect to Match Channel
  useEffect(() => {
    const matchChannel = supabase.channel(matchId);
    setChannel(matchChannel);

    matchChannel
      .on('presence', { event: 'sync' }, () => {
        const state = matchChannel.presenceState();
        if (Object.keys(state).length >= 2) {
          setOpponentConnected(true);
        } else {
          setOpponentConnected(false);
        }
      })
      .on('broadcast', { event: 'chess_move' }, (payload) => {
        const moveData = payload.payload?.move;
        if (!moveData || typeof moveData.from !== 'string' || typeof moveData.to !== 'string') {
          console.error('Received malformed move payload, ignoring');
          return;
        }
        
        // Validate move is legal before executing
        const legalMovesForValidation = chess.moves({ verbose: true });
        const isLegal = legalMovesForValidation.some(
          (m: { from: string; to: string; promotion?: string }) =>
            m.from === moveData.from && m.to === moveData.to
        );

        if (!isLegal) {
          console.error('Opponent sent illegal move, rejecting:', moveData);
          return;
        }

        try {
          const result = chess.move(moveData);
          if (result.captured) {
            if (result.color === 'w') setCapturedByWhite(prev => [...prev, result.captured as string]);
            else setCapturedByBlack(prev => [...prev, result.captured as string]);
          }
          
          setFen(chess.fen());
          setLastMove({ from: result.from, to: result.to });
          
          if (chess.isGameOver()) {
            if (chess.isCheckmate()) setWinner(chess.turn() === 'w' ? 'b' : 'w');
          }
        } catch (e) {
          console.error('Failed to execute validated move', e);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await matchChannel.track({
            name: playerName,
            color,
            status: 'in-game'
          });
        }
      });

    return () => {
      matchChannel.unsubscribe();
    };
  }, [matchId, color, playerName, chess]);

  const handleSquareClick = (sq: string) => {
    // Prevent moving if game is over, opponent disconnected, or not your turn
    if (winner || !opponentConnected || chess.turn() !== color) return;

    if (selectedSquare) {
      if (legalMoves.has(sq)) {
        try {
          // Local move
          const moveData = { from: selectedSquare, to: sq, promotion: 'q' };
          const move = chess.move(moveData);
          
          // Record capture
          if (move.captured) {
            const cap = move.captured as string;
            if (move.color === 'w') setCapturedByWhite(prev => [...prev, cap]);
            else setCapturedByBlack(prev => [...prev, cap]);
          }

          setFen(chess.fen());
          setLastMove({ from: selectedSquare, to: sq });
          setSelectedSquare(null);

          // Broadcast to opponent
          if (channel) {
            channel.send({
              type: 'broadcast',
              event: 'chess_move',
              payload: { move: moveData }
            });
          }

          if (chess.isGameOver()) {
            if (chess.isCheckmate()) setWinner(color);
          }
        } catch (e) {
          setSelectedSquare(null);
        }
      } else {
        const piece = chess.get(sq as Square);
        if (piece && piece.color === color) {
          setSelectedSquare(sq);
          const moves = chess.moves({ square: sq as Square, verbose: true }) as Move[];
          setLegalMoves(new Set(moves.map(m => m.to)));
        } else {
          setSelectedSquare(null);
          setLegalMoves(new Set());
        }
      }
    } else {
      const piece = chess.get(sq as Square);
      if (piece && piece.color === color) {
        setSelectedSquare(sq);
        const moves = chess.moves({ square: sq as Square, verbose: true }) as Move[];
        setLegalMoves(new Set(moves.map(m => m.to)));
      }
    }
  };

  const adv = materialAdvantage();

  return (
    <div className="min-h-screen bg-void-black flex flex-col lg:flex-row items-center justify-center p-space-md gap-gutter w-full">
      <div className="flex flex-col gap-space-md max-w-full">
        {/* Opponent Top Bar */}
        <div className="flex items-center gap-4">
          <PlayerBar 
            name={opponentName} 
            avatar={color === 'w' ? '🌑' : '☀️'} // Just a placeholder
            capturedPieces={color === 'w' ? capturedByBlack : capturedByWhite}
            materialAdvantage={color === 'w' ? adv.b : adv.w}
            isActive={chess.turn() !== color && !winner}
          />
          {!opponentConnected && (
            <span className="text-primary font-label-sm uppercase tracking-widest animate-pulse border border-primary px-2 rounded">
              Opponent Disconnected
            </span>
          )}
        </div>

        {/* Board Container */}
        <div className="relative">
          <ChessBoard 
            board={chess.board()}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={lastMove}
            checkSquare={chess.inCheck() ? (chess.turn() === 'w' ? 'w' : 'b') : null}
            onSquareClick={handleSquareClick}
          />
          
          {winner && (
            <div className="absolute inset-0 z-50 bg-void-black/80 flex flex-col items-center justify-center gap-space-md backdrop-blur-sm">
              <h2 className="font-display-lg text-display-lg text-primary uppercase tracking-tight drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]">
                {winner === color ? 'VICTORY' : 'DEFEAT'}
              </h2>
              <span className="font-headline-md text-bone-ivory">BY CHECKMATE</span>
              <button 
                onClick={onExit}
                className="mt-4 px-space-lg py-space-sm bg-primary-container text-on-primary-container hover:bg-crimson-glow hover:text-white font-label-md uppercase tracking-widest rounded transition-colors"
              >
                LEAVE ARENA
              </button>
            </div>
          )}
        </div>

        {/* Player Bottom Bar */}
        <div className="flex items-center justify-between">
          <PlayerBar 
            name={playerName} 
            avatar={color === 'w' ? '☀️' : '🌑'}
            capturedPieces={color === 'w' ? capturedByWhite : capturedByBlack}
            materialAdvantage={color === 'w' ? adv.w : adv.b}
            isActive={chess.turn() === color && !winner}
          />
          <button 
            onClick={onExit}
            className="text-on-surface-variant hover:text-primary font-label-sm uppercase tracking-widest transition-colors flex items-center gap-2 px-4 py-2 border border-surface-container hover:border-primary rounded"
          >
            <span className="material-symbols-outlined text-[18px]">flag</span>
            Resign
          </button>
        </div>
      </div>

      <MoveHistory history={chess.history()} />
    </div>
  );
}
