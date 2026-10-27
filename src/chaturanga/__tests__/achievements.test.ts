import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ACHIEVEMENTS,
  getUnlockedAchievementIds,
  unlockAchievement,
  isAchievementUnlocked,
  getAchievementProgress,
  clearAchievementsStore,
  setGameInProgress,
  isGameInProgress,
  getPendingGameAchievements,
  clearPendingGameAchievements
} from '../achievements';

describe('Chaturanga Postage-Stamp Achievements Module', () => {
  beforeEach(() => {
    clearAchievementsStore();
  });

  it('defines 10 verified achievements matching the design spec', () => {
    expect(ACHIEVEMENTS).toHaveLength(10);
    const ids = ACHIEVEMENTS.map(a => a.id);
    expect(ids).toContain('first-win');
    expect(ids).toContain('chess960-win');
    expect(ids).toContain('fog-win');
    expect(ids).toContain('atomic-win');
    expect(ids).toContain('speed-duel-win');
    expect(ids).toContain('mind-gate-streak');
  });

  it('starts with zero achievements unlocked on a fresh client', () => {
    const unlocked = getUnlockedAchievementIds();
    expect(unlocked).toEqual([]);
    expect(isAchievementUnlocked('first-win')).toBe(false);

    const progress = getAchievementProgress();
    expect(progress.unlocked).toBe(0);
    expect(progress.total).toBe(10);
    expect(progress.percentage).toBe(0);
  });

  it('unlocks an achievement successfully and updates progress', () => {
    const res = unlockAchievement('first-win');
    expect(res.newlyUnlocked).toBe(true);
    expect(res.achievement?.title).toBe('First Blood');

    expect(isAchievementUnlocked('first-win')).toBe(true);
    expect(getUnlockedAchievementIds()).toContain('first-win');

    const progress = getAchievementProgress();
    expect(progress.unlocked).toBe(1);
    expect(progress.percentage).toBe(10);
    expect(progress.bySet['Variant Set'].unlocked).toBe(1);
  });

  it('does not re-unlock an already unlocked achievement', () => {
    const first = unlockAchievement('fog-win');
    expect(first.newlyUnlocked).toBe(true);

    const second = unlockAchievement('fog-win');
    expect(second.newlyUnlocked).toBe(false);

    expect(getUnlockedAchievementIds().filter(id => id === 'fog-win')).toHaveLength(1);
  });

  it('handles invalid achievement IDs gracefully', () => {
    const res = unlockAchievement('non-existent-id');
    expect(res.newlyUnlocked).toBe(false);
    expect(res.achievement).toBeUndefined();
  });

  it('buffers in-game achievements to celebrate only at end of match', () => {
    const listeners: Record<string, Function[]> = {};
    const origWindow = (globalThis as any).window;
    const origCustomEvent = (globalThis as any).CustomEvent;

    (globalThis as any).CustomEvent = class {
      type: string;
      detail: any;
      constructor(type: string, init?: any) {
        this.type = type;
        this.detail = init?.detail;
      }
    };

    (globalThis as any).window = {
      addEventListener: (type: string, fn: any) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(fn);
      },
      removeEventListener: (type: string, fn: any) => {
        listeners[type] = (listeners[type] || []).filter(f => f !== fn);
      },
      dispatchEvent: (event: any) => {
        (listeners[event.type] || []).forEach(fn => fn(event));
        return true;
      }
    };

    const queuedListener = vi.fn();
    const unlockedListener = vi.fn();
    (globalThis as any).window.addEventListener('chaturanga:achievement_queued', queuedListener);
    (globalThis as any).window.addEventListener('chaturanga:achievement_unlocked', unlockedListener);

    setGameInProgress(true);
    expect(isGameInProgress()).toBe(true);
    expect(getPendingGameAchievements()).toHaveLength(0);

    // Player earns tactics-champion and mind-gate-streak during the match
    const res1 = unlockAchievement('tactics-champion');
    expect(res1.newlyUnlocked).toBe(true);
    expect(isAchievementUnlocked('tactics-champion')).toBe(true);

    const res2 = unlockAchievement('mind-gate-streak');
    expect(res2.newlyUnlocked).toBe(true);

    // Should NOT dispatch immediate celebration during game
    expect(unlockedListener).not.toHaveBeenCalled();
    expect(queuedListener).toHaveBeenCalledTimes(2);

    // Both should be in pending end-of-game achievements
    const pending = getPendingGameAchievements();
    expect(pending).toHaveLength(2);
    expect(pending[0].id).toBe('tactics-champion');
    expect(pending[1].id).toBe('mind-gate-streak');

    // End of match cleanup
    setGameInProgress(false);
    expect(isGameInProgress()).toBe(false);
    clearPendingGameAchievements();
    expect(getPendingGameAchievements()).toHaveLength(0);

    (globalThis as any).window = origWindow;
    (globalThis as any).CustomEvent = origCustomEvent;
  });
});
