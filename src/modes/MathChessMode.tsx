import { useState, useMemo, useEffect, useCallback } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { useStockfish, getBotByElo } from '../ai/useStockfish';
import CourtyardMatch, { SquareMark } from './CourtyardMatch';
import MathDuelOverlay from './MathDuelOverlay';
import { unlockAchievement } from '../chaturanga/achievements';
import { recordGameResult } from '../chaturanga/stats';
import { usePreferences } from '../chaturanga/preferences';
import { usePremoveHandler } from '../chaturanga/usePremoveHandler';
import {
  SPELL_REGISTRY,
  SpellDef,
  rollSpellDrop,
  getFreezeArea,
  canCastFreeze,
  canCastJump,
  canCastPromote,
} from './spells';
import { SPELL_CONFIG } from './spellConfig';
import SpellDropModal from './SpellDropModal';
import SpellbookModal from './SpellbookModal';
import SpellTrayCard from './SpellTrayCard';
import SpellIcon from './SpellIcon';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export interface MathQuestion {
  question: string;
  answer: number;
  options: number[];
}

export interface MathChessModeProps {
  onExit: () => void;
  botElo: number;
  forcedDropId?: string; // Test hook for deterministic testing
}

// Helper to generate mental math questions
export function generateMathQuestion(): MathQuestion {
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

  const optionsSet = new Set<number>([answer]);
  while (optionsSet.size < 4) {
    const delta = (Math.floor(Math.random() * 10) + 1) * (Math.random() > 0.5 ? 1 : -1);
    const fake = answer + delta;
    if (fake >= 0) optionsSet.add(fake);
  }

  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);
  return { question, answer, options };
}

