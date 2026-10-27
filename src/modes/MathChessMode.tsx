import { useState, useMemo, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { useStockfish, getBotByElo } from '../ai/useStockfish';
import CourtyardMatch, { SquareMark } from './CourtyardMatch';
import MathDuelOverlay from './MathDuelOverlay';
import { unlockAchievement } from '../chaturanga/achievements';
import { recordGameResult } from '../chaturanga/stats';

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
  const [questionResults, setQuestionResults] = useState<boolean[]>([]);

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
  const [freezeCasts, setFreezeCasts] = useState(0);
  const [jumpCasts, setJumpCasts] = useState(0);
  const [duelsWon, setDuelsWon] = useState(0);
  const [totalDuels, setTotalDuels] = useState(0);
  const [spellCooldown, setSpellCooldown] = useState(0);
  const [activeSpell, setActiveSpell] = useState<'freeze' | 'jump' | null>(null);
  const [spellFrozen, setSpellFrozen] = useState<Set<string>>(new Set());
  const [jumpedPiece, setJumpedPiece] = useState<{ square: string; piece: { type: any; color: any } } | null>(null);
  const [gateStreak, setGateStreak] = useState<number>(0);

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
    setQuestionResults([]);
    setInMathShowdown(true);
  };

  // Answer a Math Showdown question
  const handleShowdownAnswer = (selected: number) => {
    const q = showdownQuestions[showdownIdx];
    let newScore = showdownScore;
    const isCorrect = selected === q.answer;
    setQuestionResults((prev) => [...prev, isCorrect]);
    if (isCorrect) {
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
      setTotalDuels(td => td + 1);

      // Bot score simulated based on bot ELO (e.g. 5 to 8 points)
      const botScore = Math.min(10, Math.floor(botElo / 400) + Math.floor(Math.random() * 3));
      
      if (newScore >= botScore) {
        // Player wins power-up!
        setDuelsWon(dw => dw + 1);
        awardRandomPowerUp(showdownRoundCount === 0);
        unlockAchievement('speed-duel-win');
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
    unlockAchievement('tactics-champion');
    setFreezeCasts(c => c + 1);
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
    unlockAchievement('tactics-champion');
    setJumpCasts(c => c + 1);
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
        if (chess.isCheckmate()) {
          setWinner('w');
          recordGameResult('win');
        } else if (chess.isDraw()) {
          recordGameResult('draw');
        }
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
      const nextStreak = gateStreak + 1;
      setGateStreak(nextStreak);
      if (nextStreak >= 3) {
        unlockAchievement('mind-gate-streak');
      }
      if (pendingMove) {
        executePlayerMove(pendingMove.from, pendingMove.to);
        setPendingMove(null);
      }
      setGateQuestion(null);
    } else {
      setGateStreak(0);
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
          if (chess.isCheckmate()) {
            setWinner('b');
            recordGameResult('loss');
          } else if (chess.isDraw()) {
            recordGameResult('draw');
          }
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
        playerClock={formatTime(playerTime)}
        botClock={formatTime(botTime)}
        duelCountdown={subMode === 'showdown' && !inMathShowdown ? formatTime(showdownTimer) : undefined}
        status={
          inMathShowdown
            ? 'Maths duel in progress - clocks paused.'
            : subMode === 'gate'
              ? 'Solve a quick question to unlock each move.'
              : `Next maths duel in ${formatTime(showdownTimer)}.`
        }
        boardOverlay={
          inMathShowdown && showdownQuestions.length > 0 ? (
            <MathDuelOverlay
              question={showdownQuestions[showdownIdx]}
              questionIndex={showdownIdx}
              totalQuestions={10}
              playerScore={showdownScore}
              botScore={Math.min(showdownIdx, Math.floor(showdownIdx * 0.6))}
              duelTimer={20}
              playerName="You"
              playerRating={1200}
              botName={currentBot.name || "Aarav"}
              botRating={botElo}
              freezeCharges={freezeCharges}
              jumpCharges={jumpCharges}
              onAnswer={handleShowdownAnswer}
              questionResults={questionResults}
            />
          ) : gateQuestion ? (
            <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-[440px] shadow-2xl flex flex-col items-center text-center">
              <span className="text-[10px] font-bold tracking-[2px] text-[#AFF65B] uppercase block mb-1 font-body">
                MIND GATE · SOLVE TO MOVE
              </span>
              <div className="font-heading text-4xl sm:text-5xl tracking-wider text-[#F4F4F4] my-3">
                {gateQuestion.question} = ?
              </div>
              <div className="grid grid-cols-2 gap-3 w-full my-3">
                {gateQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswerGate(opt)}
                    className="py-3.5 px-4 rounded-xl bg-[#262626] hover:bg-[#333333] active:bg-[#AFF65B] active:text-[#0E0E0E] text-[#F4F4F4] font-heading text-2xl tracking-wide border border-white/5 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-95"
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between w-full text-xs text-[#8A8A8A] mt-2 pt-2.5 border-t border-white/5 font-body">
                <span>Streak: <strong className="text-[#AFF65B] font-mono">{gateStreak}</strong></span>
                <button
                  onClick={() => {
                    setGateQuestion(null);
                    setPendingMove(null);
                  }}
                  className="text-xs text-[#E5484D] hover:underline bg-transparent border-none cursor-pointer"
                >
                  Cancel Move
                </button>
              </div>
            </div>
          ) : null
        }
        sidePanels={
          <>
            <div className="bento-card bento-charcoal p-5">
              <span className="matiks-kicker text-[10px] block mb-2">HOW IT PLAYS</span>
              <div className="flex gap-2 mb-3">
                <button
                  className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold cursor-pointer border-none transition-colors ${
                    subMode === 'gate' ? 'bg-[#AFF65B] text-[#0E0E0E]' : 'bg-[#262626] text-[#8A8A8A] hover:text-[#F4F4F4]'
                  }`}
                  onClick={() => setSubMode('gate')}
                >
                  Mind gate
                </button>
                <button
                  className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold cursor-pointer border-none transition-colors ${
                    subMode === 'showdown' ? 'bg-[#AFF65B] text-[#0E0E0E]' : 'bg-[#262626] text-[#8A8A8A] hover:text-[#F4F4F4]'
                  }`}
                  onClick={() => setSubMode('showdown')}
                >
                  Speed duel
                </button>
              </div>
              <p className="text-xs text-[#8A8A8A] m-0">
                {subMode === 'gate'
                  ? 'Every move asks one quick mental maths question. A wrong answer costs 5 seconds.'
                  : 'Every 90 seconds, a 10-question duel triggers right in the main board. Beat the bot to win spells & power-ups.'}
              </p>
            </div>

            <div className="bento-card bento-charcoal p-5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="matiks-kicker text-[10px]">SPELL DECK</span>
                <span className="text-[10px] text-[#8A8A8A] uppercase font-mono">
                  {spellCooldown > 0 ? `Cooldown: ${spellCooldown} moves` : 'Ready'}
                </span>
              </div>
              <button
                className={`w-full text-left p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                  activeSpell === 'freeze'
                    ? 'bg-[#262626] border-[#AFF65B] text-[#AFF65B]'
                    : 'bg-[#262626] border-white/5 text-[#F4F4F4] hover:bg-[#333333]'
                } ${spellCooldown > 0 || freezeCharges === 0 || winner !== null ? 'opacity-40 cursor-not-allowed' : ''}`}
                disabled={spellCooldown > 0 || freezeCharges === 0 || winner !== null}
                onClick={() => setActiveSpell(activeSpell === 'freeze' ? null : 'freeze')}
              >
                <div className="font-semibold text-sm">❄ Freeze spell ×{freezeCharges}</div>
                <small className="text-[#8A8A8A] block mt-0.5">
                  Freeze a 3x3 area for the bot&apos;s next move.{activeSpell === 'freeze' ? ' Tap a square on the board.' : ''}
                </small>
              </button>
              <button
                className={`w-full text-left p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                  activeSpell === 'jump'
                    ? 'bg-[#262626] border-[#AFF65B] text-[#AFF65B]'
                    : 'bg-[#262626] border-white/5 text-[#F4F4F4] hover:bg-[#333333]'
                } ${spellCooldown > 0 || jumpCharges === 0 || winner !== null ? 'opacity-40 cursor-not-allowed' : ''}`}
                disabled={spellCooldown > 0 || jumpCharges === 0 || winner !== null}
                onClick={() => setActiveSpell(activeSpell === 'jump' ? null : 'jump')}
              >
                <div className="font-semibold text-sm">↺ Jump spell ×{jumpCharges}</div>
                <small className="text-[#8A8A8A] block mt-0.5">
                  Lift one non-king piece until after your next move.{activeSpell === 'jump' ? ' Tap its square.' : ''}
                </small>
              </button>
            </div>

            <div className="bento-card bento-charcoal p-5">
              <span className="matiks-kicker text-[10px] block mb-2">
                POWER-UPS ({inventory.length})
              </span>
              {inventory.length === 0 ? (
                <p className="text-xs text-[#8A8A8A] m-0 italic">No power-ups yet. Win a maths duel to earn charges.</p>
              ) : (
                <div className="space-y-1.5">
                  {inventory.map((pw, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleUsePowerUp(pw)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#262626] hover:bg-[#333333] border border-white/5 cursor-pointer text-xs"
                    >
                      <strong className="text-[#AFF65B] block">{powerLabels[pw].name}</strong>
                      <span className="text-[#8A8A8A] text-[11px]">{powerLabels[pw].desc}</span>
                    </button>
                  ))}
                </div>
              )}
              {(doubleMoveActive || activePowerUp || frozenMovesLeft > 0 || poisonSquare) && (
                <div className="mt-3 p-2 rounded-lg bg-[#262626] text-xs text-[#AFF65B]">
                  {doubleMoveActive && `Double move active (${doubleMoveCount}/2 used). `}
                  {activePowerUp && `Tap a target square for ${powerLabels[activePowerUp].name}. `}
                  {frozenMovesLeft > 0 && `Grid frozen for ${frozenMovesLeft} bot moves. `}
                  {poisonSquare && `Poison bed on ${poisonSquare} (${poisonStayCount}/3).`}
                </div>
              )}
            </div>
          </>
        }
        history={chess.history()}
        winner={winner}
        chessMmStats={{
          freezeCasts,
          jumpCasts,
          duelsWon,
          totalDuels,
        }}
        onNewGame={handleNewGame}
        onExit={onExit}
      />
  );
}
