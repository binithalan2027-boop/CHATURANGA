import { useState } from 'react';

export interface BotSelectScreenProps {
  onStart: (elo: number, timeMinutes: number, gameMode: string) => void;
  onBack: () => void;
}

interface Adversary {
  id: string;
  name: string;
  elo: number;
  tier: string;
  archetype: string;
  quote: string;
  desc: string;
  aggro: number;
  traps: number;
  endgame: number;
  img: string;
}

const ADVERSARIES: Adversary[] = [
  {
    id: 'thrall',
    name: 'CURSED THRALL',
    elo: 450,
    tier: 'TIER 1',
    archetype: 'MINDLESS HUSK',
    quote: '"Hsssk... shadows drag upon the squares..."',
    desc: 'Erratic maneuvers, blunders free material under knight checks.',
    aggro: 30,
    traps: 15,
    endgame: 25,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDE4IKBOB9wEZTbmdX--cPariDaie8YA7cFw4gCORcBLHo1HlRpjPQdnUtOyrZzrErNGLMIVeKA4UfPGgz-zlFW5QpXKl2G71kAMuFEMnwUgoFUUVmPqb6E4QwvA77bbnvV9MfCLpi6ep87F7-ePCSH6DYkgRFoEJFSAN66IAw961S5ECEnQsSrdrux3uKGPkYrb87jsruB7Dq96fzTZb3Qxhy6NEpqqILFyLc15DVDnI-XUhHqzXch'
  },
  {
    id: 'weaver',
    name: 'BONE WEAVER',
    elo: 1200,
    tier: 'TIER 2',
    archetype: 'ARACHNID TACTICIAN',
    quote: '"Eight limbs calculate thirty-two variations before your hand twitches."',
    desc: 'Web of knight forks and bishop spines. Punishes overextended pawns.',
    aggro: 65,
    traps: 84,
    endgame: 58,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDE4IKBOB9wEZTbmdX--cPariDaie8YA7cFw4gCORcBLHo1HlRpjPQdnUtOyrZzrErNGLMIVeKA4UfPGgz-zlFW5QpXKl2G71kAMuFEMnwUgoFUUVmPqb6E4QwvA77bbnvV9MfCLpi6ep87F7-ePCSH6DYkgRFoEJFSAN66IAw961S5ECEnQsSrdrux3uKGPkYrb87jsruB7Dq96fzTZb3Qxhy6NEpqqILFyLc15DVDnI-XUhHqzXch'
  },
  {
    id: 'malakor',
    name: 'BLOOD MAGE MALAKOR',
    elo: 1850,
    tier: 'TIER 3',
    archetype: 'THE CARNIVAL - PYROMANCER INQUISITOR',
    quote: '"Every exchange is a ritual sacrifice. Your King is merely fuel."',
    desc: 'Relentless piece sacrifices to rip open king file. Masters poisoned-pawn lines.',
    aggro: 92,
    traps: 78,
    endgame: 85,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDE4IKBOB9wEZTbmdX--cPariDaie8YA7cFw4gCORcBLHo1HlRpjPQdnUtOyrZzrErNGLMIVeKA4UfPGgz-zlFW5QpXKl2G71kAMuFEMnwUgoFUUVmPqb6E4QwvA77bbnvV9MfCLpi6ep87F7-ePCSH6DYkgRFoEJFSAN66IAw961S5ECEnQsSrdrux3uKGPkYrb87jsruB7Dq96fzTZb3Qxhy6NEpqqILFyLc15DVDnI-XUhHqzXch'
  },
  {
    id: 'jester',
    name: 'THE GRINNING JESTER',
    elo: 2400,
    tier: 'TIER 4',
    archetype: 'CARNIVAL BLOOD HARLEQUIN',
    quote: '"Why guard your Rook when the laughter will drown out your scream?"',
    desc: 'Grandmaster-tier psychological torture. Pins pieces and laughs at queen trades.',
    aggro: 88,
    traps: 95,
    endgame: 91,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDE4IKBOB9wEZTbmdX--cPariDaie8YA7cFw4gCORcBLHo1HlRpjPQdnUtOyrZzrErNGLMIVeKA4UfPGgz-zlFW5QpXKl2G71kAMuFEMnwUgoFUUVmPqb6E4QwvA77bbnvV9MfCLpi6ep87F7-ePCSH6DYkgRFoEJFSAN66IAw961S5ECEnQsSrdrux3uKGPkYrb87jsruB7Dq96fzTZb3Qxhy6NEpqqILFyLc15DVDnI-XUhHqzXch'
  },
  {
    id: 'voidweaver',
    name: 'THE VOIDWEAVER (MAX)',
    elo: 3200,
    tier: 'TIER 5',
    archetype: 'ELDRITCH WASM SINGULARITY',
    quote: '"Zero entropy detected. Resignation is mathematically mandatory."',
    desc: 'Inhuman cold brutality. 35-ply deep mating nets. Zero emotional blunders.',
    aggro: 100,
    traps: 100,
    endgame: 100,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDE4IKBOB9wEZTbmdX--cPariDaie8YA7cFw4gCORcBLHo1HlRpjPQdnUtOyrZzrErNGLMIVeKA4UfPGgz-zlFW5QpXKl2G71kAMuFEMnwUgoFUUVmPqb6E4QwvA77bbnvV9MfCLpi6ep87F7-ePCSH6DYkgRFoEJFSAN66IAw961S5ECEnQsSrdrux3uKGPkYrb87jsruB7Dq96fzTZb3Qxhy6NEpqqILFyLc15DVDnI-XUhHqzXch'
  }
];

