import { Achievement, isAchievementUnlocked } from './achievements';

interface StampTileProps {
  achievement: Achievement;
  isUnlocked?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function StampTile({
  achievement,
  isUnlocked: explicitUnlocked,
  onClick,
  size = 'md',
}: StampTileProps) {
  const unlocked = explicitUnlocked !== undefined ? explicitUnlocked : isAchievementUnlocked(achievement.id);

  const sizeClasses = {
    sm: 'w-24 h-32',
    md: 'w-32 h-44',
    lg: 'w-44 h-60',
  }[size];

  const stampImgSrc = unlocked ? achievement.unlockedStampSvg : achievement.lockedStampSvg;

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-between p-2.5 rounded-lg transition-all duration-200 select-none ${
        onClick ? 'cursor-pointer hover:-translate-y-1' : ''
      }`}
      style={{
        background: '#1F1F1F',
        border: '1.5px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Stamp container with perforated visual appearance */}
      <div className={`relative ${sizeClasses} flex items-center justify-center p-1 rounded overflow-hidden`}>
        <img
          src={stampImgSrc}
          alt={achievement.title}
          className={`w-full h-full object-contain filter transition-all duration-300 ${
            unlocked
              ? 'drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] group-hover:scale-105'
              : 'opacity-40 grayscale contrast-125'
          }`}
          loading="lazy"
        />

        {/* Status Pill */}
        {unlocked ? (
          <div className="absolute bottom-1 right-1 z-10">
            <span className="pill-unlocked shadow-md">UNLOCKED</span>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] rounded">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#8A8A8A] bg-[#141414]/90 px-2 py-0.5 rounded border border-white/10">
              LOCKED
            </span>
          </div>
        )}
      </div>

      {/* Info label */}
      <div className="w-full text-center mt-2 px-1">
        <div className="font-heading text-sm text-[#F4F4F4] tracking-wide truncate">
          {achievement.title}
        </div>
        <div className="text-[10px] font-body text-[#8A8A8A] line-clamp-2 leading-tight mt-0.5">
          {achievement.description}
        </div>
      </div>
    </div>
  );
}
