import { useState } from 'react';

interface LandingPageProps {
  user: { name: string; email: string } | null;
  onPlay: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

export default function LandingPage({ user, onPlay, onLogin, onLogout }: LandingPageProps) {
  const [timeControl, setTimeControl] = useState('10 min');
  const [gameMode, setGameMode] = useState('Standard Chess');

  return (
    <div className="wireframe-theme">
      {/* 1. NAVBAR */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="logo-box">QST</div>
          <span className="brand-name">Chaturanga</span>
        </div>
        <div className="nav-links">
          <a href="#play" onClick={(e) => { e.preventDefault(); onPlay(); }}>Play</a>
          <a href="#learn">Learn</a>
          <a href="#watch">Watch</a>
          <a href="#community">Community</a>
        </div>
        <div className="nav-auth">
          {user ? (
            <>
              <span className="nav-user">👤 {user.name}</span>
              <button className="btn-login" onClick={onLogout}>Log out</button>
              <button className="btn-signup" onClick={onPlay}>Play Now</button>
            </>
          ) : (
            <>
              <button className="btn-login" onClick={onLogin}>Log in</button>
              <button className="btn-signup" onClick={onLogin}>Sign up</button>
            </>
          )}
        </div>
      </nav>

      <main className="main-content">
        {/* 2. HERO SPLIT */}
        <section className="hero-section">
          <div className="hero-left">
            <h1 className="hero-title">Play chess the way it was born.</h1>
            <div className="hero-subtitle">Variants, 4-Player, and Fog of War.</div>
            
            <div className="quick-play-box">
              <div className="box-header">
                <h3>Quick Play</h3>
                <span className="badge">Beta</span>
              </div>
              
              <div className="form-group">
                <label>Game mode</label>
                <select value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
                  <option>Standard Chess</option>
                  <option>Offline vs AI</option>
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
                  <button className={`btn-time ${timeControl === '1 min' ? 'active' : ''}`} onClick={() => setTimeControl('1 min')}>1 min</button>
                  <button className={`btn-time ${timeControl === '3 min' ? 'active' : ''}`} onClick={() => setTimeControl('3 min')}>3 min</button>
                  <button className={`btn-time ${timeControl === '10 min' ? 'active' : ''}`} onClick={() => setTimeControl('10 min')}>10 min</button>
                </div>
              </div>

              <button className="btn-play-now" onClick={onPlay}>
                {user ? 'Play Now ⚔️' : 'Sign Up & Play Free'}
              </button>
              <div className="play-footer">
                12,492 players online right now
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="demo-board">
              <div className="demo-row"><div className="demo-sq light">♜</div><div className="demo-sq dark">♞</div><div className="demo-sq light">♝</div><div className="demo-sq dark">♛</div></div>
              <div className="demo-row"><div className="demo-sq dark">♟</div><div className="demo-sq light">♟</div><div className="demo-sq dark">♟</div><div className="demo-sq light">♟</div></div>
              <div className="demo-row"><div className="demo-sq light"></div><div className="demo-sq dark"></div><div className="demo-sq light"></div><div className="demo-sq dark"></div></div>
              <div className="demo-row"><div className="demo-sq dark">♖</div><div className="demo-sq light">♘</div><div className="demo-sq dark">♗</div><div className="demo-sq light">♕</div></div>
            </div>
            <div className="board-caption">LIVE: Magnus vs Hikaru</div>
          </div>
        </section>

        {/* 3. GAME MODES GRID */}
        <section className="modes-section">
          <h2>Choose your game</h2>
          <p>Every mode has its own rules, board and clock</p>
          
          <div className="modes-grid">
            {[
              { id: 'classic', icon: '♟', title: 'Standard Chess', desc: 'Classic 8x8 rules • Practice mode', cta: 'Play Now' },
              { id: 'fog', icon: '🌫️', title: 'Fog of War', desc: 'See only what your pieces see', cta: 'Coming Soon' },
              { id: 'spell', icon: '⚡', title: 'Spell Chess (MM)', desc: '10s math trials to earn spells', cta: 'Coming Soon' },
              { id: '4p', icon: '⚔️', title: '4-Player FFA', desc: '14x14 crossfire • Absolute chaos', cta: 'Coming Soon' },
              { id: 'bughouse', icon: '👥', title: 'Bughouse', desc: '2v2 team chess', cta: 'Coming Soon' },
              { id: '960', icon: '🎲', title: 'Chess960', desc: 'Shuffled back rank', cta: 'Coming Soon' },
              { id: 'atomic', icon: '💥', title: 'Atomic', desc: 'Explosive captures', cta: 'Coming Soon' },
              { id: 'crazyhouse', icon: '🌀', title: 'Crazyhouse', desc: 'Drop captured pieces', cta: 'Coming Soon' },
            ].map(mode => (
              <div className="mode-card" key={mode.id}>
                <div className="mode-icon-circle">{mode.icon}</div>
                <h3>{mode.title}</h3>
                <p>{mode.desc}</p>
                <div className="mode-line"></div>
                <button
                  className="btn-card-play"
                  onClick={() => mode.id === 'classic' ? onPlay() : undefined}
                  disabled={mode.id !== 'classic'}
                >
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
            <div className="step"><div className="step-circle">1</div><div className="step-text"><h4>Sign up</h4><p>Create a free account</p></div></div>
            <div className="step-line"></div>
            <div className="step"><div className="step-circle">2</div><div className="step-text"><h4>Pick a mode</h4><p>Classic or Variants</p></div></div>
            <div className="step-line"></div>
            <div className="step"><div className="step-circle">3</div><div className="step-text"><h4>Play</h4><p>Match instantly</p></div></div>
          </div>
        </section>

        {/* 5. LIVE GAME + LEADERBOARD */}
        <section className="live-leaderboard-section">
          <div className="live-game-box">
            <h3>Live Spotlight</h3>
            <div className="live-content">
              <div className="live-board-placeholder"><div className="placeholder-x"></div><span>BOARD</span></div>
              <div className="live-info">
                <div className="player-vs">
                  <div className="vs-text">Player A (1840)</div>
                  <div>vs</div>
                  <div className="vs-text">Player B (1812)</div>
                </div>
                <div className="fake-lines"><div className="line l-long"></div><div className="line l-med"></div><div className="line l-short"></div></div>
                <button className="btn-watch">Watch Game →</button>
              </div>
            </div>
          </div>
          <div className="leaderboard-box">
            <h3>Leaderboard - Blitz</h3>
            <div className="leaderboard-list">
              {[1, 2, 3, 4].map(rank => (
                <div className="lb-row" key={rank}>
                  <div className="lb-rank">#{rank}</div>
                  <div className="lb-avatar"></div>
                  <div className="lb-name-line"></div>
                  <div className="lb-rating">{2900 - rank * 40}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. FINAL CTA */}
        <section className="final-cta">
          <h2>Your move.</h2>
          <button className="btn-cta-signup" onClick={onPlay}>
            {user ? 'Play Now ⚔️' : 'Join Chaturanga Today'}
          </button>
        </section>
      </main>

      {/* 7. FOOTER */}
      <footer className="site-footer">
        <div className="f-col">
          <div className="footer-brand">
            <div className="logo-box" style={{ background: '#fff' }}>QST</div>
            <span className="brand-name">Chaturanga</span>
          </div>
        </div>
        <div className="footer-links">
          <div className="f-col"><h4>Play</h4><div className="f-line"></div><div className="f-line" style={{ width: '60px' }}></div></div>
          <div className="f-col"><h4>Learn</h4><div className="f-line"></div><div className="f-line" style={{ width: '50px' }}></div></div>
          <div className="f-col"><h4>About</h4><div className="f-line"></div><div className="f-line" style={{ width: '80px' }}></div></div>
        </div>
      </footer>
      <div className="footer-bottom">© 2026 Chaturanga. All rights reserved.</div>
    </div>
  );
}
