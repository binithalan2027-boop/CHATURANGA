import { useState, useEffect } from 'react';

interface LoadingVersusScreenProps {
  player: { name: string; avatar?: string; elo?: number; fideRating?: number; title?: string };
  opponent: { name: string; avatar?: string; elo?: number; fideRating?: number; title?: string };
  onComplete: () => void;
}

export default function LoadingVersusScreen({ player, opponent, onComplete }: LoadingVersusScreenProps) {
  const [countdown, setCountdown] = useState<number>(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(onComplete, 400);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-ink-black flex flex-col justify-between overflow-hidden select-none animate-fadeIn">
      {/* Background Volumetric Particle Flares */}
      <div className="absolute inset-0 bg-gradient-to-r from-blood-crimson/20 via-transparent to-cursed-violet/20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blood-crimson/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Banner */}
      <div className="relative z-10 w-full bg-void-surface/90 border-b border-void-border px-margin py-space-sm flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <span className="w-2.5 h-2.5 bg-blood-crimson animate-ping" />
          <span className="font-headline-sm uppercase tracking-widest text-bone-ivory">CHATURANGA // ARENA TRANSITION</span>
        </div>
        <div className="font-mono text-label-sm text-pumpkin-orange font-bold uppercase">
          MODE: RANKED DUEL // FEN SYNCED
        </div>
      </div>

      {/* Center Duel Split View */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 w-full max-w-[1200px] mx-auto my-auto p-space-md gap-gutter items-center">
        {/* PLAYER SIDE (LEFT) */}
        <div className="bg-void-surface border-2 border-blood-crimson/80 p-space-lg shadow-[0_0_40px_rgba(163,19,43,0.3)] flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-blood-crimson text-bone-ivory font-label-sm uppercase font-bold text-[10px]">
            WHITE COMMANDER
          </div>
          <div className="w-28 h-28 rounded-full bg-surface-container border-2 border-blood-crimson flex items-center justify-center text-5xl my-4 shadow-xl">
            {player.avatar || '👤'}
          </div>
          <h2 className="font-headline-md text-2xl text-bone-ivory uppercase tracking-wider">
            {player.name}
          </h2>
          {player.title && (
            <span className="mt-1 px-2 py-0.5 bg-pumpkin-orange/20 text-pumpkin-orange border border-pumpkin-orange/50 font-mono text-xs font-bold uppercase">
              {player.title} {player.fideRating ? `FIDE ${player.fideRating}` : ''}
            </span>
          )}
          <div className="mt-3 font-mono text-sm text-bone-ivory-dim">
            ELO: <span className="text-blood-crimson font-bold">{player.elo || 1500}</span>
          </div>
        </div>

        {/* VS CENTER BADGE OVERLAY */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-ink-black border-4 border-blood-crimson flex items-center justify-center shadow-[0_0_50px_rgba(163,19,43,0.8)] animate-pulse">
            <span className="font-display-lg text-3xl text-bone-ivory uppercase tracking-widest font-black">
              VS
            </span>
          </div>
          <div className="mt-4 font-display-xl text-5xl text-blood-crimson font-black tracking-tighter drop-shadow-[0_0_20px_rgba(163,19,43,1)]">
            {countdown > 0 ? countdown : 'COMBAT!'}
          </div>
        </div>

        {/* OPPONENT SIDE (RIGHT) */}
        <div className="bg-void-surface border-2 border-cursed-violet/80 p-space-lg shadow-[0_0_40px_rgba(100,47,158,0.3)] flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-cursed-violet text-bone-ivory font-label-sm uppercase font-bold text-[10px]">
            BLACK OPPONENT
          </div>
          <div className="w-28 h-28 rounded-full bg-surface-container border-2 border-cursed-violet flex items-center justify-center text-5xl my-4 shadow-xl">
            {opponent.avatar || '⚔️'}
          </div>
          <h2 className="font-headline-md text-2xl text-bone-ivory uppercase tracking-wider">
            {opponent.name}
          </h2>
          {opponent.title && (
            <span className="mt-1 px-2 py-0.5 bg-cursed-violet/20 text-cursed-violet border border-cursed-violet/50 font-mono text-xs font-bold uppercase">
              {opponent.title} {opponent.fideRating ? `FIDE ${opponent.fideRating}` : ''}
            </span>
          )}
          <div className="mt-3 font-mono text-sm text-bone-ivory-dim">
            ELO: <span className="text-cursed-violet font-bold">{opponent.elo || 1500}</span>
          </div>
        </div>
      </div>

      {/* Bottom Loading Bar */}
      <div className="relative z-10 w-full bg-void-surface border-t border-void-border px-margin py-space-md text-center font-mono text-xs text-bone-ivory-dim uppercase tracking-widest">
        INITIALIZING VOID WARFARE ENGINE // SYNCHRONIZING REALTIME BROADCAST CHANNELS
      </div>
    </div>
  );
}
