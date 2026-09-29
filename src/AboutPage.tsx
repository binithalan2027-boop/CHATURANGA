interface AboutPageProps {
  onBack: () => void;
  onPlay: () => void;
}

export default function AboutPage({ onBack, onPlay }: AboutPageProps) {
  return (
    <div className="about-screen">
      <div className="about-container">
        {/* Navigation Bar */}
        <div className="about-top-bar">
          <button className="auth-back" onClick={onBack}>← Back to Home</button>
          <button className="btn-new-game" onClick={onPlay}>Play Now ⚔️</button>
        </div>

        <header className="about-header">
          <div className="auth-logo">
            <div className="auth-logo-box">QST</div>
            <span className="auth-logo-name">Chaturanga</span>
          </div>
          <h1 className="about-title">PLAY CHESS THE WAY IT WAS BORN</h1>
          <p className="about-subtitle">Modern Browser Battle Chess • High Velocity • Deep Strategy</p>
        </header>

        <div className="about-sections">
          {/* Origin Story */}
          <section className="about-card">
            <div className="about-card-icon">🏛️</div>
            <h2>The Name: Chaturanga (चतुरङ्ग)</h2>
            <p>
              Before modern chess conquered the world, there was <strong>Chaturanga</strong>—an ancient 6th-century Indian strategy game whose name translates to <em>"four divisions of the military"</em> (Infantry, Cavalry, Elephants, and Chariots). 
            </p>
            <p>
              We built <strong>Chaturanga</strong> to revive that spirit of grand tactical battlefield warfare on the web with cutting-edge browser performance, neo-tactile brutalist design, and fierce game variants.
            </p>
          </section>

          {/* Core Game Modes */}
          <section className="about-card">
            <div className="about-card-icon">⚔️</div>
            <h2>Fierce Game Modes & Variants</h2>
            <div className="about-grid-2">
              <div className="variant-item">
                <h3>♟️ Standard Chess</h3>
                <p>Pure classic 8x8 rules powered by international FIDE move validation.</p>
              </div>
              <div className="variant-item">
                <h3>🎲 Chess960 (Fischer Random)</h3>
                <p>960 randomized back-rank starting positions to test pure tactical intuition over book memorization.</p>
              </div>
              <div className="variant-item">
                <h3>🌫️ Fog of War</h3>
                <p>Stealth chess where squares are shrouded in darkness unless illuminated by your pieces' line of sight.</p>
              </div>
              <div className="variant-item">
                <h3>💥 Atomic Chess</h3>
                <p>Captures trigger kinetic explosions that annihilate all surrounding non-pawn pieces!</p>
              </div>
            </div>
          </section>

          {/* Engine & AI Technology */}
          <section className="about-card">
            <div className="about-card-icon">🧠</div>
            <h2>Stockfish WASM Engine & AI Bots</h2>
            <p>
              Chaturanga runs official <strong>Stockfish WebAssembly (WASM)</strong> directly inside Web Workers inside your browser. No server lag, zero latency, 100% offline-ready.
            </p>
            <div className="bot-showcase">
              <div className="bot-pill">👶 Martin (~250 ELO)</div>
              <div className="bot-pill">🤠 Nelson (~1300 ELO)</div>
              <div className="bot-pill">🐱 Mittens (~3200 ELO)</div>
            </div>
          </section>

          {/* Tech Stack */}
          <section className="about-card">
            <div className="about-card-icon">⚡</div>
            <h2>Technical Stack & Architecture</h2>
            <div className="tech-tags">
              <span className="tech-tag">React 18</span>
              <span className="tech-tag">TypeScript</span>
              <span className="tech-tag">Vite</span>
              <span className="tech-tag">Stockfish WASM</span>
              <span className="tech-tag">Chess.js Engine</span>
              <span className="tech-tag">Neo-Brutalist UI</span>
            </div>
          </section>
        </div>

        <footer className="about-footer">
          <button className="btn-play-now" onClick={onPlay}>ENTER THE ARENA NOW ⚔️</button>
        </footer>
      </div>
    </div>
  );
}
