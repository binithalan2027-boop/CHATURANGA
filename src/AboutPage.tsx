interface AboutPageProps {
  onBack: () => void;
  onPlay: () => void;
}

export default function AboutPage({ onBack, onPlay }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-void-black flex flex-col items-center p-8">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        {/* Navigation Bar */}
        <div className="flex justify-between items-center">
          <button className="font-label-sm uppercase tracking-widest text-on-surface-variant hover:text-bone-ivory transition-colors" onClick={onBack}>← Back to Home</button>
          <button className="font-label-sm uppercase tracking-widest bg-primary-container text-on-primary-container hover:bg-crimson-glow px-4 py-2 rounded transition-colors" onClick={onPlay}>Play Now ⚔️</button>
        </div>

        <header className="flex flex-col items-center text-center gap-4 py-12">
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl font-bold text-bone-ivory border-2 border-surface-container-low px-4 py-2 rounded">QST</div>
            <span className="font-headline-md text-bone-ivory uppercase">Chaturanga</span>
          </div>
          <h1 className="font-display-lg text-bone-ivory uppercase tracking-tight">ORIGIN OF THE DARK ARTS</h1>
          <p className="font-body-md text-on-surface-variant">Modern Browser Battle Chess • High Velocity • Deep Strategy</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {/* Origin Story */}
          <section className="bg-surface-card p-6 rounded-lg border border-surface-container-low transition-shadow">
            <div className="text-4xl mb-4">🏛️</div>
            <h2 className="font-headline-md text-bone-ivory uppercase mb-4">The Name: Chaturanga (चतुरङ्ग)</h2>
            <p className="font-body-md text-on-surface-variant mb-4">
              Before modern chess conquered the world, there was <strong className="text-bone-ivory">Chaturanga</strong>—an ancient 6th-century Indian strategy game whose name translates to <em className="text-bone-ivory">"four divisions of the military"</em> (Infantry, Cavalry, Elephants, and Chariots). 
            </p>
            <p className="font-body-md text-on-surface-variant">
              We built <strong className="text-bone-ivory">Chaturanga</strong> to revive that spirit of grand tactical battlefield warfare on the web with cutting-edge browser performance, neo-tactile brutalist design, and fierce game variants.
            </p>
          </section>

          {/* Core Game Modes */}
          <section className="bg-surface-card p-6 rounded-lg border border-surface-container-low transition-shadow">
            <div className="text-4xl mb-4">⚔️</div>
            <h2 className="font-headline-md text-bone-ivory uppercase mb-4">Fierce Game Modes & Variants</h2>
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="font-label-sm uppercase tracking-widest text-bone-ivory mb-1">♟️ Standard Chess</h3>
                <p className="font-body-md text-on-surface-variant">Pure classic 8x8 rules powered by international FIDE move validation.</p>
              </div>
              <div>
                <h3 className="font-label-sm uppercase tracking-widest text-bone-ivory mb-1">🎲 Chess960 (Fischer Random)</h3>
                <p className="font-body-md text-on-surface-variant">960 randomized back-rank starting positions to test pure tactical intuition over book memorization.</p>
              </div>
              <div>
                <h3 className="font-label-sm uppercase tracking-widest text-bone-ivory mb-1">🌫️ Fog of War</h3>
                <p className="font-body-md text-on-surface-variant">Stealth chess where squares are shrouded in darkness unless illuminated by your pieces' line of sight.</p>
              </div>
              <div>
                <h3 className="font-label-sm uppercase tracking-widest text-bone-ivory mb-1">💥 Atomic Chess</h3>
                <p className="font-body-md text-on-surface-variant">Captures trigger kinetic explosions that annihilate all surrounding non-pawn pieces!</p>
              </div>
            </div>
          </section>

          {/* Engine & AI Technology */}
          <section className="bg-surface-card p-6 rounded-lg border border-surface-container-low transition-shadow">
            <div className="text-4xl mb-4">🧠</div>
            <h2 className="font-headline-md text-bone-ivory uppercase mb-4">Grim Engines & AI Bots</h2>
            <p className="font-body-md text-on-surface-variant mb-6">
              Chaturanga runs official <strong className="text-bone-ivory">Stockfish WebAssembly (WASM)</strong> directly inside Web Workers inside your browser. No server lag, zero latency, 100% offline-ready.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="font-label-sm uppercase tracking-widest bg-surface-container-low text-on-surface-variant px-4 py-2 rounded-full border border-surface-container-low">👶 Martin (~250 ELO)</div>
              <div className="font-label-sm uppercase tracking-widest bg-surface-container-low text-on-surface-variant px-4 py-2 rounded-full border border-surface-container-low">🤠 Nelson (~1300 ELO)</div>
              <div className="font-label-sm uppercase tracking-widest bg-surface-container-low text-on-surface-variant px-4 py-2 rounded-full border border-surface-container-low">🐱 Mittens (~3200 ELO)</div>
            </div>
          </section>

          {/* Tech Stack */}
          <section className="bg-surface-card p-6 rounded-lg border border-surface-container-low transition-shadow">
            <div className="text-4xl mb-4">⚡</div>
            <h2 className="font-headline-md text-bone-ivory uppercase mb-4">Spectral Tech Stack</h2>
            <div className="flex flex-wrap gap-3">
              <span className="font-label-sm uppercase tracking-widest bg-surface-container-low text-on-surface-variant px-3 py-1 rounded">React 18</span>
              <span className="font-label-sm uppercase tracking-widest bg-surface-container-low text-on-surface-variant px-3 py-1 rounded">TypeScript</span>
              <span className="font-label-sm uppercase tracking-widest bg-surface-container-low text-on-surface-variant px-3 py-1 rounded">Vite</span>
              <span className="font-label-sm uppercase tracking-widest bg-surface-container-low text-on-surface-variant px-3 py-1 rounded">Stockfish WASM</span>
              <span className="font-label-sm uppercase tracking-widest bg-surface-container-low text-on-surface-variant px-3 py-1 rounded">Chess.js Engine</span>
              <span className="font-label-sm uppercase tracking-widest bg-surface-container-low text-on-surface-variant px-3 py-1 rounded">Tailwind CSS</span>
            </div>
          </section>
        </div>

        <footer className="flex justify-center mt-12 pb-12">
          <button className="font-label-sm uppercase tracking-widest bg-primary-container text-on-primary-container hover:bg-crimson-glow px-8 py-4 rounded-md transition-colors text-lg" onClick={onPlay}>ENTER THE ARENA NOW ⚔️</button>
        </footer>
      </div>
    </div>
  );
}
