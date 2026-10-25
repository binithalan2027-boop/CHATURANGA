/**
 * Chaturanga Device-Local Game Stats Module
 */

export interface LocalStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  mindGateStreaks: number;
  speedDuelsWon: number;
}

const STATS_STORAGE_KEY = 'chaturanga_local_stats_v1';

const DEFAULT_STATS: LocalStats = {
  gamesPlayed: 12,
  gamesWon: 7,
  gamesLost: 4,
  gamesDrawn: 1,
  mindGateStreaks: 2,
  speedDuelsWon: 3,
};

export function getLocalStats(): LocalStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATS;
  }
}

export function recordGameResult(outcome: 'win' | 'loss' | 'draw'): LocalStats {
  const current = getLocalStats();
  const updated: LocalStats = {
    ...current,
    gamesPlayed: current.gamesPlayed + 1,
    gamesWon: outcome === 'win' ? current.gamesWon + 1 : current.gamesWon,
    gamesLost: outcome === 'loss' ? current.gamesLost + 1 : current.gamesLost,
    gamesDrawn: outcome === 'draw' ? current.gamesDrawn + 1 : current.gamesDrawn,
  };

  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save game stats', e);
  }
  return updated;
}