export default function MathChessMode({ onExit, botElo, forcedDropId }: MathChessModeProps) {
  // Submode: Mode 1 = Mind Gate, Mode 2 = 10-Min Match with Speed Duel
  const [subMode, setSubMode] = useState<'gate' | 'showdown'>('showdown');

  const [chess, setChess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]);
  const [winner, setWinner] = useState<'w' | 'b' | 'draw' | null>(null);
  const [resultReason, setResultReason] = useState<string | null>(null);

  // Clocks
  const [playerTime, setPlayerTime] = useState<number>(600);
  const [botTime, setBotTime] = useState<number>(600);
  const [showdownTimer, setShowdownTimer] = useState<number>(90);

  // Mode 1: Math Gate State
  const [gateQuestion, setGateQuestion] = useState<MathQuestion | null>(null);
  const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null);
  const [mathGateSolved, setMathGateSolved] = useState<boolean>(false);
  const [gateStreak, setGateStreak] = useState<number>(0);

  // Mode 2: Math Showdown Modal State
  const [inMathShowdown, setInMathShowdown] = useState<boolean>(false);
  const [showdownQuestions, setShowdownQuestions] = useState<MathQuestion[]>([]);
  const [showdownIdx, setShowdownIdx] = useState<number>(0);
  const [showdownScore, setShowdownScore] = useState<number>(0);
  const [, setShowdownRoundCount] = useState<number>(0);
  const [questionResults, setQuestionResults] = useState<boolean[]>([]);

  // v3 Spell System State
  const [spellbook, setSpellbook] = useState<SpellDef[]>([]);
  const [pendingDrop, setPendingDrop] = useState<SpellDef | null>(null);
  const [showSpellbookModal, setShowSpellbookModal] = useState<boolean>(false);
  const [armedSpell, setArmedSpell] = useState<SpellDef | null>(null);
  const [castsThisTurn, setCastsThisTurn] = useState<number>(0);
  const [spellError, setSpellError] = useState<string | null>(null);

  // Active spell modifiers
  const [spellFrozen, setSpellFrozen] = useState<Set<string>>(new Set());
  const [jumpedPiece, setJumpedPiece] = useState<{ square: string; piece: { type: any; color: any } } | null>(null);
  const [skipTurnActive, setSkipTurnActive] = useState<boolean>(false);
  const [scoreSurgeActive, setScoreSurgeActive] = useState<boolean>(false);
  const [poisonSquare, setPoisonSquare] = useState<string | null>(null);
  const [poisonOccupant, setPoisonOccupant] = useState<string | null>(null);
  const [poisonStayCount, setPoisonStayCount] = useState<number>(0);
  const [promotingSquare, setPromotingSquare] = useState<string | null>(null);

  // Stats for match analysis
  const [freezeCasts, setFreezeCasts] = useState<number>(0);
  const [jumpCasts, setJumpCasts] = useState<number>(0);
  const [duelsWon, setDuelsWon] = useState<number>(0);
  const [totalDuels, setTotalDuels] = useState<number>(0);

  const { getBestMove, stopThinking } = useStockfish();
  const { prefs } = usePreferences();
  const currentBot = getBotByElo(botElo);

  // Check Game Over Helper
  const checkGameOver = useCallback(() => {
    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        const winningColor = chess.turn() === 'w' ? 'b' : 'w';
        setWinner(winningColor);
        if (winningColor === 'w') {
          setResultReason('VICTORY · CHECKMATE');
          recordGameResult('win');
        } else {
          setResultReason('DEFEAT · CHECKMATE');
          recordGameResult('loss');
        }
      } else if (chess.isDraw()) {
        const reason = chess.isStalemate()
          ? 'DRAW · STALEMATE'
          : chess.isThreefoldRepetition()
            ? 'DRAW · THREEFOLD REPETITION'
            : chess.isInsufficientMaterial()
              ? 'DRAW · INSUFFICIENT MATERIAL'
              : 'DRAW · 50-MOVE RULE';
        setWinner('draw');
        setResultReason(reason);
        recordGameResult('draw');
      }
    }
  }, [chess]);

  const {
    premoves,
    premoveSquares,
    premoveAlert,
    handlePremoveSquareClick,
    clearPremoves,
    setPremoveAlert,
  } = usePremoveHandler({
    chess,
    playerColor: 'w',
    isPlayerTurn: chess.turn() === 'w' && !winner && !inMathShowdown,
    isGameOver: Boolean(winner),
    premoveLimit: prefs.premoveLimit,
    onMoveSuccess: (move) => {
      recordCapture(move);
      setFen(chess.fen());
      setLastMove({ from: move.from, to: move.to });
      setSelectedSquare(null);
    },
    onGameOverCheck: checkGameOver,
  });

  const handleResign = () => {
    if (winner) return;
    stopThinking();
    clearPremoves();
    setWinner('b');
    setResultReason('DEFEAT · RESIGNED');
    recordGameResult('loss');
  };

  // Reset casts count on turn arrival
  useEffect(() => {
    if (chess.turn() === 'w') {
      setCastsThisTurn(0);
    }
  }, [chess, fen]);

  // Test hooks for screenshot and automation
  useEffect(() => {
    (window as any).__setChessMmSpells = (spellIds: any[]) => {
      setSpellbook(spellIds.map((id) => (SPELL_REGISTRY as any)[id]).filter(Boolean));
    };
    (window as any).__triggerSpellDrop = (spellId: any) => {
      setPendingDrop((SPELL_REGISTRY as any)[spellId] || SPELL_REGISTRY.freeze);
    };
    (window as any).__openSpellbookModal = () => {
      setShowSpellbookModal(true);
    };
    (window as any).__armSpell = (spellId: any) => {
      setArmedSpell((SPELL_REGISTRY as any)[spellId] || null);
    };
  }, []);

  // Main game clock timer
  useEffect(() => {
    if (winner || inMathShowdown) return;

    const interval = setInterval(() => {
      if (chess.turn() === 'w') {
        setPlayerTime((t) => {
          if (t <= 1) {
            setWinner('b');
            setResultReason('DEFEAT · TIME FORFEIT');
            recordGameResult('loss');
            return 0;
          }
          return t - 1;
        });
      } else {
        setBotTime((t) => {
          if (t <= 1) {
            setWinner('w');
            setResultReason('VICTORY · WON ON TIME');
            unlockAchievement('first-win');
            recordGameResult('win');
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [chess, winner, inMathShowdown]);

  // Periodic Math Showdown Countdown (90s)
  useEffect(() => {
    if (winner || inMathShowdown || subMode !== 'showdown') return;

    const interval = setInterval(() => {
      setShowdownTimer((t) => {
        if (t <= 1) {
          triggerMathShowdown();
          return 90;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [winner, inMathShowdown, subMode, scoreSurgeActive]);

  // Trigger Math Showdown
  const triggerMathShowdown = () => {
    const qList: MathQuestion[] = [];
    for (let i = 0; i < 10; i++) {
      qList.push(generateMathQuestion());
    }
    setShowdownQuestions(qList);
    setShowdownIdx(0);

    // Score Surge: if active, player starts with +3 head start!
    const startingScore = scoreSurgeActive ? SPELL_CONFIG.scoreSurgeBonus : 0;
    setShowdownScore(startingScore);
    setScoreSurgeActive(false);

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
      setPlayerTime((t) => Math.max(0, t - 3));
    }

    if (showdownIdx < 9) {
      setShowdownIdx((idx) => idx + 1);
    } else {
      // Showdown complete!
      setInMathShowdown(false);
      setShowdownRoundCount((rc) => rc + 1);
      setTotalDuels((td) => td + 1);

      const botScore = Math.min(10, Math.floor(botElo / 400) + Math.floor(Math.random() * 3));

      if (newScore >= botScore) {
        // Player wins duel! Roll spell drop
        setDuelsWon((dw) => dw + 1);
        unlockAchievement('speed-duel-win');

        const isFirstDrop = duelsWon === 0;
        const droppedSpell = rollSpellDrop(isFirstDrop, forcedDropId as any);
        setPendingDrop(droppedSpell);
      }
    }
  };

  // Record captures
  const recordCapture = (moveResult: Move) => {
    const captured = moveResult.captured;
    if (captured) {
      if (moveResult.color === 'w') {
        setCapturedByWhite((prev) => [...prev, captured]);
      } else {
        setCapturedByBlack((prev) => [...prev, captured]);
      }
    }
  };

  // Cast Freeze
  const castFreeze = (centerSq: string) => {
    const check = canCastFreeze(chess, centerSq);
    if (!check.allowed) {
      setSpellError(check.reason || 'Cannot cast Freeze here.');
      return;
    }

    unlockAchievement('tactics-champion');
    setFreezeCasts((c) => c + 1);
    const newlyFrozen = getFreezeArea(centerSq);
    setSpellFrozen(newlyFrozen);
    setSpellbook((prev) => prev.filter((s) => s !== armedSpell));
    setCastsThisTurn((c) => c + 1);
    setArmedSpell(null);
    setSpellError(null);
  };

  // Cast Jump
  const castJump = (targetSq: string) => {
    const check = canCastJump(chess, targetSq, 'w');
    if (!check.allowed) {
      setSpellError(check.reason || 'Cannot jump this piece.');
      return;
    }

    unlockAchievement('tactics-champion');
    setJumpCasts((c) => c + 1);
    const piece = chess.get(targetSq as Square)!;
    setJumpedPiece({ square: targetSq, piece });
    chess.remove(targetSq as Square);
    setFen(chess.fen());
    setSpellbook((prev) => prev.filter((s) => s !== armedSpell));
    setCastsThisTurn((c) => c + 1);
    setArmedSpell(null);
    setSpellError(null);
  };

  // Cast Instant Spells
  const castInstantSpell = (spell: SpellDef) => {
    if (castsThisTurn >= SPELL_CONFIG.castsPerTurn) {
      setSpellError('Maximum 1 spell cast per turn.');
      return;
    }

    if (spell.id === 'timeboost') {
      setPlayerTime((t) => t + SPELL_CONFIG.timeBoostSeconds);
    } else if (spell.id === 'timedrain') {
      setBotTime((t) => Math.max(0, t - SPELL_CONFIG.timeDrainSeconds));
    } else if (spell.id === 'skip') {
      setSkipTurnActive(true);
    } else if (spell.id === 'surge') {
      setScoreSurgeActive(true);
    } else if (spell.id === 'rewind') {
      try {
        if (chess.history().length > 0) {
          chess.undo(); // Undo bot move
          if (chess.turn() === 'b' && chess.history().length > 0) {
            chess.undo(); // Undo player move
          }
          setFen(chess.fen());
          setSelectedSquare(null);
        }
      } catch (e) {
        setSpellError('Cannot rewind further.');
        return;
      }
    }

    unlockAchievement('tactics-champion');
    setSpellbook((prev) => prev.filter((s) => s !== spell));
    setCastsThisTurn((c) => c + 1);
    setArmedSpell(null);
    setSpellError(null);
  };

  // Cast Promote execution
  const executePromote = (pieceType: 'q' | 'r' | 'b' | 'n') => {
    if (!promotingSquare) return;

    const originalPiece = chess.get(promotingSquare as Square);
    chess.remove(promotingSquare as Square);
    chess.put({ type: pieceType, color: 'w' }, promotingSquare as Square);

    // Verify own king safety
    if (chess.isCheck() && chess.turn() === 'w') {
      // Revert!
      chess.remove(promotingSquare as Square);
      if (originalPiece) chess.put(originalPiece, promotingSquare as Square);
      setSpellError('Cannot promote: your King would be left in check.');
      setPromotingSquare(null);
      return;
    }

    unlockAchievement('tactics-champion');
    setFen(chess.fen());
    setSpellbook((prev) => prev.filter((s) => s !== armedSpell));
    setCastsThisTurn((c) => c + 1);
    setArmedSpell(null);
    setPromotingSquare(null);
    setSpellError(null);
    checkGameOver();
  };

  // Move execution
  const executePlayerMove = (from: string, to: string) => {
    try {
      const move = chess.move({ from, to, promotion: 'q' });

      // If Jump was active, piece restores after your move
      if (jumpedPiece) {
        chess.put(jumpedPiece.piece as any, jumpedPiece.square as Square);
        setJumpedPiece(null);
      }

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
            if (newCount >= SPELL_CONFIG.poisonMovesLimit) {
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

      // Check Skip Turn Mechanic
      if (skipTurnActive) {
        // Restriction: first move may not give check
        if (chess.isCheck()) {
          // Revert first move!
          chess.undo();
          setFen(chess.fen());
          setSpellError('Skip Turn restriction: your first move may not give check.');
          return;
        }

        // Opponent turn is skipped: set side to move back to White ('w') and clear en passant
        const tokens = chess.fen().split(' ');
        tokens[1] = 'w';
        tokens[3] = '-';
        const newFen = tokens.join(' ');
        chess.load(newFen);
        setFen(newFen);
        setSkipTurnActive(false); // consumed! Player now moves again.
        return;
      }

      checkGameOver();
    } catch (e) {
      setSelectedSquare(null);
    }
  };

  // Legal moves calculation
  const legalMoves = useMemo(() => {
    if (!selectedSquare || winner || inMathShowdown) return new Set<string>();
    if (spellFrozen.has(selectedSquare) && chess.turn() === 'w') return new Set<string>();

    try {
      const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
      const valid = moves.filter((m) => !jumpedPiece || m.to !== jumpedPiece.square);
      return new Set(valid.map((m: Move) => m.to));
    } catch (e) {
      return new Set<string>();
    }
  }, [selectedSquare, fen, chess, winner, spellFrozen, jumpedPiece, inMathShowdown]);

  // Display board showing jumped piece in place
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

  // Check Square calculation
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

  // Handle Board Square Click
  const handleSquareClick = (sq: string) => {
    if (winner || inMathShowdown) return;

    if (chess.turn() !== 'w') {
      handlePremoveSquareClick(sq);
      return;
    }

    // If a targeted spell is armed:
    if (armedSpell) {
      if (armedSpell.id === 'freeze') {
        castFreeze(sq);
        return;
      }
      if (armedSpell.id === 'jump') {
        castJump(sq);
        return;
      }
      if (armedSpell.id === 'poison') {
        setPoisonSquare(sq);
        const piece = chess.get(sq as Square);
        setPoisonOccupant(piece ? `${piece.color}-${piece.type}` : null);
        setPoisonStayCount(piece ? 1 : 0);
        unlockAchievement('tactics-champion');
        setSpellbook((prev) => prev.filter((s) => s !== armedSpell));
        setCastsThisTurn((c) => c + 1);
        setArmedSpell(null);
        setSpellError(null);
        return;
      }
      if (armedSpell.id === 'promote') {
        const check = canCastPromote(chess, sq, 'w');
        if (!check.allowed) {
          setSpellError(check.reason || 'Cannot promote this square.');
          return;
        }
        setPromotingSquare(sq);
        return;
      }
    }

    // Normal chess move selection
    if (selectedSquare) {
      if (legalMoves.has(sq)) {
        if (subMode === 'gate' && !mathGateSolved) {
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

  // Solve Math Gate
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
      setPlayerTime((t) => Math.max(0, t - 5));
      setGateQuestion(generateMathQuestion());
    }
  };

  // Bot Turn Handler
  useEffect(() => {
    if (winner || chess.turn() === 'w' || inMathShowdown || skipTurnActive) return;
    let isActive = true;

    const playBotMove = async () => {
      let moveStr = await getBestMove(chess.fen(), currentBot);
      if (!isActive || !moveStr) return;

      try {
        // Freeze handling: if best move is from a frozen square, select another legal move!
        if (spellFrozen.has(moveStr.slice(0, 2))) {
          const validMoves = chess.moves({ verbose: true }).filter((m) => !spellFrozen.has(m.from));
          if (validMoves.length > 0) {
            const m = validMoves[Math.floor(Math.random() * validMoves.length)];
            moveStr = m.from + m.to + (m.promotion || '');
          }
        }
        // Freeze lifts after bot move
        setSpellFrozen(new Set());

        const from = moveStr.slice(0, 2);
        const to = moveStr.slice(2, 4);
        const promotion = moveStr.length > 4 ? moveStr[4] : undefined;

        const move = chess.move({ from, to, promotion });
        recordCapture(move);
        setFen(chess.fen());
        setLastMove({ from, to });
        checkGameOver();
      } catch (e) {
        console.error('Bot move error:', moveStr);
      }
    };
    playBotMove();

    return () => {
      isActive = false;
    };
  }, [fen, chess, getBestMove, currentBot, winner, inMathShowdown, skipTurnActive, spellFrozen, checkGameOver]);

  const handleNewGame = () => {
    clearPremoves();
    const newChess = new Chess();
    setChess(newChess);
    setFen(newChess.fen());
    setSelectedSquare(null);
    setLastMove(null);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setWinner(null);
    setResultReason(null);
    setPlayerTime(600);
    setBotTime(600);
    setShowdownTimer(90);
    setSpellbook([]);
    setArmedSpell(null);
    setSpellFrozen(new Set());
    setJumpedPiece(null);
    setSkipTurnActive(false);
    setScoreSurgeActive(false);
    setPoisonSquare(null);
    setCastsThisTurn(0);
    setSpellError(null);
  };

  // Square marks on board
  const squareMarks: Record<string, SquareMark> = {};
  spellFrozen.forEach((sq) => {
    squareMarks[sq] = { className: 'frozen', icon: '❄' };
  });
  if (poisonSquare) {
    squareMarks[poisonSquare] = { className: 'poison', icon: '☠' };
  }
  if (jumpedPiece) {
    squareMarks[jumpedPiece.square] = { className: 'jumped', icon: '↺' };
  }

  // Preview targeting squares
  const previewTargetSquares = useMemo(() => {
    if (!armedSpell) return new Set<string>();
    if (armedSpell.id === 'promote') {
      const pawns = new Set<string>();
      for (const r of [5, 6, 7]) {
        for (const f of FILES) {
          const sq = `${f}${r}`;
          const p = chess.get(sq as Square);
          if (p && p.color === 'w' && p.type === 'p') pawns.add(sq);
        }
      }
      return pawns;
    }
    if (armedSpell.id === 'jump') {
      const nonKings = new Set<string>();
      for (const r of RANKS) {
        for (const f of FILES) {
          const sq = `${f}${r}`;
          const p = chess.get(sq as Square);
          if (p && p.type !== 'k') nonKings.add(sq);
        }
      }
      return nonKings;
    }
    return new Set<string>();
  }, [armedSpell, chess]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
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
        botActive={chess.turn() === 'b' && !winner && !skipTurnActive}
        playerActive={chess.turn() === 'w' && !winner && !inMathShowdown}
        playerClock={formatTime(playerTime)}
        botClock={skipTurnActive ? 'SKIPPED' : formatTime(botTime)}
        duelCountdown={
          subMode === 'showdown' && !inMathShowdown
            ? `${formatTime(showdownTimer)}${scoreSurgeActive ? ' (+3 Surge)' : ''}`
            : undefined
        }
        status={
          inMathShowdown
            ? 'Maths duel in progress - clocks paused.'
            : subMode === 'gate'
              ? 'Solve a quick question to unlock each move.'
              : `Next maths duel in ${formatTime(showdownTimer)}.`
        }
        premoveSquares={premoveSquares.size > 0 ? premoveSquares : previewTargetSquares}
        premovesCount={premoves.length}
        onClearPremoves={clearPremoves}
        premoveAlert={premoveAlert}
        onDismissPremoveAlert={() => setPremoveAlert(null)}
        onResign={handleResign}
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
              botName={currentBot.name || 'Aarav'}
              botRating={botElo}
              freezeCharges={spellbook.filter((s) => s.id === 'freeze').length}
              jumpCharges={spellbook.filter((s) => s.id === 'jump').length}
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
                <span>
                  Streak: <strong className="text-[#AFF65B] font-mono">{gateStreak}</strong>
                </span>
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
          ) : promotingSquare ? (
            <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 w-full max-w-[360px] shadow-2xl flex flex-col items-center text-center">
              <span className="text-[10px] font-bold tracking-[2px] text-[#A594F0] uppercase block mb-1">
                PROMOTE PAWN · CHOOSE PIECE
              </span>
              <h3 className="font-heading text-2xl text-[#F4F4F4] m-0 mb-4">
                Square {promotingSquare}
              </h3>
              <div className="grid grid-cols-4 gap-2 w-full mb-3">
                {(['q', 'r', 'b', 'n'] as const).map((choice) => (
                  <button
                    key={choice}
                    onClick={() => executePromote(choice)}
                    className="p-3 rounded-xl bg-[#262626] hover:bg-[#A594F0] hover:text-[#0E0E0E] text-[#F4F4F4] font-heading text-2xl border border-white/10 cursor-pointer transition-colors"
                  >
                    {choice.toUpperCase()}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPromotingSquare(null)}
                className="text-xs text-[#8A8A8A] hover:text-red-400 bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
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
                    subMode === 'gate'
                      ? 'bg-[#AFF65B] text-[#0E0E0E]'
                      : 'bg-[#262626] text-[#8A8A8A] hover:text-[#F4F4F4]'
                  }`}
                  onClick={() => setSubMode('gate')}
                >
                  Mind gate
                </button>
                <button
                  className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold cursor-pointer border-none transition-colors ${
                    subMode === 'showdown'
                      ? 'bg-[#AFF65B] text-[#0E0E0E]'
                      : 'bg-[#262626] text-[#8A8A8A] hover:text-[#F4F4F4]'
                  }`}
                  onClick={() => setSubMode('showdown')}
                >
                  Speed duel
                </button>
              </div>
              <p className="text-xs text-[#8A8A8A] m-0">
                {subMode === 'gate'
                  ? 'Every move asks one quick mental maths question. A wrong answer costs 5 seconds.'
                  : 'Every 90 seconds, a 10-question duel triggers right in the main board. Beat the bot to win spells & random drops.'}
              </p>
            </div>

            {/* Targeted spell active indicator & cancel */}
            {armedSpell && (
              <div
                className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold border-2 shadow-lg"
                style={{
                  backgroundColor: '#1A1A1A',
                  borderColor: armedSpell.accent,
                }}
              >
                <div className="flex items-center gap-2">
                  <SpellIcon id={armedSpell.id} size={24} />
                  <span className="font-heading text-sm" style={{ color: armedSpell.accent }}>
                    {armedSpell.targetPrompt || `ARMED: ${armedSpell.name}`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setArmedSpell(null);
                    setSpellError(null);
                  }}
                  className="text-[10px] text-red-400 hover:text-red-300 uppercase font-bold cursor-pointer"
                >
                  Cancel [✕]
                </button>
              </div>
            )}

            {/* Spell Error Toast */}
            {spellError && (
              <div className="w-full flex items-center justify-between px-3 py-2 bg-red-950/70 border border-red-500/40 rounded-xl text-xs text-red-300">
                <span>⚠️ {spellError}</span>
                <button
                  onClick={() => setSpellError(null)}
                  className="text-xs text-red-400 cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Single v3 Spellbook Panel */}
            <SpellTrayCard
              spells={spellbook}
              maxSlots={SPELL_CONFIG.slotCap}
              armedSpellId={armedSpell?.id || null}
              castsThisTurn={castsThisTurn}
              isPlayerTurn={chess.turn() === 'w' && !winner && !inMathShowdown}
              isGameOver={Boolean(winner)}
              surgeActive={scoreSurgeActive}
              onSelectSpell={(spell) => {
                setSpellError(null);
                setArmedSpell(spell);
              }}
              onDisarmSpell={() => {
                setArmedSpell(null);
                setSpellError(null);
              }}
              onCastInstant={castInstantSpell}
              onOpenCatalogue={() => setShowSpellbookModal(true)}
            />
          </>
        }
        history={chess.history()}
        winner={winner}
        resultTitle={resultReason || undefined}
        chessMmStats={{
          freezeCasts,
          jumpCasts,
          duelsWon,
          totalDuels,
        }}
        onNewGame={handleNewGame}
        onExit={onExit}
      />

      {/* Spell Drop Moment Reveal Modal */}
      {pendingDrop && (
        <SpellDropModal
          spell={pendingDrop}
          currentSpellCount={spellbook.length}
          maxSlots={SPELL_CONFIG.slotCap}
          currentSpells={spellbook}
          onAddToSpellbook={(spell) => {
            setSpellbook((prev) => [...prev.slice(0, SPELL_CONFIG.slotCap - 1), spell]);
            setPendingDrop(null);
          }}
          onReplaceSpell={(idx, spell) => {
            setSpellbook((prev) => {
              const copy = [...prev];
              copy[idx] = spell;
              return copy;
            });
            setPendingDrop(null);
          }}
          onDiscard={() => setPendingDrop(null)}
        />
      )}

      {/* 3x3 Bento Spellbook Catalogue Modal */}
      {showSpellbookModal && (
        <SpellbookModal onClose={() => setShowSpellbookModal(false)} />
      )}
    </>
  );
}
