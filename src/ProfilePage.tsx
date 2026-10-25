import { getLocalStats } from './chaturanga/stats';
import { getAchievementProgress, ACHIEVEMENTS, isAchievementUnlocked } from './chaturanga/achievements';
import StampTile from './chaturanga/StampTile';

interface ProfilePageProps {
  onBack: () => void;
  onOpenStamps?: () => void;
  user?: { name: string; email: string } | null;
}

export default function ProfilePage({ onBack, onOpenStamps, user }: ProfilePageProps) {
  const stats = getLocalStats();
  const progress = getAchievementProgress();
  const unlockedAchievements = ACHIEVEMENTS.filter((a) => isAchievementUnlocked(a.id));

  const displayName = user?.name || 'Local Player';
  const handle = user?.email ? `@${user.email.split('@')[0]}` : '@local';

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
          <div className="hidden sm:block matiks-kicker">DEVICE-LOCAL PROFILE</div>
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
              <h1 className="matiks-headline text-4xl sm:text-6xl text-[#0E0E0E] leading-none">
                {displayName}
              </h1>
              <span className="font-body text-sm font-semibold text-[#0E0E0E]/80 mt-1">
                {handle} • Local device profile
              </span>
              <span className="font-body text-xs text-[#0E0E0E]/60 mt-0.5">
                Saved locally on this browser • No server account required
              </span>
            </div>
          </div>
        </div>

        {/* 3 Bento Stat Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6">
          {/* Tile 1: Games (Yellow) */}
          <div className="bento-card bento-yellow p-6 sm:p-8 flex flex-col justify-between min-h-[160px]">
            <span className="matiks-kicker text-[#0E0E0E]/80 tracking-[3px]">GAMES PLAYED</span>
            <div className="font-heading text-6xl sm:text-7xl leading-none text-[#0E0E0E] mt-4">
              {stats.gamesPlayed}
            </div>
          </div>

          {/* Tile 2: Wins (Lavender) */}
          <div className="bento-card bento-lavender p-6 sm:p-8 flex flex-col justify-between min-h-[160px]">
            <span className="matiks-kicker text-[#0E0E0E]/80 tracking-[3px]">TOTAL WINS</span>
            <div className="font-heading text-6xl sm:text-7xl leading-none text-[#0E0E0E] mt-4">
              {stats.gamesWon}
            </div>
          </div>

          {/* Tile 3: Stamps (Teal) */}
          <div className="bento-card bento-teal p-6 sm:p-8 flex flex-col justify-between min-h-[160px]">
            <div className="flex items-center justify-between">
              <span className="matiks-kicker text-[#0E0E0E]/80 tracking-[3px]">EARNED STAMPS</span>
              <span className="text-xs font-mono font-bold text-[#0E0E0E]">
                {progress.percentage}%
              </span>
            </div>
            <div className="font-heading text-6xl sm:text-7xl leading-none text-[#0E0E0E] mt-4">
              {progress.unlocked} <span className="text-4xl text-[#0E0E0E]/60">/ {progress.total}</span>
            </div>
          </div>
        </div>

        {/* Achievements / Stamps Showcase */}
        <div className="mt-12 bg-[#1A1A1A] border border-white/5 rounded-3xl p-6 sm:p-8">
          <div className="flex items-baseline justify-between pb-4 mb-6 border-b border-white/5">
            <div>
              <div className="matiks-kicker mb-1">STAMP COLLECTION</div>
              <h2 className="matiks-headline text-3xl sm:text-4xl text-[#F4F4F4]">
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
