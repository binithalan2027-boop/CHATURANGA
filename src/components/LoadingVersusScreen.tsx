import { useState, useEffect } from 'react';

interface LoadingVersusScreenProps {
  player: { name: string; avatar?: string; elo?: number; fideRating?: number; title?: string };
  opponent: { name: string; avatar?: string; elo?: number; fideRating?: number; title?: string };
  onComplete: () => void;
}

export default function LoadingVersusScreen({ player, opponent, onComplete }: LoadingVersusScreenProps) {
  const [countdown, setCountdown] = useState<number>(3);
  const [progress, setProgress] = useState<number>(30);

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

    const progressTimer = setInterval(() => {
      setProgress(p => Math.min(100, p + 25));
    }, 600);

    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-ink-black flex flex-col justify-between overflow-y-auto select-none font-body-md text-bone-ivory antialiased animate-fadeIn">
      {/* Top Protocol Telemetry Header */}
      <header className="w-full bg-ink-black/95 border-b border-void-border px-margin py-space-sm flex flex-wrap items-center justify-between gap-space-md shadow-[0_4px_20px_rgba(9,9,13,0.85)]">
        <div className="flex items-center gap-space-md">
          <div className="px-space-xs py-0.5 bg-blood-crimson text-bone-ivory font-label-sm uppercase font-bold text-[11px] tracking-wider">
            ARENA PROTOCOL // ENGAGED
          </div>
          <div className="flex flex-col">
            <h1 className="font-headline-sm text-headline-sm uppercase tracking-wider text-bone-ivory">
              MATCH FOUND <span className="text-pumpkin-orange font-mono text-xs">[WARPING TO ARENA 07: OBLIVION CRYPT]</span>
            </h1>
            <span className="font-label-sm text-[10px] text-bone-ivory-dim font-mono">
              MODE: CLASSIC RANKED • BLOOD CLOCK: 3 MIN BLITZ • RATED MATCH
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-lg font-mono text-xs text-bone-ivory-dim">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>RTT: <strong className="text-bone-ivory">14ms</strong></span>
          </div>
          <div className="hidden sm:block">CLUSTER: <strong className="text-bone-ivory">TOKYO-EAST</strong></div>
          <div className="hidden md:block">ENGINE: <strong className="text-pumpkin-orange">STOCKFISH 16 WASM</strong></div>
          <div className="px-2 py-0.5 bg-void-surface border border-void-border text-blood-crimson font-bold">#ARENA-88942</div>
        </div>
      </header>

      {/* Main Split-Screen Versus Arena Cockpit */}
      <main className="w-full max-w-[1440px] mx-auto px-margin py-space-lg flex flex-col gap-space-lg my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center relative">
          
          {/* WHITE COMMANDER (LEFT - 5 COLS) */}
          <div className="lg:col-span-5 bg-void-surface border-2 border-blood-crimson/80 p-space-lg shadow-[0_0_40px_rgba(163,19,43,0.35)] relative overflow-hidden flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-void-border pb-space-xs">
              <span className="px-space-xs py-0.5 bg-blood-crimson text-bone-ivory font-label-sm font-bold uppercase text-[10px] tracking-wider">
                WHITE // 1ST MOVE <span className="ml-1 text-pumpkin-orange font-normal">YOU</span>
              </span>
              <div className="font-mono text-right">
                <span className="text-title-sm font-bold text-bone-ivory">{player.elo || 2480} ELO</span>
                <span className="block text-[10px] text-pumpkin-orange font-bold uppercase tracking-wider">GRANDMASTER • RANK #42 GLOBAL</span>
              </div>
            </div>

            {/* Character Figurine Avatar */}
            <div className="relative w-full aspect-[16/9] bg-gradient-to-t from-ink-black via-void-surface to-surface-container border border-void-border flex items-center justify-center overflow-hidden group">
              <div className="text-7xl filter drop-shadow-[0_0_20px_rgba(163,19,43,0.8)] group-hover:scale-110 transition-transform">
                {player.avatar || '🎭'}
              </div>
              <div className="absolute bottom-2 left-2 px-space-xs py-0.5 bg-blood-crimson/90 font-label-sm text-[10px] text-bone-ivory font-bold uppercase">
                FACTION: THE CARNIVAL
              </div>
            </div>

            <div>
              <h2 className="font-display-lg text-display-lg text-bone-ivory uppercase tracking-wider">
                {player.name || 'VOID_COMMANDER'}
              </h2>
              <p className="font-body-sm text-body-sm text-bone-ivory-dim italic mt-0.5">
                "Every check is a death sentence."
              </p>
            </div>

            {/* Equipped Occult Spells Loadout */}
            <div className="border-t border-void-border pt-space-xs">
              <span className="font-label-sm text-[10px] text-bone-ivory-dim font-mono uppercase tracking-wider">
                EQUIPPED OCCULT SPELLS // LOADOUT
              </span>
              <div className="grid grid-cols-2 gap-space-xs mt-1.5">
                <div className="bg-ink-black border border-void-border p-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blood-crimson text-[18px]">cyclone</span>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-xs text-bone-ivory uppercase">VOID WARP</span>
                    <span className="font-label-sm text-[9px] text-bone-ivory-dim">Swap Knight & Bishop</span>
                  </div>
                </div>
                <div className="bg-ink-black border border-void-border p-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-pumpkin-orange text-[18px]">ac_unit</span>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-xs text-bone-ivory uppercase">TILE FREEZE</span>
                    <span className="font-label-sm text-[9px] text-bone-ivory-dim">Lock square for 2 turns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VS CENTER COLLISION BADGE (2 COLS) */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center my-4 lg:my-0 z-10">
            <div className="relative flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-ink-black border-4 border-blood-crimson flex flex-col items-center justify-center shadow-[0_0_50px_rgba(163,19,43,0.8)] animate-pulse">
                <span className="font-display-lg text-4xl text-bone-ivory uppercase font-black tracking-widest leading-none">
                  VS
                </span>
              </div>

              <div className="mt-3 text-center">
                <span className="font-label-sm text-[10px] text-pumpkin-orange font-mono uppercase tracking-widest block">
                  COLLISION DETECTED
                </span>
                <span className="font-display-xl text-4xl text-blood-crimson font-black tracking-tighter drop-shadow-[0_0_20px_rgba(163,19,43,1)]">
                  0{countdown}.0S // ENGAGED
                </span>
                <span className="font-label-sm text-[10px] text-bone-ivory-dim block mt-1">
                  STAKES: <strong className="text-green-400">+32</strong> / <strong className="text-red-400">-28 ELO</strong>
                </span>
              </div>
            </div>
          </div>

          {/* BLACK OPPONENT (RIGHT - 5 COLS) */}
          <div className="lg:col-span-5 bg-void-surface border-2 border-cursed-violet/80 p-space-lg shadow-[0_0_40px_rgba(100,47,158,0.35)] relative overflow-hidden flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-void-border pb-space-xs">
              <div className="font-mono">
                <span className="text-title-sm font-bold text-bone-ivory">{opponent.elo || 2515} ELO</span>
                <span className="block text-[10px] text-cursed-violet-bright font-bold uppercase tracking-wider">OCCULT ARCHON</span>
              </div>
              <span className="px-space-xs py-0.5 bg-cursed-violet text-bone-ivory font-label-sm font-bold uppercase text-[10px] tracking-wider">
                OPPONENT <span className="ml-1 text-cursed-violet-bright font-normal">BLACK // DEFENSE</span>
              </span>
            </div>

            {/* Character Figurine Avatar */}
            <div className="relative w-full aspect-[16/9] bg-gradient-to-t from-ink-black via-void-surface to-surface-container border border-void-border flex items-center justify-center overflow-hidden group">
              <div className="text-7xl filter drop-shadow-[0_0_20px_rgba(100,47,158,0.8)] group-hover:scale-110 transition-transform">
                {opponent.avatar || '🕷️'}
              </div>
              <div className="absolute bottom-2 right-2 px-space-xs py-0.5 bg-cursed-violet/90 font-label-sm text-[10px] text-bone-ivory font-bold uppercase">
                FACTION: THE SWARM
              </div>
            </div>

            <div className="text-right">
              <h2 className="font-display-lg text-display-lg text-bone-ivory uppercase tracking-wider">
                {opponent.name || 'ARCHON MALAKOR'}
              </h2>
              <p className="font-body-sm text-body-sm text-bone-ivory-dim italic mt-0.5">
                "Your soul belongs to the 64 squares of torment."
              </p>
            </div>

            {/* Scout Intel Threat Analysis */}
            <div className="border-t border-void-border pt-space-xs">
              <div className="flex items-center justify-between font-label-sm text-[10px] text-bone-ivory-dim font-mono uppercase">
                <span>SCOUT INTEL // THREAT ANALYSIS</span>
                <span className="text-red-400 font-bold">LETHAL // 94% WIN IN RAPID</span>
              </div>
              <div className="grid grid-cols-2 gap-space-xs mt-1.5">
                <div className="bg-ink-black border border-void-border p-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-cursed-violet text-[18px]">grain</span>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-xs text-bone-ivory uppercase">ABYSSAL THREAD</span>
                    <span className="font-label-sm text-[9px] text-bone-ivory-dim">Diagonal bishops pinned</span>
                  </div>
                </div>
                <div className="bg-ink-black border border-void-border p-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blood-crimson text-[18px]">skull</span>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-xs text-bone-ivory uppercase">CORPSE PAWN</span>
                    <span className="font-label-sm text-[9px] text-bone-ivory-dim">Revives captured piece</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Tactical Pipeline Synchronization Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-stretch mt-space-md">
          <div className="lg:col-span-8 bg-void-surface border border-void-border p-space-md flex flex-col gap-space-sm shadow-md">
            <div className="flex items-center justify-between font-label-sm text-xs">
              <span className="text-bone-ivory font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-blood-crimson animate-ping" />
                TACTICAL PIPELINE SYNCHRONIZATION
              </span>
              <span className="text-pumpkin-orange font-mono font-bold">{progress}% READY</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-surface-container-lowest border border-void-border overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blood-crimson via-pumpkin-orange to-cursed-violet transition-all duration-300" 
                style={{ width: `${progress}%` }} 
              />
            </div>

            {/* Terminal Live Telemetry Logs */}
            <div className="bg-ink-black border border-void-border p-space-sm font-mono text-[11px] text-bone-ivory-dim flex flex-col gap-1 h-24 overflow-y-auto">
              <div className="text-green-400">&gt; PING_CLUSTER_OK: Handshake acknowledged by Oblivion Node #07</div>
              <div className="text-bone-ivory">&gt; OCCULT_RULES_INJECT: Faction bonuses calculated for [CARNIVAL] &amp; [SWARM]</div>
              <div className="text-bone-ivory">&gt; CLOCK_INIT: 180s White / 180s Black synchronized via PTP NTP client</div>
              <div className="text-pumpkin-orange animate-pulse">&gt; STATUS: PREPARING BOARD PROJECTION... BATTLE IS IMMINENT</div>
            </div>
          </div>

          {/* Tactical Advisory Pro-Tip Panel */}
          <div className="lg:col-span-4 bg-void-surface border border-void-border p-space-md flex flex-col justify-between shadow-md">
            <div>
              <div className="flex items-center gap-1.5 font-label-sm text-xs text-pumpkin-orange font-bold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                TACTICAL ADVISORY // PRO-TIP
              </div>
              <p className="font-body-sm text-xs text-bone-ivory-dim leading-relaxed">
                When playing against <strong className="text-bone-ivory">The Swarm</strong>, never leave your diagonal bishops unshielded. Their Abyssal Threading will pin your heavy pieces in early opening.
              </p>
            </div>

            <div className="mt-space-md pt-space-xs border-t border-void-border flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-bone-ivory-dim">
                <span>🔊 SFX ON</span>
                <span>💬 TAUNTS ALLOWED</span>
              </div>
              <button disabled className="w-full py-2 bg-void-surface border border-void-border text-bone-ivory-muted font-headline-sm text-xs uppercase tracking-widest opacity-60">
                🔒 LOCKED IN COMBAT (CANNOT ABORT)
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer System Telemetry Bar */}
      <footer className="w-full bg-ink-black/95 border-t border-void-border px-margin py-space-xs font-mono text-[10px] text-bone-ivory-dim flex items-center justify-between">
        <span>CHATURANGA V0.9.4 COMBAT BETA</span>
        <span>LORE CHRONICLES • BATTLE REGULATIONS • SERVER TELEMETRY</span>
        <span className="text-green-400">[GRID STATUS: OPTIMAL]</span>
      </footer>
    </div>
  );
}
