import { useState, useEffect, useCallback } from 'react';
import { Achievement } from './achievements';

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="End of Game Achievements"
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
          aria-label="Skip achievements celebration"
        >
          <span>SKIP</span>
          <span className="text-xs bg-white/10 group-hover:bg-[#AFF65B]/20 text-[#8A8A8A] group-hover:text-[#AFF65B] px-1.5 py-0.5 rounded font-mono font-bold transition-colors">
            ✕
          </span>
        </button>
      </div>

      {/* Central celebration card */}
      <div className="relative z-10 w-full max-w-lg bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto">
        {/* Glow backdrop matching stamp accent color */}
        <div
          className="absolute -top-12 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-40 transition-colors duration-500"
          style={{ backgroundColor: current.accentColor || '#AFF65B' }}
        />

        {/* Top Kicker & Count Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="matiks-kicker">
            {total > 1 ? `MATCH COMPLETE · STAMP ${currentIndex + 1} OF ${total}` : 'MATCH COMPLETE · ACHIEVEMENT UNLOCKED'}
          </span>
        </div>

        {/* Stepper Progress Dots if multiple stamps */}
        {total > 1 && (
          <div className="flex items-center gap-2 mb-3">
            {achievements.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer border-none p-0 ${
                  i === currentIndex ? 'w-7 bg-[#AFF65B]' : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Jump to stamp ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Big Lime Headline */}
        <h2 className="matiks-headline text-3xl sm:text-4xl text-[#AFF65B] mb-1">
          {total > 1 ? `STAMP ${currentIndex + 1} OF ${total} EARNED` : 'STAMP EARNED'}
        </h2>
        <div className="font-heading text-2xl sm:text-3xl text-[#F4F4F4] tracking-wider mb-2">
          {current.title}
        </div>

        {/* Set Badge */}
        <span className="text-xs uppercase font-mono tracking-wider px-3 py-0.5 rounded-full bg-white/10 text-[#8A8A8A] mb-4">
          {current.setName}
        </span>

        {/* Centered Stamp Art with metallic frame */}
        <div className="relative my-2 p-3.5 bg-[#262626] rounded-2xl border-2 border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex items-center justify-center transition-transform hover:scale-102">
          <img
            src={current.unlockedStampSvg}
            alt={current.title}
            className="w-36 h-48 sm:w-44 sm:h-56 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]"
          />
          <div className="absolute -bottom-3 bg-[#F07040] text-[#0E0E0E] font-body text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
            NEW COLLECTIBLE
          </div>
        </div>

        {/* Description */}
        <p className="font-body text-sm sm:text-base text-[#F4F4F4]/90 max-w-sm mt-6 mb-5 leading-relaxed font-medium">
          {current.description}
        </p>

        {/* Multiple Stamps Thumbnails Strip */}
        {total > 1 && (
          <div className="w-full flex items-center justify-center gap-2 mb-6 py-2 overflow-x-auto">
            {achievements.map((ach, idx) => (
              <button
                key={ach.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative p-1 rounded-xl border transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'border-[#AFF65B] bg-[#262626] scale-105 shadow-md shadow-[#AFF65B]/20'
                    : 'border-white/10 bg-[#1F1F1F] opacity-60 hover:opacity-100'
                }`}
                aria-label={`View ${ach.title}`}
              >
                <img
                  src={ach.unlockedStampSvg}
                  alt={ach.title}
                  className="w-10 h-14 object-contain"
                />
              </button>
            ))}
          </div>
        )}

        {/* Action Button: Next / Claim */}
        <div className="w-full flex flex-col gap-2">
          <button
            onClick={handleNext}
            className="btn-lime w-full py-4 text-base font-semibold uppercase tracking-wider shadow-lg cursor-pointer font-heading"
            autoFocus
          >
            {isLast
              ? total > 1
                ? 'CLAIM ALL & CONTINUE'
                : 'CLAIM & CONTINUE'
              : `NEXT STAMP (${currentIndex + 1}/${total}) →`}
          </button>
        </div>
      </div>
    </div>
  );
}
