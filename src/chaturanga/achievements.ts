/**
 * Chaturanga Postage-Stamp Achievements Module
 * Device-local persistence, serializable, pure, unit-tested.
 */

export type AchievementSetId =
  | 'variant'
  | 'chess-mm'
  | 'training'
  | 'milestones'
  | 'checkmate'
  | 'tactics'
  | 'learning'
  | 'consistency';

export interface Achievement {
  id: string;
  set: AchievementSetId;
  setName: string;
  title: string;
  description: string;
  lockedStampSvg: string;
  unlockedStampSvg: string;
  accentColor: string;
  icon?: string;
  denomination?: string;
}

export const ACHIEVEMENT_SETS: Array<{ id: AchievementSetId; name: string; desc: string }> = [
  { id: 'variant', name: 'Variant Set', desc: 'Rules from Fischer 960 to 3 & 4-Player Cross battles' },
  { id: 'chess-mm', name: 'Chess MM Set', desc: 'Mental mathematics, speed duels & spellcraft' },
  { id: 'training', name: 'Training Set', desc: 'Tactical milestones, openings & mating sprints' },
  { id: 'milestones', name: 'Milestones Set', desc: 'Wins, games played, marathon clashes & comebacks' },
  { id: 'checkmate', name: 'Checkmate Set', desc: 'Corridor mates, smothered jumps & promotion finishes' },
  { id: 'tactics', name: 'Tactics Set', desc: 'Forks, pins, skewers, queen sacrifices & en passant' },
  { id: 'learning', name: 'Learning Set', desc: 'Daily riddles, analysis post-mortems & book explorer' },
  { id: 'consistency', name: 'Consistency Set', desc: 'Daily training streaks from 3 to 30 days' },
];

