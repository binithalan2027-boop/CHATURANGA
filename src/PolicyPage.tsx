interface PolicyPageProps {
  onBack: () => void;
}

export default function PolicyPage({ onBack }: PolicyPageProps) {
  return (
    <div className="min-h-screen bg-void-black text-on-surface-variant font-body-md p-8 relative overflow-hidden">
      {/* Spooky glowing dots */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_2px_theme(colors.primary)] opacity-70 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-3 h-3 bg-tertiary rounded-full shadow-[0_0_15px_3px_theme(colors.tertiary)] opacity-50 animate-pulse"></div>
      
      <div className="max-w-4xl mx-auto bg-surface-card rounded-xl p-space-lg shadow-2xl border border-surface-container-high relative z-10">
        <button 
          className="font-label-sm uppercase tracking-widest text-secondary hover:text-primary transition-colors mb-8 flex items-center gap-2" 
          onClick={onBack}
        >
          <span>←</span> Flee to Sanctuary (Home)
        </button>

        <header className="mb-12 border-b border-surface-container-high pb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-void-black border border-primary text-primary flex items-center justify-center font-display-lg rounded-sm shadow-[0_0_8px_theme(colors.primary)]">
              QST
            </div>
            <span className="font-headline-md text-tertiary uppercase tracking-widest">Chaturanga</span>
          </div>
          <h1 className="font-display-lg text-bone-ivory uppercase tracking-tight mb-2 text-shadow-sm">
            Grimoires of Service & Privacy Rituals
          </h1>
          <p className="font-body-md text-on-surface-variant/70 italic">
            Last summoned: September 2026
          </p>
        </header>

        <div className="space-y-10">
          <section className="space-y-4">
            <h2 className="font-headline-md text-bone-ivory uppercase border-l-4 border-primary pl-4">
              1. Pacts of Service
            </h2>
            <p>
              Welcome to the cursed realm of Chaturanga. By stepping into our domain, engaging in our deathmatches, and utilizing our forbidden arts, you bind your soul to these Pacts of Service. If you refuse these terms, flee immediately.
            </p>
            <h3 className="font-label-sm uppercase tracking-widest text-secondary mt-6">
              User Conduct & Honorable Bloodshed
            </h3>
            <p>
              We demand a ruthless but honorable battlefield. Using dark magic (cheating), summoning demonic engines during online duels, manipulating reality (software manipulation), or tormenting fellow souls is strictly prohibited. Violators will face immediate banishment to the void.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-headline-md text-bone-ivory uppercase border-l-4 border-secondary pl-4">
              2. Privacy Rituals
            </h2>
            <p>
              Your soul's imprint is guarded heavily. This Privacy Ritual dictates how Chaturanga harvests, utilizes, and shields your mortal data.
            </p>
            <h3 className="font-label-sm uppercase tracking-widest text-secondary mt-6">
              Essence We Harvest
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-tertiary">Mortal Identity:</strong> Username, email, or soul-tokens from worldly portals (Google, Discord).</li>
              <li><strong className="text-tertiary">Chronicles of War:</strong> Match history, spilled blood logs, rating anomalies, and favored arenas.</li>
              <li><strong className="text-tertiary">Arcane Metrics:</strong> Browser vessel, IP coordinates, and anti-cheat psychic readings.</li>
            </ul>
            <h3 className="font-label-sm uppercase tracking-widest text-secondary mt-6">
              How We Channel Your Essence
            </h3>
            <p>
              Your data is channeled solely to sustain the Chaturanga realm, carve leaderboards into stone, calculate ELO power levels, and ensure pure combat. We never sell your essence to demonic third parties.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-headline-md text-bone-ivory uppercase border-l-4 border-tertiary pl-4">
              3. Coven Guidelines & Anti-Hexing
            </h2>
            <p>
              All duelists must respect their opponent's final moments. Automated familiars and Stockfish summons are restricted to isolated offline purgatories. Channeling chess engines during multiplayer mortal kombat is a cardinal sin.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-headline-md text-bone-ivory uppercase border-l-4 border-primary pl-4">
              4. Summon Us
            </h2>
            <p>
              If you seek clarification on these pacts or need to mend your fractured account, cast a message to our inner circle at <code className="bg-void-black text-primary px-2 py-1 rounded font-mono text-sm border border-surface-container-high">support@chaturanga.dev</code>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
