import { useState, useMemo, useEffect } from 'react';
import { Chess, Square, Move, Piece } from 'chess.js';
import { useStockfish, getBotByElo } from '../ai/useStockfish';
import ChessBoard from '../components/ChessBoard';
import PlayerBar from '../components/PlayerBar';
import MoveHistory from '../components/MoveHistory';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export interface GameModeProps {
  onExit: () => void;
  botElo: number;
}

export default function SpellMode({ onExit, botElo }: GameModeProps) {
  const [chess, setChess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]);
  const [winner, setWinner] = useState<'w' | 'b' | null>(null);

  const currentBotElo = botElo;
  const { isReady, isThinking, getBestMove, engineError } = useStockfish();
  const currentBot = getBotByElo(currentBotElo);

  // SPELL SYSTEM STATE
  const [spellCooldown, setSpellCooldown] = useState(0);
  const [freezeCharges, setFreezeCharges] = useState(5);
  const [jumpCharges, setJumpCharges] = useState(2);
  const [activeSpell, setActiveSpell] = useState<'freeze' | 'jump' | null>(null);
  
  const [frozenSquares, setFrozenSquares] = useState<Set<string>>(new Set());
  const [jumpedPiece, setJumpedPiece] = useState<{ square: string, piece: Piece } | null>(null);

  const legalMoves = useMemo(() => {
    if (!selectedSquare || winner) return new Set<string>();
    if (frozenSquares.has(selectedSquare) && chess.turn() === 'w') return new Set<string>(); // Cannot move a frozen piece

    try {
      const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
      const valid = moves.filter(m => !jumpedPiece || m.to !== jumpedPiece.square);
      return new Set(valid.map((m: Move) => m.to));
    } catch(e) {
      return new Set<string>();
    }
  }, [selectedSquare, fen, chess, winner, frozenSquares, jumpedPiece]);

  const displayBoard = useMemo(() => {
    const b = chess.board();
    if (jumpedPiece) {
      const f = FILES.indexOf(jumpedPiece.square[0]);
      const r = RANKS.indexOf(jumpedPiece.square[1]);
      if (b[r] && f >= 0) {
        b[r][f] = { ...jumpedPiece.piece, square: jumpedPiece.square as Square };
      }
    }
    return b;
  }, [fen, chess, jumpedPiece]);

  const checkSquare = useMemo(() => {
    if (winner) return null;
    try {
      if (!chess.isCheck()) return null;
      const turn = chess.turn();
      const board = displayBoard;
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const piece = board[r][f];
          if (piece && piece.type === 'k' && piece.color === turn) {
            return `${FILES[f]}${RANKS[r]}`;
          }
        }
      }
    } catch(e) {}
    return null;
  }, [fen, chess, winner, displayBoard]);

  const materialAdvantage = useMemo(() => {
    const whiteScore = capturedByWhite.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
    const blackScore = capturedByBlack.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
    return whiteScore - blackScore;
  }, [capturedByWhite, capturedByBlack]);

  const recordCapture = (moveResult: Move) => {
    const captured = moveResult.captured;
    if (captured) {
      if (moveResult.color === 'w') {
        setCapturedByWhite(prev => [...prev, captured]);
      } else {
        setCapturedByBlack(prev => [...prev, captured]);
      }
    }
  };

  const castFreeze = (centerSq: string) => {
    const fileIdx = FILES.indexOf(centerSq[0]);
    const rankIdx = RANKS.indexOf(centerSq[1]);
    const newlyFrozen = new Set<string>();

    for (let df = -1; df <= 1; df++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (fileIdx + df >= 0 && fileIdx + df < 8 && rankIdx + dr >= 0 && rankIdx + dr < 8) {
          newlyFrozen.add(`${FILES[fileIdx + df]}${RANKS[rankIdx + dr]}`);
        }
      }
    }
    
    setFrozenSquares(newlyFrozen);
    setFreezeCharges(c => c - 1);
    setSpellCooldown(3);
    setActiveSpell(null);
  };

  const castJump = (sq: string) => {
    const piece = chess.get(sq as Square);
    if (!piece || piece.type === 'k') return; // Cannot jump empty squares or kings
    
    setJumpedPiece({ square: sq, piece });
    chess.remove(sq as Square);
    setFen(chess.fen());
    
    setJumpCharges(c => c - 1);
    setSpellCooldown(3);
    setActiveSpell(null);
  };

  const handleSquareClick = (sq: string) => {
    if (winner || chess.turn() !== 'w') return;

    if (activeSpell === 'freeze') {
      castFreeze(sq);
      return;
    }

    if (activeSpell === 'jump') {
      castJump(sq);
      return;
    }

    if (selectedSquare) {
      if (legalMoves.has(sq)) {
        try {
          const move = chess.move({ from: selectedSquare, to: sq, promotion: 'q' });
          if (jumpedPiece) {
            chess.put(jumpedPiece.piece, jumpedPiece.square as Square);
            setJumpedPiece(null);
          }

          recordCapture(move);
          setFen(chess.fen());
          setLastMove({ from: selectedSquare, to: sq });
          setSelectedSquare(null);
          
          if (spellCooldown > 0) setSpellCooldown(c => c - 1);

          if (chess.isGameOver()) {
            if (chess.isCheckmate()) setWinner('w');
          }
        } catch (e) {
          setSelectedSquare(null);
        }
      } else {
        const piece = displayBoard[RANKS.indexOf(sq[1])][FILES.indexOf(sq[0])];
        if (piece && piece.color === 'w') {
          setSelectedSquare(sq);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      const piece = displayBoard[RANKS.indexOf(sq[1])][FILES.indexOf(sq[0])];
      if (piece && piece.color === 'w') {
        setSelectedSquare(sq);
      }
    }
  };

  useEffect(() => {
    if (winner || chess.turn() === 'w') return;
    let isActive = true;

    const playBotMove = async () => {
      const moveStr = await getBestMove(chess.fen(), currentBot);
      if (!isActive || !moveStr) return;

      try {
        let finalMoveStr = moveStr;
        const from = finalMoveStr.slice(0, 2);
        
        // If bot tried to move a frozen piece, override with a random legal move
        if (frozenSquares.has(from)) {
          const validMoves = chess.moves({ verbose: true }).filter(m => !frozenSquares.has(m.from));
          if (validMoves.length > 0) {
            const m = validMoves[Math.floor(Math.random() * validMoves.length)];
            finalMoveStr = m.from + m.to + (m.promotion || '');
          }
        }

        // Before bot moves, player's frozen squares expire for the next turn
        setFrozenSquares(new Set());

        const moveFrom = finalMoveStr.slice(0, 2);
        const moveTo = finalMoveStr.slice(2, 4);
        const promotion = finalMoveStr.length > 4 ? finalMoveStr[4] : undefined;

        const move = chess.move({ from: moveFrom, to: moveTo, promotion });
        recordCapture(move);
        setFen(chess.fen());
        setLastMove({ from: moveFrom, to: moveTo });
        
        if (chess.isGameOver()) {
          if (chess.isCheckmate()) setWinner('b');
        }
      } catch (e) {
        console.error("Bot attempted illegal move:", moveStr);
      }
    };
    playBotMove();

    return () => { isActive = false; };
  }, [fen, chess, getBestMove, currentBot, winner, frozenSquares]);

  const handleNewGame = () => {
    const newChess = new Chess();
    setChess(newChess);
    setFen(newChess.fen());
    setSelectedSquare(null);
    setLastMove(null);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setWinner(null);
    setFreezeCharges(5);
    setJumpCharges(2);
    setSpellCooldown(0);
    setActiveSpell(null);
    setFrozenSquares(new Set());
    setJumpedPiece(null);
  };

  const customSquareStyles: Record<string, string> = {};
  frozenSquares.forEach(sq => {
    customSquareStyles[sq] = 'bg-cyan-500/40 border border-cyan-300 shadow-[inset_0_0_15px_rgba(34,211,238,0.5)]';
  });
  if (jumpedPiece) {
    customSquareStyles[jumpedPiece.square] = 'bg-green-500/30 border border-green-400 border-dashed opacity-50 shadow-[0_0_15px_rgba(74,222,128,0.5)]';
  }

  return (
    <div className="min-h-screen bg-void-black flex flex-col lg:flex-row items-center justify-center p-space-md gap-gutter w-full text-bone-ivory font-body-md">
      
      {/* GRIMOIRE (SPELLBOOK) PANEL */}
      <div className="w-full lg:w-64 bg-surface-card border border-surface-container-high rounded-xl p-space-md flex flex-col gap-4 shadow-[0_0_40px_rgba(34,211,238,0.1)] order-last lg:order-first">
        <h3 className="font-display-md text-cyan-400 uppercase tracking-wider text-center border-b border-surface-container pb-2">SPELL DECK</h3>
        
        <div className="flex flex-col gap-3">
          <div className="text-xs text-on-surface-variant font-mono uppercase text-center">
            {spellCooldown > 0 ? `Cooldown: ${spellCooldown} turns` : 'Spells Ready'}
          </div>
          
          <button 
            disabled={spellCooldown > 0 || freezeCharges === 0}
            onClick={() => setActiveSpell(activeSpell === 'freeze' ? null : 'freeze')}
            className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 overflow-hidden ${activeSpell === 'freeze' ? 'bg-cyan-900 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] scale-105' : 'bg-surface-container-low border-surface-container hover:bg-surface-container'} ${(spellCooldown > 0 || freezeCharges === 0) ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {activeSpell === 'freeze' && <div className="absolute inset-0 bg-cyan-400/20 animate-pulse"></div>}
            <div className="relative w-16 h-16 rounded-lg bg-black flex items-center justify-center border border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <img src="/spells/freeze.jpg" alt="Freeze" className="w-full h-full object-cover rounded-lg mix-blend-screen" />
              <div className="absolute -top-2 -right-2 bg-cyan-500 text-black font-bold font-mono text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-black">x{freezeCharges}</div>
            </div>
            <div className="text-center z-10">
              <span className="font-headline-sm uppercase tracking-wide text-cyan-300 block leading-tight">Freeze Spell</span>
              <span className="text-[10px] text-cyan-100/70 font-mono">Freezes a 3x3 area</span>
            </div>
          </button>
          
          <button 
            disabled={spellCooldown > 0 || jumpCharges === 0}
            onClick={() => setActiveSpell(activeSpell === 'jump' ? null : 'jump')}
            className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 overflow-hidden ${activeSpell === 'jump' ? 'bg-green-900 border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.6)] scale-105' : 'bg-surface-container-low border-surface-container hover:bg-surface-container'} ${(spellCooldown > 0 || jumpCharges === 0) ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {activeSpell === 'jump' && <div className="absolute inset-0 bg-green-400/20 animate-pulse"></div>}
            <div className="relative w-16 h-16 rounded-lg bg-black flex items-center justify-center border border-green-500/50 shadow-[0_0_15px_rgba(74,222,128,0.3)]">
              <img src="/spells/jump.jpg" alt="Jump" className="w-full h-full object-cover rounded-lg mix-blend-screen" />
              <div className="absolute -top-2 -right-2 bg-green-500 text-black font-bold font-mono text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-black">x{jumpCharges}</div>
            </div>
            <div className="text-center z-10">
              <span className="font-headline-sm uppercase tracking-wide text-green-300 block leading-tight">Jump Spell</span>
              <span className="text-[10px] text-green-100/70 font-mono">Jump over one piece</span>
            </div>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-[600px]">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-surface-card p-3 rounded-lg border border-surface-container-high shadow-xl">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isReady ? (engineError ? 'bg-yellow-400' : 'bg-green-500') : 'bg-red-500'}`}></span>
            <span className="font-headline-sm uppercase tracking-wide text-bone-ivory">Spell Chess</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest rounded text-sm transition-colors uppercase tracking-wider" onClick={handleNewGame}>New Game</button>
            <button className="px-3 py-1 bg-crimson-glow hover:bg-red-700 text-white font-bold rounded text-sm transition-colors uppercase tracking-wider shadow-[0_0_10px_rgba(255,0,0,0.2)]" onClick={onExit}>Surrender</button>
          </div>
        </div>

        {/* OPPONENT INFO BAR */}
        <PlayerBar
          name={currentBot.name}
          avatar={currentBot.avatar}
          isThinking={isThinking}
          capturedPieces={capturedByBlack}
          materialAdvantage={-materialAdvantage}
          isActive={chess.turn() === 'b' && !winner}
          elo={currentBotElo}
        />

        {/* CHESS BOARD */}
        <div className={`relative ${activeSpell === 'freeze' ? 'cursor-crosshair ring-4 ring-cyan-400 rounded shadow-[0_0_40px_rgba(34,211,238,0.5)] transition-all' : activeSpell === 'jump' ? 'cursor-crosshair ring-4 ring-green-400 rounded shadow-[0_0_40px_rgba(74,222,128,0.5)] transition-all' : ''}`}>
          <ChessBoard
            board={displayBoard}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={lastMove}
            checkSquare={checkSquare}
            onSquareClick={handleSquareClick}
            customSquareStyles={customSquareStyles}
          />
          {winner && (
            <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
              <h2 className="font-display-lg text-6xl text-cyan-400 uppercase tracking-tighter mb-4 animate-pulse drop-shadow-[0_0_30px_rgba(34,211,238,0.8)]">
                {winner === 'w' ? 'VICTORY' : 'DEFEATED'}
              </h2>
              <button className="px-6 py-2 bg-bone-ivory text-void-black font-bold uppercase tracking-widest rounded hover:bg-white transition-colors" onClick={handleNewGame}>
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        {/* PLAYER INFO BAR */}
        <PlayerBar
          name="You"
          avatar="👤"
          capturedPieces={capturedByWhite}
          materialAdvantage={materialAdvantage}
          isActive={chess.turn() === 'w' && !winner}
        />
      </div>

      <MoveHistory history={chess.history()} />
    </div>
  );
}
