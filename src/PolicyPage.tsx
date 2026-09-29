import { useEffect } from 'react';

interface PolicyPageProps {
  onBack: () => void;
}

export default function PolicyPage({ onBack }: PolicyPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-ink-black text-on-surface font-body-md text-body-md min-h-screen selection:bg-blood-crimson selection:text-bone-ivory antialiased">
      <header className="fixed top-0 left-0 right-0 z-50 bg-ink-black/95 backdrop-blur-xl border-b border-void-border shadow-[0_4px_24px_rgba(9,9,13,0.85)]">
        <div className="h-20 w-full max-w-[1440px] mx-auto px-margin flex items-center justify-between gap-gutter">
          <div className="flex items-center gap-space-lg">
            <button onClick={onBack} className="flex items-center gap-space-sm group focus:outline-none">
              <span className="material-symbols-outlined text-bone-ivory group-hover:-translate-x-1 transition-transform">arrow_back</span>
              <div className="flex flex-col text-left">
                <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-bone-ivory leading-none">Chaturanga</span>
                <span className="font-label-sm text-label-sm tracking-widest text-blood-crimson font-bold uppercase">Return to Arena</span>
              </div>
            </button>
            <div className="hidden 2xl:flex items-center gap-space-md border-l border-void-border pl-space-md">
              <div className="flex items-center gap-space-xs bg-void-surface px-space-sm py-1 border border-void-border">
                <span className="w-1.5 h-1.5 bg-blood-crimson animate-pulse"></span>
                <span className="font-label-sm text-label-sm uppercase text-bone-ivory tracking-wider font-semibold">42,891 IN COMBAT</span>
              </div>
              <div className="flex items-center gap-space-xs bg-void-surface px-space-sm py-1 border border-void-border">
                <span className="w-1.5 h-1.5 bg-pumpkin-orange"></span>
                <span className="font-label-sm text-label-sm uppercase text-bone-ivory-dim tracking-wider">US-EAST: 14MS</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="w-full pt-20 bg-ink-black min-h-screen">
        <div className="flex flex-col w-full">
          {/* ATMOSPHERIC BACKGROUND TACTICAL GRID OVERLAY */}
          <div className="relative w-full overflow-hidden">
            {/* Subtle Ambient Noise / Glow Orbs */}
            <div className="absolute -top-32 left-1/4 w-96 h-96 bg-blood-crimson/10 rounded-full blur-[140px] pointer-events-none"></div>
            <div className="absolute top-1/3 -right-24 w-80 h-80 bg-cursed-violet/15 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-pumpkin-orange/10 rounded-full blur-[160px] pointer-events-none"></div>
            <div className="w-full max-w-[1440px] mx-auto px-margin py-space-xl flex flex-col gap-space-2xl relative z-10">
              
              {/* 1. HEADER / BREADCRUMBS & HERO INTRO */}
              <section className="flex flex-col gap-space-lg">
                <div className="flex flex-wrap items-center gap-space-sm font-label-sm text-label-sm text-bone-ivory-dim tracking-widest uppercase">
                  <span className="bg-void-surface text-blood-crimson px-2 py-0.5 border border-void-border font-bold">[ CODEX // LEGAL PROTOCOL ]</span>
                  <span className="text-bone-ivory-muted">//</span>
                  <span className="text-bone-ivory">REVISION 2025.4.11</span>
                  <span className="text-bone-ivory-muted">//</span>
                  <span className="text-pumpkin-orange font-semibold">ZERO MERCY TACTICAL STANDARD</span>
                  <span className="text-bone-ivory-muted">//</span>
                  <span className="text-cursed-violet-surge">PGN/FEN CERTIFIED ENGINE COVENANT</span>
                </div>
                
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg border-b border-void-border pb-space-lg">
                  <div className="flex flex-col max-w-4xl">
                    <span className="font-label-md text-label-md uppercase tracking-[0.25em] text-blood-crimson font-mono flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-blood-crimson animate-pulse"></span>
                      BINDING JURISDICTION OF THE 9 ABYSSAL REALMS
                    </span>
                    <h1 className="font-display-xl text-display-xl uppercase text-bone-ivory tracking-wide leading-none mt-1">
                      BATTLE REGULATIONS &amp; <span className="text-blood-crimson drop-shadow-[0_0_18px_rgba(163,19,43,0.6)]">OCCULT COVENANTS</span>
                    </h1>
                    <p className="font-body-lg text-body-lg text-bone-ivory-dim mt-space-sm max-w-2xl leading-relaxed">
                      The immutable edicts governing combatants, anti-cheat neural telemetry, soul data privacy, and fair-play enforcement across all ranked arenas. Entry onto the 64-square grid constitutes an unbreakable covenant.
                    </p>
                  </div>
                  
                  <div className="flex flex-row lg:flex-col items-start lg:items-end justify-between gap-space-sm bg-void-surface p-space-md border border-void-border min-w-[260px]">
                    <div className="flex flex-col lg:text-right">
                      <span className="font-label-sm text-label-sm text-bone-ivory-muted uppercase">Codex Authority</span>
                      <span className="font-label-md text-label-md text-bone-ivory font-bold uppercase">Supreme Coven Arbitration</span>
                    </div>
                    <div className="flex flex-col lg:text-right">
                      <span className="font-label-sm text-label-sm text-bone-ivory-muted uppercase">Hash Signature</span>
                      <span className="font-label-sm text-label-sm text-pumpkin-orange font-mono">0x9F4A...B72C_SHA256</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-1.5 pt-1">
                      <span className="w-1.5 h-1.5 bg-blood-crimson"></span>
                      <span className="font-label-sm text-label-sm text-bone-ivory-dim uppercase tracking-wider">ALL TELEMETRY RUNNING</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm bg-surface-container-lowest p-space-sm border border-void-border">
                  <div className="flex items-center gap-space-sm p-space-xs bg-void-surface border border-void-border">
                    <span className="w-2.5 h-2.5 bg-blood-crimson shadow-[0_0_8px_#D61F3D]"></span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-bone-ivory-muted uppercase leading-none">Engine Standard</span>
                      <span className="font-label-md text-label-md text-bone-ivory uppercase font-bold leading-tight">FIDE PROTOCOL 2025</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm p-space-xs bg-void-surface border border-void-border">
                    <span className="w-2.5 h-2.5 bg-pumpkin-orange animate-ping shadow-[0_0_8px_#FF7A1A]"></span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-bone-ivory-muted uppercase leading-none">Grim Sentinel</span>
                      <span className="font-label-md text-label-md text-bone-ivory uppercase font-bold leading-tight">NEURAL ANTI-CHEAT ACTIVE</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm p-space-xs bg-void-surface border border-void-border">
                    <span className="w-2.5 h-2.5 bg-cursed-violet shadow-[0_0_8px_#8C42DD]"></span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-bone-ivory-muted uppercase leading-none">Data Sovereign</span>
                      <span className="font-label-md text-label-md text-bone-ivory uppercase font-bold leading-tight">GDPR // ZERO-KEYLOG</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm p-space-xs bg-void-surface border border-void-border">
                    <span className="w-2.5 h-2.5 bg-bone-ivory-dim shadow-[0_0_8px_#E8DDC8]"></span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-bone-ivory-muted uppercase leading-none">Last Consecration</span>
                      <span className="font-label-md text-label-md text-bone-ivory uppercase font-bold leading-tight">OCTOBER 24, 2025</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. QUICK NAVIGATION ANCHOR BAR */}
              <nav className="sticky top-20 z-40 bg-ink-black/95 backdrop-blur-md border border-void-border p-1 shadow-[0_8px_30px_rgba(9,9,13,0.95)]">
                <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-1">
                  <a className="px-space-md py-2.5 font-label-md text-label-md uppercase tracking-wider text-bone-ivory bg-void-surface border border-blood-crimson shadow-[0_0_12px_rgba(163,19,43,0.35)] whitespace-nowrap flex items-center gap-2" href="#code-of-combat">
                    <span className="text-blood-crimson font-bold font-mono">01.</span>
                    <span>Code of Combat</span>
                  </a>
                  <a className="px-space-md py-2.5 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:text-bone-ivory hover:bg-void-surface-hover border border-transparent hover:border-void-border transition-colors whitespace-nowrap flex items-center gap-2" href="#anti-cheat-sentinel">
                    <span className="text-pumpkin-orange font-bold font-mono">02.</span>
                    <span>Anti-Cheat Sentinel</span>
                  </a>
                  <a className="px-space-md py-2.5 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:text-bone-ivory hover:bg-void-surface-hover border border-transparent hover:border-void-border transition-colors whitespace-nowrap flex items-center gap-2" href="#soul-ledger-privacy">
                    <span className="text-cursed-violet-surge font-bold font-mono">03.</span>
                    <span>Soul Ledger &amp; Privacy</span>
                  </a>
                  <a className="px-space-md py-2.5 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:text-bone-ivory hover:bg-void-surface-hover border border-transparent hover:border-void-border transition-colors whitespace-nowrap flex items-center gap-2" href="#digital-figurines">
                    <span className="text-bone-ivory font-bold font-mono">04.</span>
                    <span>Figurines &amp; Cosmetics</span>
                  </a>
                  <a className="px-space-md py-2.5 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:text-bone-ivory hover:bg-void-surface-hover border border-transparent hover:border-void-border transition-colors whitespace-nowrap flex items-center gap-2" href="#sanctions-exile">
                    <span className="text-blood-crimson-bright font-bold font-mono">05.</span>
                    <span>Sanctions &amp; Exile</span>
                  </a>
                  <div className="hidden xl:flex items-center pl-4 pr-2 border-l border-void-border">
                    <button className="text-bone-ivory-dim hover:text-bone-ivory flex items-center gap-1 font-label-sm text-label-sm uppercase tracking-wider" onClick={() => window.print()}>
                      <span className="material-symbols-outlined text-[16px]">print</span>
                      <span>Codex Print</span>
                    </button>
                  </div>
                </div>
              </nav>

              {/* 3. SECTION 1: CODE OF COMBAT */}
              <section className="flex flex-col gap-space-lg scroll-mt-36" id="code-of-combat">
                <div className="flex items-center justify-between border-b border-void-border pb-2">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-display-lg text-display-lg text-blood-crimson leading-none">01</span>
                    <div className="flex flex-col">
                      <h2 className="font-headline-lg text-headline-lg uppercase text-bone-ivory leading-none">CODE OF COMBAT (TERMS OF ENGAGEMENT)</h2>
                      <span className="font-label-sm text-label-sm text-bone-ivory-dim uppercase tracking-widest font-mono">SOVEREIGN USER AGREEMENT // SECTION A-19</span>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block font-label-sm text-label-sm text-blood-crimson uppercase tracking-widest font-mono px-2 py-1 bg-void-surface border border-void-border">
                    [ STATUS: ABSOLUTE ENFORCEMENT ]
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                  <div className="bg-void-surface p-space-lg border border-void-border flex flex-col justify-between hover:border-blood-crimson transition-colors group">
                    <div className="flex flex-col gap-space-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-pumpkin-orange font-mono uppercase tracking-wider">[ CLAUSE 1.1 ]</span>
                        <span className="material-symbols-outlined text-blood-crimson group-hover:scale-110 transition-transform">gavel</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm uppercase text-bone-ivory">Acceptance of Occult Terms</h3>
                      <p className="font-body-md text-body-md text-bone-ivory-dim leading-relaxed">
                        By initializing any matchmaking queue or sparring with the Grim AI, you forfeit standard mortal dispute arbitration. You acknowledge that Chaturanga is a competitive psychological battleground governed by non-negotiable server rules.
                      </p>
                    </div>
                    <div className="mt-space-md pt-space-sm border-t border-void-border/50 font-label-sm text-label-sm text-bone-ivory-muted uppercase">
                      Applies to: All Web &amp; Desktop Clients
                    </div>
                  </div>
                  <div className="bg-void-surface p-space-lg border border-void-border flex flex-col justify-between hover:border-pumpkin-orange transition-colors group">
                    <div className="flex flex-col gap-space-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-pumpkin-orange font-mono uppercase tracking-wider">[ CLAUSE 1.2 ]</span>
                        <span className="material-symbols-outlined text-pumpkin-orange group-hover:scale-110 transition-transform">hourglass_disabled</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm uppercase text-bone-ivory">Zero Abandonment &amp; Stall Edict</h3>
                      <p className="font-body-md text-body-md text-bone-ivory-dim leading-relaxed">
                        Rage-quitting, tab-stalling (deliberately running your remaining clock down in a decisively losing position), or closing network sockets triggers an automated <strong>Soul Forfeiture</strong>. Rating points are immediately deducted and credited to your rival.
                      </p>
                    </div>
                    <div className="mt-space-md pt-space-sm border-t border-void-border/50 font-label-sm text-label-sm text-bone-ivory-muted uppercase">
                      Telemetry Threshold: 30s Client Disconnect
                    </div>
                  </div>
                  <div className="bg-void-surface p-space-lg border border-void-border flex flex-col justify-between hover:border-cursed-violet transition-colors group">
                    <div className="flex flex-col gap-space-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-pumpkin-orange font-mono uppercase tracking-wider">[ CLAUSE 1.3 ]</span>
                        <span className="material-symbols-outlined text-cursed-violet-surge group-hover:scale-110 transition-transform">lock_clock</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm uppercase text-bone-ivory">The FEN Ledger is Irrevocable</h3>
                      <p className="font-body-md text-body-md text-bone-ivory-dim leading-relaxed">
                        Every coordinate packet dispatched over WebSocket is hashed upon arrival. There is no "Takeback" mechanic under any circumstance in Ranked or Tournament arenas. "Mouseslips" are considered psychological fractures of the soul.
                      </p>
                    </div>
                    <div className="mt-space-md pt-space-sm border-t border-void-border/50 font-label-sm text-label-sm text-bone-ivory-muted uppercase">
                      Integrity: Cryptographic Move Validation
                    </div>
                  </div>
                </div>
                <div className="p-space-md bg-surface-container-lowest border-l-4 border-blood-crimson border-y border-r border-void-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-blood-crimson text-[28px]">shield_with_heart</span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-bone-ivory uppercase font-bold">Eligibility &amp; Mental Fortitude Threshold</span>
                      <span className="font-body-sm text-body-sm text-bone-ivory-dim">Combatants must be at least 13 years of age (or legal regional age of digital consent). Dark tactical horror themes are present throughout.</span>
                    </div>
                  </div>
                  <button className="px-space-md py-1.5 bg-void-surface hover:bg-void-surface-hover border border-void-border text-bone-ivory font-label-sm text-label-sm uppercase tracking-wider whitespace-nowrap" type="button">
                    View FIDE Equivalence Rules
                  </button>
                </div>
              </section>

              {/* 4. SECTION 2: ANTI-CHEAT */}
              <section className="flex flex-col gap-space-lg scroll-mt-36" id="anti-cheat-sentinel">
                <div className="flex items-center justify-between border-b border-void-border pb-2">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-display-lg text-display-lg text-pumpkin-orange leading-none">02</span>
                    <div className="flex flex-col">
                      <h2 className="font-headline-lg text-headline-lg uppercase text-bone-ivory leading-none">ANTI-CHEAT &amp; AUTONOMOUS SENTINEL PROTOCOL</h2>
                      <span className="font-label-sm text-label-sm text-bone-ivory-dim uppercase tracking-widest font-mono">REALTIME NEURAL TELEMETRY // STOCKFISH CORRELATION MATRIX</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-pumpkin-orange-blaze animate-ping"></span>
                    <span className="font-label-sm text-label-sm text-pumpkin-orange uppercase tracking-wider font-mono">SCANNING LIVE SERVERS</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
                  <div className="lg:col-span-7 bg-void-surface p-space-lg border border-void-border flex flex-col gap-space-md relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-md text-headline-md uppercase text-bone-ivory">Neural Centipawn Deviation Tracking (NCDT)</span>
                      <span className="px-2 py-0.5 bg-blood-crimson text-bone-ivory font-label-sm text-label-sm uppercase font-mono font-bold">LEVEL 4 SENTINEL</span>
                    </div>
                    <p className="font-body-md text-body-md text-bone-ivory-dim leading-relaxed">
                      Our proprietary WebAssembly telemetry daemon runs concurrent multi-depth analysis on every move submitted across the grid. Player decisions are correlated in real-time against top engine evaluations (Stockfish 17 Depth 26+, Torch, Leela Zero).
                    </p>
                    <div className="bg-ink-black p-space-md border border-void-border flex flex-col gap-2">
                      <div className="flex items-center justify-between font-label-sm text-label-sm text-bone-ivory-dim font-mono">
                        <span>ANALYSIS: MOVE TIME VARIANCE VS. ENGINE ENGINE CORRELATION</span>
                        <span className="text-blood-crimson">HERESY THRESHOLD &gt; 97.4%</span>
                      </div>
                      <svg className="w-full h-24 text-pumpkin-orange" fill="none" viewBox="0 0 600 120" xmlns="http://www.w3.org/2000/svg">
                        <line stroke="#282436" strokeDasharray="4 4" x1="0" x2="600" y1="20" y2="20"></line>
                        <line stroke="#282436" strokeDasharray="4 4" x1="0" x2="600" y1="60" y2="60"></line>
                        <line stroke="#282436" strokeDasharray="4 4" x1="0" x2="600" y1="100" y2="100"></line>
                        <line stroke="#A3132B" strokeDasharray="2 2" strokeWidth="1.5" x1="0" x2="600" y1="35" y2="35"></line>
                        <text fill="#A3132B" fontFamily="JetBrains Mono" fontSize="10" fontWeight="700" x="510" y="30">BAN TRIGGER</text>
                        <path d="M10 95 Q 40 85, 70 102 T 140 70 T 210 88 T 280 65 T 350 92 T 420 80 T 490 60 T 580 82" stroke="#E66A18" strokeLinecap="round" strokeWidth="2"></path>
                        <path d="M380 92 L 400 30 L 440 28 L 470 29 L 510 27" stroke="#D61F3D" strokeDasharray="4 2" strokeLinecap="round" strokeWidth="2"></path>
                        <circle cx="400" cy="30" fill="#D61F3D" r="4"></circle>
                        <circle cx="510" cy="27" fill="#D61F3D" r="4"></circle>
                      </svg>
                      <div className="flex items-center justify-between font-label-sm text-label-sm text-bone-ivory-muted font-mono pt-1">
                        <span>0.00s Move Lag</span>
                        <span className="text-pumpkin-orange">Normal Grandmaster Spread (68-82%)</span>
                        <span className="text-blood-crimson font-bold">Unsanctioned AI Assistance Detected</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-2">
                      <div className="flex items-start gap-2 bg-surface-container-lowest p-2 border border-void-border">
                        <span className="material-symbols-outlined text-pumpkin-orange text-[18px] mt-0.5">tab</span>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-bone-ivory font-bold uppercase">Focus Telemetry</span>
                          <span className="font-body-sm text-body-sm text-bone-ivory-dim">Detects tab-switching, devtools injection, and dual-monitor browser mirroring.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 bg-surface-container-lowest p-2 border border-void-border">
                        <span className="material-symbols-outlined text-blood-crimson text-[18px] mt-0.5">timer</span>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-bone-ivory font-bold uppercase">Chronos Cadence</span>
                          <span className="font-body-sm text-body-sm text-bone-ivory-dim">Uniform decision speeds on complex sacrifice lines are immediate anomalies.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-5 bg-void-surface p-space-lg border border-void-border flex flex-col justify-between">
                    <div className="flex flex-col gap-space-sm">
                      <span className="font-label-sm text-label-sm text-blood-crimson font-mono uppercase tracking-widest">[ DISCIPLINARY ACTIONS ]</span>
                      <h3 className="font-headline-md text-headline-md uppercase text-bone-ivory">The Mark of the Dishonored</h3>
                      <p className="font-body-md text-body-md text-bone-ivory-dim leading-relaxed">
                        Combatants verified to have utilized chess assistance engines, automated solvers, or overlay scripts receive instantaneous and unappealable sanctions:
                      </p>
                      <ul className="flex flex-col gap-2 font-label-sm text-label-sm text-bone-ivory font-mono mt-2">
                        <li className="flex items-center gap-2 p-2 bg-surface-container-lowest border border-void-border">
                          <span className="w-1.5 h-1.5 bg-blood-crimson"></span>
                          <span className="text-blood-crimson-bright font-bold">RATING DRAIN:</span>
                          <span>ELO reset to absolute 0; past victories purged.</span>
                        </li>
                        <li className="flex items-center gap-2 p-2 bg-surface-container-lowest border border-void-border">
                          <span className="w-1.5 h-1.5 bg-blood-crimson"></span>
                          <span className="text-blood-crimson-bright font-bold">SOUL BRANDING:</span>
                          <span>Profile stamped with public "Dishonored" Sigil.</span>
                        </li>
                        <li className="flex items-center gap-2 p-2 bg-surface-container-lowest border border-void-border">
                          <span className="w-1.5 h-1.5 bg-blood-crimson"></span>
                          <span className="text-blood-crimson-bright font-bold">EXILE:</span>
                          <span>Hardware &amp; IP hash banned from matchmaking queues.</span>
                        </li>
                      </ul>
                    </div>
                    <div className="mt-space-md pt-space-md border-t border-void-border flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-bone-ivory-dim uppercase tracking-wider font-mono">LIVE WALL OF HERETICS (LAST 24H)</span>
                        <span className="font-label-sm text-label-sm text-blood-crimson font-bold">142 PURGED</span>
                      </div>
                      <div className="bg-ink-black p-2 border border-void-border flex flex-wrap gap-2 text-[11px] font-mono text-bone-ivory-muted">
                        <span className="px-1.5 py-0.5 bg-blood-crimson/20 text-blood-crimson border border-blood-crimson/40">USER_8829#401 (99.8% STF)</span>
                        <span className="px-1.5 py-0.5 bg-blood-crimson/20 text-blood-crimson border border-blood-crimson/40">VOID_REAPER (SCR_INJECT)</span>
                        <span className="px-1.5 py-0.5 bg-blood-crimson/20 text-blood-crimson border border-blood-crimson/40">HEX_QUEEN_9 (FOCUS_ALT)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 5. SECTION 3: PRIVACY */}
              <section className="flex flex-col gap-space-lg scroll-mt-36" id="soul-ledger-privacy">
                <div className="flex items-center justify-between border-b border-void-border pb-2">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-display-lg text-display-lg text-cursed-violet-surge leading-none">03</span>
                    <div className="flex flex-col">
                      <h2 className="font-headline-lg text-headline-lg uppercase text-bone-ivory leading-none">SOUL RETENTION &amp; PRIVACY LEDGER</h2>
                      <span className="font-label-sm text-label-sm text-bone-ivory-dim uppercase tracking-widest font-mono">GDPR // CCPA // CRYPTOGRAPHIC SOVEREIGNTY PROTOCOL</span>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block font-label-sm text-label-sm text-cursed-violet-surge uppercase tracking-widest font-mono px-2 py-1 bg-void-surface border border-void-border">
                    [ SOVEREIGN PROTOCOL: ZERO UNENCRYPTED LOGS ]
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="bg-void-surface p-space-lg border border-void-border flex flex-col gap-space-md">
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-cursed-violet-surge text-[24px]">database</span>
                      <h3 className="font-headline-sm text-headline-sm uppercase text-bone-ivory">Telemetry Harvested For Matchmaking &amp; Integrity</h3>
                    </div>
                    <p className="font-body-md text-body-md text-bone-ivory-dim">
                      To guarantee zero-latency synchronous tactical gameplay, we log minimal operational packets strictly required by the chess engine:
                    </p>
                    <div className="flex flex-col gap-2 font-mono text-label-sm">
                      <div className="flex items-start justify-between p-2 bg-surface-container-lowest border border-void-border">
                        <span className="text-bone-ivory">Board Move Coordinates</span>
                        <span className="text-pumpkin-orange">Retained in PGN Archive</span>
                      </div>
                      <div className="flex items-start justify-between p-2 bg-surface-container-lowest border border-void-border">
                        <span className="text-bone-ivory">Client Latency &amp; WebSocket Jitter</span>
                        <span className="text-pumpkin-orange">Purged After 48 Hours</span>
                      </div>
                      <div className="flex items-start justify-between p-2 bg-surface-container-lowest border border-void-border">
                        <span className="text-bone-ivory">Hashed Device Architecture (WASM)</span>
                        <span className="text-pumpkin-orange">Anti-Cheat Verification</span>
                      </div>
                      <div className="flex items-start justify-between p-2 bg-surface-container-lowest border border-void-border">
                        <span className="text-bone-ivory">Match Win/Loss Ratios &amp; Elo Deltas</span>
                        <span className="text-cursed-violet-surge font-bold">Immutable Ledger</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-void-surface p-space-lg border border-void-border flex flex-col justify-between">
                    <div className="flex flex-col gap-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-blood-crimson text-[24px]">visibility_off</span>
                        <h3 className="font-headline-sm text-headline-sm uppercase text-bone-ivory">Strict Non-Harvesting Edict</h3>
                      </div>
                      <p className="font-body-md text-body-md text-bone-ivory-dim">
                        We believe your digital vessel is sovereign. The Chaturanga client will never, under any circumstance, conduct unsanctioned background surveillance:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        <div className="p-2.5 bg-surface-container-lowest border border-void-border text-label-sm font-mono text-blood-crimson flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">close</span>
                          <span>NO Out-of-Game Keystrokes</span>
                        </div>
                        <div className="p-2.5 bg-surface-container-lowest border border-void-border text-label-sm font-mono text-blood-crimson flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">close</span>
                          <span>NO External Browsing History</span>
                        </div>
                        <div className="p-2.5 bg-surface-container-lowest border border-void-border text-label-sm font-mono text-blood-crimson flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">close</span>
                          <span>NO Unencrypted Payment Keys</span>
                        </div>
                        <div className="p-2.5 bg-surface-container-lowest border border-void-border text-label-sm font-mono text-blood-crimson flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">close</span>
                          <span>NO Third-Party Ad Trackers</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-space-md p-space-sm bg-ink-black border border-void-border flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-bone-ivory font-bold uppercase">The Right to Oblivion</span>
                        <span className="font-body-sm text-body-sm text-bone-ivory-dim">Purge all match logs, PGNs, and account identity permanently.</span>
                      </div>
                      <button className="px-space-md py-1.5 bg-void-surface hover:bg-blood-crimson border border-void-border hover:border-blood-crimson-bright text-bone-ivory font-label-sm text-label-sm uppercase tracking-wider transition-colors" type="button">
                        Request Oblivion
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* 6. SECTION 4: FIGURINES */}
              <section className="flex flex-col gap-space-lg scroll-mt-36" id="digital-figurines">
                <div className="flex items-center justify-between border-b border-void-border pb-2">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-display-lg text-display-lg text-bone-ivory leading-none">04</span>
                    <div className="flex flex-col">
                      <h2 className="font-headline-lg text-headline-lg uppercase text-bone-ivory leading-none">VIRTUAL FIGURINES &amp; MICROTRANSACTION POLICY</h2>
                      <span className="font-label-sm text-label-sm text-bone-ivory-dim uppercase tracking-widest font-mono">0% PAY-TO-WIN IRONCLAD GUARANTEE // SKINS &amp; FINISHERS</span>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm text-pumpkin-orange uppercase tracking-widest font-mono px-2 py-1 bg-void-surface border border-void-border">
                    [ SKILL SUPREME // ZERO STAT ADVANTAGE ]
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
                  <div className="bg-void-surface p-space-md border border-void-border flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-blood-crimson font-mono uppercase font-bold">[ ARMORY SET 01 ]</span>
                      <span className="font-label-sm text-label-sm text-bone-ivory-dim font-mono">THE CARNIVAL</span>
                    </div>
                    <div className="relative w-full h-48 bg-cover bg-center border border-void-border overflow-hidden group" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCFUS_XTSsoSlHic1C3qcIBv7cekR-j3__MtpGtwGYyQuk8NbcN06mW-cRS43k00OQ5cOcWC0yJJGFIx2hMnBKxi9OiBY2QIvwQMBG2gwa1_sOrlJuh1xLZSnexgTQ0h9bh3-VM7q_ixjHUCqOEAOT2KplRJUAsKQiHdsE17ihjdXAlUj5v5Ag-0DPsq824loBV4p7sB6x6yxXJXCcxU_sQy3fadqcbBtJwA3fFIBfEVKyli1Vo8tGs')" }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-black via-transparent to-transparent"></div>
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-blood-crimson text-bone-ivory font-label-sm text-label-sm font-mono uppercase font-bold">
                        Cosmetic Asset Only
                      </div>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm uppercase text-bone-ivory mt-1">Gothic Animated Army Skins</h4>
                    <p className="font-body-sm text-body-sm text-bone-ivory-dim">
                      Board sets like The Carnival, The Swarm, and The Cursed Harvest feature unique capture executions and ambient board effects. They do not alter piece velocity, range, or legal move paths.
                    </p>
                  </div>
                  <div className="bg-void-surface p-space-md border border-void-border flex flex-col justify-between">
                    <div className="flex flex-col gap-space-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-pumpkin-orange font-mono uppercase font-bold">[ MONETIZATION ETHICS ]</span>
                        <span className="material-symbols-outlined text-pumpkin-orange">balance</span>
                      </div>
                      <h4 className="font-headline-sm text-headline-sm uppercase text-bone-ivory">The Anti-Gacha Manifesto</h4>
                      <p className="font-body-sm text-body-sm text-bone-ivory-dim leading-relaxed">
                        Chaturanga is engineered by competitive chess masters who despise pay-to-win manipulation. There are no booster packs that increase checkmate resistance, no paid hints, no AI time-dilation passes, and no paywalled tactical advantages.
                      </p>
                      <div className="p-space-sm bg-surface-container-lowest border border-void-border font-label-sm text-label-sm font-mono text-bone-ivory flex flex-col gap-1 mt-2">
                        <span className="text-blood-crimson font-bold">// THE THREE LAWS OF TACTICAL CHURANGA:</span>
                        <span>1. Every piece moves identically for Free &amp; Patron combatants.</span>
                        <span>2. Vision and board clocks are 100% symmetric.</span>
                        <span>3. Elo cannot be purchased with currency.</span>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm text-bone-ivory-muted uppercase pt-2">Article VIII - Fair Combat Clause</span>
                  </div>
                  <div className="bg-void-surface p-space-md border border-void-border flex flex-col justify-between">
                    <div className="flex flex-col gap-space-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-cursed-violet-surge font-mono uppercase font-bold">[ COMMERCE RULES ]</span>
                        <span className="material-symbols-outlined text-cursed-violet-surge">currency_exchange</span>
                      </div>
                      <h4 className="font-headline-sm text-headline-sm uppercase text-bone-ivory">Acquisition &amp; Digital Custody</h4>
                      <p className="font-body-sm text-body-sm text-bone-ivory-dim leading-relaxed">
                        Tokens, Blood Sigils, and 3D miniature boards unlocked via the Armory are tied to your personal Combatant Hash. Account transfers, unauthorized third-party key sales, or currency exploitation result in instant inventory voiding without refund.
                      </p>
                      <div className="p-space-sm bg-ink-black border border-void-border font-label-sm text-label-sm text-bone-ivory-dim font-mono">
                        <span className="text-pumpkin-orange font-bold">14-Day Refund Window:</span> Available for unused cosmetic cosmetics before initial equip in a live ranked match.
                      </div>
                    </div>
                    <a className="inline-flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-wider text-pumpkin-orange hover:text-bone-ivory pt-2" href="#">
                      <span>Read Full Digital Asset Agreement</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </section>

              {/* 7. SECTION 5: SANCTIONS */}
              <section className="flex flex-col gap-space-lg scroll-mt-36" id="sanctions-exile">
                <div className="flex items-center justify-between border-b border-void-border pb-2">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-display-lg text-display-lg text-blood-crimson-bright leading-none">05</span>
                    <div className="flex flex-col">
                      <h2 className="font-headline-lg text-headline-lg uppercase text-bone-ivory leading-none">SANCTIONS, ESCALATION MATRIX &amp; EXILE</h2>
                      <span className="font-label-sm text-label-sm text-bone-ivory-dim uppercase tracking-widest font-mono">DISCIPLINARY ESCALATION // ARBITRATION PROTOCOLS</span>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm text-blood-crimson uppercase tracking-widest font-mono px-2 py-1 bg-void-surface border border-void-border">
                    [ NO MITIGATION FOR HERESY ]
                  </span>
                </div>
                <div className="w-full overflow-x-auto border border-void-border bg-void-surface">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-lowest border-b border-void-border font-label-sm text-label-sm uppercase text-bone-ivory-dim font-mono">
                        <th className="p-space-md border-r border-void-border">Violation Tier</th>
                        <th className="p-space-md border-r border-void-border">Infraction Manifest</th>
                        <th className="p-space-md border-r border-void-border">Autonomous Detection</th>
                        <th className="p-space-md border-r border-void-border">Automated Sanction</th>
                        <th className="p-space-md">Appeal Rights</th>
                      </tr>
                    </thead>
                    <tbody className="font-label-sm text-label-sm font-mono divide-y divide-void-border">
                      <tr className="hover:bg-void-surface-hover transition-colors">
                        <td className="p-space-md border-r border-void-border text-pumpkin-orange font-bold whitespace-nowrap">
                          TIER 01: MINOR DISRUPTION
                        </td>
                        <td className="p-space-md border-r border-void-border text-bone-ivory font-sans">
                          Chat toxicity, excessive draw spamming, stall-flagging in hopeless positions (&lt;10s clock refusal).
                        </td>
                        <td className="p-space-md border-r border-void-border text-bone-ivory-dim">
                          Heuristic Sentiment &amp; Time Parser
                        </td>
                        <td className="p-space-md border-r border-void-border text-pumpkin-orange font-bold">
                          24h Chat Silence + 50 ELO Tithe
                        </td>
                        <td className="p-space-md text-bone-ivory-dim">
                          Automatic Expiry (No review required)
                        </td>
                      </tr>
                      <tr className="hover:bg-void-surface-hover transition-colors">
                        <td className="p-space-md border-r border-void-border text-pumpkin-orange-blaze font-bold whitespace-nowrap">
                          TIER 02: COMBAT DESERTION
                        </td>
                        <td className="p-space-md border-r border-void-border text-bone-ivory font-sans">
                          Repeated match disconnection, sandbagging (deliberate Elo manipulation), multi-account queue sniffing.
                        </td>
                        <td className="p-space-md border-r border-void-border text-bone-ivory-dim">
                          ELO Delta Anomaly Engine &amp; Socket Watch
                        </td>
                        <td className="p-space-md border-r border-void-border text-blood-crimson font-bold">
                          7-Day Arena Banishment + Queue Quarantine
                        </td>
                        <td className="p-space-md text-bone-ivory">
                          Standard Dossier Appeal
                        </td>
                      </tr>
                      <tr className="bg-blood-crimson/10 hover:bg-blood-crimson/15 transition-colors">
                        <td className="p-space-md border-r border-void-border text-blood-crimson-bright font-bold whitespace-nowrap flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-blood-crimson animate-pulse"></span>
                          TIER 03: TOTAL HERESY
                        </td>
                        <td className="p-space-md border-r border-void-border text-bone-ivory font-sans">
                          Stockfish/Torch engine injection, automated move botting, WASM client tampering, DDoS against match servers.
                        </td>
                        <td className="p-space-md border-r border-void-border text-blood-crimson font-bold">
                          Centipawn Deviation (&gt;97.4%) + Client Memory Hash
                        </td>
                        <td className="p-space-md border-r border-void-border text-blood-crimson-bright font-bold">
                          PERMANENT SOUL BAN + HARDWARE HASH EXPULSION
                        </td>
                        <td className="p-space-md text-blood-crimson font-bold">
                          Single PGN Forensic Re-Check Only
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-void-surface p-space-xl border border-void-border flex flex-col lg:flex-row items-center justify-between gap-space-lg">
                  <div className="flex flex-col gap-space-xs max-w-2xl text-center lg:text-left">
                    <span className="font-label-sm text-label-sm text-blood-crimson uppercase tracking-widest font-mono font-bold">
                      [ OFFICIAL DISPUTE ARBITRATION DOSSIER ]
                    </span>
                    <h3 className="font-headline-md text-headline-md uppercase text-bone-ivory leading-tight">
                      Subject to an Injustice in the Blood Arena?
                    </h3>
                    <p className="font-body-md text-body-md text-bone-ivory-dim">
                      Appeals against Autonomous Sentinel sanctions must be submitted within 72 hours of disciplinary action. You must include your raw PGN match telemetry and cryptographic match ID. Frivolous engine appeals double the ban duration.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-space-md w-full lg:w-auto">
                    <button className="px-space-lg py-3 bg-void-surface hover:bg-void-surface-hover border border-pumpkin-orange text-bone-ivory font-headline-sm text-headline-sm uppercase tracking-wider transition-colors flex items-center gap-space-xs" type="button">
                      <span className="material-symbols-outlined text-pumpkin-orange text-[20px]">download</span>
                      <span>Download Full Codex (PDF)</span>
                    </button>
                    <button className="px-space-lg py-3 bg-blood-crimson hover:bg-blood-crimson-bright border border-blood-crimson-bright text-bone-ivory font-headline-sm text-headline-sm uppercase tracking-widest shadow-[0_0_20px_rgba(163,19,43,0.55)] transition-all flex items-center gap-space-xs" type="button">
                      <span className="material-symbols-outlined text-bone-ivory text-[20px]">gavel</span>
                      <span>Submit Regulation Appeal</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* 8. FREQUENTLY INVOKED EDCTS */}
              <section className="flex flex-col gap-space-md border-t border-void-border pt-space-xl">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-pumpkin-orange uppercase tracking-widest font-mono">SUPPLEMENTARY INQUIRIES</span>
                  <h3 className="font-headline-lg text-headline-lg uppercase text-bone-ivory">FREQUENTLY INVOKED COVENANTS</h3>
                </div>
                <div className="flex flex-col gap-2" id="covenant-accordion">
                  <details className="group bg-void-surface border border-void-border p-space-md cursor-pointer transition-all duration-150 open:border-blood-crimson open:bg-void-surface-hover">
                    <summary className="flex items-center justify-between font-headline-sm text-headline-sm uppercase text-bone-ivory select-none list-none">
                      <span className="flex items-center gap-space-sm">
                        <span className="text-blood-crimson font-mono text-label-md">[ § 12.4 ]</span>
                        <span>Are premoves legally binding if a tactical trap triggers?</span>
                      </span>
                      <span className="material-symbols-outlined text-bone-ivory-dim group-open:rotate-180 transition-transform">expand_more</span>
                    </summary>
                    <div className="mt-space-sm pt-space-sm border-t border-void-border font-body-md text-body-md text-bone-ivory-dim leading-relaxed">
                      Yes. Premoves in Chaturanga are executed client-side with zero latency buffer. If you premove your Queen into a discovered checkmate line or pawn capture square, the action is irreversible under the Inviolable Move Covenant. Premoving is inherently a pact with psychological risk.
                    </div>
                  </details>
                  <details className="group bg-void-surface border border-void-border p-space-md cursor-pointer transition-all duration-150 open:border-pumpkin-orange open:bg-void-surface-hover">
                    <summary className="flex items-center justify-between font-headline-sm text-headline-sm uppercase text-bone-ivory select-none list-none">
                      <span className="flex items-center gap-space-sm">
                        <span className="text-pumpkin-orange font-mono text-label-md">[ § 18.1 ]</span>
                        <span>Can I stream ranked combat on Twitch or YouTube without anti-cheat strikes?</span>
                      </span>
                      <span className="material-symbols-outlined text-bone-ivory-dim group-open:rotate-180 transition-transform">expand_more</span>
                    </summary>
                    <div className="mt-space-sm pt-space-sm border-t border-void-border font-body-md text-body-md text-bone-ivory-dim leading-relaxed">
                      Streaming is fully permitted and encouraged. However, combatants broadcasting at Elo 2000+ are strongly advised to enforce a 60-second broadcast delay to prevent stream-sniping. "Ghosting" by opposing players is recognized as an honor violation, but match outcomes will not be re-rolled post-facto.
                    </div>
                  </details>
                  <details className="group bg-void-surface border border-void-border p-space-md cursor-pointer transition-all duration-150 open:border-cursed-violet open:bg-void-surface-hover">
                    <summary className="flex items-center justify-between font-headline-sm text-headline-sm uppercase text-bone-ivory select-none list-none">
                      <span className="flex items-center gap-space-sm">
                        <span className="text-cursed-violet-surge font-mono text-label-md">[ § 29.8 ]</span>
                        <span>How does the Grim AI handle engine parity during practice bouts?</span>
                      </span>
                      <span className="material-symbols-outlined text-bone-ivory-dim group-open:rotate-180 transition-transform">expand_more</span>
                    </summary>
                    <div className="mt-space-sm pt-space-sm border-t border-void-border font-body-md text-body-md text-bone-ivory-dim leading-relaxed">
                      Grim AI utilizes customized neural evaluation weights trained explicitly on romantic-era tactical sacrifices and aggressive horror counterplay. Matches against Grim AI do not count toward official FIDE-equivalent Elo rankings and are entirely exempt from anti-cheat external assistance penalties.
                    </div>
                  </details>
                </div>
              </section>

              {/* 9. FINAL COVENANT SEAL */}
              <div className="p-space-lg bg-ink-black border border-void-border flex flex-col md:flex-row items-center justify-between gap-space-md text-center md:text-left">
                <div className="flex items-center gap-space-md">
                  <div className="w-12 h-12 bg-void-surface border border-blood-crimson flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-blood-crimson text-[28px]">verified</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm uppercase text-bone-ivory">Cryptographically Consecrated Document</span>
                    <span className="font-label-sm text-label-sm text-bone-ivory-dim font-mono">ALL WARDS AND CLAUSES SIGNED UNDER CHATURANGA SECURITY DIRECTIVE V4.2</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm font-label-sm text-label-sm text-bone-ivory-muted uppercase font-mono">
                  <span className="w-2 h-2 bg-blood-crimson"></span>
                  <span>COVEN ENFORCEMENT ENGINE 24/7 ONLINE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
