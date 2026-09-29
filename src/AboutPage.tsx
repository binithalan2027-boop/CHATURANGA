import { useEffect } from 'react';

interface AboutPageProps {
  onBack: () => void;
  onPlay: () => void;
}

export default function AboutPage({ onBack, onPlay }: AboutPageProps) {
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
          {/* AMBIENT VOLUMETRIC GRADIENTS (CLIPPED INTERNALLY) */}
          <div className="relative w-full overflow-hidden">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[480px] bg-blood-crimson/15 blur-[140px] pointer-events-none"></div>
            <div className="absolute top-[800px] -left-48 w-[600px] h-[600px] bg-cursed-violet/10 blur-[160px] pointer-events-none"></div>
            <div className="absolute top-[1600px] -right-48 w-[700px] h-[700px] bg-pumpkin-orange/10 blur-[180px] pointer-events-none"></div>

            {/* 1. HERO HEADER // MANIFESTO */}
            <section className="relative w-full max-w-[1440px] mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
              <div className="flex flex-wrap items-center justify-between gap-space-md">
                <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-bone-ivory-dim uppercase tracking-widest bg-void-surface px-space-md py-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-blood-crimson"></span>
                  <span>PROTOCOL</span>
                  <span className="text-void-border">/</span>
                  <span>ARCHIVES</span>
                  <span className="text-void-border">/</span>
                  <span className="text-blood-crimson font-bold">FILE_001</span>
                  <span className="text-void-border">/</span>
                  <span>ORIGINS</span>
                </div>
                <div className="flex items-center gap-space-sm bg-void-surface px-space-md py-1.5 shadow-sm">
                  <span className="w-2 h-2 bg-pumpkin-orange animate-pulse"></span>
                  <span className="font-label-sm text-label-sm text-bone-ivory uppercase tracking-wider font-semibold">
                    FOUNDED 2025 // TOKYO - BUCHAREST // ZERO BORING MATCHES GUARANTEE
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-space-xs pt-space-md">
                <div className="flex items-baseline gap-space-md flex-wrap">
                  <span className="font-headline-sm text-headline-sm text-blood-crimson uppercase tracking-widest">[ DECLASSIFIED STRATEGY DOSSIER ]</span>
                  <span className="font-label-sm text-label-sm text-bone-ivory-muted tracking-widest font-mono">SECTOR 04 // COMBAT REVOLUTION</span>
                </div>
                <h1 className="font-display-xl text-display-xl uppercase text-bone-ivory tracking-wide leading-none select-none drop-shadow-[0_4px_32px_rgba(163,19,43,0.35)]">
                  CHESS GOT <span className="text-blood-crimson-bright underline decoration-blood-crimson/40 underline-offset-8">POSSESSED.</span>
                </h1>
                <p className="font-headline-md text-headline-md text-bone-ivory-dim uppercase tracking-wider max-w-4xl mt-space-xs">
                  Traditional strategy stripped bare, resurrected in blood and electric chaos.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mt-space-md">
                <div className="bg-void-surface p-space-md shadow-md flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-bone-ivory-dim uppercase tracking-wider">HARVEST STATS</span>
                    <span className="material-symbols-outlined text-blood-crimson text-[18px]">skull</span>
                  </div>
                  <div className="mt-space-sm">
                    <div className="font-headline-lg text-headline-lg text-bone-ivory tracking-wider leading-none">4,892,104</div>
                    <div className="font-label-sm text-label-sm text-blood-crimson font-bold uppercase tracking-widest mt-1">CAPTURED SOULS</div>
                  </div>
                </div>
                <div className="bg-void-surface p-space-md shadow-md flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-bone-ivory-dim uppercase tracking-wider">WAR ZONES</span>
                    <span className="material-symbols-outlined text-pumpkin-orange text-[18px]">swords</span>
                  </div>
                  <div className="mt-space-sm">
                    <div className="font-headline-lg text-headline-lg text-bone-ivory tracking-wider leading-none">09 ARENAS</div>
                    <div className="font-label-sm text-label-sm text-pumpkin-orange font-bold uppercase tracking-widest mt-1">BRUTAL FORMATS</div>
                  </div>
                </div>
                <div className="bg-void-surface p-space-md shadow-md flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-bone-ivory-dim uppercase tracking-wider">NEURAL TICK</span>
                    <span className="material-symbols-outlined text-tertiary text-[18px]">bolt</span>
                  </div>
                  <div className="mt-space-sm">
                    <div className="font-headline-lg text-headline-lg text-bone-ivory tracking-wider leading-none">12.4 MS</div>
                    <div className="font-label-sm text-label-sm text-tertiary font-bold uppercase tracking-widest mt-1">ENGINE LATENCY</div>
                  </div>
                </div>
                <div className="bg-void-surface p-space-md shadow-md flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-bone-ivory-dim uppercase tracking-wider">CURSED COHORT</span>
                    <span className="material-symbols-outlined text-cursed-violet-surge text-[18px]">pest_control</span>
                  </div>
                  <div className="mt-space-sm">
                    <div className="font-headline-lg text-headline-lg text-bone-ivory tracking-wider leading-none">03 ARMIES</div>
                    <div className="font-label-sm text-label-sm text-cursed-violet-surge font-bold uppercase tracking-widest mt-1">NIGHTMARE LEGIONS</div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. THE GENESIS & PHILOSOPHY */}
            <section className="relative w-full max-w-[1440px] mx-auto px-margin py-space-xl">
              <div className="flex items-center gap-space-sm mb-space-md">
                <span className="w-3 h-3 bg-blood-crimson"></span>
                <span className="font-label-sm text-label-sm text-blood-crimson uppercase tracking-widest font-mono font-bold">SECTION 02 // HISTORICAL TRAJECTORY</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg uppercase text-bone-ivory tracking-wide mb-space-lg">
                WHY CHATURANGA? THE DIVIDE BETWEEN WOOD AND FLESH.
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter items-stretch">
                <div className="bg-void-surface p-space-xl shadow-lg flex flex-col justify-between relative overflow-hidden">
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-bone-ivory-dim uppercase tracking-widest font-mono">[ AD 550 // GUPTA EMPIRE ]</span>
                      <span className="px-2 py-0.5 bg-surface-container font-label-sm text-label-sm text-bone-ivory-dim uppercase">THE ANCIENT SEED</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-bone-ivory uppercase tracking-wide">
                      FOUR BRANCHES OF TOTAL ARMED CONFLICT
                    </h3>
                    <p className="font-body-lg text-body-lg text-bone-ivory-dim leading-relaxed mt-space-xs">
                      Centuries ago, <em className="text-bone-ivory font-serif not-italic">Chaturanga</em> simulated the supreme brutality of war: Infantry, Cavalry, War Elephants, and War Chariots clashing across an ashtapada board without mercy.
                    </p>
                    <p className="font-body-md text-body-md text-bone-ivory-muted leading-relaxed">
                      Through Victorian standardization, the combat was domesticated. Blood gave way to clock ticks. Terror gave way to sterile calculation. Pieces became carved timber pegs sliding politely over varnished oak, divorced from the primal dread of total annihilation.
                    </p>
                  </div>
                  <div className="mt-space-xl pt-space-md bg-void-surface-hover p-space-md">
                    <div className="flex items-center gap-space-sm text-bone-ivory-dim font-label-sm text-label-sm uppercase font-mono">
                      <span className="material-symbols-outlined text-[18px] text-bone-ivory-muted">history_edu</span>
                      <span>HISTORICAL VERDICT: STERILIZED TACTICS OVER 14 CENTURIES</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container p-space-xl shadow-xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blood-crimson/10 blur-2xl pointer-events-none"></div>
                  <div className="flex flex-col gap-space-sm relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-pumpkin-orange uppercase tracking-widest font-mono">[ PROTOCOL 2025 // TOKYO ENGINE ]</span>
                      <span className="px-2 py-0.5 bg-primary-container font-label-sm text-label-sm text-bone-ivory uppercase font-bold">THE CURSED AWAKENING</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-bone-ivory uppercase tracking-wide">
                      RE-INJECTING TERROR AND KINETIC VIOLENCE
                    </h3>
                    <p className="font-body-lg text-body-lg text-bone-ivory leading-relaxed mt-space-xs">
                      We took the raw mathematical backbone of 64 squares and infused it with gothic horror miniature craft, anime screen-shaking finisher sequences, and occult atmospheric dread.
                    </p>
                    <blockquote className="bg-void-surface p-space-md text-bone-ivory font-headline-sm text-headline-sm uppercase tracking-wider text-blood-crimson">
                      “Every move is an execution. Every check is a death sentence.”
                    </blockquote>
                    <p className="font-body-md text-body-md text-bone-ivory-dim leading-relaxed">
                      Pawns do not merely exchange positions—they are pulverized into cursed ectoplasm. Knights erupt through demonic rifts. Rooks smash down like haunted iron maidens. Strategy remains absolute; mercy is extinct.
                    </p>
                  </div>
                  <div className="mt-space-xl pt-space-md bg-primary-container/20 p-space-md relative z-10">
                    <div className="flex items-center gap-space-sm text-primary font-label-sm text-label-sm uppercase font-mono font-bold">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>OPERATIONAL MANDATE: PURE CHESS RULES + 100% UNHINGED COMBAT ARTISTRY</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. THE THREE CURSED ARMIES */}
            <section className="relative w-full max-w-[1440px] mx-auto px-margin py-space-xl">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
                <div>
                  <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-pumpkin-orange uppercase tracking-widest font-mono font-bold">
                    <span className="w-2 h-2 bg-pumpkin-orange"></span>
                    <span>SECTION 03 // BATTLEFIELD COHORTS</span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg uppercase text-bone-ivory tracking-wide mt-1">
                    THE THREE CURSED ARMIES
                  </h2>
                  <p className="font-body-md text-body-md text-bone-ivory-dim max-w-2xl mt-1">
                    Each faction is meticulously sculpted with bespoke 3D nightmare figurines, signature dynamic executions, and asymmetric atmospheric audio.
                  </p>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="px-space-sm py-1 bg-void-surface text-bone-ivory font-label-sm text-label-sm uppercase tracking-wider">FIGURINES: PRODUCTION READY</span>
                  <span className="px-space-sm py-1 bg-blood-crimson text-bone-ivory font-label-sm text-label-sm uppercase tracking-wider font-bold">SEASON 01 IN COMBAT</span>
                </div>
              </div>
              <div className="w-full bg-void-surface shadow-2xl relative overflow-hidden mb-space-xl">
                <div className="relative w-full aspect-[16/9] max-h-[640px] overflow-hidden">
                  <img className="w-full h-full object-cover object-center" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4Yoe4875cXUhjb85CaQ4Sac7z0CCXNftzYE8htXs5Hab_McFSLSjMAaFtrj1FIEFGw3CqssSDqs1RchvlgayIMd-qf5Xm8YHTrwdwMvANtqH3pa0vfVjs-Kxy3SKLeNCy-vEUl4-wqRPd02vRd02ncONvjVXl5YhX3RR5cftWVRiRjwae-E2rbZH4CqFQb79ODbyYzjF5SZSqg--4rufl0yLTxkydnSgJhwllgkRxGEuwlBX9CHZx" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-black via-ink-black/40 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-space-md">
                    <div className="bg-ink-black/90 p-space-md backdrop-blur-md max-w-lg shadow-xl">
                      <span className="font-label-sm text-label-sm text-pumpkin-orange font-mono uppercase tracking-widest">TACTICAL RENDER // CODEX-X9</span>
                      <h4 className="font-headline-md text-headline-md text-bone-ivory uppercase tracking-wider mt-1">TRIAD OF ABYSSAL ARCHETYPES</h4>
                      <p className="font-body-sm text-body-sm text-bone-ivory-dim mt-1">
                        Captured during real-time 60fps anime VFX rendering tests. Cast in bone ivory, charred brass, and cursed resins.
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-space-md bg-ink-black/85 px-space-md py-space-sm backdrop-blur-md">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-blood-crimson"></span>
                        <span className="font-label-sm text-label-sm text-bone-ivory uppercase">Carnival</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-cursed-violet"></span>
                        <span className="font-label-sm text-label-sm text-bone-ivory uppercase">Swarm</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-pumpkin-orange"></span>
                        <span className="font-label-sm text-label-sm text-bone-ivory uppercase">Harvest</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <div className="bg-void-surface shadow-xl flex flex-col justify-between group hover:bg-void-surface-hover transition-colors duration-200">
                  <div className="p-space-lg flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-blood-crimson uppercase tracking-widest font-mono font-bold">[ SET_01 // CARNIVAL ]</span>
                      <span className="px-2 py-0.5 bg-primary-container text-bone-ivory font-label-sm text-label-sm uppercase font-bold">JESTERS &amp; CLOWNS</span>
                    </div>
                    <div>
                      <h3 className="font-headline-md text-headline-md text-bone-ivory uppercase tracking-wider">THE CARNIVAL</h3>
                      <p className="font-label-md text-label-md text-blood-crimson uppercase tracking-widest font-mono mt-0.5">THE LAUGHING GUILLOTINE</p>
                    </div>
                    <p className="font-body-md text-body-md text-bone-ivory-dim leading-relaxed">
                      Born from the charred remains of a midnight theater. The Carnival utilizes psychological dread, inverted smiles, theatrical acrobatics, and grotesque mockery. Each piece moves with unnatural, elastic choreography.
                    </p>
                    <div className="bg-ink-black/60 p-space-md flex flex-col gap-space-xs">
                      <span className="font-label-sm text-label-sm text-bone-ivory-muted uppercase tracking-wider font-mono">SIGNATURE MANEUVER</span>
                      <span className="font-headline-sm text-headline-sm text-blood-crimson uppercase tracking-wider">THE GRINNING GAMBIT</span>
                      <p className="font-body-sm text-body-sm text-bone-ivory-dim">
                        Capturing with the Harlequin Knight triggers a deafening theatrical laugh, distorting opposing coordinates for three seconds.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-space-xs">
                      <div className="flex justify-between font-label-sm text-label-sm text-bone-ivory-dim uppercase">
                        <span>PSYCHOLOGICAL DAMAGE</span>
                        <span className="text-blood-crimson font-mono font-bold">98 / 100</span>
                      </div>
                      <div className="w-full h-1 bg-surface-container overflow-hidden">
                        <div className="h-full bg-blood-crimson w-[98%]"></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-space-md bg-void-surface-hover flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-bone-ivory-dim uppercase font-mono">PALETTE: CRIMSON // IVORY</span>
                    <span className="material-symbols-outlined text-blood-crimson text-[20px]">theater_comedy</span>
                  </div>
                </div>
                <div className="bg-void-surface shadow-xl flex flex-col justify-between group hover:bg-void-surface-hover transition-colors duration-200">
                  <div className="p-space-lg flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest font-mono font-bold">[ SET_02 // SWARM ]</span>
                      <span className="px-2 py-0.5 bg-tertiary-container text-tertiary-fixed font-label-sm text-label-sm uppercase font-bold">SPIDERS &amp; CHITIN</span>
                    </div>
                    <div>
                      <h3 className="font-headline-md text-headline-md text-bone-ivory uppercase tracking-wider">THE SWARM</h3>
                      <p className="font-label-md text-label-md text-tertiary uppercase tracking-widest font-mono mt-0.5">THE RELENTLESS WEAVE</p>
                    </div>
                    <p className="font-body-md text-body-md text-bone-ivory-dim leading-relaxed">
                      Exhumed from deep underground catacombs where bone and carapace fused. Multi-limbed siege units crawling in coordinated geometric suffocations. Relentless attrition that punishes overextended tactical lines.
                    </p>
                    <div className="bg-ink-black/60 p-space-md flex flex-col gap-space-xs">
                      <span className="font-label-sm text-label-sm text-bone-ivory-muted uppercase tracking-wider font-mono">SIGNATURE MANEUVER</span>
                      <span className="font-headline-sm text-headline-sm text-tertiary uppercase tracking-wider">ABYSSAL THREADING</span>
                      <p className="font-body-sm text-body-sm text-bone-ivory-dim">
                        The Bone Spider Rook anchors to the board, pinning diagonal diagonals with violet silk threads that immobilize sliding targets.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-space-xs">
                      <div className="flex justify-between font-label-sm text-label-sm text-bone-ivory-dim uppercase">
                        <span>TERRITORIAL CONTROL</span>
                        <span className="text-tertiary font-mono font-bold">94 / 100</span>
                      </div>
                      <div className="w-full h-1 bg-surface-container overflow-hidden">
                        <div className="h-full bg-tertiary w-[94%]"></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-space-md bg-void-surface-hover flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-bone-ivory-dim uppercase font-mono">PALETTE: OBSIDIAN // VIOLET</span>
                    <span className="material-symbols-outlined text-tertiary text-[20px]">pest_control</span>
                  </div>
                </div>
                <div className="bg-void-surface shadow-xl flex flex-col justify-between group hover:bg-void-surface-hover transition-colors duration-200">
                  <div className="p-space-lg flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-pumpkin-orange uppercase tracking-widest font-mono font-bold">[ SET_03 // HARVEST ]</span>
                      <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase font-bold">PUMPKINS &amp; WITCHES</span>
                    </div>
                    <div>
                      <h3 className="font-headline-md text-headline-md text-bone-ivory uppercase tracking-wider">THE CURSED HARVEST</h3>
                      <p className="font-label-md text-label-md text-pumpkin-orange uppercase tracking-widest font-mono mt-0.5">THE PYRE OF MIDNIGHT</p>
                    </div>
                    <p className="font-body-md text-body-md text-bone-ivory-dim leading-relaxed">
                      Awakened in decaying pumpkin orchards and solitary witch towers. Ancient pyres, enchanted scythes, and animated scarecrow golems that engulf the battlefield in searing embers and occult alchemy.
                    </p>
                    <div className="bg-ink-black/60 p-space-md flex flex-col gap-space-xs">
                      <span className="font-label-sm text-label-sm text-bone-ivory-muted uppercase tracking-wider font-mono">SIGNATURE MANEUVER</span>
                      <span className="font-headline-sm text-headline-sm text-pumpkin-orange uppercase tracking-wider">WITCHING HOUR CHECKMATE</span>
                      <p className="font-body-sm text-body-sm text-bone-ivory-dim">
                        Delivering mate with the Harvest Witch ignites the entire board in orange hellfire, disintegrating the enemy King into cinders.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-space-xs">
                      <div className="flex justify-between font-label-sm text-label-sm text-bone-ivory-dim uppercase">
                        <span>PYROTECHNIC IMPACT</span>
                        <span className="text-pumpkin-orange font-mono font-bold">99 / 100</span>
                      </div>
                      <div className="w-full h-1 bg-surface-container overflow-hidden">
                        <div className="h-full bg-pumpkin-orange w-[99%]"></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-space-md bg-void-surface-hover flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-bone-ivory-dim uppercase font-mono">PALETTE: EMBER // CHARCOAL</span>
                    <span className="material-symbols-outlined text-pumpkin-orange text-[20px]">local_fire_department</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. CORE ENGINEERING */}
            <section className="relative w-full max-w-[1440px] mx-auto px-margin py-space-xl">
              <div className="flex items-center gap-space-sm mb-space-md">
                <span className="w-3 h-3 bg-tertiary"></span>
                <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest font-mono font-bold">SECTION 04 // ENGINEERING ARCHITECTURE</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg uppercase text-bone-ivory tracking-wide mb-space-lg">
                BRUTAL PRECISION: THE CYBER-TACTICAL ENGINE
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-space-xl">
                <div className="bg-void-surface p-space-lg shadow-md flex flex-col justify-between">
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-bone-ivory-dim font-mono uppercase">COMPUTE NODE // 01</span>
                      <span className="material-symbols-outlined text-blood-crimson text-[20px]">memory</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-bone-ivory uppercase tracking-wider">STOCKFISH 10 WASM WORKER</h3>
                    <p className="font-body-md text-body-md text-bone-ivory-dim leading-relaxed">
                      Compiled to client-side WebAssembly executing across isolated WebWorkers. Zero server trip delays for move validation, positional evaluations, and AI bot simulations. Over 4.2 million positions evaluated per second in-browser.
                    </p>
                  </div>
                  <div className="mt-space-md pt-space-sm flex items-center justify-between font-label-sm text-label-sm text-bone-ivory-muted uppercase font-mono">
                    <span>CLIENT-SIDE ENGINE</span>
                    <span className="text-blood-crimson font-bold">[THREAT LEVEL: S-RANK]</span>
                  </div>
                </div>
                <div className="bg-void-surface p-space-lg shadow-md flex flex-col justify-between">
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-bone-ivory-dim font-mono uppercase">RENDER PIPELINE // 02</span>
                      <span className="material-symbols-outlined text-pumpkin-orange text-[20px]">speed</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-bone-ivory uppercase tracking-wider">60FPS ANIME VFX STACK</h3>
                    <p className="font-body-md text-body-md text-bone-ivory-dim leading-relaxed">
                      Deterministic frame-synced particle systems, impact frame freezes, chromatic aberration screen tears, and manga speed-line overlays. Engineered to never obscure tactical board coordinates or legal move indicators.
                    </p>
                  </div>
                  <div className="mt-space-md pt-space-sm flex items-center justify-between font-label-sm text-label-sm text-bone-ivory-muted uppercase font-mono">
                    <span>FRAME PACING</span>
                    <span className="text-pumpkin-orange font-bold">[LOCKED 60 FPS]</span>
                  </div>
                </div>
                <div className="bg-void-surface p-space-lg shadow-md flex flex-col justify-between">
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-bone-ivory-dim font-mono uppercase">NETWORK MESH // 03</span>
                      <span className="material-symbols-outlined text-tertiary text-[20px]">hub</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-bone-ivory uppercase tracking-wider">SUPABASE REALTIME MESH</h3>
                    <p className="font-body-md text-body-md text-bone-ivory-dim leading-relaxed">
                      Global peer-to-peer WebSocket mesh networking. Clocks are synced to atomic NTP relays with automatic jitter mitigation, providing an absolute esports-grade zero-desync guarantee across 14 global edge clusters.
                    </p>
                  </div>
                  <div className="mt-space-md pt-space-sm flex items-center justify-between font-label-sm text-label-sm text-bone-ivory-muted uppercase font-mono">
                    <span>AVG GLOBAL PING</span>
                    <span className="text-tertiary font-bold">[14 MS FLAT]</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-md text-headline-md text-bone-ivory uppercase tracking-wider">THE CORE COVEN // ARCHITECTS</h3>
                  <span className="font-label-sm text-label-sm text-bone-ivory-dim font-mono uppercase">STAFF PROTOCOL 2025</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                  <div className="bg-void-surface p-space-md shadow-md flex items-start gap-space-md">
                    <div className="w-16 h-16 bg-surface-container flex-shrink-0 flex items-center justify-center text-blood-crimson">
                      <span className="material-symbols-outlined text-[32px]">chess</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-blood-crimson uppercase font-mono font-bold">LEAD ARCHITECT / GRANDMASTER</span>
                      <span className="font-title-md text-title-md text-bone-ivory font-bold uppercase tracking-wide">Vex "Voidweaver" K.</span>
                      <p className="font-body-sm text-body-sm text-bone-ivory-dim mt-1">
                        Ex-FIDE 2520 Master turned Occult Systems Engineer. Directs engine balance, board geometries, and tactical pacing.
                      </p>
                    </div>
                  </div>
                  <div className="bg-void-surface p-space-md shadow-md flex items-start gap-space-md">
                    <div className="w-16 h-16 bg-surface-container flex-shrink-0 flex items-center justify-center text-pumpkin-orange">
                      <span className="material-symbols-outlined text-[32px]">brush</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-pumpkin-orange uppercase font-mono font-bold">COMBAT ANIMATION DIRECTOR</span>
                      <span className="font-title-md text-title-md text-bone-ivory font-bold uppercase tracking-wide">Kira S.</span>
                      <p className="font-body-sm text-body-sm text-bone-ivory-dim mt-1">
                        Veteran anime combat animator &amp; 3D sculpture lead. Crafted the hyper-kinetic death animations and finisher VFX.
                      </p>
                    </div>
                  </div>
                  <div className="bg-void-surface p-space-md shadow-md flex items-start gap-space-md">
                    <div className="w-16 h-16 bg-surface-container flex-shrink-0 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined text-[32px]">terminal</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-tertiary uppercase font-mono font-bold">NEURAL SYSTEMS ARCHITECT</span>
                      <span className="font-title-md text-title-md text-bone-ivory font-bold uppercase tracking-wide">Dr. Aris Thorne</span>
                      <p className="font-body-sm text-body-sm text-bone-ivory-dim mt-1">
                        WASM chess engine compiler and real-time distributed systems researcher. Engineered the client WebWorker cluster.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. COMMUNITY SANCTUM */}
            <section className="relative w-full max-w-[1440px] mx-auto px-margin py-space-2xl">
              <div className="bg-surface-container p-space-xl md:p-space-2xl shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-blood-crimson/25 blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col items-center max-w-3xl gap-space-md">
                  <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-blood-crimson uppercase tracking-widest font-mono bg-void-surface px-space-md py-1 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-blood-crimson animate-ping"></span>
                    <span>VOID PROTOCOL ACTIVE // RECRUITMENT OPEN</span>
                  </div>
                  <h2 className="font-display-lg text-display-lg uppercase text-bone-ivory tracking-wider leading-none mt-space-xs">
                    STEP INTO THE VOID.
                  </h2>
                  <p className="font-body-lg text-body-lg text-bone-ivory-dim max-w-2xl leading-relaxed">
                    The board is consecrated in salt and brimstone. Your opponents are waiting in ranked queue across North America, Europe, and Asia-Pacific. No polite draws. No sterile stalemates.
                  </p>
                  <div className="w-full max-w-xl bg-ink-black p-space-md text-left font-mono font-label-sm text-label-sm text-bone-ivory shadow-inner mt-space-sm flex flex-col gap-1">
                    <div className="flex items-center justify-between text-bone-ivory-muted text-[10px] pb-1">
                      <span>CHATURANGA_CLI // v0.9.4</span>
                      <span>TLS_ENCRYPTED</span>
                    </div>
                    <div className="text-pumpkin-orange">&gt; INITIALIZING_TACTICAL_SOCKET... [OK]</div>
                    <div className="text-tertiary">&gt; MOUNTING_STOCKFISH_WASM_CLUSTER... [OK 4 CORES]</div>
                    <div className="text-bone-ivory-dim">&gt; VERIFYING_CURSED_ARMY_CONTRACTS... [OK]</div>
                    <div className="flex items-center text-blood-crimson-bright font-bold mt-1">
                      <span>&gt; ENTER_CALLSIGN_TO_DEPLOY:</span>
                      <span className="w-2 h-3.5 bg-blood-crimson ml-1.5 animate-pulse inline-block"></span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-space-md mt-space-md w-full justify-center">
                    <button onClick={onPlay} className="w-full sm:w-auto px-space-xl py-3 bg-blood-crimson hover:bg-blood-crimson-bright text-bone-ivory font-headline-sm text-headline-sm uppercase tracking-widest shadow-[0_0_24px_rgba(163,19,43,0.6)] active:translate-x-0.5 active:translate-y-0.5 transition-all text-center flex items-center justify-center gap-space-xs">
                      <span className="material-symbols-outlined text-[20px]">swords</span>
                      <span>ENTER THE COMBAT ARENA</span>
                    </button>
                    <button onClick={onBack} className="w-full sm:w-auto px-space-xl py-3 bg-void-surface hover:bg-void-surface-hover text-bone-ivory font-headline-sm text-headline-sm uppercase tracking-widest shadow-md hover:text-pumpkin-orange active:translate-x-0.5 active:translate-y-0.5 transition-all text-center flex items-center justify-center gap-space-xs">
                      <span className="material-symbols-outlined text-[20px]">menu_book</span>
                      <span>READ BATTLE REGULATIONS</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-space-md pt-space-lg text-bone-ivory-dim font-label-sm text-label-sm uppercase font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-pumpkin-orange"></span>
                      <span>SERVER STATUS: OPERATIONAL</span>
                    </div>
                    <span className="text-bone-ivory-muted">//</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blood-crimson"></span>
                      <span>LATENCY: 14MS</span>
                    </div>
                    <span className="text-bone-ivory-muted">//</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-tertiary"></span>
                      <span>NEURAL CLUSTER: ENGAGED</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