export const ACHIEVEMENTS: Achievement[] = [
  // 1. Variant Set (6)
  {
    id: 'first-win',
    set: 'variant',
    setName: 'Variant Set',
    title: 'First Blood',
    description: 'Win your first game against any bot in standard chess.',
    lockedStampSvg: '/stamps/first-win-locked.svg',
    unlockedStampSvg: '/stamps/first-win-unlocked.svg',
    accentColor: '#F2D500',
    icon: 'pawn',
    denomination: '5¢',
  },
  {
    id: 'chess960-win',
    set: 'variant',
    setName: 'Variant Set',
    title: 'Fischer Chaos',
    description: 'Win a match in Chess960 with a randomized back-rank.',
    lockedStampSvg: '/stamps/chess960-locked.svg',
    unlockedStampSvg: '/stamps/chess960-unlocked.svg',
    accentColor: '#66D4C2',
    icon: 'dice',
    denomination: '10¢',
  },
  {
    id: 'fog-win',
    set: 'variant',
    setName: 'Variant Set',
    title: 'Eyes in the Mist',
    description: 'Win a match under Fog of War visibility rules.',
    lockedStampSvg: '/stamps/fog-win-locked.svg',
    unlockedStampSvg: '/stamps/fog-win-unlocked.svg',
    accentColor: '#A594F0',
    icon: 'fog',
    denomination: '15¢',
  },
  {
    id: 'atomic-win',
    set: 'variant',
    setName: 'Variant Set',
    title: 'Nuclear Checkmate',
    description: 'Win an Atomic match through devastating 3x3 detonations.',
    lockedStampSvg: '/stamps/atomic-win-locked.svg',
    unlockedStampSvg: '/stamps/atomic-win-unlocked.svg',
    accentColor: '#F07040',
    icon: 'burst',
    denomination: '20¢',
  },
  {
    id: 'cross-win',
    set: 'variant',
    setName: 'Variant Set',
    title: 'Cross Commander',
    description: 'Triumph in a 3-player or 4-player cross-board combat match.',
    lockedStampSvg: '/stamps/cross-win-locked.svg',
    unlockedStampSvg: '/stamps/cross-win-unlocked.svg',
    accentColor: '#AFF65B',
    icon: 'shield',
    denomination: '25¢',
  },
  {
    id: 'all-variants',
    set: 'variant',
    setName: 'Variant Set',
    title: 'Variant Grandmaster',
    description: 'Score a victory across all featured battle variants.',
    lockedStampSvg: '/stamps/all-variants-locked.svg',
    unlockedStampSvg: '/stamps/all-variants-unlocked.svg',
    accentColor: '#FF9F43',
    icon: 'crown',
    denomination: '50¢',
  },

  // 2. Chess MM Set (6)
  {
    id: 'speed-duel-win',
    set: 'chess-mm',
    setName: 'Chess MM Set',
    title: 'Mental Arithmetic',
    description: 'Triumph in a 10-question rapid mental math showdown.',
    lockedStampSvg: '/stamps/speed-duel-win-locked.svg',
    unlockedStampSvg: '/stamps/speed-duel-win-unlocked.svg',
    accentColor: '#AFF65B',
    icon: 'bolt',
    denomination: '10¢',
  },
  {
    id: 'mind-gate-streak',
    set: 'chess-mm',
    setName: 'Chess MM Set',
    title: 'Mind Gate Streak',
    description: 'Solve 3 Mind Gate math problems consecutively without error.',
    lockedStampSvg: '/stamps/mind-gate-streak-locked.svg',
    unlockedStampSvg: '/stamps/mind-gate-streak-unlocked.svg',
    accentColor: '#50A0F0',
    icon: 'pi',
    denomination: '15¢',
  },
  {
    id: 'chess-mm-win',
    set: 'chess-mm',
    setName: 'Chess MM Set',
    title: 'Mind Over Board',
    description: 'Win a full game of Chess MM combining tactics and calculation.',
    lockedStampSvg: '/stamps/chess-mm-win-locked.svg',
    unlockedStampSvg: '/stamps/chess-mm-win-unlocked.svg',
    accentColor: '#A594F0',
    icon: 'sum',
    denomination: '25¢',
  },
  {
    id: 'spell-win',
    set: 'chess-mm',
    setName: 'Chess MM Set',
    title: 'Arcane Tactician',
    description: 'Cast Freeze or Jump spells to alter tactical lines.',
    lockedStampSvg: '/stamps/spell-win-locked.svg',
    unlockedStampSvg: '/stamps/spell-win-unlocked.svg',
    accentColor: '#66D4C2',
    icon: 'spark',
    denomination: '30¢',
  },
  {
    id: 'perfect-gate',
    set: 'chess-mm',
    setName: 'Chess MM Set',
    title: 'Flawless Gate',
    description: 'Clear 5 consecutive Mind Gates with 100% precision.',
    lockedStampSvg: '/stamps/perfect-gate-locked.svg',
    unlockedStampSvg: '/stamps/perfect-gate-unlocked.svg',
    accentColor: '#F2D500',
    icon: 'target',
    denomination: '40¢',
  },
  {
    id: 'duel-comeback',
    set: 'chess-mm',
    setName: 'Chess MM Set',
    title: 'Calculation Duelist',
    description: 'Win a mental arithmetic speed duel with under 3 seconds remaining.',
    lockedStampSvg: '/stamps/duel-comeback-locked.svg',
    unlockedStampSvg: '/stamps/duel-comeback-unlocked.svg',
    accentColor: '#F07040',
    icon: 'clock',
    denomination: '50¢',
  },

  // 3. Training & Drills Set (5)
  {
    id: 'opening-master',
    set: 'training',
    setName: 'Training Set',
    title: 'Opening Theory',
    description: 'Complete 10 opening moves with grandmaster precision.',
    lockedStampSvg: '/stamps/opening-locked.svg',
    unlockedStampSvg: '/stamps/opening-unlocked.svg',
    accentColor: '#F2D500',
    icon: 'book',
    denomination: '10¢',
  },
  {
    id: 'tactics-champion',
    set: 'training',
    setName: 'Training Set',
    title: 'Tactical Striker',
    description: 'Solve 10 tactical training drills cleanly without hints.',
    lockedStampSvg: '/stamps/tactics-locked.svg',
    unlockedStampSvg: '/stamps/tactics-unlocked.svg',
    accentColor: '#A594F0',
    icon: 'target',
    denomination: '15¢',
  },
  {
    id: 'training-sprint',
    set: 'training',
    setName: 'Training Set',
    title: 'Sprint Complete',
    description: 'Finish a fast-paced 3-minute blitz training drill.',
    lockedStampSvg: '/stamps/training-sprint-locked.svg',
    unlockedStampSvg: '/stamps/training-sprint-unlocked.svg',
    accentColor: '#66D4C2',
    icon: 'clock',
    denomination: '20¢',
  },
  {
    id: 'mate-sprint',
    set: 'training',
    setName: 'Training Set',
    title: 'Checkmate Artist',
    description: 'Deliver checkmate against an adversary rated 1500+ ELO.',
    lockedStampSvg: '/stamps/mate-sprint-locked.svg',
    unlockedStampSvg: '/stamps/mate-sprint-unlocked.svg',
    accentColor: '#E5484D',
    icon: 'king',
    denomination: '25¢',
  },
  {
    id: 'endgame-specialist',
    set: 'training',
    setName: 'Training Set',
    title: 'Endgame Wizard',
    description: 'Demonstrate clean endgame technique in king and pawn endings.',
    lockedStampSvg: '/stamps/endgame-locked.svg',
    unlockedStampSvg: '/stamps/endgame-unlocked.svg',
    accentColor: '#50A0F0',
    icon: 'rook',
    denomination: '35¢',
  },

  // 4. Milestones Set (9)
  {
    id: 'wins-10',
    set: 'milestones',
    setName: 'Milestones Set',
    title: 'Decathlete',
    description: 'Accumulate 10 victories across any game mode.',
    lockedStampSvg: '/stamps/wins-10-locked.svg',
    unlockedStampSvg: '/stamps/wins-10-unlocked.svg',
    accentColor: '#AFF65B',
    icon: 'trophy',
    denomination: '10¢',
  },
  {
    id: 'wins-50',
    set: 'milestones',
    setName: 'Milestones Set',
    title: 'Half Century',
    description: 'Achieve 50 glorious match victories.',
    lockedStampSvg: '/stamps/wins-50-locked.svg',
    unlockedStampSvg: '/stamps/wins-50-unlocked.svg',
    accentColor: '#F2D500',
    icon: 'trophy',
    denomination: '25¢',
  },
  {
    id: 'wins-100',
    set: 'milestones',
    setName: 'Milestones Set',
    title: 'Centurion',
    description: 'Conquer the battlefield with 100 recorded wins.',
    lockedStampSvg: '/stamps/wins-100-locked.svg',
    unlockedStampSvg: '/stamps/wins-100-unlocked.svg',
    accentColor: '#F07040',
    icon: 'crown',
    denomination: '$1',
  },
  {
    id: 'games-10',
    set: 'milestones',
    setName: 'Milestones Set',
    title: 'Tested Warrior',
    description: 'Play 10 complete games on the board.',
    lockedStampSvg: '/stamps/games-10-locked.svg',
    unlockedStampSvg: '/stamps/games-10-unlocked.svg',
    accentColor: '#66D4C2',
    icon: 'flag',
    denomination: '5¢',
  },
  {
    id: 'games-100',
    set: 'milestones',
    setName: 'Milestones Set',
    title: 'Battle Hardened',
    description: 'Complete 100 chess battles in your journey.',
    lockedStampSvg: '/stamps/games-100-locked.svg',
    unlockedStampSvg: '/stamps/games-100-unlocked.svg',
    accentColor: '#A594F0',
    icon: 'shield',
    denomination: '50¢',
  },
  {
    id: 'first-draw',
    set: 'milestones',
    setName: 'Milestones Set',
    title: 'Honorable Stalemate',
    description: 'Hold ground in a hard-fought draw or stalemate.',
    lockedStampSvg: '/stamps/first-draw-locked.svg',
    unlockedStampSvg: '/stamps/first-draw-unlocked.svg',
    accentColor: '#8A8A8A',
    icon: 'shield',
    denomination: '10¢',
  },
  {
    id: 'comeback',
    set: 'milestones',
    setName: 'Milestones Set',
    title: 'Resilient Phoenix',
    description: 'Turn defeat into victory from a 5+ material deficit.',
    lockedStampSvg: '/stamps/comeback-locked.svg',
    unlockedStampSvg: '/stamps/comeback-unlocked.svg',
    accentColor: '#FF9F43',
    icon: 'burst',
    denomination: '30¢',
  },
  {
    id: 'marathon',
    set: 'milestones',
    setName: 'Milestones Set',
    title: 'Deep Thinker',
    description: 'Win a deep calculation match lasting more than 50 moves.',
    lockedStampSvg: '/stamps/marathon-locked.svg',
    unlockedStampSvg: '/stamps/marathon-unlocked.svg',
    accentColor: '#50A0F0',
    icon: 'clock',
    denomination: '20¢',
  },
  {
    id: 'miniature',
    set: 'milestones',
    setName: 'Milestones Set',
    title: 'Lightning Strike',
    description: 'Finish off an opponent cleanly in under 20 moves.',
    lockedStampSvg: '/stamps/miniature-locked.svg',
    unlockedStampSvg: '/stamps/miniature-unlocked.svg',
    accentColor: '#AFF65B',
    icon: 'bolt',
    denomination: '15¢',
  },

  // 5. Checkmate Set (7)
  {
    id: 'first-mate',
    set: 'checkmate',
    setName: 'Checkmate Set',
    title: 'Checkmate',
    description: 'Deliver your first victorious checkmate.',
    lockedStampSvg: '/stamps/first-mate-locked.svg',
    unlockedStampSvg: '/stamps/first-mate-unlocked.svg',
    accentColor: '#E5484D',
    icon: 'king',
    denomination: '10¢',
  },
  {
    id: 'back-rank-mate',
    set: 'checkmate',
    setName: 'Checkmate Set',
    title: 'Corridor of Doom',
    description: 'Execute a devastating back-rank corridor checkmate.',
    lockedStampSvg: '/stamps/back-rank-mate-locked.svg',
    unlockedStampSvg: '/stamps/back-rank-mate-unlocked.svg',
    accentColor: '#50A0F0',
    icon: 'rook',
    denomination: '15¢',
  },
  {
    id: 'smothered-mate',
    set: 'checkmate',
    setName: 'Checkmate Set',
    title: 'Philidor Smother',
    description: 'Deliver smothered mate with a leaping knight into trapped ranks.',
    lockedStampSvg: '/stamps/smothered-mate-locked.svg',
    unlockedStampSvg: '/stamps/smothered-mate-unlocked.svg',
    accentColor: '#A594F0',
    icon: 'knight',
    denomination: '25¢',
  },
  {
    id: 'promotion-mate',
    set: 'checkmate',
    setName: 'Checkmate Set',
    title: 'Crown & Glory',
    description: 'Deliver checkmate in the exact turn your pawn promotes.',
    lockedStampSvg: '/stamps/promotion-mate-locked.svg',
    unlockedStampSvg: '/stamps/promotion-mate-unlocked.svg',
    accentColor: '#F2D500',
    icon: 'queen',
    denomination: '30¢',
  },
  {
    id: 'pawn-mate',
    set: 'checkmate',
    setName: 'Checkmate Set',
    title: 'The Humble Footman',
    description: 'Deliver the final fatal blow with a single pawn checkmate.',
    lockedStampSvg: '/stamps/pawn-mate-locked.svg',
    unlockedStampSvg: '/stamps/pawn-mate-unlocked.svg',
    accentColor: '#AFF65B',
    icon: 'pawn',
    denomination: '35¢',
  },
  {
    id: 'knight-mate',
    set: 'checkmate',
    setName: 'Checkmate Set',
    title: 'Equine Execution',
    description: 'Seal victory with a decisive knight checkmate.',
    lockedStampSvg: '/stamps/knight-mate-locked.svg',
    unlockedStampSvg: '/stamps/knight-mate-unlocked.svg',
    accentColor: '#66D4C2',
    icon: 'knight',
    denomination: '20¢',
  },
  {
    id: 'ladder-mate',
    set: 'checkmate',
    setName: 'Checkmate Set',
    title: 'Rook Escalator',
    description: 'Trap the enemy monarch on the board perimeter with paired heavy pieces.',
    lockedStampSvg: '/stamps/ladder-mate-locked.svg',
    unlockedStampSvg: '/stamps/ladder-mate-unlocked.svg',
    accentColor: '#FF9F43',
    icon: 'rook',
    denomination: '15¢',
  },

  // 6. Tactics Set (9)
  {
    id: 'fork',
    set: 'tactics',
    setName: 'Tactics Set',
    title: 'The Double Fork',
    description: 'Attack two high-value pieces simultaneously with a single strike.',
    lockedStampSvg: '/stamps/fork-locked.svg',
    unlockedStampSvg: '/stamps/fork-unlocked.svg',
    accentColor: '#AFF65B',
    icon: 'knight',
    denomination: '10¢',
  },
  {
    id: 'pin',
    set: 'tactics',
    setName: 'Tactics Set',
    title: 'Absolute Pin',
    description: 'Pin an enemy piece immovably directly against their king.',
    lockedStampSvg: '/stamps/pin-locked.svg',
    unlockedStampSvg: '/stamps/pin-unlocked.svg',
    accentColor: '#50A0F0',
    icon: 'bishop',
    denomination: '10¢',
  },
  {
    id: 'skewer',
    set: 'tactics',
    setName: 'Tactics Set',
    title: 'Laser Skewer',
    description: 'Attack through a valuable piece to capture the target behind it.',
    lockedStampSvg: '/stamps/skewer-locked.svg',
    unlockedStampSvg: '/stamps/skewer-unlocked.svg',
    accentColor: '#F07040',
    icon: 'bishop',
    denomination: '15¢',
  },
  {
    id: 'discovered',
    set: 'tactics',
    setName: 'Tactics Set',
    title: 'Discovered Ambush',
    description: 'Move a masking piece to unleash an unmasked line of check or capture.',
    lockedStampSvg: '/stamps/discovered-locked.svg',
    unlockedStampSvg: '/stamps/discovered-unlocked.svg',
    accentColor: '#A594F0',
    icon: 'target',
    denomination: '20¢',
  },
  {
    id: 'queen-sac',
    set: 'tactics',
    setName: 'Tactics Set',
    title: "The Queen's Gambit",
    description: 'Sacrifice your most powerful piece to force an unavoidable win.',
    lockedStampSvg: '/stamps/queen-sac-locked.svg',
    unlockedStampSvg: '/stamps/queen-sac-unlocked.svg',
    accentColor: '#E5484D',
    icon: 'queen',
    denomination: '50¢',
  },
  {
    id: 'en-passant',
    set: 'tactics',
    setName: 'Tactics Set',
    title: 'In Passing',
    description: 'Execute the historic en passant diagonal pawn capture.',
    lockedStampSvg: '/stamps/en-passant-locked.svg',
    unlockedStampSvg: '/stamps/en-passant-unlocked.svg',
    accentColor: '#66D4C2',
    icon: 'pawn',
    denomination: '15¢',
  },
  {
    id: 'castle',
    set: 'tactics',
    setName: 'Tactics Set',
    title: 'Kingside Bastion',
    description: 'Castle kingside to secure the sovereign behind the pawns.',
    lockedStampSvg: '/stamps/castle-locked.svg',
    unlockedStampSvg: '/stamps/castle-unlocked.svg',
    accentColor: '#F2D500',
    icon: 'rook',
    denomination: '10¢',
  },
  {
    id: 'long-castle',
    set: 'tactics',
    setName: 'Tactics Set',
    title: 'Queenside Fortress',
    description: 'Castle queenside across the open file.',
    lockedStampSvg: '/stamps/long-castle-locked.svg',
    unlockedStampSvg: '/stamps/long-castle-unlocked.svg',
    accentColor: '#FF9F43',
    icon: 'shield',
    denomination: '15¢',
  },
  {
    id: 'underpromote',
    set: 'tactics',
    setName: 'Tactics Set',
    title: 'Subtle Promotion',
    description: 'Promote a pawn to a Knight, Bishop or Rook rather than a Queen.',
    lockedStampSvg: '/stamps/underpromote-locked.svg',
    unlockedStampSvg: '/stamps/underpromote-unlocked.svg',
    accentColor: '#A594F0',
    icon: 'knight',
    denomination: '30¢',
  },

  // 7. Learning Set (6)
  {
    id: 'first-puzzle',
    set: 'learning',
    setName: 'Learning Set',
    title: 'First Riddle',
    description: 'Solve your first daily chess puzzle.',
    lockedStampSvg: '/stamps/first-puzzle-locked.svg',
    unlockedStampSvg: '/stamps/first-puzzle-unlocked.svg',
    accentColor: '#AFF65B',
    icon: 'target',
    denomination: '5¢',
  },
  {
    id: 'puzzles-5-clean',
    set: 'learning',
    setName: 'Learning Set',
    title: 'Tactical Clarity',
    description: 'Solve 5 training puzzles in a row without a single error.',
    lockedStampSvg: '/stamps/puzzles-5-clean-locked.svg',
    unlockedStampSvg: '/stamps/puzzles-5-clean-unlocked.svg',
    accentColor: '#66D4C2',
    icon: 'star',
    denomination: '15¢',
  },
  {
    id: 'game-reviewed',
    set: 'learning',
    setName: 'Learning Set',
    title: 'Post-Mortem',
    description: 'Review and analyze a finished match move by move.',
    lockedStampSvg: '/stamps/game-reviewed-locked.svg',
    unlockedStampSvg: '/stamps/game-reviewed-unlocked.svg',
    accentColor: '#50A0F0',
    icon: 'book',
    denomination: '10¢',
  },
  {
    id: 'mistake-fixed',
    set: 'learning',
    setName: 'Learning Set',
    title: 'Lesson Learned',
    description: 'Retake and find the optimal move following a missed tactic.',
    lockedStampSvg: '/stamps/mistake-fixed-locked.svg',
    unlockedStampSvg: '/stamps/mistake-fixed-unlocked.svg',
    accentColor: '#F2D500',
    icon: 'spark',
    denomination: '15¢',
  },
  {
    id: 'opening-explored',
    set: 'learning',
    setName: 'Learning Set',
    title: 'Book Explorer',
    description: 'Explore variations in the opening study tree.',
    lockedStampSvg: '/stamps/opening-explored-locked.svg',
    unlockedStampSvg: '/stamps/opening-explored-unlocked.svg',
    accentColor: '#FF9F43',
    icon: 'book',
    denomination: '10¢',
  },
  {
    id: 'chesscom-import',
    set: 'learning',
    setName: 'Learning Set',
    title: 'World Traveler',
    description: 'Load an external PGN or master game into the study board.',
    lockedStampSvg: '/stamps/chesscom-import-locked.svg',
    unlockedStampSvg: '/stamps/chesscom-import-unlocked.svg',
    accentColor: '#A594F0',
    icon: 'flag',
    denomination: '20¢',
  },

  // 8. Consistency Set (3)
  {
    id: 'days-3',
    set: 'consistency',
    setName: 'Consistency Set',
    title: 'Iron Resolve',
    description: 'Maintain a 3-day consecutive training streak.',
    lockedStampSvg: '/stamps/days-3-locked.svg',
    unlockedStampSvg: '/stamps/days-3-unlocked.svg',
    accentColor: '#AFF65B',
    icon: 'clock',
    denomination: '10¢',
  },
  {
    id: 'days-7',
    set: 'consistency',
    setName: 'Consistency Set',
    title: 'Weekly Champion',
    description: 'Complete daily chess training for 7 days straight.',
    lockedStampSvg: '/stamps/days-7-locked.svg',
    unlockedStampSvg: '/stamps/days-7-unlocked.svg',
    accentColor: '#F2D500',
    icon: 'trophy',
    denomination: '25¢',
  },
  {
    id: 'days-30',
    set: 'consistency',
    setName: 'Consistency Set',
    title: 'Grandmaster Discipline',
    description: 'Achieve an exceptional 30-day continuous chess streak.',
    lockedStampSvg: '/stamps/days-30-locked.svg',
    unlockedStampSvg: '/stamps/days-30-unlocked.svg',
    accentColor: '#FF9F43',
    icon: 'crown',
    denomination: '$1',
  },
];

