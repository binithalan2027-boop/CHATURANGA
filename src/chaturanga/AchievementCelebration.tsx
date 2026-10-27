import { Achievement } from './achievements';

interface AchievementCelebrationProps {
  achievement: Achievement | null;
  onDismiss: () => void;
  onSkip?: () => void;
}

export default function AchievementCelebration({
  achievement,
  onDismiss,
  onSkip,
}: AchievementCelebrationProps) {
  if (!achievement) return null;

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onDismiss();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Achievement Celebration"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-300"
    >
      {/* Sunburst Background Effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
        <svg
          viewBox="0 0 1000 1000"
          className="w-[180vmin] h-[180vmin] animate-sunburst"
          style={{ willChange: 'transform' }}
        >
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 360) / 24;
            return (
              <polygon
                key={i}
                points="500,500 460,0 540,0"
                fill={i % 2 === 0 ? '#1A1A1A' : '#0E0E0E'}
                transform={`rotate(${angle} 500 500)`}
              />
            );
          })}
        </svg>
      </div>

      {/* Prominent SKIP Button on the Right Side of the Screen */}
      <div className="fixed top-5 right-5 sm:top-8 sm:right-10 z-50">
        <button
          onClick={handleSkip}
          className="btn-raised flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/20 hover:border-[#AFF65B] text-[#F4F4F4] hover:text-[#AFF65B] font-heading text-base sm:text-lg tracking-widest transition-all shadow-2xl cursor-pointer active:scale-95 group"
          aria-label="Skip achievement celebration"
        >
          <span>SKIP</span>
          <span className="text-xs bg-white/10 group-hover:bg-[#AFF65B]/20 text-[#8A8A8A] group-hover:text-[#AFF65B] px-1.5 py-0.5 rounded font-mono font-bold transition-colors">
            ✕
          </span>
        </button>
      </div>

      {/* Central celebration card */}
      <div className="relative z-10 w-full max-w-md bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        {/* Glow backdrop */}
        <div
          className="absolute -top-10 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-40"
          style={{ backgroundColor: achievement.accentColor || '#AFF65B' }}
        />

        {/* Top Kicker */}
        <div className="matiks-kicker mb-2">ACHIEVEMENT UNLOCKED</div>

        {/* Big Lime Headline */}
        <h2 className="matiks-headline text-4xl sm:text-5xl text-[#AFF65B] mb-1">
          STAMP EARNED
        </h2>
        <div className="font-heading text-2xl text-[#F4F4F4] tracking-wider mb-6">
          {achievement.title}
        </div>

        {/* Centered Stamp Art with metallic frame */}
        <div className="relative my-2 p-3 bg-[#262626] rounded-2xl border-2 border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex items-center justify-center">
          <img
            src={achievement.unlockedStampSvg}
            alt={achievement.title}
            className="w-36 h-48 sm:w-44 sm:h-56 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]"
          />
          <div className="absolute -bottom-3 bg-[#F07040] text-[#0E0E0E] font-body text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
            NEW COLLECTIBLE
          </div>
        </div>

        {/* Description */}
        <p className="font-body text-sm text-[#F4F4F4]/80 max-w-xs mt-6 mb-8 leading-relaxed">
          {achievement.description}
        </p>

        {/* The ONE lime action button */}
        <button
          onClick={onDismiss}
          className="btn-lime w-full py-4 text-base font-semibold uppercase tracking-wider shadow-lg cursor-pointer"
          autoFocus
        >
          CLAIM & CONTINUE
        </button>
      </div>
    </div>
  );
}
