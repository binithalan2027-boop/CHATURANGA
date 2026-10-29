import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const sharedStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html {
    background-color: #0E0E0E;
    color: #F4F4F4;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  body {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #0E0E0E;
    background-image: 
      radial-gradient(circle at 10% 10%, rgba(175, 246, 91, 0.05) 0%, transparent 40%),
      radial-gradient(circle at 90% 90%, rgba(242, 213, 0, 0.04) 0%, transparent 40%);
  }
  a { color: #AFF65B; text-decoration: none; transition: opacity 0.2s; }
  a:hover { opacity: 0.85; text-decoration: underline; }
  
  .container {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 0 24px;
  }

  /* Header */
  .site-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(20, 20, 20, 0.85);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
  }
  .brand-group {
    display: flex;
    align-items: baseline;
    gap: 10px;
    text-decoration: none;
  }
  .brand-group:hover { text-decoration: none; }
  .brand-title {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: #F4F4F4;
  }
  .brand-tagline {
    font-size: 10px;
    font-weight: 600;
    color: #AFF65B;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .site-nav {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .nav-link {
    font-size: 13px;
    color: #8A8A8A;
    font-weight: 500;
  }
  .nav-link:hover, .nav-link.active {
    color: #AFF65B;
    text-decoration: none;
  }
  .btn-play {
    background: #AFF65B;
    color: #0E0E0E;
    font-size: 12px;
    font-weight: 700;
    padding: 8px 18px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-decoration: none;
    transition: transform 0.15s, background 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn-play:hover {
    background: #9ee44a;
    transform: translateY(-1px);
    text-decoration: none;
  }

  /* Content */
  .main-content {
    flex: 1;
    padding: 48px 0 64px 0;
  }
  .kicker {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2.5px;
    color: #AFF65B;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  h1 {
    font-size: 38px;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: 0.5px;
    color: #F4F4F4;
    margin-bottom: 12px;
  }
  .subtitle {
    font-size: 18px;
    color: #A0A0A0;
    line-height: 1.6;
    margin-bottom: 36px;
  }

  /* Cards */
  .card {
    background: #161616;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 20px;
    padding: 28px;
    margin-bottom: 24px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  }
  .card h2 {
    font-size: 22px;
    font-weight: 700;
    color: #F4F4F4;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .card h3 {
    font-size: 17px;
    font-weight: 600;
    color: #F4F4F4;
    margin: 20px 0 8px 0;
  }
  .card p {
    font-size: 15px;
    color: #B0B0B0;
    line-height: 1.65;
    margin-bottom: 14px;
  }
  .card p:last-child { margin-bottom: 0; }
  .card ul, .card ol {
    margin: 12px 0 16px 20px;
    color: #B0B0B0;
    font-size: 14px;
    line-height: 1.7;
  }
  .card li { margin-bottom: 6px; }

  .badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(175, 246, 91, 0.12);
    color: #AFF65B;
    border: 1px solid rgba(175, 246, 91, 0.25);
  }
  .badge-yellow {
    background: rgba(242, 213, 0, 0.12);
    color: #F2D500;
    border-color: rgba(242, 213, 0, 0.25);
  }

  /* FAQ Accordion Look */
  .faq-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 20px 0;
  }
  .faq-item:first-child { padding-top: 0; }
  .faq-item:last-child { border-bottom: none; padding-bottom: 0; }
  .faq-q {
    font-size: 17px;
    font-weight: 700;
    color: #F4F4F4;
    margin-bottom: 8px;
  }
  .faq-a {
    font-size: 15px;
    color: #A0A0A0;
    line-height: 1.65;
  }

  /* Footer */
  .site-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding: 36px 0;
    background: #0E0E0E;
    font-size: 13px;
    color: #777;
  }
  .footer-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    text-align: center;
  }
  @media (min-width: 640px) {
    .footer-inner {
      flex-direction: row;
      justify-content: space-between;
      text-align: left;
    }
  }
  .footer-links {
    display: flex;
    gap: 18px;
    align-items: center;
  }
  .footer-links a { color: #8A8A8A; font-size: 13px; }
  .footer-links a:hover { color: #AFF65B; }
`;

function renderPage({ title, description, canonical, activeTab, contentHtml, jsonLd }) {
  const jsonLdScript = jsonLd
    ? `\n    <!-- Structured Data (JSON-LD) -->\n    <script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n    </script>`
    : '';

  return `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonical}" />
    <meta name="robots" content="index, follow" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Chaturanga" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="https://chaturangachess.games/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Chaturanga - Chess, Maths & Magic" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="https://chaturangachess.games/og-image.png" />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#0E0E0E" />${jsonLdScript}

    <style>${sharedStyles}</style>
  </head>
  <body>
    <header class="site-header">
      <div class="container header-inner">
        <a href="/" class="brand-group">
          <span class="brand-title">CHATURANGA</span>
          <span class="brand-tagline">Chess. Reimagined.</span>
        </a>

        <nav class="site-nav">
          <a href="/about/" class="nav-link ${activeTab === 'about' ? 'active' : ''}">About</a>
          <a href="/modes/" class="nav-link ${activeTab === 'modes' ? 'active' : ''}">Modes</a>
          <a href="/faq/" class="nav-link ${activeTab === 'faq' ? 'active' : ''}">FAQ</a>
          <a href="/" class="btn-play">Play Free</a>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <div class="container">
        ${contentHtml}
      </div>
    </main>

    <footer class="site-footer">
      <div class="container footer-inner">
        <div>
          <span>&copy; 2026 Chaturanga. Built with React 18, TypeScript &amp; Vite.</span>
          <div style="font-size: 11px; color: #555; margin-top: 4px;">Quiet colours. Warm wood. No account needed for local play.</div>
        </div>
        <div class="footer-links">
          <a href="/">Play</a>
          <a href="/about/">About</a>
          <a href="/modes/">Modes</a>
          <a href="/faq/">FAQ</a>
        </div>
      </div>
    </footer>
  </body>
</html>`;
}

// 1. /about/
const aboutContent = `
  <span class="kicker">Overview &amp; Origin</span>
  <h1>About Chaturanga</h1>
  <p class="subtitle">A quiet, tactical chess platform designed for fast browser play, clean geometry, and original mental challenges.</p>

  <div class="card">
    <h2><span>🪵</span> The Vision: Warm Wood &amp; Quiet Colours</h2>
    <p>
      Chaturanga is built on a simple premise: <strong>Your next move. Nothing in the way.</strong>
    </p>
    <p>
      Many digital chess websites today are crowded with distractions, aggressive popups, and paywalls. Chaturanga returns focus to the board: distraction-free dark charcoal surfaces, clean SVG vector piece artwork, quiet colors, and smooth 60fps piece motion.
    </p>
    <p>
      Whether you want a calm game against a custom Stockfish engine bot, an imperfect-information battle in Fog of War, or a tactical mental-arithmetic clash in Chess MM, everything is accessible directly in your web browser with no mandatory account required. Explore all <a href="/modes/">combat game modes and rules</a> or check our <a href="/faq/">frequently asked questions</a>.
    </p>
  </div>

  <div class="card">
    <h2><span>👤</span> Creator &amp; Development</h2>
    <p>
      Chaturanga is designed and built by <strong>Binit Halan</strong> as a solo developer project.
    </p>
    <p>
      The project combines modern web engineering with deep chess mechanics. Every animation, sound trigger, and board state machine is constructed to respect reduced-motion settings, run offline via client-side caching, and maintain instant input responsiveness.
    </p>
  </div>

  <div class="card">
    <h2><span>⚙️</span> Technical Foundation</h2>
    <p>Chaturanga is engineered with an uncompromising focus on performance and open standards:</p>
    <ul>
      <li><strong>Frontend:</strong> React 18, Vite, TypeScript, and Tailwind CSS.</li>
      <li><strong>AI Chess Engine:</strong> Client-side Stockfish WebAssembly (WASM) running locally in Web Workers across Elo levels from 250 to 2000+.</li>
      <li><strong>Tactical Variants:</strong> Clean algebraic rules engines implementing Chess960 permutations, Fog of War raycast vision, and Atomic explosion mechanics.</li>
      <li><strong>Mental Mathematics:</strong> Arithmetic challenge engines powering rapid-fire Speed Duels and Gate Showdowns in Chess MM.</li>
      <li><strong>Multiplayer Architecture:</strong> Lightweight WebSocket private room protocol for real-time peer play.</li>
    </ul>
  </div>

  <div class="card" style="text-align: center; background: #1C1C1C; border-color: rgba(175, 246, 91, 0.3);">
    <h2 style="justify-content: center;">Ready to make your move?</h2>
    <p style="max-width: 500px; margin: 0 auto 20px auto;">Jump straight into local combat modes, computer bots, or puzzle training.</p>
    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
      <a href="/" class="btn-play" style="font-size: 14px; padding: 10px 28px;">Start Playing Now &rarr;</a>
      <a href="/modes/" class="btn-play" style="font-size: 14px; padding: 10px 28px; background: rgba(255,255,255,0.08); color: #F4F4F4;">Browse Modes &rarr;</a>
    </div>
  </div>
`;

// 2. /modes/
const modesContent = `
  <span class="kicker">Rulebook &amp; Variants</span>
  <h1>Combat Game Modes</h1>
  <p class="subtitle">Complete rules and mechanics for all five combat modes available in Chaturanga. Have common questions? See our <a href="/faq/">FAQ guide</a>.</p>

  <!-- Classic Chess -->
  <div class="card" id="classic">
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
      <h2><span>♟️</span> Classic Chess</h2>
      <span class="badge">Standard 8×8</span>
    </div>
    <p>
      The royal game in its purest form. Standard FIDE piece movements, check, checkmate, castling, en passant, and pawn promotion.
    </p>
    <h3>Key Features</h3>
    <ul>
      <li><strong>Adjustable Engine Bots:</strong> Train against computer opponents calibrated across a wide Elo rating scale (250 to 2000+).</li>
      <li><strong>Custom Timers:</strong> Play Blitz (3 min, 5 min), Rapid (10 min, 15 min), or untimed study games.</li>
      <li><strong>Rotated Board for Black:</strong> Automatic 180&deg; perspective rotation when playing Black pieces, with full manual flip support.</li>
      <li><strong>Move History &amp; Analysis:</strong> Replay moves, inspect captured material advantages, and practice checkmate patterns.</li>
    </ul>
    <div style="margin-top: 16px;">
      <a href="/?mode=standard" class="btn-play" style="font-size: 12px; padding: 6px 16px;">Play Classic Chess &rarr;</a>
    </div>
  </div>

  <!-- Chess960 -->
  <div class="card" id="chess960">
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
      <h2><span>🎲</span> Chess960 (Fischer Random)</h2>
      <span class="badge badge-yellow">Permutation Variant</span>
    </div>
    <p>
      Created by Bobby Fischer to eliminate memorized opening books and test pure tactical chess intuition from move one.
    </p>
    <h3>Rules &amp; Mechanics</h3>
    <ul>
      <li><strong>Starting Position:</strong> The pieces on the 1st and 8th ranks are randomized into one of 960 possible starting configurations.</li>
      <li><strong>Mirrored Ranks:</strong> White and Black mirror each other identically across ranks.</li>
      <li><strong>Bishop Placement:</strong> The two bishops must always start on opposite-colored squares.</li>
      <li><strong>Castling Constraints:</strong> The king always starts between the two rooks, allowing standard a-side and h-side castling.</li>
    </ul>
    <div style="margin-top: 16px;">
      <a href="/?mode=chess960" class="btn-play" style="font-size: 12px; padding: 6px 16px;">Play Chess960 &rarr;</a>
    </div>
  </div>

  <!-- Fog of War -->
  <div class="card" id="fog">
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
      <h2><span>🌫️</span> Fog of War</h2>
      <span class="badge">Imperfect Information</span>
    </div>
    <p>
      Chess under total stealth. Players have limited field-of-vision and can only see squares their pieces can observe.
    </p>
    <h3>Rules &amp; Mechanics</h3>
    <ul>
      <li><strong>Vision Radius:</strong> A square is visible only if your piece occupies it or can legally move or attack to it on the current turn.</li>
      <li><strong>Pawn Sight:</strong> Pawns see the square directly in front of them as well as their diagonal attack squares.</li>
      <li><strong>No Check Warnings:</strong> There is no concept of "check" or "checkmate"—you do not have to announce threats.</li>
      <li><strong>King Capture Win Condition:</strong> The game ends immediately when a player captures the opponent's king.</li>
    </ul>
    <div style="margin-top: 16px;">
      <a href="/?mode=fog" class="btn-play" style="font-size: 12px; padding: 6px 16px;">Play Fog of War &rarr;</a>
    </div>
  </div>

  <!-- Atomic Chess -->
  <div class="card" id="atomic">
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
      <h2><span>💥</span> Atomic Chess</h2>
      <span class="badge badge-yellow">Explosive Captures</span>
    </div>
    <p>
      A high-velocity variant where every capture unleashes an explosion that vaporizes surrounding units.
    </p>
    <h3>Rules &amp; Mechanics</h3>
    <ul>
      <li><strong>Detonation Radius:</strong> Every capture triggers an explosion in the 3&times;3 area surrounding the capture square.</li>
      <li><strong>Casualties:</strong> The capturing piece and the captured piece are both destroyed, along with all adjacent non-pawn pieces.</li>
      <li><strong>Pawn Resilience:</strong> Pawns are only removed if directly captured; they survive adjacent explosions.</li>
      <li><strong>King Immunity &amp; Restraints:</strong> Kings cannot capture any piece (since that would trigger a self-destructive explosion) and cannot make a move that causes an adjacent explosion to their own square.</li>
    </ul>
    <div style="margin-top: 16px;">
      <a href="/?mode=atomic" class="btn-play" style="font-size: 12px; padding: 6px 16px;">Play Atomic Chess &rarr;</a>
    </div>
  </div>

  <!-- Chess MM -->
  <div class="card" id="chess-mm">
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
      <h2><span>🔮</span> Chess MM (Mind &amp; Magic)</h2>
      <span class="badge">Maths &amp; Spells</span>
    </div>
    <p>
      Chaturanga's signature fusion: combining rapid mental arithmetic with tactical chess strategy and earned board spells.
    </p>
    <h3>Battle Formats</h3>
    <ul>
      <li><strong>Math Before Move:</strong> Solve an arithmetic equation under time pressure before confirming your tactical chess move.</li>
      <li><strong>Speed Duel &amp; Gate Showdown:</strong> A 90-second mental math trial where quick answers unlock seven collectible spells.</li>
      <li><strong>Earned Board Spells:</strong> Cast tactical powers onto the board—freeze enemy units, shield friendly pieces, jump over defenders, or swap piece positions.</li>
    </ul>
    <div style="margin-top: 16px;">
      <a href="/?mode=math" class="btn-play" style="font-size: 12px; padding: 6px 16px;">Play Chess MM &rarr;</a>
    </div>
  </div>

  <div class="card" style="text-align: center; background: #1C1C1C; border-color: rgba(175, 246, 91, 0.3);">
    <h2 style="justify-content: center;">Choose your combat mode</h2>
    <p style="max-width: 500px; margin: 0 auto 20px auto;">All five modes are playable instantly in your browser with zero downloads.</p>
    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
      <a href="/" class="btn-play" style="font-size: 14px; padding: 10px 28px;">Play Modes Now &rarr;</a>
      <a href="/faq/" class="btn-play" style="font-size: 14px; padding: 10px 28px; background: rgba(255,255,255,0.08); color: #F4F4F4;">Read FAQ &rarr;</a>
    </div>
  </div>
`;

// 3. /faq/
const faqContent = `
  <span class="kicker">Frequently Asked Questions</span>
  <h1>Frequently Asked Questions</h1>
  <p class="subtitle">Quick, factual answers about playing chess, game modes, accounts, and multiplayer in Chaturanga.</p>

  <div class="card">
    <div class="faq-item">
      <h2 class="faq-q">Is Chaturanga free to play?</h2>
      <div class="faq-a">
        Yes. Chaturanga is a free web browser application. You can play all local chess modes, practice puzzles, and compete against computer bots without paying any fees or subscriptions.
      </div>
    </div>

    <div class="faq-item">
      <h2 class="faq-q">Do I need an account to play?</h2>
      <div class="faq-a">
        No account is needed for local play. You can jump directly onto the board as a guest with an automatically generated 8-digit Player ID. If you wish to sync your progress, you can optionally sign in with Google.
      </div>
    </div>

    <div class="faq-item">
      <h2 class="faq-q">What is Chess MM (Mind &amp; Magic)?</h2>
      <div class="faq-a">
        Chess MM is an original game mode combining chess with mental mathematics. Players can choose between solving mental-maths problems before making moves, or entering a 90-second math sprint to earn tactical spells (such as freezing pieces, placing shields, or jumping pieces). Learn more on the <a href="/modes/#chess-mm">Chess MM mode rules</a>.
      </div>
    </div>

    <div class="faq-item">
      <h2 class="faq-q">How does Fog of War work?</h2>
      <div class="faq-a">
        In Fog of War, neither player has full board vision. Squares are hidden by fog unless one of your pieces occupies, attacks, or moves to that square. There is no check warning, and the objective is to capture the opponent's king directly. Full details are in the <a href="/modes/#fog">Fog of War rules</a>.
      </div>
    </div>

    <div class="faq-item">
      <h2 class="faq-q">How do explosions work in Atomic Chess?</h2>
      <div class="faq-a">
        Whenever any capture occurs in Atomic Chess, an explosion destroys the captured piece, the capturing piece, and all non-pawn pieces in the eight immediately adjacent squares. Kings cannot capture and cannot move adjacent to other kings. Full details are in the <a href="/modes/#atomic">Atomic Chess rules</a>.
      </div>
    </div>

    <div class="faq-item">
      <h2 class="faq-q">What is Chess960?</h2>
      <div class="faq-a">
        Chess960 (also known as Fischer Random Chess) randomizes the home-rank pieces into one of 960 starting permutations. The pieces mirror identically for White and Black, bishops remain on opposite colors, and standard castling rules apply. Full details are in the <a href="/modes/#chess960">Chess960 rules</a>.
      </div>
    </div>

    <div class="faq-item">
      <h2 class="faq-q">How do private multiplayer rooms work?</h2>
      <div class="faq-a">
        You can create a private room and share the room code with a friend. Once your friend enters the code, both players are connected directly for real-time play across Classic Chess, Chess MM, or multi-board formats.
      </div>
    </div>

    <div class="faq-item">
      <h2 class="faq-q">Can I play on mobile phones or tablets?</h2>
      <div class="faq-a">
        Yes. Chaturanga is fully responsive and optimized for mobile touchscreens, tablets, and desktop displays. It functions client-side as an offline-ready web application without requiring an app store download.
      </div>
    </div>
  </div>

  <div class="card" style="text-align: center; background: #1C1C1C; border-color: rgba(175, 246, 91, 0.3);">
    <h2 style="justify-content: center;">Have a new mode idea or feedback?</h2>
    <p style="max-width: 500px; margin: 0 auto 20px auto;">Open the in-game community feedback menu anytime to share ideas, mode requests, or report friction.</p>
    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
      <a href="/" class="btn-play" style="font-size: 14px; padding: 10px 28px;">Go to App &rarr;</a>
      <a href="/modes/" class="btn-play" style="font-size: 14px; padding: 10px 28px; background: rgba(255,255,255,0.08); color: #F4F4F4;">Explore Modes &rarr;</a>
    </div>
  </div>

`;

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About Chaturanga',
  url: 'https://chaturangachess.games/about/',
  description: 'Learn about Chaturanga, a quiet, tactical browser chess platform with combat variants, mental math showdowns, and custom Stockfish bots. Created by Binit Halan.',
  mainEntity: {
    '@type': 'Person',
    name: 'Binit Halan',
    jobTitle: 'Solo Developer',
    description: 'Creator and developer of Chaturanga.',
  },
};

const modesJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Game Modes & Rules - Chaturanga Chess Variants',
  url: 'https://chaturangachess.games/modes/',
  description: 'Explore all combat game modes in Chaturanga: Classic Chess, Chess960, Fog of War, Atomic Chess, and Chess MM (Mind & Magic). Full rules and mechanics.',
  hasPart: [
    {
      '@type': 'Game',
      name: 'Classic Chess',
      description: 'Standard FIDE chess with engine bots from 250 to 2000+ Elo, custom timers, and board rotation.',
    },
    {
      '@type': 'Game',
      name: 'Chess960 (Fischer Random)',
      description: '960 randomized starting configurations mirroring White and Black with opposite-colored bishops.',
    },
    {
      '@type': 'Game',
      name: 'Fog of War',
      description: 'Stealth chess with imperfect information where players only see squares their pieces observe.',
    },
    {
      '@type': 'Game',
      name: 'Atomic Chess',
      description: 'Explosive captures destroying captured piece, capturing piece, and adjacent non-pawns in a 3x3 radius.',
    },
    {
      '@type': 'Game',
      name: 'Chess MM (Mind & Magic)',
      description: 'Chess fused with mental arithmetic challenges and seven unlockable tactical board spells.',
    },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  name: 'Frequently Asked Questions - Chaturanga',
  url: 'https://chaturangachess.games/faq/',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is Chaturanga free to play?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Chaturanga is a free web browser application. You can play all local chess modes, practice puzzles, and compete against computer bots without paying any fees or subscriptions.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need an account to play?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No account is needed for local play. You can jump directly onto the board as a guest with an automatically generated 8-digit Player ID. If you wish to sync your progress, you can optionally sign in with Google.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is Chess MM (Mind & Magic)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Chess MM is an original game mode combining chess with mental mathematics. Players can choose between solving mental-maths problems before making moves, or entering a 90-second math sprint to earn tactical spells (such as freezing pieces, placing shields, or jumping pieces).',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Fog of War work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "In Fog of War, neither player has full board vision. Squares are hidden by fog unless one of your pieces occupies, attacks, or moves to that square. There is no check warning, and the objective is to capture the opponent's king directly.",
      },
    },
    {
      '@type': 'Question',
      name: 'How do explosions work in Atomic Chess?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Whenever any capture occurs in Atomic Chess, an explosion destroys the captured piece, the capturing piece, and all non-pawn pieces in the eight immediately adjacent squares. Kings cannot capture and cannot move adjacent to other kings.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is Chess960?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Chess960 (also known as Fischer Random Chess) randomizes the home-rank pieces into one of 960 starting permutations. The pieces mirror identically for White and Black, bishops remain on opposite colors, and standard castling rules apply.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do private multiplayer rooms work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can create a private room and share the room code with a friend. Once your friend enters the code, both players are connected directly for real-time play across Classic Chess, Chess MM, or multi-board formats.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I play on mobile phones or tablets?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Chaturanga is fully responsive and optimized for mobile touchscreens, tablets, and desktop displays. It functions client-side as an offline-ready web application without requiring an app store download.',
      },
    },
  ],
};

// Build pages
export function buildStaticPages() {
  console.log('Building static pages for SEO/AEO/GEO...');

  const pages = [
    {
      dir: path.join(distDir, 'about'),
      title: 'About Chaturanga - Chess, Maths & Magic',
      description: 'Learn about Chaturanga, a quiet, tactical browser chess platform with combat variants, mental math showdowns, and custom Stockfish bots. Created by Binit Halan.',
      canonical: 'https://chaturangachess.games/about/',
      activeTab: 'about',
      contentHtml: aboutContent,
      jsonLd: aboutJsonLd,
    },
    {
      dir: path.join(distDir, 'modes'),
      title: 'Game Modes & Rules - Chaturanga Chess Variants',
      description: 'Explore all combat game modes in Chaturanga: Classic Chess, Chess960, Fog of War, Atomic Chess, and Chess MM (Mind & Magic). Full rules and mechanics.',
      canonical: 'https://chaturangachess.games/modes/',
      activeTab: 'modes',
      contentHtml: modesContent,
      jsonLd: modesJsonLd,
    },
    {
      dir: path.join(distDir, 'faq'),
      title: 'Frequently Asked Questions - Chaturanga',
      description: 'Frequently asked questions about Chaturanga. Learn about accounts, game modes, mental maths, offline play, private multiplayer rooms, and bot engines.',
      canonical: 'https://chaturangachess.games/faq/',
      activeTab: 'faq',
      contentHtml: faqContent,
      jsonLd: faqJsonLd,
    },
  ];

  for (const page of pages) {
    ensureDir(page.dir);
    const html = renderPage(page);
    const filePath = path.join(page.dir, 'index.html');
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✓ Generated ${path.relative(rootDir, filePath)}`);
  }

  console.log('Static pages build complete.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildStaticPages();
}