const ACHIEVEMENTS_STORAGE_KEY = 'chaturanga_unlocked_achievements_v1';

function getAchievementsStorageKey(playerId?: string): string {
  if (playerId) return `chaturanga_achievements_${playerId}`;
  try {
    const rawUser = typeof localStorage !== 'undefined' ? localStorage.getItem('chaturanga_user_profile') : null;
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.playerId) return `chaturanga_achievements_${parsed.playerId}`;
    }
  } catch {}
  return ACHIEVEMENTS_STORAGE_KEY;
}

let memoryStore: Record<string, string> = {};
let gameInProgress = false;
let pendingGameAchievements: Achievement[] = [];

export function setGameInProgress(active: boolean): void {
  gameInProgress = active;
  if (active) {
    pendingGameAchievements = [];
  }
}

export function isGameInProgress(): boolean {
  return gameInProgress;
}

export function getPendingGameAchievements(): Achievement[] {
  return [...pendingGameAchievements];
}

export function clearPendingGameAchievements(): void {
  pendingGameAchievements = [];
}

function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // fallback
  }
  return memoryStore[key] || null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch {
    // fallback
  }
  memoryStore[key] = value;
}

export function clearAchievementsStore(playerId?: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(getAchievementsStorageKey(playerId));
      localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
    }
  } catch {
    // fallback
  }
  memoryStore = {};
  pendingGameAchievements = [];
  gameInProgress = false;
}

