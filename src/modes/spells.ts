import { Chess, Square } from 'chess.js';
import { SPELL_CONFIG, SpellId, SpellRarity, SpellStatus } from './spellConfig';

export interface SpellDef {
  id: SpellId;
  name: string;
  status: SpellStatus;
  rarity: SpellRarity;
  accent: string;
  textColor: string;
  effect: string;
  sourceTag: string;
  needsTarget: 'none' | 'square' | 'piece' | 'pawn';
  targetPrompt?: string;
  iconPath: string;
}

export const SPELL_REGISTRY: Record<SpellId, SpellDef> = {
  freeze: {
    id: 'freeze',
    name: 'Freeze',
    status: 'sourced',
    rarity: 'common',
    accent: '#50A0F0', // Sky
    textColor: '#0E0E0E',
    effect: "Locks a 3x3 area for the opponent's next turn only.",
    sourceTag: 'Spell Chess',
    needsTarget: 'square',
    targetPrompt: 'TAP A SQUARE TO CENTRE THE FREEZE',
    iconPath: '/spells/spell-icon-freeze.svg',
  },
  jump: {
    id: 'jump',
    name: 'Jump',
    status: 'sourced',
    rarity: 'rare',
    accent: '#66D4C2', // Teal
    textColor: '#0E0E0E',
    effect: 'Allows sliding pieces to leap through a chosen non-king piece.',
    sourceTag: 'Spell Chess (adapted)',
    needsTarget: 'piece',
    targetPrompt: 'TAP A NON-KING PIECE TO JUMP',
    iconPath: '/spells/spell-icon-jump.svg',
  },
  skip: {
    id: 'skip',
    name: 'Skip Turn',
    status: 'proposed',
    rarity: 'rare',
    accent: '#F07040', // Coral
    textColor: '#0E0E0E',
    effect: "Skip opponent's turn after your move so you move twice (no check on 1st move).",
    sourceTag: 'UNO-inspired',
    needsTarget: 'none',
    iconPath: '/spells/spell-icon-skip.svg',
  },
  surge: {
    id: 'surge',
    name: 'Score Surge',
    status: 'proposed',
    rarity: 'common',
    accent: '#F2D500', // Yellow
    textColor: '#0E0E0E',
    effect: 'Start your next maths duel with a +3 score head start.',
    sourceTag: 'UNO-inspired',
    needsTarget: 'none',
    iconPath: '/spells/spell-icon-surge.svg',
  },
  promote: {
    id: 'promote',
    name: 'Promote',
    status: 'existing',
    rarity: 'epic',
    accent: '#A594F0', // Lavender
    textColor: '#0E0E0E',
    effect: 'Instantly promote one of your pawns on rank 5+ to Q, R, B, or N.',
    sourceTag: 'Pawn promote (limits proposed)',
    needsTarget: 'pawn',
    targetPrompt: 'TAP A PAWN ON RANK 5+ TO PROMOTE',
    iconPath: '/spells/spell-icon-promote.svg',
  },
  timeboost: {
    id: 'timeboost',
    name: 'Time Boost',
    status: 'existing',
    rarity: 'common',
    accent: '#F4F4F4', // Off-white
    textColor: '#0E0E0E',
    effect: 'Add 20 seconds to your clock immediately.',
    sourceTag: 'Existing',
    needsTarget: 'none',
    iconPath: '/spells/spell-icon-timeboost.svg',
  },
  timedrain: {
    id: 'timedrain',
    name: 'Time Drain',
    status: 'existing',
    rarity: 'common',
    accent: '#F4F4F4', // Off-white
    textColor: '#0E0E0E',
    effect: 'Take 20 seconds off the bot clock immediately.',
    sourceTag: 'Existing',
    needsTarget: 'none',
    iconPath: '/spells/spell-icon-timedrain.svg',
  },
  poison: {
    id: 'poison',
    name: 'Poison Bed',
    status: 'existing',
    rarity: 'rare',
    accent: '#E5484D', // Red
    textColor: '#F4F4F4',
    effect: 'Infuse a square with poison. A piece staying 3 consecutive moves dies.',
    sourceTag: 'Existing',
    needsTarget: 'square',
    targetPrompt: 'TAP A SQUARE TO PLACE POISON BED',
    iconPath: '/spells/spell-icon-poison.svg',
  },
  rewind: {
    id: 'rewind',
    name: 'Rewind',
    status: 'existing',
    rarity: 'rare',
    accent: '#0FB567', // Emerald
    textColor: '#0E0E0E',
    effect: 'Take back your last move and the bot reply (undo last 2 plies).',
    sourceTag: 'Existing (redo)',
    needsTarget: 'none',
    iconPath: '/spells/spell-icon-rewind.svg',
  },
};

export const ALL_SPELLS = Object.values(SPELL_REGISTRY);

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

/**
 * Calculate the 3x3 square area for Freeze
 */
