import { useState, useEffect, useCallback, useRef } from 'react';
import { Achievement } from './achievements';
import { useReducedMotion } from '../lib/motion';
import { playThreeParticleBurst } from '../lib/threeParticles';

export interface EndOfGameCelebrationProps {
  achievements: Achievement[];
  onDismiss: () => void;
  onSkip?: () => void;
}

export default function EndOfGameCelebration({
  achievements,
  onDismiss,
  onSkip,
}: EndOfGameCelebrationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
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

  const total = achievements.length;
  const current = achievements[currentIndex] || achievements[0];

  const handleSkip = useCallback(() => {
    if (onSkip) {
      onSkip();
    } else {
      onDismiss();
    }
  }, [onSkip, onDismiss]);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onDismiss();
    }
  }, [currentIndex, total, onDismiss]);

  // Keyboard shortcut support: Esc to skip, Enter / ArrowRight to next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        setCurrentIndex((prev) => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip, handleNext, currentIndex]);

  if (!current || total === 0) return null;

  const isLast = currentIndex === total - 1;
  const shouldSpin = !reducedMotion && isPageVisible;
  const burstRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (current && !reducedMotion && burstRef.current) {
      playThreeParticleBurst({
        container: burstRef.current,
        count: 45,
        accentColors: ['#AFF65B', '#F2D500', '#F4F4F4', '#A594F0'],
        durationMs: 800,
        radiusScale: 2.2,
      }).catch(() => {});
    }
  }, [currentIndex, current, reducedMotion]);

  return (
    <div
      ref={burstRef}
      role="dialog"
      aria-modal="true"
      aria-label="End of Game Achievements"
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
          aria-label="Skip achievements celebration"
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
          {current.icon}
        </div>

        {/* Title */}
        <h2 className="font-heading text-2xl sm:text-3xl text-[#F4F4F4] tracking-wide mt-4 mb-1">
          {current.title}
        </h2>

        {/* Description */}
        <p className="font-body text-sm text-[#8A8A8A] leading-relaxed max-w-xs mb-6">
          {current.description}
        </p>

        {/* Pagination Indicator dots if multiple achievements */}
        {total > 1 && (
          <div className="flex items-center gap-2 mb-6" aria-label={`Achievement ${currentIndex + 1} of ${total}`}>
            {achievements.map((_, idx) => (
              <span
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'bg-[#F2D500] scale-125'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="btn-lime w-full py-3.5 rounded-2xl font-heading text-base uppercase tracking-wider font-bold cursor-pointer transition-all active:scale-95 shadow-xl"
        >
          {isLast ? 'CONTINUE' : `NEXT (${currentIndex + 1}/${total})`}
        </button>
      </div>
    </div>
  );
}
