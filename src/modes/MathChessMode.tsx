import { useState, useMemo, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { useStockfish, getBotByElo } from '../ai/useStockfish';
import CourtyardMatch, { SquareMark } from './CourtyardMatch';

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

  // SPELL DECK (merged from Original Spell): Freeze + Jump with charges and a
  // shared cooldown. Charges are also awarded for winning maths showdowns.
  const [freezeCharges, setFreezeCharges] = useState(2);
  const [jumpCharges, setJumpCharges] = useState(1);
  const [spellCooldown, setSpellCooldown] = useState(0);
  const [activeSpell, setActiveSpell] = useState<'freeze' | 'jump' | null>(null);
  const [spellFrozen, setSpellFrozen] = useState<Set<string>>(new Set());
  const [jumpedPiece, setJumpedPiece] = useState<{ square: string; piece: { type: any; color: any } } | null>(null);

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
    // Winning a duel also recharges the spell deck (Chess MM merge).
    if (Math.random() < 0.5) {
      setFreezeCharges(c => Math.min(5, c + 1));
    } else {
      setJumpCharges(c => Math.min(2, c + 1));
    }
  };

  // Cast Freeze: a 3x3 area cannot move for the bot's next turn.
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
    setSpellFrozen(newlyFrozen);
    setFreezeCharges(c => c - 1);
    setSpellCooldown(3);
    setActiveSpell(null);
  };

  // Cast Jump: lift one non-king piece off the board until after your next move.
  const castJump = (sq: string) => {
    const piece = chess.get(sq as Square);
    if (!piece || piece.type === 'k') return;
    setJumpedPiece({ square: sq, piece });
    chess.remove(sq as Square);
    setFen(chess.fen());
    setJumpCharges(c => c - 1);
    setSpellCooldown(3);
    setActiveSpell(null);
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
    if (spellFrozen.has(selectedSquare) && chess.turn() === 'w') return new Set<string>();

    try {
      const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
      const valid = moves.filter(m => !jumpedPiece || m.to !== jumpedPiece.square);
      return new Set(valid.map((m: Move) => m.to));
    } catch (e) {
      return new Set<string>();
    }
  }, [selectedSquare, fen, chess, winner, frozenSquares, spellFrozen, jumpedPiece, inMathShowdown]);

  const displayBoard = useMemo(() => {
    const b = chess.board();
    if (jumpedPiece) {
      const f = FILES.indexOf(jumpedPiece.square[0]);
      const r = RANKS.indexOf(jumpedPiece.square[1]);
      if (b[r] && f >= 0) {
        b[r][f] = { ...jumpedPiece.piece, square: jumpedPiece.square as Square } as any;
      }
    }
    return b;
  }, [fen, chess, jumpedPiece]);

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
      if (jumpedPiece) {
        chess.put(jumpedPiece.piece as any, jumpedPiece.square as Square);
        setJumpedPiece(null);
      }
      recordCapture(move);
      setFen(chess.fen());
      setLastMove({ from, to });
      setSelectedSquare(null);
      if (spellCooldown > 0) setSpellCooldown(c => c - 1);

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

    // Casting a spell from the deck
    if (activeSpell === 'freeze') {
      castFreeze(sq);
      return;
    }
    if (activeSpell === 'jump') {
      castJump(sq);
      return;
    }

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
      let moveStr = await getBestMove(chess.fen(), currentBot);
      if (!isActive || !moveStr) return;

      try {
        // Spell freeze: the bot cannot move frozen pieces this turn.
        if (spellFrozen.has(moveStr.slice(0, 2))) {
          const validMoves = chess.moves({ verbose: true }).filter(m => !spellFrozen.has(m.from));
          if (validMoves.length > 0) {
            const m = validMoves[Math.floor(Math.random() * validMoves.length)];
            moveStr = m.from + m.to + (m.promotion || '');
          }
        }
        // The freeze lifts once the bot has moved.
        setSpellFrozen(new Set());

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
  }, [fen, chess, getBestMove, currentBot, winner, inMathShowdown, doubleMoveActive, frozenMovesLeft, spellFrozen]);

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
    setFreezeCharges(2);
    setJumpCharges(1);
    setSpellCooldown(0);
    setActiveSpell(null);
    setSpellFrozen(new Set());
    setJumpedPiece(null);
  };

  const squareMarks: Record<string, SquareMark> = {};
  frozenSquares.forEach(sq => {
    squareMarks[sq] = { className: 'frozen', icon: '❄' };
  });
  spellFrozen.forEach(sq => {
    squareMarks[sq] = { className: 'frozen', icon: '❄' };
  });
  if (poisonSquare) {
    squareMarks[poisonSquare] = { className: 'poison', icon: '☠' };
  }
  if (jumpedPiece) {
    squareMarks[jumpedPiece.square] = { className: 'jumped', icon: '↺' };
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const powerLabels: Record<PowerUpType, { name: string; desc: string }> = {
    time_boost: { name: '+20s time boost', desc: 'Add 20 seconds to your clock.' },
    time_drain: { name: '-20s time drain', desc: 'Take 20 seconds off the bot clock.' },
    freeze_grid: { name: 'Freeze grid (2x3)', desc: 'Freeze a 2x3 area for 2 bot moves.' },
    poison_bed: { name: 'Poison bed', desc: 'A piece that stays 3 moves on the square is lost.' },
    double_move: { name: 'Double move', desc: 'Play two moves in one turn.' },
    redo: { name: 'Redo', desc: 'Take back your last move and the bot reply.' },
    pawn_promote: { name: 'Royal ascension', desc: 'Promote one pawn to a queen at once.' },
  };

  return (
      <CourtyardMatch
        eyebrow="CHESS MM · MIND & MAGIC · THE CLASSIC COLLECTION"
        title="Chess MM"
        board={displayBoard}
        selectedSquare={selectedSquare}
        legalMoves={legalMoves}
        lastMove={lastMove}
        checkSquare={checkSquare}
        onSquareClick={handleSquareClick}
        squareMarks={squareMarks}
        botName={currentBot.name}
        botElo={botElo}
        isBotThinking={false}
        capturedByWhite={capturedByWhite}
        capturedByBlack={capturedByBlack}
        materialAdvantage={materialAdvantage}
        botActive={chess.turn() === 'b' && !winner}
        playerActive={chess.turn() === 'w' && !winner && !inMathShowdown}
        status={
          inMathShowdown
            ? 'Maths duel in progress - the clocks are paused.'
            : subMode === 'gate'
              ? 'Solve a quick question to unlock each move.'
              : `Next maths duel in ${formatTime(showdownTimer)}.`
        }
        sidePanels={
          <>
            <section className="court-panel">
              <div className="eyebrow">HOW IT PLAYS</div>
              <div className="answer-actions">
                <button
                  className={subMode === 'gate' ? 'primary' : ''}
                  onClick={() => setSubMode('gate')}
                >
                  Mind gate
                </button>
                <button
                  className={subMode === 'showdown' ? 'primary' : ''}
                  onClick={() => setSubMode('showdown')}
                >
                  Speed duel
                </button>
              </div>
              <p>
                {subMode === 'gate'
                  ? 'Every move asks one quick maths question. A wrong answer costs 5 seconds.'
                  : 'Every 90 seconds, a 10-question duel. Beat the bot to win a power-up and a spell charge.'}
              </p>
              <div className="clock-line">
                <span>You {formatTime(playerTime)}</span>
                <span>Bot {formatTime(botTime)}</span>
              </div>
            </section>

            <section className="court-panel spell-deck">
              <div className="eyebrow">SPELL DECK</div>
              <button
                className={activeSpell === 'freeze' ? 'armed' : ''}
                disabled={spellCooldown > 0 || freezeCharges === 0 || winner !== null}
                onClick={() => setActiveSpell(activeSpell === 'freeze' ? null : 'freeze')}
              >
                ❄ Freeze spell ×{freezeCharges}
                <small>
                  Freeze a 3x3 area for the bot's next move.
                  {activeSpell === 'freeze' ? ' Now tap a square.' : ''}
                </small>
              </button>
              <button
                className={activeSpell === 'jump' ? 'armed' : ''}
                disabled={spellCooldown > 0 || jumpCharges === 0 || winner !== null}
                onClick={() => setActiveSpell(activeSpell === 'jump' ? null : 'jump')}
              >
                ↺ Jump spell ×{jumpCharges}
                <small>
                  Lift one non-king piece until after your next move.
                  {activeSpell === 'jump' ? ' Now tap its square.' : ''}
                </small>
              </button>
              <p>
                {spellCooldown > 0
                  ? `Spells recover in ${spellCooldown} move${spellCooldown > 1 ? 's' : ''}.`
                  : 'Spells are ready. Winning duels recharges the deck.'}
              </p>
            </section>

            <section className="court-panel vault">
              <div className="eyebrow">POWER-UPS · {inventory.length}</div>
              {inventory.length === 0 && (
                <p>No power-ups yet. Win a maths duel to earn one.</p>
              )}
              {inventory.map((pw, idx) => (
                <button key={idx} onClick={() => handleUsePowerUp(pw)}>
                  {powerLabels[pw].name}
                  <small>{powerLabels[pw].desc}</small>
                </button>
              ))}
              {(doubleMoveActive || activePowerUp || frozenMovesLeft > 0 || poisonSquare) && (
                <p>
                  {doubleMoveActive && `Double move active (${doubleMoveCount}/2 used). `}
                  {activePowerUp && `Tap a target square for ${powerLabels[activePowerUp].name}. `}
                  {frozenMovesLeft > 0 && `Grid frozen for ${frozenMovesLeft} bot moves. `}
                  {poisonSquare && `Poison bed on ${poisonSquare} (${poisonStayCount}/3).`}
                </p>
              )}
            </section>
          </>
        }
        history={chess.history()}
        winner={winner}
        onNewGame={handleNewGame}
        onExit={onExit}
        overlays={<>
      {/* Mind gate: one question unlocks the pending move. */}
      {gateQuestion && (
        <div className="court-overlay" role="dialog" aria-modal="true" aria-label="Maths question">
          <div className="court-panel" style={{ maxWidth: 420, width: '100%' }}>
            <div className="eyebrow">MIND GATE · SOLVE TO MOVE</div>
            <div className="mm-question">{gateQuestion.question} = ?</div>
            <div className="mm-options">
              {gateQuestion.options.map((opt, i) => (
                <button key={i} onClick={() => handleAnswerGate(opt)}>
                  {opt}
                </button>
              ))}
            </div>
            <p className="local-note">A wrong answer costs 5 seconds and brings a new question.</p>
          </div>
        </div>
      )}

      {/* Speed duel: 10 questions against the clock and the bot. */}
      {inMathShowdown && showdownQuestions.length > 0 && (
        <div className="court-overlay" role="dialog" aria-modal="true" aria-label="Maths duel">
          <div className="court-panel" style={{ maxWidth: 460, width: '100%' }}>
            <div className="eyebrow">
              MATHS DUEL · ROUND {showdownRoundCount + 1} · QUESTION {showdownIdx + 1}/10
            </div>
            <div className="mm-question">{showdownQuestions[showdownIdx].question} = ?</div>
            <div className="mm-options">
              {showdownQuestions[showdownIdx].options.map((opt, i) => (
                <button key={i} onClick={() => handleShowdownAnswer(opt)}>
                  {opt}
                </button>
              ))}
            </div>
            <p className="local-note">
              Score {showdownScore}/{showdownIdx}. A wrong answer costs 3 seconds.
            </p>
          </div>
        </div>
      )}
    </>}
      />
  );
}
