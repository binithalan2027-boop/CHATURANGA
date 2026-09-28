import { useState } from 'react';

export default function LandingPage({ onPlay }: { onPlay: () => void }) {
  const [timeControl, setTimeControl] = useState('10 min');
  const [gameMode, setGameMode] = useState('Classic');

  return (
    <div className="wireframe-theme">
      {/* 1. NAVBAR */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="logo-box">logo</div>
          <span className="brand-name">CHATURANGA</span>
        </div>
        <div className="nav-links">
          <a href="#">Play</a>
          <a href="#">Modes</a>
          <a href="#">Puzzles</a>
          <a href="#">Learn</a>
          <a href="#">Leaderboard</a>
        </div>
        <div className="nav-auth">
          <button className="btn-login">Log in</button>
          <button className="btn-signup">Sign up free</button>
        </div>
      </nav>

      <main className="main-content">
        {/* 2. HERO */}
        <section className="hero-section">
          <div className="hero-left">
            <h1 className="hero-title">Play chess the way it was born.</h1>
            <p className="hero-subtitle">
              8 modes. Ancient origins, modern speed.<br />
              Play online, vs AI, or with friends.
            </p>

            <div className="quick-play-box">
              <div className="box-header">
                <h3>Quick Play</h3>
                <span className="badge">WEB APP: works as guest</span>
              </div>
              
              <div className="form-group">
                <label>Game mode</label>
                <select value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
                  <option>Standard Chess</option>
                  <option>Fog of War</option>
                  <option>Spell Chess (MM)</option>
                  <option>4-Player FFA</option>
                  <option>Bughouse</option>
                  <option>Chess960</option>
                  <option>Atomic</option>
                  <option>Crazyhouse</option>
                </select>
              </div>

              <div className="form-group">
                <label>Time control</label>
                <div className="time-toggles">
                  {['1 min', '3 min', '10 min', '30 min'].map(time => (
                    <button 
                      key={time}
                      className={`btn-time ${timeControl === time ? 'active' : ''}`}
                      onClick={() => setTimeControl(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn-play-now" onClick={onPlay}>
                ► Play Now
              </button>
              <div className="play-footer">
                or play as guest · vs friend · vs AI
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="demo-board">
              {/* Static demo board matching wireframe */}
              {[...Array(8)].map((_, r) => (
                <div className="demo-row" key={r}>
                  {[...Array(8)].map((_, c) => {
                    const isDark = (r + c) % 2 !== 0;
                    let piece = '';
                    if (r === 0) piece = ['♜','♞','♝','♛','♚','♝','♞','♜'][c];
                    else if (r === 1) piece = '♟';
                    return (
                      <div key={c} className={`demo-sq ${isDark ? 'dark' : 'light'}`}>
                        {piece && <span className="demo-piece">{piece}</span>}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="board-caption">Hero board preview / animated demo</div>
          </div>
        </section>

        {/* 3. GAME MODES GRID */}
        <section className="modes-section">
          <h2>Choose your game</h2>
          <p>Every mode has its own rules, board and clock</p>
          
          <div className="modes-grid">
            {[
              { id: 'classic', icon: '♟', title: 'Standard Chess', desc: 'Classic 8x8 rules • Practice mode', cta: 'Play →' },
              { id: 'fog', icon: '🌫️', title: 'Fog of War', desc: 'See only what your pieces see', cta: 'Play →' },
              { id: 'spell', icon: '⚡', title: 'Spell Chess (MM)', desc: '10s math trials to earn spells', cta: 'Play →' },
              { id: '4p', icon: '⚔️', title: '4-Player FFA', desc: '14x14 crossfire • Absolute chaos', cta: 'Play →' },
              { id: 'bughouse', icon: '👥', title: 'Bughouse', desc: '2v2 team chess', cta: 'Play →' },
              { id: '960', icon: '🎲', title: 'Chess960', desc: 'Shuffled back rank', cta: 'Play →' },
              { id: 'atomic', icon: '💥', title: 'Atomic', desc: 'Explosive captures', cta: 'Play →' },
              { id: 'crazyhouse', icon: '🌀', title: 'Crazyhouse', desc: 'Drop captured pieces', cta: 'Play →' },
            ].map(mode => (
              <div className="mode-card" key={mode.id}>
                <div className="mode-icon-circle">{mode.icon}</div>
                <h3>{mode.title}</h3>
                <p>{mode.desc}</p>
                <div className="mode-line"></div>
                <button className="btn-card-play" onClick={onPlay}>
                  {mode.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 4. HOW IT WORKS */}
        <section className="steps-section">
          <h2>Start in 3 steps</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-circle">1</div>
              <div className="step-text">
                <h4>Pick a mode</h4>
                <p>Choose rules & time control</p>
              </div>
            </div>
            <div className="step-line"></div>
            <div className="step">
              <div className="step-circle">2</div>
              <div className="step-text">
                <h4>Get matched</h4>
                <p>Instant opponent or AI</p>
              </div>
            </div>
            <div className="step-line"></div>
            <div className="step">
              <div className="step-circle">3</div>
              <div className="step-text">
                <h4>Play & climb</h4>
                <p>Earn rating, unlock boards</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. LIVE GAME + LEADERBOARD */}
        <section className="live-leaderboard-section">
          <div className="live-game-box">
            <h3>Live game spotlight</h3>
            <div className="live-content">
              <div className="live-board-placeholder">
                <div className="placeholder-x"></div>
                <span>mini board (live)</span>
              </div>
              <div className="live-info">
                <div className="player-vs">
                  <strong>Player A (1840)</strong>
                  <span className="vs-text">vs</span>
                  <strong>Player B (1812)</strong>
                </div>
                <div className="fake-lines">
                  <div className="line l-long"></div>
                  <div className="line l-med"></div>
                  <div className="line l-short"></div>
                </div>
                <button className="btn-watch">Watch live</button>
              </div>
            </div>
          </div>

          <div className="leaderboard-box">
            <h3>Top players</h3>
            <div className="leaderboard-list">
              {[1, 2, 3, 4, 5, 6].map(num => (
                <div className="lb-row" key={num}>
                  <span className="lb-rank">#{num}</span>
                  <div className="lb-avatar"></div>
                  <div className="lb-name-line"></div>
                  <span className="lb-rating">2xxx</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. FINAL CTA */}
        <section className="final-cta">
          <h2>Your move.</h2>
          <button className="btn-cta-signup">Create free account</button>
        </section>
      </main>

      {/* 7. FOOTER */}
      <footer className="site-footer">
        <div className="footer-brand">
          <div className="logo-box">logo</div>
          <span className="brand-name">CHATURANGA</span>
        </div>
        <div className="footer-links">
          <div className="f-col">
            <h4>Play</h4>
            <div className="f-line"></div>
            <div className="f-line"></div>
            <div className="f-line"></div>
          </div>
          <div className="f-col">
            <h4>Company</h4>
            <div className="f-line"></div>
            <div className="f-line"></div>
            <div className="f-line"></div>
          </div>
          <div className="f-col">
            <h4>Support</h4>
            <div className="f-line"></div>
            <div className="f-line"></div>
            <div className="f-line"></div>
          </div>
          <div className="f-col">
            <h4>Legal</h4>
            <div className="f-line"></div>
            <div className="f-line"></div>
            <div className="f-line"></div>
          </div>
        </div>
      </footer>
      <div className="footer-bottom">
        © 2026 Chaturanga • Socials: ◯ ◯ ◯ ◯
      </div>
    </div>
  );
}
