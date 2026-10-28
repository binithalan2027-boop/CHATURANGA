import { useState, useEffect, useRef } from 'react';
import { Achievement } from './achievements';
import { useReducedMotion } from '../lib/motion';
import { playThreeParticleBurst } from '../lib/threeParticles';

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
  const reducedMotion = useReducedMotion();
  const [isPageVisible, setIsPageVisible] = useState(
    typeof document !== 'undefined' ? !document.hidden : true
  );

  useEffect(() => {
    const onVisibility = () => {
      setIsPageVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  if (!achievement) return null;

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onDismiss();
    }
  };

  const shouldSpin = !reducedMotion && isPageVisible;
  const burstRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (achievement && !reducedMotion && burstRef.current) {
      playThreeParticleBurst({
        container: burstRef.current,
        count: 50,
        accentColors: ['#AFF65B', '#F2D500', '#F4F4F4', '#66D4C2'],
        durationMs: 800,
        radiusScale: 2.2,
      }).catch(() => {});
    }
  }, [achievement, reducedMotion]);

  return (
    <div
      ref={burstRef}
      role="dialog"
      aria-modal="true"
      aria-label="Achievement Celebration"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-300"
    >
      {/* Sunburst Background Effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
        <svg
          viewBox="0 0 1000 1000"
          className={`w-[180vmin] h-[180vmin] ${shouldSpin ? 'animate-sunburst' : ''}`}
          style={{ willChange: shouldSpin ? 'transform' : 'auto' }}
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

      {/* Celebration Card */}
      <div className="relative z-10 max-w-sm sm:max-w-md w-full bg-[#1A1A1A] border-2 border-[#F2D500] rounded-3xl p-6 sm:p-8 text-center shadow-2xl flex flex-col items-center">
        {/* Glow Accent */}
        <div className="absolute -top-12 w-24 h-24 bg-[#F2D500]/20 rounded-full blur-2xl pointer-events-none" />

        {/* Badge Banner */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F2D500]/15 border border-[#F2D500]/30 text-[#F2D500] text-xs font-mono font-bold tracking-widest uppercase mb-4">
          <span>🏆</span>
          <span>ACHIEVEMENT UNLOCKED</span>
        </div>

        {/* Big Icon */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#262626] border-2 border-white/10 flex items-center justify-center text-5xl sm:text-6xl my-2 shadow-inner">
          {achievement.icon}
        </div>

        {/* Title */}
        <h2 className="font-heading text-2xl sm:text-3xl text-[#F4F4F4] tracking-wide mt-4 mb-1">
          {achievement.title}
        </h2>

        {/* Description */}
        <p className="font-body text-sm text-[#8A8A8A] leading-relaxed max-w-xs mb-6">
          {achievement.description}
        </p>

        {/* Action Button */}
        <button
          onClick={onDismiss}
          className="btn-lime w-full py-3.5 rounded-2xl font-heading text-base uppercase tracking-wider font-bold cursor-pointer transition-all active:scale-95 shadow-xl"
        >
          CLAIM REWARD
        </button>
      </div>
    </div>
  );
}
