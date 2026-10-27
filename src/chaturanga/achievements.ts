/**
 * Chaturanga Postage-Stamp Achievements Module
 * Device-local persistence, serializable, pure, unit-tested.
 */

export interface Achievement {
  id: string;
  set: 'variant' | 'chess-mm' | 'training';
  setName: string;
  title: string;
  description: string;
  lockedStampSvg: string;
  unlockedStampSvg: string;
  accentColor: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Variant Set
  {
    id: 'first-win',
    set: 'variant',
    setName: 'Variant Set',
    title: 'First Blood',
    description: 'Win your first game against any bot in standard chess.',
    lockedStampSvg: '/stamps/first-win-locked.svg',
    unlockedStampSvg: '/stamps/first-win-unlocked.svg',
    accentColor: '#F2D500',
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
  },

  // Chess MM Set
  {
    id: 'speed-duel-win',
    set: 'chess-mm',
    setName: 'Chess MM Set',
    title: 'Mental Arithmetic',
    description: 'Triumph in a 10-question rapid mental math showdown.',
    lockedStampSvg: '/stamps/speed-duel-win-locked.svg',
    unlockedStampSvg: '/stamps/speed-duel-win-unlocked.svg',
    accentColor: '#AFF65B',
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
  },

  // Training Set
  {
    id: 'opening-master',
    set: 'training',
    setName: 'Training Set',
    title: 'Opening Theory',
    description: 'Complete 10 opening moves with grandmaster precision.',
    lockedStampSvg: '/stamps/opening-locked.svg',
    unlockedStampSvg: '/stamps/opening-unlocked.svg',
    accentColor: '#F2D500',
  },
  {
    id: 'tactics-champion',
    set: 'training',
    setName: 'Training Set',
    title: 'Tactical Striker',
    description: 'Cast a Freeze or Jump spell to alter tactical lines.',
    lockedStampSvg: '/stamps/tactics-locked.svg',
    unlockedStampSvg: '/stamps/tactics-unlocked.svg',
    accentColor: '#A594F0',
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
  },
];

const ACHIEVEMENTS_STORAGE_KEY = 'chaturanga_unlocked_achievements_v1';

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

export function clearAchievementsStore(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
    }
  } catch {
    // fallback
  }
  memoryStore = {};
  pendingGameAchievements = [];
  gameInProgress = false;
}

export function getUnlockedAchievementIds(): string[] {
  try {
    const raw = getStorageItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isAchievementUnlocked(id: string): boolean {
  return getUnlockedAchievementIds().includes(id);
}

export function unlockAchievement(id: string): { newlyUnlocked: boolean; achievement?: Achievement } {
  const achievement = ACHIEVEMENTS.find(a => a.id === id);
  if (!achievement) return { newlyUnlocked: false };

  const current = getUnlockedAchievementIds();
  if (current.includes(id)) {
    return { newlyUnlocked: false, achievement };
  }

  const updated = [...current, id];
  try {
    setStorageItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(updated));
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

export function getAchievementProgress(): {
  total: number;
  unlocked: number;
  percentage: number;
  bySet: Record<string, { total: number; unlocked: number }>;
} {
  const unlockedIds = new Set(getUnlockedAchievementIds());
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
