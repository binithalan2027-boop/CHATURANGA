
import { useState } from 'react';

interface HeroSectionProps {
  onPlay: () => void;
  onSearchMatch: () => void;
  onCancelMatch: () => void;
  matchStatus: 'idle' | 'searching' | 'found';
}

export default function HeroSection({ onPlay, onSearchMatch, onCancelMatch, matchStatus }: HeroSectionProps) {
  const [timeControl, setTimeControl] = useState('10');

  const handleMatchmaking = () => {
    if (matchStatus === 'idle') {
      onSearchMatch();
    } else if (matchStatus === 'searching') {
      onCancelMatch();
    }
  };

  let matchBtnText = 'FIND IMMEDIATE MATCH';
  if (matchStatus === 'searching') matchBtnText = 'SEARCHING COMBATANTS...';
  if (matchStatus === 'found') matchBtnText = 'OPPONENT FOUND! ENTERING ARENA...';

  return (
    <>
      <div className="w-full bg-surface-container-lowest px-margin-mobile lg:px-margin py-2 flex items-center justify-between overflow-x-auto gap-gutter">
        <div className="flex items-center gap-space-md shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-crimson-glow animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-bone-ivory uppercase tracking-widest">SEASON 1: BLOODLINE</span>
          </div>
          <span className="text-outline-variant font-label-sm">/</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">WORLD ARENA #4 LIVE</span>
        </div>
        <div className="flex items-center gap-space-lg shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-primary uppercase">AVG QUEUE:</span>
            <span className="font-label-sm text-label-sm text-bone-ivory">00:09s</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-secondary-container uppercase">CHECKMATE STRIKES TODAY:</span>
            <span className="font-label-sm text-label-sm text-bone-ivory">48,219</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-tertiary">
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider">ANIME ENGINE 2.4 READY</span>
          </div>
        </div>
      </div>

      <section className="relative w-full px-margin-mobile lg:px-margin pt-space-md pb-space-xl overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-primary-container/20 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-tertiary-container/25 rounded-full blur-[160px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-secondary-container/15 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div className="inline-flex items-center gap-2 self-start bg-surface-container-high px-space-sm py-1 rounded">
              <span className="font-label-sm text-label-sm text-crimson-glow uppercase tracking-widest">[ HORROR CHARACTERS × ANIME ACTION ]</span>
              <span className="w-1 h-1 rounded-full bg-bone-ivory"></span>
              <span className="font-label-sm text-label-sm text-bone-ivory/80 uppercase">TACTICAL BATTLE ARENA</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display-xl text-display-xl text-bone-ivory uppercase tracking-normal select-none">CHESS, BUT EVERY</span>
              <span className="font-display-xl text-display-xl text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary uppercase tracking-tight select-none">PIECE WANTS BLOOD.</span>
            </div>
            <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mt-4">
              Step into the cursed void. Command armies of vampires, shadow fiends, and liches in 
              high-stakes tactical combat. Climb the Grim Leaderboards, execute perfect sacrifices, 
              and unleash hellish spells on your opponent's king.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-space-sm">
            <div className="bg-surface-card border border-surface-container-high rounded-xl p-space-lg shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-container/10 to-transparent pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-space-md">
                <h3 className="font-headline-md text-bone-ivory uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">swords</span>
                  Enter the Arena
                </h3>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="font-mono text-xs text-on-surface-variant">4,291 Online</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-space-md">
                {['1', '3', '5', '10'].map((time) => (
                  <button 
                    key={time}
                    onClick={() => setTimeControl(time)}
                    className={`py-2 rounded font-headline-sm flex flex-col items-center justify-center transition-all ${timeControl === time ? 'bg-primary text-void-black shadow-[0_0_15px_rgba(var(--color-primary),0.5)] scale-105' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low hover:text-white'}`}
                  >
                    <span>{time}</span>
                    <span className="text-[10px] uppercase opacity-70">Min</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={handleMatchmaking}
                className={`w-full py-space-md rounded-lg font-display-sm uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${matchStatus !== 'idle' ? 'bg-surface-container-highest text-primary animate-pulse border border-primary/30' : 'bg-bone-ivory text-void-black hover:bg-white hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]'}`}
              >
                {matchStatus !== 'idle' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite]"></div>
                )}
                {matchBtnText}
              </button>

              <div className="flex items-center justify-center gap-4 mt-space-md pt-space-md border-t border-surface-container">
                <button onClick={onPlay} className="text-on-surface-variant hover:text-white font-label-sm uppercase tracking-widest transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                  Grim AI Arena
                </button>
                <span className="text-surface-container-highest">|</span>
                <button className="text-on-surface-variant hover:text-white font-label-sm uppercase tracking-widest transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">group</span>
                  Friends Sanctum
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
