import { useState, useMemo, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { useStockfish, getBotByElo } from '../ai/useStockfish';
import ChessBoard from '../components/ChessBoard';
import PlayerBar from '../components/PlayerBar';
import MoveHistory from '../components/MoveHistory';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export type PowerUpType = 
  | 'time_boost'     // +20s
  | 'time_drain'     // -20s
  | 'freeze_grid'    // Freeze 2x3 or 3x2 grid for 2 moves
  | 'poison_bed'     // Piece dies if it stays 3 consecutive moves
  | 'double_move'    // Make 2 moves in one turn
  | 'redo'           // Redo/Takeback move
  | 'pawn_promote';  // Instant pawn promotion to Queen

export interface MathQuestion {
  question: string;
  answer: number;
  options: number[];
}

export interface MathChessModeProps {
  onExit: () => void;
  botElo: number;
}

// Helper to generate mental math questions
function generateMathQuestion(): MathQuestion {
  const types = ['add', 'sub', 'mul'];
  const type = types[Math.floor(Math.random() * types.length)];
  let num1 = 0, num2 = 0, answer = 0, question = '';

  if (type === 'add') {
    num1 = Math.floor(Math.random() * 80) + 12;
    num2 = Math.floor(Math.random() * 80) + 12;
    answer = num1 + num2;
    question = `${num1} + ${num2}`;
  } else if (type === 'sub') {
    num1 = Math.floor(Math.random() * 80) + 30;
    num2 = Math.floor(Math.random() * (num1 - 10)) + 5;
    answer = num1 - num2;
    question = `${num1} - ${num2}`;
  } else {
    num1 = Math.floor(Math.random() * 12) + 3;
    num2 = Math.floor(Math.random() * 12) + 3;
    answer = num1 * num2;
    question = `${num1} × ${num2}`;
  }

  // Generate 3 distractors
  const optionsSet = new Set<number>([answer]);
  while (optionsSet.size < 4) {
    const delta = (Math.floor(Math.random() * 10) + 1) * (Math.random() > 0.5 ? 1 : -1);
    const fake = answer + delta;
    if (fake >= 0) optionsSet.add(fake);
  }

  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);
  return { question, answer, options };
}

