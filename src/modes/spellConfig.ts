/**
 * Chess MM Spells Configuration
 * Every value marked PROPOSED is a design default awaiting owner approval.
 * Putting them in this single file allows tuning without changing game logic.
 */
export const SPELL_CONFIG = {
  startingSpells: 0, // owner-requested, not a proposal
  slotCap: 3, // PROPOSED: maximum spells in the spellbook tray
  castsPerTurn: 1, // PROPOSED: max spells castable in a single turn
  dropTrigger: 'duelWin', // PROPOSED: spell drop is awarded on winning a maths speed duel
  rarityWeights: {
    common: 50, // PROPOSED: 50%
    rare: 35, // PROPOSED: 35%
    epic: 15, // PROPOSED: 15%
  },
  scoreSurgeBonus: 3, // PROPOSED: +3 head start for the next maths duel
  promoteMinRankFromOwnSide: 5, // PROPOSED: rank 5 or higher from own side (i.e. ranks 5, 6, 7 for White)
  promoteChoices: ['q', 'r', 'b', 'n'] as const, // PROPOSED: choices when promoting
  jumpAffectsOpponent: true, // PROPOSED: jump lasts through opponent's reply
  timeBoostSeconds: 20, // +20s clock boost
  timeDrainSeconds: 20, // -20s bot clock drain
  poisonMovesLimit: 3, // Piece lost if staying 3 moves on poison bed
  freezeGridSize: 3, // 3x3 square area

  // Animation Timings (PROPOSED, Clash-of-Clans-style feel)
  animation: {
    dimBannerMs: 220,
    fallMs: 260,
    squashMs: 80,
    ringsMs: 360,
    confettiMs: 600,
    shakeMs: 120,
    settleMs: 200,
    flipMs: 260,
    revealReadyMs: 1000,
    flyToSlotMs: 450,
  },
} as const;

export type SpellRarity = 'common' | 'rare' | 'epic';
export type SpellStatus = 'sourced' | 'proposed' | 'existing';
export type SpellId =
  | 'freeze'
  | 'jump'
  | 'skip'
  | 'surge'
  | 'promote'
  | 'timeboost'
  | 'timedrain'
  | 'poison'
  | 'rewind';
