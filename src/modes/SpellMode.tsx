import { useState, useMemo, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
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
  const [swapCharges, setSwapCharges] = useState(2);
  const [activeSpell, setActiveSpell] = useState<'freeze' | 'swap' | null>(null);
  const [swapTarget, setSwapTarget] = useState<string | null>(null);
  const [frozenSquares, setFrozenSquares] = useState<Set<string>>(new Set());

  const legalMoves = useMemo(() => {
    if (!selectedSquare || winner) return new Set<string>();
    if (frozenSquares.has(selectedSquare) && chess.turn() === 'w') return new Set<string>(); // Cannot move a frozen piece

    try {
      const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
      return new Set(moves.map((m: Move) => m.to));
    } catch(e) {
      return new Set<string>();
    }
  }, [selectedSquare, fen, chess, winner, frozenSquares]);

  const checkSquare = useMemo(() => {
    if (winner) return null;
    try {
      if (!chess.isCheck()) return null;
      const turn = chess.turn();
      const board = chess.board();
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
  }, [fen, chess, winner]);

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

  const castSwap = (sq1: string, sq2: string) => {
    const p1 = chess.get(sq1 as Square);
    const p2 = chess.get(sq2 as Square);
    if (!p1 || !p2 || p1.color !== 'w' || p2.color !== 'w' || p1.type === 'k' || p2.type === 'k') {
      return; // Invalid swap
    }

    chess.remove(sq1 as Square);
    chess.remove(sq2 as Square);
    chess.put(p2, sq1 as Square);
    chess.put(p1, sq2 as Square);
    
    setFen(chess.fen());
    setSwapCharges(c => c - 1);
    setSpellCooldown(3);
    setActiveSpell(null);
    setSwapTarget(null);
  };

  const handleSquareClick = (sq: string) => {
    if (winner || chess.turn() !== 'w') return;

    if (activeSpell === 'freeze') {
      castFreeze(sq);
      return;
    }

    if (activeSpell === 'swap') {
      if (!swapTarget) {
        const piece = chess.get(sq as Square);
        if (piece && piece.color === 'w' && piece.type !== 'k') {
          setSwapTarget(sq);
        }
      } else {
        castSwap(swapTarget, sq);
      }
      return;
    }

    if (selectedSquare) {
      if (legalMoves.has(sq)) {
        try {
          const move = chess.move({ from: selectedSquare, to: sq, promotion: 'q' });
          recordCapture(move);
          setFen(chess.fen());
          setLastMove({ from: selectedSquare, to: sq });
          setSelectedSquare(null);
          
          if (spellCooldown > 0) setSpellCooldown(c => c - 1);
          setFrozenSquares(new Set()); // Player frozen squares melt after their turn

          if (chess.isGameOver()) {
            if (chess.isCheckmate()) setWinner('w');
          }
        } catch (e) {
          setSelectedSquare(null);
        }
      } else {
        const piece = chess.get(sq as Square);
        if (piece && piece.color === 'w') {
          setSelectedSquare(sq);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      const piece = chess.get(sq as Square);
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
        const from = moveStr.slice(0, 2);
        const to = moveStr.slice(2, 4);
        const promotion = moveStr.length > 4 ? moveStr[4] : undefined;
        
        // Before bot moves, frozen squares expire
        setFrozenSquares(new Set());

        const move = chess.move({ from, to, promotion });
        recordCapture(move);
        setFen(chess.fen());
        setLastMove({ from, to });
        
        if (chess.isGameOver()) {
          if (chess.isCheckmate()) setWinner('b');
        }
      } catch (e) {
        console.error("Bot attempted illegal move:", moveStr);
      }
    };
    playBotMove();

    return () => { isActive = false; };
  }, [fen, chess, getBestMove, currentBot, winner]);

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
    setSwapCharges(2);
    setSpellCooldown(0);
    setActiveSpell(null);
    setFrozenSquares(new Set());
  };

  const customSquareStyles: Record<string, string> = {};
  if (activeSpell === 'freeze') {
    // Hovering logic can't be purely done via state here without mouse tracking,
    // so we'll just indicate active mode.
  }
  if (activeSpell === 'swap' && swapTarget) {
    customSquareStyles[swapTarget] = 'bg-tertiary-container/80 animate-pulse border-2 border-tertiary shadow-[0_0_15px_rgba(163,80,240,0.8)]';
  }
  frozenSquares.forEach(sq => {
    customSquareStyles[sq] = 'bg-cyan-900/50 border border-cyan-400/30';
  });

  return (
    <div className="min-h-screen bg-void-black flex flex-col lg:flex-row items-center justify-center p-space-md gap-gutter w-full text-bone-ivory font-body-md">
      
      {/* GRIMOIRE (SPELLBOOK) PANEL */}
      <div className="w-full lg:w-64 bg-surface-card border border-tertiary-container rounded-xl p-space-md flex flex-col gap-4 shadow-[0_0_30px_rgba(110,40,200,0.15)] order-last lg:order-first">
        <h3 className="font-display-md text-tertiary uppercase tracking-wider text-center border-b border-tertiary/20 pb-2">Grimoire</h3>
        
        <div className="flex flex-col gap-2">
          <div className="text-xs text-on-surface-variant font-mono uppercase text-center mb-2">
            {spellCooldown > 0 ? `Cooldown: ${spellCooldown} turns` : 'Spells Ready'}
          </div>
          
          <button 
            disabled={spellCooldown > 0 || freezeCharges === 0}
            onClick={() => setActiveSpell(activeSpell === 'freeze' ? null : 'freeze')}
            className={`p-3 rounded border transition-all ${activeSpell === 'freeze' ? 'bg-tertiary text-white border-tertiary-container scale-105' : 'bg-surface-container-low border-surface-container hover:bg-surface-container'} ${(spellCooldown > 0 || freezeCharges === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-headline-sm uppercase tracking-wide">Void Freeze</span>
              <span className="font-mono text-tertiary">{freezeCharges}</span>
            </div>
            <div className="text-[10px] text-on-surface-variant text-left leading-tight">Freezes a 3x3 area. Trapped units cannot move.</div>
          </button>
          
          <button 
            disabled={spellCooldown > 0 || swapCharges === 0}
            onClick={() => {
              setActiveSpell(activeSpell === 'swap' ? null : 'swap');
              setSwapTarget(null);
            }}
            className={`p-3 rounded border transition-all ${activeSpell === 'swap' ? 'bg-tertiary text-white border-tertiary-container scale-105' : 'bg-surface-container-low border-surface-container hover:bg-surface-container'} ${(spellCooldown > 0 || swapCharges === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-headline-sm uppercase tracking-wide">Shadow Swap</span>
              <span className="font-mono text-tertiary">{swapCharges}</span>
            </div>
            <div className="text-[10px] text-on-surface-variant text-left leading-tight">Select two of your non-royal pieces to instantly swap their positions.</div>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-[600px]">
        {/* HEADER */}
        <div className="flex items-center justify-between bg-surface-card p-3 rounded-lg border border-surface-container-high shadow-xl">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isReady ? (engineError ? 'bg-yellow-400' : 'bg-green-500') : 'bg-red-500'}`}></span>
            <span className="font-headline-sm uppercase tracking-wide text-tertiary">Spell Chess</span>
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
        <div className={`relative ${activeSpell ? 'cursor-crosshair ring-4 ring-tertiary rounded shadow-[0_0_30px_rgba(110,40,200,0.5)] transition-all' : ''}`}>
          <ChessBoard
            board={chess.board()}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={lastMove}
            checkSquare={checkSquare}
            onSquareClick={handleSquareClick}
            customSquareStyles={customSquareStyles}
          />
          {winner && (
            <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
              <h2 className="font-display-lg text-6xl text-tertiary uppercase tracking-tighter mb-4 animate-pulse drop-shadow-[0_0_20px_rgba(110,40,200,0.5)]">
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