export default function MathChessMode({ onExit, botElo }: MathChessModeProps) {
  // Submode: Mode 1 = Math Gated Move, Mode 2 = 10-Min Match with 1:30 Math Speed Showdown
  const [subMode, setSubMode] = useState<'gate' | 'showdown'>('showdown');
  
  const [chess, setChess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]);
  const [winner, setWinner] = useState<'w' | 'b' | null>(null);

  // Clocks for 10-minute match
  const [playerTime, setPlayerTime] = useState<number>(600); // 10 mins
  const [botTime, setBotTime] = useState<number>(600);
  const [showdownTimer, setShowdownTimer] = useState<number>(90); // 1.5 mins countdown

  // Mode 1: Math Gate State
  const [gateQuestion, setGateQuestion] = useState<MathQuestion | null>(null);
  const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null);
  const [mathGateSolved, setMathGateSolved] = useState<boolean>(false);

  // Mode 2: Math Showdown Modal State
  const [inMathShowdown, setInMathShowdown] = useState<boolean>(false);
  const [showdownQuestions, setShowdownQuestions] = useState<MathQuestion[]>([]);
  const [showdownIdx, setShowdownIdx] = useState<number>(0);
  const [showdownScore, setShowdownScore] = useState<number>(0);
  const [showdownRoundCount, setShowdownRoundCount] = useState<number>(0);

  // Power-Ups System
  const [inventory, setInventory] = useState<PowerUpType[]>([]);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);

  // Powerup active states
  const [frozenSquares, setFrozenSquares] = useState<Set<string>>(new Set());
  const [frozenMovesLeft, setFrozenMovesLeft] = useState<number>(0);

  const [poisonSquare, setPoisonSquare] = useState<string | null>(null);
  const [poisonOccupant, setPoisonOccupant] = useState<string | null>(null);
  const [poisonStayCount, setPoisonStayCount] = useState<number>(0);

  const [doubleMoveActive, setDoubleMoveActive] = useState<boolean>(false);
  const [doubleMoveCount, setDoubleMoveCount] = useState<number>(0);

  const [pawnPromoteActive, setPawnPromoteActive] = useState<boolean>(false);

  const { getBestMove } = useStockfish();
  const currentBot = getBotByElo(botElo);

  // Main game clock timer
  useEffect(() => {
    if (winner || inMathShowdown) return;

    const interval = setInterval(() => {
      if (chess.turn() === 'w') {
        setPlayerTime(t => {
          if (t <= 1) { setWinner('b'); return 0; }
          return t - 1;
        });
      } else {
        setBotTime(t => {
          if (t <= 1) { setWinner('w'); return 0; }
          return t - 1;
        });
      }

      // Showdown countdown in Mode 2
      if (subMode === 'showdown') {
        setShowdownTimer(st => {
          if (st <= 1) {
            triggerMathShowdown();
            return 90; // Reset 1.5 min timer
          }
          return st - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [chess, winner, inMathShowdown, subMode]);

  // Trigger Math Showdown round (10 Questions)
  const triggerMathShowdown = () => {
    const qList: MathQuestion[] = [];
    for (let i = 0; i < 10; i++) {
      qList.push(generateMathQuestion());
    }
    setShowdownQuestions(qList);
    setShowdownIdx(0);
    setShowdownScore(0);
    setInMathShowdown(true);
  };

  // Answer a Math Showdown question
  const handleShowdownAnswer = (selected: number) => {
    const q = showdownQuestions[showdownIdx];
    let newScore = showdownScore;
    if (selected === q.answer) {
      newScore += 1;
      setShowdownScore(newScore);
    } else {
      // Wrong answer in showdown: -3 second penalty
      setPlayerTime(t => Math.max(0, t - 3));
    }

    if (showdownIdx < 9) {
      setShowdownIdx(idx => idx + 1);
    } else {
      // Showdown complete! Determine winner & reward Power-Up
      setInMathShowdown(false);
      setShowdownRoundCount(rc => rc + 1);

      // Bot score simulated based on bot ELO (e.g. 5 to 8 points)
      const botScore = Math.min(10, Math.floor(botElo / 400) + Math.floor(Math.random() * 3));
      
      if (newScore >= botScore) {
        // Player wins power-up!
        awardRandomPowerUp(showdownRoundCount === 0);
      }
    }
  };

  // Award random powerup (excluding poison bed on 1st round)
  const awardRandomPowerUp = (isFirstRound: boolean) => {
    const pool: PowerUpType[] = [
      'time_boost',
      'time_drain',
      'freeze_grid',
      'double_move',
      'redo',
      'pawn_promote'
    ];
    if (!isFirstRound) {
      pool.push('poison_bed');
    }
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    setInventory(inv => [...inv, chosen]);
  };

  // Activate power-up from inventory
  const handleUsePowerUp = (p: PowerUpType) => {
    setInventory(inv => {
      const idx = inv.indexOf(p);
      if (idx > -1) {
        const next = [...inv];
        next.splice(idx, 1);
        return next;
      }
      return inv;
    });

    if (p === 'time_boost') {
      setPlayerTime(t => t + 20);
    } else if (p === 'time_drain') {
      setBotTime(t => Math.max(0, t - 20));
    } else if (p === 'freeze_grid') {
      setActivePowerUp('freeze_grid');
    } else if (p === 'poison_bed') {
      setActivePowerUp('poison_bed');
    } else if (p === 'double_move') {
      setDoubleMoveActive(true);
      setDoubleMoveCount(0);
    } else if (p === 'redo') {
      try {
        chess.undo(); // Undo bot move
        chess.undo(); // Undo player move
        setFen(chess.fen());
        setSelectedSquare(null);
      } catch (e) {}
    } else if (p === 'pawn_promote') {
      setPawnPromoteActive(true);
    }
  };

  const legalMoves = useMemo(() => {
    if (!selectedSquare || winner || inMathShowdown) return new Set<string>();
    if (frozenSquares.has(selectedSquare) && chess.turn() === 'w') return new Set<string>();

    try {
      const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
      return new Set(moves.map((m: Move) => m.to));
    } catch (e) {
      return new Set<string>();
    }
  }, [selectedSquare, fen, chess, winner, frozenSquares, inMathShowdown]);

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
    } catch (e) {}
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

  // Perform actual execution of a chess move
  const executePlayerMove = (from: string, to: string) => {
    try {
      const move = chess.move({ from, to, promotion: 'q' });
      recordCapture(move);
      setFen(chess.fen());
      setLastMove({ from, to });
      setSelectedSquare(null);

      // Check Poison Bed status
      if (poisonSquare) {
        const pieceOnPoison = chess.get(poisonSquare as Square);
        if (pieceOnPoison) {
          if (poisonOccupant === `${pieceOnPoison.color}-${pieceOnPoison.type}`) {
            const newCount = poisonStayCount + 1;
            setPoisonStayCount(newCount);
            if (newCount >= 3) {
              // Destroy piece!
              chess.remove(poisonSquare as Square);
              setFen(chess.fen());
              setPoisonSquare(null);
              setPoisonOccupant(null);
              setPoisonStayCount(0);
            }
          } else {
            setPoisonOccupant(`${pieceOnPoison.color}-${pieceOnPoison.type}`);
            setPoisonStayCount(1);
          }
        } else {
          setPoisonOccupant(null);
          setPoisonStayCount(0);
        }
      }

      // Check Double Move
      if (doubleMoveActive) {
        if (doubleMoveCount === 0) {
          setDoubleMoveCount(1);
          return; // Allow 2nd move!
        } else {
          setDoubleMoveActive(false);
          setDoubleMoveCount(0);
        }
      }

      if (chess.isGameOver()) {
        if (chess.isCheckmate()) setWinner('w');
      }
    } catch (e) {
      setSelectedSquare(null);
    }
  };

  const handleSquareClick = (sq: string) => {
    if (winner || chess.turn() !== 'w' || inMathShowdown) return;

    // Apply Freeze Grid powerup
    if (activePowerUp === 'freeze_grid') {
      const fileIdx = FILES.indexOf(sq[0]);
      const rankIdx = RANKS.indexOf(sq[1]);
      const newlyFrozen = new Set<string>();

      // Freeze 2x3 grid
      for (let df = 0; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (fileIdx + df < 8 && rankIdx + dr >= 0 && rankIdx + dr < 8) {
            newlyFrozen.add(`${FILES[fileIdx + df]}${RANKS[rankIdx + dr]}`);
          }
        }
      }
      setFrozenSquares(newlyFrozen);
      setFrozenMovesLeft(2);
      setActivePowerUp(null);
      return;
    }

    // Apply Poison Bed powerup
    if (activePowerUp === 'poison_bed') {
      setPoisonSquare(sq);
      const piece = chess.get(sq as Square);
      setPoisonOccupant(piece ? `${piece.color}-${piece.type}` : null);
      setPoisonStayCount(piece ? 1 : 0);
      setActivePowerUp(null);
      return;
    }

    // Apply Instant Pawn Promotion
    if (pawnPromoteActive) {
      const piece = chess.get(sq as Square);
      if (piece && piece.color === 'w' && piece.type === 'p') {
        chess.remove(sq as Square);
        chess.put({ type: 'q', color: 'w' }, sq as Square);
        setFen(chess.fen());
        setPawnPromoteActive(false);
      }
      return;
    }

    if (selectedSquare) {
      if (legalMoves.has(sq)) {
        if (subMode === 'gate' && !mathGateSolved) {
          // Trigger Math Question Gate before move execution!
          setPendingMove({ from: selectedSquare, to: sq });
          setGateQuestion(generateMathQuestion());
        } else {
          executePlayerMove(selectedSquare, sq);
          setMathGateSolved(false);
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

  // Solve Math Gate for Mode 1
  const handleAnswerGate = (selected: number) => {
    if (gateQuestion && selected === gateQuestion.answer) {
      setMathGateSolved(true);
      if (pendingMove) {
        executePlayerMove(pendingMove.from, pendingMove.to);
        setPendingMove(null);
      }
      setGateQuestion(null);
    } else {
      // Wrong answer: -5 second time penalty and new question
      setPlayerTime(t => Math.max(0, t - 5));
      setGateQuestion(generateMathQuestion());
    }
  };

  // Bot Turn Handler
  useEffect(() => {
    if (winner || chess.turn() === 'w' || inMathShowdown || doubleMoveActive) return;
    let isActive = true;

    const playBotMove = async () => {
      const moveStr = await getBestMove(chess.fen(), currentBot);
      if (!isActive || !moveStr) return;

      try {
        const from = moveStr.slice(0, 2);
        const to = moveStr.slice(2, 4);
        const promotion = moveStr.length > 4 ? moveStr[4] : undefined;

        // Decrease frozen moves left
        if (frozenMovesLeft > 0) {
          setFrozenMovesLeft(f => {
            if (f <= 1) setFrozenSquares(new Set());
            return f - 1;
          });
        }

        const move = chess.move({ from, to, promotion });
        recordCapture(move);
        setFen(chess.fen());
        setLastMove({ from, to });

        if (chess.isGameOver()) {
          if (chess.isCheckmate()) setWinner('b');
        }
      } catch (e) {
        console.error("Bot move error:", moveStr);
      }
    };
    playBotMove();

    return () => { isActive = false; };
  }, [fen, chess, getBestMove, currentBot, winner, inMathShowdown, doubleMoveActive, frozenMovesLeft]);

  const handleNewGame = () => {
    const newChess = new Chess();
    setChess(newChess);
    setFen(newChess.fen());
    setSelectedSquare(null);
    setLastMove(null);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setWinner(null);
    setPlayerTime(600);
    setBotTime(600);
    setShowdownTimer(90);
    setInventory([]);
    setFrozenSquares(new Set());
    setPoisonSquare(null);
    setDoubleMoveActive(false);
  };

  const customSquareStyles: Record<string, string> = {};
  frozenSquares.forEach(sq => {
    customSquareStyles[sq] = 'bg-cyan-900/60 border border-cyan-400/40 shadow-[inset_0_0_10px_rgba(0,255,255,0.4)]';
  });
  if (poisonSquare) {
    customSquareStyles[poisonSquare] = 'bg-emerald-950/80 border-2 border-emerald-500 animate-pulse';
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-ink-black flex flex-col justify-between p-space-md text-bone-ivory font-body-md select-none">
      
      {/* HEADER HUD BAR */}
      <header className="w-full bg-void-surface border border-void-border p-space-sm flex flex-wrap items-center justify-between gap-space-md shadow-xl">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-pumpkin-orange animate-ping" />
            <span className="font-headline-sm text-sm uppercase tracking-wider text-bone-ivory">CHESS MM // MATIKS</span>
          </div>
          <span className="text-void-border font-mono text-xs">/</span>
          
          {/* Submode Switcher */}
          <div className="flex items-center gap-1 bg-ink-black p-0.5 border border-void-border">
            <button
              onClick={() => setSubMode('gate')}
              className={`px-2 py-0.5 font-label-sm text-[10px] uppercase ${subMode === 'gate' ? 'bg-blood-crimson text-bone-ivory font-bold' : 'text-bone-ivory-dim'}`}
            >
              MODE 1: MATH GATE
            </button>
            <button
              onClick={() => setSubMode('showdown')}
              className={`px-2 py-0.5 font-label-sm text-[10px] uppercase ${subMode === 'showdown' ? 'bg-blood-crimson text-bone-ivory font-bold' : 'text-bone-ivory-dim'}`}
            >
              MODE 2: SPEED SHOWDOWN &amp; POWER-UPS
            </button>
          </div>
        </div>

        {/* Clocks & Showdown Timer */}
        <div className="flex items-center gap-space-lg font-mono text-xs">
          <div className="flex items-center gap-2 bg-ink-black px-3 py-1 border border-void-border">
            <span className="text-bone-ivory-dim">YOU:</span>
            <span className="text-pumpkin-orange font-bold text-sm">{formatTime(playerTime)}</span>
          </div>
          <div className="flex items-center gap-2 bg-ink-black px-3 py-1 border border-void-border">
            <span className="text-bone-ivory-dim">BOT:</span>
            <span className="text-cursed-violet-bright font-bold text-sm">{formatTime(botTime)}</span>
          </div>
          {subMode === 'showdown' && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blood-crimson/20 border border-blood-crimson text-blood-crimson font-bold text-xs">
              <span>MATH DUEL IN:</span>
              <span className="text-bone-ivory font-mono">{formatTime(showdownTimer)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-space-md">
          <button onClick={handleNewGame} className="px-3 py-1 bg-surface-container hover:bg-surface-container-high text-xs font-headline-sm uppercase border border-void-border">
            RESTART
          </button>
          <button onClick={onExit} className="px-3 py-1 bg-blood-crimson hover:bg-blood-crimson-bright text-bone-ivory text-xs font-headline-sm uppercase tracking-widest shadow-[0_0_12px_rgba(163,19,43,0.5)]">
            SURRENDER
          </button>
        </div>
      </header>

      {/* MAIN CONTENT COCKPIT */}
      <main className="w-full max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter my-space-md items-start">
        
        {/* COLUMN 1: POWER-UP VAULT & INVENTORY (3 COLS) */}
        <div className="lg:col-span-3 flex flex-col gap-space-md">
          <div className="bg-void-surface border border-void-border p-space-md flex flex-col gap-space-sm shadow-md">
            <div className="flex items-center justify-between border-b border-void-border pb-space-xs">
              <span className="font-headline-sm text-xs uppercase tracking-wider text-bone-ivory flex items-center gap-1.5">
                <span className="material-symbols-outlined text-pumpkin-orange text-[18px]">bolt</span>
                CURSED POWER-UP VAULT
              </span>
              <span className="font-mono text-[10px] text-pumpkin-orange font-bold">{inventory.length} AVAILABLE</span>
            </div>

            {subMode === 'showdown' && (
              <p className="font-body-sm text-[11px] text-bone-ivory-dim leading-relaxed">
                Win the 10-Question Speed Math Showdown every 1.5 minutes to unlock random power-ups!
              </p>
            )}

            {/* Inventory List */}
            <div className="flex flex-col gap-2 mt-1">
              {inventory.map((p, idx) => {
                const labels: Record<PowerUpType, { name: string; desc: string; icon: string }> = {
                  time_boost: { name: '+20s TIME BOOST', desc: 'Adds +20 seconds to your match clock', icon: 'hourglass_top' },
                  time_drain: { name: '-20s TIME DRAIN', desc: 'Deducts 20s from opponent clock', icon: 'hourglass_bottom' },
                  freeze_grid: { name: 'FREEZE SPELL (2x3)', desc: 'Freeze a 2x3 grid for 2 opponent moves', icon: 'ac_unit' },
                  poison_bed: { name: 'POISON BED', desc: 'Piece dies if staying 3 moves on square', icon: 'skull' },
                  double_move: { name: 'DOUBLE MOVE', desc: 'Execute 2 chess moves in 1 turn', icon: 'double_arrow' },
                  redo: { name: 'CHRONO REDO', desc: 'Undo your last move', icon: 'undo' },
                  pawn_promote: { name: 'ROYAL ASCENSION', desc: 'Instantly promote any pawn to Queen', icon: 'crown' },
                };
                const item = labels[p];
                return (
                  <button
                    key={idx}
                    onClick={() => handleUsePowerUp(p)}
                    className="w-full text-left p-2.5 bg-ink-black hover:bg-surface-container border border-void-border hover:border-pumpkin-orange transition-all flex items-center gap-2 group"
                  >
                    <span className="material-symbols-outlined text-pumpkin-orange group-hover:scale-110 transition-transform">{item.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-xs text-bone-ivory uppercase">{item.name}</span>
                      <span className="font-label-sm text-[9px] text-bone-ivory-dim">{item.desc}</span>
                    </div>
                  </button>
                );
              })}

              {inventory.length === 0 && (
                <div className="p-4 bg-ink-black border border-void-border text-center font-mono text-xs text-bone-ivory-dim italic">
                  No power-ups collected yet. Win the Math Showdowns!
                </div>
              )}
            </div>
          </div>

          {/* Active Status Effects */}
          <div className="bg-void-surface border border-void-border p-space-md flex flex-col gap-space-xs shadow-md font-mono text-[11px]">
            <span className="text-bone-ivory font-bold uppercase tracking-wider border-b border-void-border pb-1">
              ACTIVE FIELD EFFECT PROTOCOLS
            </span>
            {doubleMoveActive && (
              <div className="text-pumpkin-orange font-bold animate-pulse">
                ⚡ DOUBLE MOVE ACTIVE ({doubleMoveCount}/2 MOVES USED)
              </div>
            )}
            {activePowerUp && (
              <div className="text-cyan-400 font-bold animate-pulse">
                🎯 CLICK TARGET SQUARE TO APPLY {activePowerUp.toUpperCase()}
              </div>
            )}
            {frozenMovesLeft > 0 && (
              <div className="text-cyan-300">
                ❄️ GRID FROZEN FOR {frozenMovesLeft} OPPONENT TURNS
              </div>
            )}
            {poisonSquare && (
              <div className="text-emerald-400">
                ☠️ POISON BED ACTIVE AT {poisonSquare} (STAY COUNT: {poisonStayCount}/3)
              </div>
            )}
            {!doubleMoveActive && !activePowerUp && frozenMovesLeft === 0 && !poisonSquare && (
              <span className="text-bone-ivory-dim italic">Standard grid rules active.</span>
            )}
          </div>
        </div>

        {/* COLUMN 2: CHESS BOARD (6 COLS) */}
        <div className="lg:col-span-6 flex flex-col gap-space-md items-center relative">
          <div className="w-full bg-void-surface border border-void-border px-space-md py-space-xs flex items-center justify-between shadow-md">
            <span className="font-mono text-xs text-bone-ivory font-bold">
              {subMode === 'gate' ? 'MODE 1: SOLVE MATH TO UNLOCK MOVES' : 'MODE 2: 10-MIN MATCH + MATH SPEED SHOWDOWN'}
            </span>
            <span className="font-mono text-xs text-pumpkin-orange font-bold uppercase">
              TURN #{chess.history().length}
            </span>
          </div>

          <div className="relative w-full flex items-center justify-center">
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
              <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-md animate-fadeIn">
                <h2 className="font-display-xl text-6xl text-blood-crimson uppercase tracking-tighter mb-4 animate-pulse drop-shadow-[0_0_30px_rgba(163,19,43,1)]">
                  {winner === 'w' ? 'VICTORY' : 'DEFEATED'}
                </h2>
                <button 
                  onClick={handleNewGame} 
                  className="px-8 py-3 bg-bone-ivory text-void-black font-display-sm text-lg uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                >
                  PLAY AGAIN
                </button>
              </div>
            )}
          </div>

          <PlayerBar
            name="You"
            avatar="👤"
            capturedPieces={capturedByWhite}
            materialAdvantage={materialAdvantage}
            isActive={chess.turn() === 'w' && !winner}
          />
        </div>

        {/* COLUMN 3: MOVE HISTORY & STATS (3 COLS) */}
        <div className="lg:col-span-3 flex flex-col gap-space-md">
          <PlayerBar
            name={currentBot.name}
            avatar={currentBot.avatar}
            isThinking={false}
            capturedPieces={capturedByBlack}
            materialAdvantage={-materialAdvantage}
            isActive={chess.turn() === 'b' && !winner}
            elo={botElo}
          />
          <MoveHistory history={chess.history()} />
        </div>

      </main>

      {/* MODE 1: MENTAL MATH QUESTION GATE MODAL */}
      {gateQuestion && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-space-md animate-fadeIn">
          <div className="bg-void-surface border-2 border-blood-crimson p-space-lg max-w-md w-full shadow-[0_0_50px_rgba(163,19,43,0.8)] text-center flex flex-col gap-space-md">
            <span className="font-label-sm text-xs text-blood-crimson uppercase tracking-widest font-bold">
              MENTAL MATH GATE // SOLVE TO UNLOCK MOVE
            </span>
            <div className="font-display-xl text-5xl text-bone-ivory font-black tracking-tight bg-ink-black py-4 border border-void-border">
              {gateQuestion.question} = ?
            </div>
            <div className="grid grid-cols-2 gap-space-xs mt-2">
              {gateQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswerGate(opt)}
                  className="py-3 bg-surface-container hover:bg-blood-crimson hover:text-bone-ivory font-display-sm text-xl border border-void-border transition-all"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: 10-QUESTION SPEED MATH SHOWDOWN MODAL */}
      {inMathShowdown && showdownQuestions.length > 0 && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-space-md animate-fadeIn">
          <div className="bg-void-surface border-2 border-pumpkin-orange p-space-lg max-w-lg w-full shadow-[0_0_50px_rgba(230,106,24,0.8)] text-center flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-void-border pb-space-xs font-mono text-xs">
              <span className="text-pumpkin-orange font-bold uppercase">⚡ SPEED MATH SHOWDOWN (ROUND #{showdownRoundCount + 1})</span>
              <span className="text-bone-ivory font-bold">QUESTION {showdownIdx + 1} / 10</span>
            </div>

            <div className="font-display-xl text-6xl text-bone-ivory font-black tracking-tight bg-ink-black py-6 border border-void-border my-2">
              {showdownQuestions[showdownIdx].question} = ?
            </div>

            <div className="grid grid-cols-2 gap-space-sm">
              {showdownQuestions[showdownIdx].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleShowdownAnswer(opt)}
                  className="py-4 bg-surface-container hover:bg-pumpkin-orange hover:text-void-black font-display-sm text-2xl border border-void-border transition-all shadow-md"
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="font-mono text-xs text-bone-ivory-dim mt-2">
              CURRENT SCORE: <strong className="text-pumpkin-orange">{showdownScore}</strong> / {showdownIdx}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER SYSTEM TELEMETRY */}
      <footer className="w-full bg-ink-black border-t border-void-border px-margin py-space-xs font-mono text-[10px] text-bone-ivory-dim flex flex-wrap items-center justify-between gap-space-md">
        <div>CHESS MM ENGINE // MENTAL MATH GAUNTLET ACTIVE</div>
        <div className="text-pumpkin-orange font-bold">[MOAT SYSTEM: ACTIVE]</div>
      </footer>
    </div>
  );
}
