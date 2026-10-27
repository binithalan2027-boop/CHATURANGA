import { useState } from 'react';
import { getLocalStats, getRatingTier } from './chaturanga/stats';
import { getAchievementProgress, ACHIEVEMENTS, isAchievementUnlocked } from './chaturanga/achievements';
import StampTile from './chaturanga/StampTile';

interface ProfilePageProps {
  onBack: () => void;
  onOpenStamps?: () => void;
  user?: { name: string; email: string } | null;
}

export default function ProfilePage({ onBack, onOpenStamps, user }: ProfilePageProps) {
  const [stats] = useState(() => getLocalStats());
  const progress = getAchievementProgress();
  const unlockedAchievements = ACHIEVEMENTS.filter((a) => isAchievementUnlocked(a.id));
  const [historyFilter, setHistoryFilter] = useState<'all' | 'online' | 'bots'>('all');

  const displayName = user?.name || 'Local Player';
  const handle = user?.email ? `@${user.email.split('@')[0]}` : '@local';

  const ratingTier = getRatingTier(stats.currentRating);
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

  const onlineMatches = stats.history.filter((m) =>
    m.mode.toLowerCase().includes('online') || m.opponentName.toLowerCase().includes('guest') || m.opponentName.toLowerCase().includes('player')
  );
  const botMatches = stats.history.filter(
    (m) => !onlineMatches.includes(m)
  );

  const filteredHistory =
    historyFilter === 'online'
      ? onlineMatches
      : historyFilter === 'bots'
      ? botMatches
      : stats.history;

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#F4F4F4] pb-24 lg:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Navigation back */}
        <div className="flex items-center justify-between pb-6 border-b border-white/5">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#8A8A8A] hover:text-[#AFF65B] font-body text-xs font-semibold uppercase tracking-widest bg-transparent border-none cursor-pointer transition-colors"
          >
            ← Return to Hub
          </button>
          <div className="hidden sm:block matiks-kicker">DEVICE-LOCAL & ONLINE PROFILE</div>
        </div>

        {/* Hero Profile Banner */}
        <div className="relative mt-8 rounded-3xl bg-[#F07040] text-[#0E0E0E] p-6 sm:p-10 overflow-hidden shadow-2xl bg-diagonal-stripes">
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
            {/* Avatar Circle with Knight illustration */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#F4F4F4] border-4 border-[#0E0E0E] flex items-center justify-center p-3 shadow-xl shrink-0">
              <img
                src="/illustrations/knight.svg"
                alt="Avatar"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Profile Info */}
            <div className="flex flex-col text-center sm:text-left">
              <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                <h1 className="matiks-headline text-4xl sm:text-6xl text-[#0E0E0E] leading-none m-0">
                  {displayName}
                </h1>
                <span className="px-3 py-1 rounded-full bg-[#0E0E0E] text-[#AFF65B] text-xs font-mono font-bold tracking-wider uppercase">
                  {ratingTier.tier} · {stats.currentRating} ELO
                </span>
              </div>
              <span className="font-body text-sm font-semibold text-[#0E0E0E]/80 mt-1">
                {handle} • Standard 1200 Starting Baseline
              </span>
              <span className="font-body text-xs text-[#0E0E0E]/60 mt-0.5">
                Saved locally on this browser • Dynamic Elo updates after rated matches
              </span>
            </div>
          </div>
        </div>

        {/* 4 Bento Stat Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
          {/* Tile 1: Rating (Yellow) */}
          <div className="bento-card bento-yellow p-6 sm:p-8 flex flex-col justify-between min-h-[160px] rounded-3xl shadow-xl">
            <div className="flex items-center justify-between">
              <span className="matiks-kicker text-[#0E0E0E]/80 tracking-[2px]">CHESS RATING</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#0E0E0E]/15 text-[#0E0E0E]">
                PEAK {stats.peakRating}
              </span>
            </div>
            <div className="font-heading text-5xl sm:text-6xl leading-none text-[#0E0E0E] mt-3">
              {stats.currentRating}
            </div>
            <div className="text-xs font-bold text-[#0E0E0E]/80 uppercase tracking-wider mt-1">
              {ratingTier.tier} • Baseline 1200
            </div>
          </div>

          {/* Tile 2: Games (Lavender) */}
          <div className="bento-card bento-lavender p-6 sm:p-8 flex flex-col justify-between min-h-[160px] rounded-3xl shadow-xl">
            <span className="matiks-kicker text-[#0E0E0E]/80 tracking-[2px]">GAMES PLAYED</span>
            <div className="font-heading text-5xl sm:text-6xl leading-none text-[#0E0E0E] mt-3">
              {stats.gamesPlayed}
            </div>
            <div className="text-xs font-bold text-[#0E0E0E]/80 mt-1">
              {stats.gamesWon}W · {stats.gamesDrawn}D · {stats.gamesLost}L
            </div>
          </div>

          {/* Tile 3: Total Wins / Rate (Coral) */}
          <div className="bento-card bento-coral p-6 sm:p-8 flex flex-col justify-between min-h-[160px] rounded-3xl shadow-xl">
            <div className="flex items-center justify-between">
              <span className="matiks-kicker text-[#0E0E0E]/80 tracking-[2px]">TOTAL WINS</span>
              <span className="text-xs font-mono font-bold text-[#0E0E0E]">
                {winRate}% WIN RATE
              </span>
            </div>
            <div className="font-heading text-5xl sm:text-6xl leading-none text-[#0E0E0E] mt-3">
              {stats.gamesWon}
            </div>
            <div className="text-xs font-bold text-[#0E0E0E]/80 mt-1">
              {stats.mindGateStreaks} Gate Streaks · {stats.speedDuelsWon} Duels
            </div>
          </div>

          {/* Tile 4: Stamps (Teal) */}
          <div className="bento-card bento-teal p-6 sm:p-8 flex flex-col justify-between min-h-[160px] rounded-3xl shadow-xl">
            <div className="flex items-center justify-between">
              <span className="matiks-kicker text-[#0E0E0E]/80 tracking-[2px]">EARNED STAMPS</span>
              <span className="text-xs font-mono font-bold text-[#0E0E0E]">
                {progress.percentage}%
              </span>
            </div>
            <div className="font-heading text-5xl sm:text-6xl leading-none text-[#0E0E0E] mt-3">
              {progress.unlocked} <span className="text-3xl text-[#0E0E0E]/60">/ {progress.total}</span>
            </div>
            <div className="text-xs font-bold text-[#0E0E0E]/80 mt-1">
              {progress.unlocked === progress.total ? 'Full Album Completed!' : `${progress.total - progress.unlocked} remaining`}
            </div>
          </div>
        </div>

        {/* Rating Standard Practice & Calibration Explainer */}
        <div className="mt-6 bg-[#1A1A1A] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
            <div>
              <div className="matiks-kicker text-[#AFF65B] mb-1">APP RATING STANDARD & PRACTISE</div>
              <h2 className="matiks-headline text-2xl sm:text-3xl text-[#F4F4F4] m-0">
                1200 ELO STARTING BASELINE
              </h2>
              <p className="font-body text-xs text-[#8A8A8A] max-w-2xl mt-1 leading-relaxed mb-0">
                In Chaturanga, every normal player begins at an official baseline of <strong>1200 Elo (Club Player)</strong>. Ratings adjust dynamically following standard FIDE formulas after every rated bot or online match based on the opponent's rating and match outcome:
                <span className="block mt-1 font-mono text-[#AFF65B]">Δ = round(K · (S - E)) where E = 1 / (1 + 10^((R_opp - R_player) / 400))</span>
                Beating higher-rated opponents awards greater gains; losses against lower-rated opponents carry heavier deductions.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              <div className="px-4 py-2.5 rounded-2xl bg-[#262626] border border-white/10 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ratingTier.badgeColor }} />
                <div>
                  <div className="text-[10px] font-mono text-[#8A8A8A] uppercase">Current Tier</div>
                  <div className="font-bold text-sm text-[#F4F4F4]">{ratingTier.tier}</div>
                </div>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-[#262626] border border-white/10 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#AFF65B]" />
                <div>
                  <div className="text-[10px] font-mono text-[#8A8A8A] uppercase">Starting Baseline</div>
                  <div className="font-bold text-sm text-[#F4F4F4]">1200 Elo (Club Tier)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rating Tiers Progression */}
          <div className="mt-6 pt-2">
            <div className="text-xs font-mono font-semibold text-[#8A8A8A] uppercase mb-3">
              Chaturanga Elo Hierarchy & Playing Tiers:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { name: 'Novice', range: '< 800', color: '#8A8A8A' },
                { name: 'Apprentice', range: '800 – 1199', color: '#F2D500' },
                { name: 'Club Player', range: '1200 – 1599', color: '#AFF65B', isDefault: true },
                { name: 'Expert Tactician', range: '1600 – 1999', color: '#65D1C1' },
                { name: 'Candidate Master', range: '2000 – 2399', color: '#AB97EE' },
                { name: 'Grandmaster', range: '2400+', color: '#FFD700' },
              ].map((t) => {
                const isCurrent = ratingTier.tier === t.name;
                return (
                  <div
                    key={t.name}
                    className={`p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-[#262626] border-[#AFF65B] shadow-lg shadow-[#AFF65B]/10'
                        : 'bg-[#141414] border-white/5 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="font-heading text-xs text-[#F4F4F4] truncate">{t.name}</span>
                    </div>
                    <div className="font-mono text-[11px] text-[#8A8A8A]">{t.range}</div>
                    {t.isDefault && (
                      <div className="mt-1 text-[9px] font-mono text-[#AFF65B] font-bold">
                        DEFAULT BASELINE
                      </div>
                    )}
                    {isCurrent && (
                      <div className="mt-1 text-[9px] font-mono text-[#AFF65B] font-bold">
                        ACTIVE TIER
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Competitive Match History Section */}
        <div className="mt-10 bg-[#1A1A1A] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
            <div>
              <div className="matiks-kicker text-[#AFF65B] mb-1">COMPETITIVE MATCH HISTORY</div>
              <h2 className="matiks-headline text-3xl sm:text-4xl text-[#F4F4F4] m-0">
                RECENT MATCHES
              </h2>
              <p className="font-body text-xs text-[#8A8A8A] mt-1 mb-0">
                Review your rated matches across Online PvP matches and calibrated Bot encounters.
              </p>
            </div>

            {/* Filter tabs: All / Online / Bots */}
            <div className="flex items-center gap-1.5 bg-[#0E0E0E] p-1.5 rounded-2xl border border-white/10 shrink-0 self-start sm:self-auto">
              {(['all', 'online', 'bots'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setHistoryFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border-none cursor-pointer ${
                    historyFilter === filter
                      ? 'bg-[#AFF65B] text-[#0E0E0E] font-bold'
                      : 'bg-transparent text-[#8A8A8A] hover:text-[#F4F4F4]'
                  }`}
                >
                  {filter === 'all'
                    ? `All (${stats.history.length})`
                    : filter === 'online'
                    ? `Online (${onlineMatches.length})`
                    : `Bots (${botMatches.length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Match rows list */}
          <div className="mt-6 space-y-3">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((match) => (
                <div
                  key={match.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Result pill, opponent info, mode */}
                  <div className="flex items-center gap-4">
                    {/* Result Badge */}
                    <div
                      className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 font-heading font-black text-xs ${
                        match.result === 'win'
                          ? 'bg-[#AFF65B]/15 text-[#AFF65B] border border-[#AFF65B]/30'
                          : match.result === 'loss'
                          ? 'bg-[#F07040]/15 text-[#F07040] border border-[#F07040]/30'
                          : 'bg-white/10 text-[#8A8A8A] border border-white/10'
                      }`}
                    >
                      <span className="text-[10px] tracking-wider uppercase">{match.result}</span>
                      <span className="font-mono text-sm font-bold">
                        {match.delta > 0 ? `+${match.delta}` : match.delta === 0 ? '±0' : match.delta}
                      </span>
                    </div>

                    {/* Match details */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading text-lg sm:text-xl text-[#F4F4F4]">
                          vs. {match.opponentName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#262626] text-[#8A8A8A] font-mono text-xs">
                          {match.opponentRating} Elo
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#262626] text-[#AFF65B] font-mono text-[10px] uppercase tracking-wider">
                          {match.mode}
                        </span>
                      </div>
                      <div className="font-body text-xs text-[#8A8A8A] mt-1 flex items-center gap-2 sm:gap-3 flex-wrap">
                        <span>{match.date}</span>
                        <span>•</span>
                        <span>Rating: {match.ratingBefore} → {match.ratingAfter} ELO</span>
                        {match.accuracy && (
                          <>
                            <span>•</span>
                            <span className="text-[#66D4C2] font-mono font-semibold">
                              {match.accuracy}% Accuracy
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Match Review • Coming Soon Action */}
                  <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                    <button
                      onClick={() =>
                        alert(
                          `Match Review for ${match.opponentName} (${match.date}):\n\nDeep Stockfish engine move-by-move evaluation, blunder analysis, and brilliance detection is coming soon in the next major update!`
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] border border-white/10 text-xs font-semibold text-[#F4F4F4] flex items-center gap-2 transition-all cursor-pointer group"
                      title="Deep engine game review is coming soon"
                    >
                      <span>Match Review</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#AFF65B]/15 text-[#AFF65B] text-[10px] font-mono font-bold tracking-wider uppercase group-hover:bg-[#AFF65B] group-hover:text-[#0E0E0E] transition-colors">
                        Coming Soon
                      </span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-[#262626] flex items-center justify-center mb-3">
                  <span className="text-2xl">⚔️</span>
                </div>
                <h3 className="font-heading text-xl text-[#F4F4F4]">NO MATCHES IN THIS CATEGORY</h3>
                <p className="font-body text-xs text-[#8A8A8A] max-w-sm mt-1 mb-0">
                  Play rated online multiplayer games or challenge the calibrated bots to build your combat match history!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Achievements / Stamps Showcase */}
        <div className="mt-10 bg-[#1A1A1A] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-baseline justify-between pb-4 mb-6 border-b border-white/5">
            <div>
              <div className="matiks-kicker mb-1">STAMP COLLECTION</div>
              <h2 className="matiks-headline text-3xl sm:text-4xl text-[#F4F4F4] m-0">
                RECENT ACQUISITIONS
              </h2>
            </div>
            {onOpenStamps && (
              <button
                onClick={onOpenStamps}
                className="btn-lime text-xs py-2 px-5 font-semibold uppercase tracking-wider"
              >
                Open Stamp Book →
              </button>
            )}
          </div>

          {unlockedAchievements.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {unlockedAchievements.map((ach) => (
                <StampTile
                  key={ach.id}
                  achievement={ach}
                  isUnlocked={true}
                  onClick={onOpenStamps}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#262626] flex items-center justify-center mb-3">
                <img src="/icons/stamp.svg" alt="" className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="font-heading text-2xl text-[#F4F4F4]">NO STAMPS UNLOCKED YET</h3>
              <p className="font-body text-xs text-[#8A8A8A] max-w-sm mt-1 mb-6">
                Win games across the 5 combat modes, solve mental math questions, and execute tactical trials to fill your album!
              </p>
              {onOpenStamps && (
                <button
                  onClick={onOpenStamps}
                  className="btn-raised text-xs py-2 px-6 font-semibold uppercase tracking-wider"
                >
                  Explore All Stamps
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
