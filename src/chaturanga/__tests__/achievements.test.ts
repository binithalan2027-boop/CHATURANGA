import { describe, it, expect, beforeEach } from 'vitest';
import {
  ACHIEVEMENTS,
  getUnlockedAchievementIds,
  unlockAchievement,
  isAchievementUnlocked,
  getAchievementProgress,
  clearAchievementsStore
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
});