export function getUnlockedAchievementIds(playerId?: string): string[] {
  try {
    const key = getAchievementsStorageKey(playerId);
    const raw = getStorageItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isAchievementUnlocked(id: string, playerId?: string): boolean {
  return getUnlockedAchievementIds(playerId).includes(id);
}

export function unlockAchievement(id: string, playerId?: string): { newlyUnlocked: boolean; achievement?: Achievement } {
  const achievement = ACHIEVEMENTS.find(a => a.id === id);
  if (!achievement) return { newlyUnlocked: false };

  const current = getUnlockedAchievementIds(playerId);
  if (current.includes(id)) {
    return { newlyUnlocked: false, achievement };
  }

  const updated = [...current, id];
  try {
    const key = getAchievementsStorageKey(playerId);
    setStorageItem(key, JSON.stringify(updated));
    if (isGameInProgress()) {
      // Buffer in-game achievements to celebrate only at end of game!
      if (!pendingGameAchievements.some(a => a.id === id)) {
        pendingGameAchievements.push(achievement);
      }
      if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chaturanga:achievement_queued', { detail: achievement }));
      }
    } else {
      if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chaturanga:achievement_unlocked', { detail: achievement }));
      }
    }
  } catch (e) {
    console.error('Failed to save unlocked achievement', e);
  }

  return { newlyUnlocked: true, achievement };
}

export function getAchievementProgress(playerId?: string): {
  total: number;
  unlocked: number;
  percentage: number;
  bySet: Record<string, { total: number; unlocked: number }>;
} {
  const unlockedIds = new Set(getUnlockedAchievementIds(playerId));
  const total = ACHIEVEMENTS.length;
  const unlocked = ACHIEVEMENTS.filter(a => unlockedIds.has(a.id)).length;
  const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  const bySet: Record<string, { total: number; unlocked: number }> = {};
  for (const a of ACHIEVEMENTS) {
    if (!bySet[a.setName]) {
      bySet[a.setName] = { total: 0, unlocked: 0 };
    }
    bySet[a.setName].total += 1;
    if (unlockedIds.has(a.id)) {
      bySet[a.setName].unlocked += 1;
    }
  }

  return { total, unlocked, percentage, bySet };
}