export default function BotSelectScreen({ onStart, onBack }: BotSelectScreenProps) {
  const [selectedAdv, setSelectedAdv] = useState<Adversary>(ADVERSARIES[2]); // Malakor by default
  const [elo, setElo] = useState<number>(1850);
  const [timeMinutes, setTimeMinutes] = useState<number>(3);
  const [increment, setIncrement] = useState<number>(2);
  const [gameMode, setGameMode] = useState<string>('standard');
  const [side, setSide] = useState<'white' | 'black' | 'random'>('white');

  const handleSelectAdversary = (adv: Adversary) => {
    setSelectedAdv(adv);
    setElo(adv.elo);
  };

  const handleCommence = () => {
    onStart(elo, timeMinutes, gameMode);
  };

  return (
    <div className="bg-ink-black text-on-surface font-body-md text-body-md min-h-screen selection:bg-blood-crimson selection:text-bone-ivory antialiased">
      {/* Header Navigation */}
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
          </div>
          <div className="flex items-center gap-space-md">
            <button onClick={handleCommence} className="px-space-md py-2 bg-blood-crimson hover:bg-blood-crimson-bright text-bone-ivory font-headline-sm text-headline-sm uppercase tracking-widest shadow-[0_0_16px_rgba(163,19,43,0.55)] transition-all flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">swords</span>
              <span>COMMENCE TRIAL</span>
            </button>
          </div>
        </div>
      </header>

      <main className="w-full pt-20 bg-ink-black min-h-screen">
        <div className="flex flex-col w-full">
          {/* Chamber Telemetry HUD Bar */}
          <section className="w-full bg-surface-container-lowest px-margin py-space-sm border-b border-void-border">
            <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md">
                <div className="flex items-center gap-space-xs">
                  <span className="w-2 h-2 bg-blood-crimson animate-ping"></span>
                  <span className="w-2 h-2 bg-blood-crimson"></span>
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-bone-ivory font-bold">CHAMBER 03</span>
                </div>
                <span className="text-void-border text-label-sm font-label-sm">/</span>
                <div className="flex items-center gap-1.5 bg-void-surface px-space-sm py-0.5 border border-void-border">
                  <span className="font-label-sm text-label-sm text-blood-crimson font-mono">PROTO:</span>
                  <span className="font-label-sm text-label-sm text-bone-ivory font-mono">STOCKFISH WASM v16.1 NEURAL</span>
                </div>
              </div>
              <div className="flex items-center gap-space-md">
                <span className="text-pumpkin-orange font-mono font-semibold">OFFLINE TRIAL // NO RANK PENALTY</span>
              </div>
            </div>
          </section>

          {/* Main Engagement Cockpit (3-Column Layout) */}
          <section className="w-full max-w-[1440px] mx-auto px-margin py-space-lg">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
              {/* COLUMN 1: RULES, TIME & ALLIANCE (3 Cols) */}
              <div className="lg:col-span-3 flex flex-col gap-space-lg">
                {/* Panel 1: Battle Variant Selection */}
                <div className="bg-void-surface border border-void-border p-space-md relative overflow-hidden shadow-md">
                  <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-void-border">
                    <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-bone-ivory flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-blood-crimson text-[20px]">grid_view</span>
                      Game Mode
                    </span>
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    {[
                      { id: 'math', name: 'Chess MM // Matiks', desc: 'Mental math per move & speed math power-up showdowns.', badge: 'MOAT SYSTEM', chaos: '+200% INTELLECTUAL' },
                      { id: 'standard', name: 'Standard Chess', desc: '64 squares, absolute tactical calculation.', badge: 'FIDE APPROVED', chaos: '+0% CHAOS' },
                      { id: 'chess960', name: 'Fischer Void 960', desc: 'Chaotic back-rank transposition.', badge: 'RANDOM ROYALS', chaos: '+40% UNPREDICTABLE' },
                      { id: 'spell', name: 'Power-Up Arena', desc: 'Cursed Relics & instant blood spells.', badge: 'ANIME SPELLS', chaos: '+100% VISCERAL' },
                      { id: 'atomic', name: 'Atomic Explosions', desc: 'Captures trigger violent 3x3 detonations.', badge: 'CURSED BLAST', chaos: '+80% EXPLOSIVE' },
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setGameMode(mode.id)}
                        className={`w-full text-left p-space-sm transition-all border ${
                          gameMode === mode.id
                            ? 'bg-surface-container border-blood-crimson shadow-[0_0_12px_rgba(163,19,43,0.35)]'
                            : 'bg-void-surface hover:bg-void-surface-hover border-void-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-headline-sm text-[18px] text-bone-ivory uppercase">{mode.name}</span>
                          {gameMode === mode.id && <span className="w-2 h-2 bg-blood-crimson"></span>}
                        </div>
                        <p className="font-body-sm text-body-sm text-bone-ivory-dim mt-0.5">{mode.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Panel 2: Time Protocol */}
                <div className="bg-void-surface border border-void-border p-space-md shadow-md">
                  <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-void-border">
                    <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-bone-ivory flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-pumpkin-orange text-[20px]">timer</span>
                      Time Protocol
                    </span>
                    <span className="font-label-sm text-label-sm text-pumpkin-orange font-bold uppercase">{timeMinutes} MIN</span>
                  </div>
                  <div className="grid grid-cols-2 gap-space-xs">
                    {[
                      { mins: 1, label: '1 MIN', sub: 'BULLET' },
                      { mins: 3, label: '3 MIN', sub: 'BLITZ' },
                      { mins: 10, label: '10 MIN', sub: 'RAPID' },
                      { mins: 30, label: '30 MIN', sub: 'CLASSIC' },
                    ].map(t => (
                      <button
                        key={t.mins}
                        onClick={() => setTimeMinutes(t.mins)}
                        className={`p-space-sm border text-left transition-all ${
                          timeMinutes === t.mins
                            ? 'bg-surface-container border-blood-crimson-bright shadow-[0_0_10px_rgba(163,19,43,0.3)]'
                            : 'bg-void-surface hover:bg-void-surface-hover border-void-border'
                        }`}
                      >
                        <div className="font-headline-sm text-[20px] text-bone-ivory">{t.label}</div>
                        <div className="font-label-sm text-label-sm text-bone-ivory-dim">{t.sub}</div>
                      </button>
                    ))}
                  </div>
                  {/* Fischer Increment Slider */}
                  <div className="mt-space-md pt-space-sm border-t border-void-border">
                    <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                      <span className="text-bone-ivory-dim uppercase tracking-wider">FISCHER INCREMENT</span>
                      <span className="text-pumpkin-orange font-bold font-mono">+{increment} SECONDS</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={increment}
                      onChange={(e) => setIncrement(Number(e.target.value))}
                      className="w-full h-1 bg-surface-container-high rounded-none appearance-none cursor-pointer accent-pumpkin-orange"
                    />
                  </div>
                </div>

                {/* Panel 3: Faction Stance */}
                <div className="bg-void-surface border border-void-border p-space-md shadow-md">
                  <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-void-border">
                    <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-bone-ivory flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-bone-ivory text-[20px]">flag</span>
                      Faction Stance
                    </span>
                    <span className="font-label-sm text-label-sm text-bone-ivory font-mono">{side.toUpperCase()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-space-xs">
                    {(['white', 'random', 'black'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setSide(s)}
                        className={`p-space-sm border flex flex-col items-center text-center transition-all ${
                          side === s
                            ? 'bg-surface-container border-blood-crimson'
                            : 'bg-void-surface hover:bg-void-surface-hover border-void-border'
                        }`}
                      >
                        <span className="font-label-sm text-[11px] text-bone-ivory uppercase font-bold mt-1">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* COLUMN 2: AI DOSSIER & ELO MATRIX (6 Cols) */}
              <div className="lg:col-span-6 flex flex-col gap-space-lg">
                {/* Header Bar */}
                <div className="bg-void-surface border border-void-border p-space-md flex flex-wrap items-center justify-between gap-space-md shadow-md">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-blood-crimson/20 text-blood-crimson-bright border border-blood-crimson/50 font-label-sm text-label-sm uppercase font-bold">TARGET PROFILE</span>
                      <span className="font-label-sm text-label-sm text-bone-ivory-dim font-mono">DEPTH 18 // NNUE ACTIVE</span>
                    </div>
                    <h1 className="font-headline-md text-headline-md uppercase tracking-wider text-bone-ivory mt-0.5">
                      Select Cursed Adversary
                    </h1>
                  </div>
                  <div className="flex items-center gap-space-md font-mono text-label-sm text-right">
                    <div>
                      <div className="text-bone-ivory-dim text-[10px]">CURRENT EVALUATION</div>
                      <div className="text-pumpkin-orange font-bold text-title-sm">+0.14 C-PAWN</div>
                    </div>
                  </div>
                </div>

                {/* Tiered Adversary Selector Ribbons (5 Tiers) */}
                <div className="grid grid-cols-5 gap-space-xs">
                  {ADVERSARIES.map(adv => (
                    <button
                      key={adv.id}
                      onClick={() => handleSelectAdversary(adv)}
                      className={`p-space-xs border text-center flex flex-col items-center gap-1 transition-all ${
                        selectedAdv.id === adv.id
                          ? 'bg-surface-container border-blood-crimson shadow-[0_0_12px_rgba(163,19,43,0.45)]'
                          : 'bg-void-surface hover:bg-void-surface-hover border-void-border'
                      }`}
                    >
                      <span className="font-label-sm text-[9px] text-bone-ivory-muted">{adv.tier}</span>
                      <span className="font-headline-sm text-[13px] text-bone-ivory uppercase leading-none truncate w-full">{adv.name.split(' ')[0]}</span>
                      <span className="font-mono text-[10px] text-pumpkin-orange">{adv.elo}</span>
                    </button>
                  ))}
                </div>

                {/* Big Hero Visual Dossier Frame */}
                <div className="bg-void-surface border-2 border-blood-crimson/80 relative overflow-hidden shadow-[0_0_24px_rgba(163,19,43,0.3)]">
                  <div className="px-space-md py-space-sm bg-surface-container border-b border-void-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-blood-crimson-bright"></span>
                      <span className="font-headline-sm text-[17px] text-bone-ivory uppercase tracking-wider">{selectedAdv.name}</span>
                      <span className="font-label-sm text-[10px] px-1.5 py-0.2 bg-void-surface text-blood-crimson border border-blood-crimson font-mono">{selectedAdv.tier}</span>
                    </div>
                    <div className="flex items-center gap-space-xs font-mono font-bold text-label-sm">
                      <span className="text-bone-ivory-dim">STRENGTH:</span>
                      <span className="text-blood-crimson-bright font-title-sm">{elo} ELO</span>
                    </div>
                  </div>

                  <div className="p-space-md grid grid-cols-1 md:grid-cols-12 gap-space-md items-center">
                    <div className="md:col-span-5 relative flex flex-col items-center justify-center bg-ink-black border border-void-border p-space-sm">
                      <div className="relative w-full aspect-square flex items-center justify-center overflow-hidden">
                        <img className="w-full h-full object-cover" alt={selectedAdv.name} src={selectedAdv.img} />
                      </div>
                      <div className="w-full flex items-center justify-between pt-2 border-t border-void-border mt-2">
                        <span className="font-label-sm text-[10px] text-bone-ivory-dim uppercase">{selectedAdv.archetype}</span>
                      </div>
                    </div>

                    <div className="md:col-span-7 flex flex-col gap-space-sm">
                      <div className="p-space-sm bg-surface-container border-l-2 border-blood-crimson">
                        <p className="font-body-sm text-body-sm italic text-bone-ivory leading-snug">{selectedAdv.quote}</p>
                        <span className="block mt-1 font-label-sm text-[10px] text-pumpkin-orange font-mono">— DOSSIER ANALYSIS</span>
                      </div>

                      <div className="flex flex-col gap-space-xs pt-1">
                        <div>
                          <div className="flex justify-between font-label-sm text-label-sm text-bone-ivory-dim mb-1">
                            <span className="uppercase">Combat Aggression</span>
                            <span className="text-blood-crimson font-bold font-mono">{selectedAdv.aggro}%</span>
                          </div>
                          <div className="w-full h-2 bg-surface-container-high">
                            <div className="h-full bg-blood-crimson" style={{ width: `${selectedAdv.aggro}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between font-label-sm text-label-sm text-bone-ivory-dim mb-1">
                            <span className="uppercase">Occult Trap Frequency</span>
                            <span className="text-pumpkin-orange font-bold font-mono">{selectedAdv.traps}%</span>
                          </div>
                          <div className="w-full h-2 bg-surface-container-high">
                            <div className="h-full bg-pumpkin-orange" style={{ width: `${selectedAdv.traps}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manual ELO Adjuster */}
                  <div className="p-space-sm bg-surface-container-lowest border-t border-void-border flex flex-wrap items-center justify-between gap-space-sm">
                    <span className="font-label-sm text-label-sm text-bone-ivory-dim uppercase font-mono">FINE-TUNE STOCKFISH LIMIT:</span>
                    <div className="flex items-center gap-3 flex-1 max-w-xs">
                      <input
                        type="range"
                        min="400"
                        max="3200"
                        step="50"
                        value={elo}
                        onChange={(e) => setElo(Number(e.target.value))}
                        className="w-full h-1 bg-surface-container rounded-none appearance-none cursor-pointer accent-blood-crimson"
                      />
                      <span className="font-headline-sm text-headline-sm text-blood-crimson-bright font-mono font-bold min-w-[50px] text-right">{elo}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMN 3: ARSENAL, MODS & LAUNCH (3 Cols) */}
              <div className="lg:col-span-3 flex flex-col gap-space-lg">
                <div className="bg-surface-container border border-blood-crimson p-space-md shadow-[0_0_24px_rgba(163,19,43,0.35)] flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between text-bone-ivory-dim font-label-sm text-label-sm pb-1 border-b border-void-border">
                    <span>SESSION SUMMARY</span>
                    <span className="text-pumpkin-orange font-bold font-mono">OFFLINE PROTOCOL</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-bone-ivory">
                    <div className="flex flex-col bg-ink-black p-1.5 border border-void-border">
                      <span className="text-[9px] text-bone-ivory-dim">TIME CONTROL</span>
                      <span className="font-bold text-bone-ivory">{timeMinutes} MIN</span>
                    </div>
                    <div className="flex flex-col bg-ink-black p-1.5 border border-void-border">
                      <span className="text-[9px] text-bone-ivory-dim">MODE</span>
                      <span className="font-bold text-bone-ivory uppercase">{gameMode}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCommence}
                    className="group relative w-full py-4 bg-blood-crimson hover:bg-blood-crimson-bright border border-blood-crimson-bright text-bone-ivory font-headline-sm text-[24px] uppercase tracking-widest shadow-[0_0_24px_rgba(163,19,43,0.7)] hover:shadow-[0_0_32px_rgba(214,31,61,0.9)] transition-all flex items-center justify-center gap-space-xs mt-2"
                  >
                    <span className="material-symbols-outlined text-[24px] group-hover:rotate-45 transition-transform">swords</span>
                    <span>Commence Battle</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