export function getFreezeArea(centerSq: string): Set<string> {
  const fIdx = FILES.indexOf(centerSq[0]);
  const rIdx = RANKS.indexOf(centerSq[1]);
  const frozen = new Set<string>();

  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      const f = fIdx + df;
      const r = rIdx + dr;
      if (f >= 0 && f < 8 && r >= 0 && r < 8) {
        frozen.add(`${FILES[f]}${RANKS[r]}`);
      }
    }
  }
  return frozen;
}

/**
 * Check whether a Freeze cast is strictly legal:
 * - Opponent must have at least one legal move whose `from` square is NOT frozen.
 * - This prevents Freeze from causing artificial checkmate or stalemate.
 */
export function canCastFreeze(chess: Chess, centerSq: string): { allowed: boolean; reason?: string } {
  const frozenArea = getFreezeArea(centerSq);

  // Simulate opponent's turn
  const fen = chess.fen();
  const tokens = fen.split(' ');
  const opponentTurn = tokens[1] === 'w' ? 'b' : 'w';
  tokens[1] = opponentTurn;
  tokens[3] = '-'; // clear en passant

  try {
    const simChess = new Chess(tokens.join(' '));
    const legalMoves = simChess.moves({ verbose: true });

    // Filter out moves whose from square is in the frozen area
    const availableMoves = legalMoves.filter((m) => !frozenArea.has(m.from));

    if (availableMoves.length === 0) {
      return {
        allowed: false,
        reason: 'Cannot cast Freeze: opponent would have zero selectable legal moves.',
      };
    }

    return { allowed: true };
  } catch {
    // If simulation fails for edge board states, test directly against current legal moves
    const opponentMoves = chess.moves({ verbose: true }).filter((m) => !frozenArea.has(m.from));
    if (opponentMoves.length === 0 && chess.moves().length > 0) {
      return {
        allowed: false,
        reason: 'Cannot cast Freeze: opponent would have zero selectable legal moves.',
      };
    }
    return { allowed: true };
  }
}

/**
 * Check whether a Jump cast is legal:
 * - Cannot target a king
 * - Target square must hold a piece
 * - Removing the piece must not leave player's own king in check
 */
export function canCastJump(chess: Chess, targetSq: string, playerColor: 'w' | 'b'): { allowed: boolean; reason?: string } {
  const piece = chess.get(targetSq as Square);
  if (!piece) {
    return { allowed: false, reason: 'Target square is empty.' };
  }
  if (piece.type === 'k') {
    return { allowed: false, reason: 'A King can never be jumped.' };
  }

  // Verify own king safety when piece is temporarily removed
  const fen = chess.fen();
  try {
    const sim = new Chess(fen);
    sim.remove(targetSq as Square);

    // If removing the piece exposed player's king, reject!
    if (sim.isCheck() && sim.turn() === playerColor) {
      return {
        allowed: false,
        reason: 'Cannot jump this piece: your King would be exposed to attack.',
      };
    }
  } catch {
    return { allowed: false, reason: 'Invalid board state for Jump.' };
  }

  return { allowed: true };
}

/**
 * Check whether a Promote cast is legal:
 * - Must be player's own pawn
 * - Must be rank >= 5 from player's side (rank '5', '6', '7' for White)
 * - Cannot be on rank 8 (already promoted)
 */
export function canCastPromote(chess: Chess, targetSq: string, playerColor: 'w' | 'b'): { allowed: boolean; reason?: string } {
  const piece = chess.get(targetSq as Square);
  if (!piece || piece.color !== playerColor || piece.type !== 'p') {
    return { allowed: false, reason: 'Target must be one of your pawns.' };
  }

  const rank = parseInt(targetSq[1], 10);
  const minRank = SPELL_CONFIG.promoteMinRankFromOwnSide;

  if (playerColor === 'w') {
    if (rank < minRank || rank >= 8) {
      return { allowed: false, reason: `White pawn must be on rank ${minRank}+ to promote.` };
    }
  } else {
    // For black, rank 1 to 4
    if (rank > (9 - minRank) || rank <= 1) {
      return { allowed: false, reason: `Black pawn must be on rank ${9 - minRank} or closer to promote.` };
    }
  }

  return { allowed: true };
}

/**
 * Roll a random spell drop according to rarity weights
 */
export function rollSpellDrop(isFirstDrop = false, forcedSpellId?: SpellId): SpellDef {
  if (forcedSpellId && SPELL_REGISTRY[forcedSpellId]) {
    return SPELL_REGISTRY[forcedSpellId];
  }

  const { common, rare, epic } = SPELL_CONFIG.rarityWeights;
  const total = common + rare + epic;
  const roll = Math.random() * total;

  let rarity: SpellRarity = 'common';
  if (roll < common) {
    rarity = 'common';
  } else if (roll < common + rare) {
    rarity = 'rare';
  } else {
    rarity = 'epic';
  }

  // Filter registry
  let candidates = ALL_SPELLS.filter((s) => s.rarity === rarity);
  if (isFirstDrop) {
    // Rule: Poison Bed cannot drop in the first drop of a game
    candidates = candidates.filter((s) => s.id !== 'poison');
  }

  if (candidates.length === 0) {
    candidates = ALL_SPELLS.filter((s) => s.id !== 'poison');
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  return chosen;
}
