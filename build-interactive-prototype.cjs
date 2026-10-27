const fs = require('fs');
const path = require('path');

const puzzles = JSON.parse(fs.readFileSync('src/chaturanga/puzzles150.json', 'utf8'));
const chessCjs = fs.readFileSync('node_modules/chess.js/dist/cjs/chess.js', 'utf8');

// SVG piece generator functions for standalone HTML
const pieceSvg = {
  p: (color) => `<svg viewBox="0 0 100 100" class="piece-svg"><circle cx="50" cy="30" r="15" fill="${color==='w'?'#FAFAFA':'#1B1B1B'}"/><path d="M36 52 H64 L68 72 H32 Z" fill="${color==='w'?'#FAFAFA':'#1B1B1B'}"/><rect x="26" y="72" width="48" height="14" rx="6" fill="${color==='w'?'#FAFAFA':'#1B1B1B'}"/><rect x="40" y="52" width="20" height="5" rx="2" fill="${color==='w'?'#1B1B1B':'#FAFAFA'}"/></svg>`,
  n: (color) => `<svg viewBox="0 0 100 100" class="piece-svg"><path d="M26 90 H78 V80 C78 62 72 50 62 44 C72 40 78 30 74 20 L64 24 L58 10 L48 22 C32 26 20 40 20 56 L36 62 C40 54 46 52 52 52 C46 62 38 70 30 80 Z" fill="${color==='w'?'#FAFAFA':'#1B1B1B'}"/><circle cx="52" cy="34" r="3.2" fill="${color==='w'?'#1B1B1B':'#FAFAFA'}"/><rect x="22" y="82" width="60" height="10" rx="4" fill="${color==='w'?'#1B1B1B':'#FAFAFA'}"/></svg>`,
  b: (color) => `<svg viewBox="0 0 100 100" class="piece-svg"><circle cx="50" cy="22" r="8" fill="${color==='w'?'#FAFAFA':'#1B1B1B'}"/><path d="M50 32 C38 32 32 44 32 58 C32 72 38 78 50 78 C62 78 68 72 68 58 C68 44 62 32 50 32 Z" fill="${color==='w'?'#FAFAFA':'#1B1B1B'}"/><rect x="24" y="74" width="52" height="14" rx="6" fill="${color==='w'?'#FAFAFA':'#1B1B1B'}"/><line x1="44" y1="38" x2="56" y2="50" stroke="${color==='w'?'#1B1B1B':'#FAFAFA'}" stroke-width="4" stroke-linecap="round"/></svg>`,
  r: (color) => `<svg viewBox="0 0 100 100" class="piece-svg"><path d="M26 20 H36 V30 H44 V20 H56 V30 H64 V20 H74 V42 L68 50 V78 L76 84 V92 H24 V84 L32 78 V50 L26 42 Z" fill="${color==='w'?'#FAFAFA':'#1B1B1B'}"/><rect x="38" y="60" width="24" height="5" rx="2.5" fill="${color==='w'?'#1B1B1B':'#FAFAFA'}"/></svg>`,
  q: (color) => `<svg viewBox="0 0 100 100" class="piece-svg"><circle cx="50" cy="14" r="7" fill="${color==='w'?'#FAFAFA':'#1B1B1B'}"/><circle cx="24" cy="26" r="6" fill="${color==='w'?'#FAFAFA':'#1B1B1B'}"/><circle cx="76" cy="26" r="6" fill="${color==='w'?'#FAFAFA':'#1B1B1B'}"/><path d="M28 88 L22 30 L38 52 L50 24 L62 52 L78 30 L72 88 Z" fill="${color==='w'?'#FAFAFA':'#1B1B1B'}"/><rect x="22" y="82" width="56" height="12" rx="5" fill="${color==='w'?'#FAFAFA':'#1B1B1B'}"/><rect x="34" y="66" width="32" height="5" rx="2.5" fill="${color==='w'?'#1B1B1B':'#FAFAFA'}"/></svg>`,
  k: (color) => `<svg viewBox="0 0 100 100" class="piece-svg"><line x1="50" y1="12" x2="50" y2="28" stroke="${color==='w'?'#FAFAFA':'#1B1B1B'}" stroke-width="6" stroke-linecap="round"/><line x1="42" y1="20" x2="58" y2="20" stroke="${color==='w'?'#FAFAFA':'#1B1B1B'}" stroke-width="6" stroke-linecap="round"/><path d="M30 84 L26 40 L40 50 L50 32 L60 50 L74 40 L70 84 Z" fill="${color==='w'?'#FAFAFA':'#1B1B1B'}"/><rect x="22" y="80" width="56" height="14" rx="6" fill="${color==='w'?'#FAFAFA':'#1B1B1B'}"/><rect x="36" y="62" width="28" height="5" rx="2.5" fill="${color==='w'?'#1B1B1B':'#FAFAFA'}"/></svg>`
};

const htmlContent = `<!doctype html>
<!-- chess.js licence:
Copyright (c) 2025, Jeff Hlywa (jhlywa@gmail.com)
All rights reserved.
-->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Chaturanga Training - Interactive Prototype</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  :root {
    --bg-canvas: #0E0E0E;
    --bg-card: #1A1A1A;
    --bg-ctrl: #262626;
    --border-color: #2D2D2D;
    --text-primary: #F4F4F4;
    --text-secondary: #8A8A8A;
    --color-lime: #AFF65B;
    --color-yellow: #F2D500;
    --color-lavender: #A594F0;
    --color-teal: #66D4C2;
    --color-red: #FF6B6B;
    --sq-light: #C9BA9B;
    --sq-dark: #667A53;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body {
    background-color: var(--bg-canvas);
    color: var(--text-primary);
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  h1, h2, h3, .font-display {
    font-family: 'Bebas Neue', Impact, sans-serif;
    letter-spacing: 0.04em;
    font-weight: 900;
  }
  button { font-family: inherit; }
  
  /* Header */
  header {
    height: 64px;
    background: #141414;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .wordmark {
    font-family: 'Bebas Neue', Impact, sans-serif;
    font-size: 26px;
    letter-spacing: 2px;
    color: #FFF;
  }
  .proto-tag {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--color-lime);
    text-transform: uppercase;
  }
  .btn-exit {
    padding: 7px 16px;
    border-radius: 12px;
    background: var(--bg-ctrl);
    color: var(--text-primary);
    border: 1px solid #363636;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s;
  }
  .btn-exit:hover { background: #333; }

  /* Main Container */
  main {
    flex: 1;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding: 24px 20px 60px;
  }

  /* Hub Section */
  .hub-title-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .kicker {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 2px;
    color: var(--color-lime);
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .hub-title {
    font-size: 48px;
    line-height: 1;
    color: #FFF;
  }
  .device-pill {
    padding: 6px 14px;
    border-radius: 9999px;
    background: #1C1C1C;
    border: 1px solid #2B2B2B;
    font-size: 11px;
    color: var(--text-secondary);
    font-weight: 600;
  }
  .section-subhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .section-subhead h2 { font-size: 24px; color: #FFF; }
  .section-subhead span { font-size: 12px; color: var(--text-secondary); font-weight: 600; }

  /* 3 Bento Cards */
  .bento-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 24px;
  }
  .bento-card {
    border-radius: 24px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 240px;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: transform 0.2s, box-shadow 0.2s;
    position: relative;
    overflow: hidden;
  }
  .bento-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(0,0,0,0.4);
  }
  .bento-card-yellow { background: var(--color-yellow); color: #111; }
  .bento-card-lavender { background: var(--color-lavender); color: #111; }
  .bento-card-teal { background: var(--color-teal); color: #111; }

  .bento-kicker {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    opacity: 0.75;
    margin-bottom: 4px;
  }
  .bento-title {
    font-size: 34px;
    line-height: 0.95;
    margin-bottom: 8px;
  }
  .bento-illustration {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: auto 0;
    padding: 12px 0;
  }
  .bento-illustration svg { width: 72px; height: 72px; }
  .bento-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: 8px;
  }
  .bento-desc { font-size: 12px; font-weight: 600; opacity: 0.9; }
  .btn-arrow-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #000;
    color: #FFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
  }

  /* Secondary Row */
  .secondary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .card-charcoal {
    background: var(--bg-card);
    border-radius: 24px;
    border: 1px solid var(--border-color);
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .pattern-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 16px 0;
  }
  .chip {
    padding: 8px 16px;
    border-radius: 14px;
    background: var(--bg-ctrl);
    color: var(--text-primary);
    border: 1px solid #363636;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.2s;
  }
  .chip:hover { background: #333; }
  .chip.active { background: var(--color-lime); color: #0E0E0E; border-color: var(--color-lime); }

  /* Practice Stats Card */
  .stats-row-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 16px;
  }
  .stat-col { text-align: left; }
  .stat-val { font-size: 32px; font-weight: 900; line-height: 1; font-family: 'Bebas Neue', Impact, sans-serif; color: #FFF; }
  .stat-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-top: 4px; }
  .progress-track {
    width: 100%;
    height: 8px;
    background: #262626;
    border-radius: 9999px;
    margin-top: 16px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: var(--color-lime);
    border-radius: 9999px;
    transition: width 0.4s ease;
  }

  /* Board Area */
  .board-wrapper {
    max-width: 540px;
    width: 100%;
    aspect-ratio: 1;
    margin: 0 auto;
    background: #141414;
    border-radius: 20px;
    border: 1px solid var(--border-color);
    box-shadow: 0 16px 40px rgba(0,0,0,0.6);
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    overflow: hidden;
    position: relative;
    user-select: none;
  }
  .square {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .square.light { background-color: var(--sq-light); }
  .square.dark { background-color: var(--sq-dark); }
  .square.selected { box-shadow: inset 0 0 0 4px #F2D500; }
  .square.hint { box-shadow: inset 0 0 0 4px var(--color-lime); }
  .square.last-move { background-color: rgba(242, 213, 0, 0.4) !important; }
  .square.in-check { background-color: rgba(255, 107, 107, 0.6) !important; }

  .move-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgba(0,0,0,0.3);
    pointer-events: none;
  }
  .capture-ring {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 6px solid rgba(0,0,0,0.3);
    position: absolute;
    pointer-events: none;
  }

  .piece-svg {
    width: 84%;
    height: 84%;
    pointer-events: none;
  }
  .coord-rank {
    position: absolute;
    top: 2px;
    left: 4px;
    font-size: 10px;
    font-weight: 800;
    opacity: 0.6;
    pointer-events: none;
  }
  .coord-file {
    position: absolute;
    bottom: 2px;
    right: 4px;
    font-size: 10px;
    font-weight: 800;
    opacity: 0.6;
    pointer-events: none;
  }

  /* Puzzle Practice Layout */
  .session-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 24px;
    align-items: start;
  }
  .lime-btn {
    width: 100%;
    padding: 14px;
    border-radius: 16px;
    background: var(--color-lime);
    color: #0E0E0E;
    font-size: 14px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    border: none;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(175, 246, 91, 0.25);
    transition: 0.2s;
  }
  .lime-btn:hover { background: #9DE84A; }

  /* Speed Duel Screen */
  .speed-duel-container {
    max-width: 460px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .keypad-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .key-btn {
    height: 48px;
    border-radius: 12px;
    background: var(--bg-ctrl);
    color: #FFF;
    border: 1px solid #363636;
    font-size: 20px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .key-btn:active { background: #404040; transform: scale(0.97); }

  /* Mobile Responsive */
  @media (max-width: 900px) {
    .bento-grid {
      grid-template-columns: 1fr;
      gap: 14px;
    }
    .bento-card {
      min-height: 124px;
      flex-direction: row;
      align-items: center;
      padding: 20px;
    }
    .bento-card .bento-illustration {
      margin: 0;
      padding: 0;
    }
    .bento-bottom { display: none; }
    .secondary-grid {
      grid-template-columns: 1fr;
    }
    .session-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
</head>
<body>

<header>
  <div class="wordmark">CHATURANGA</div>
  <div class="proto-tag">PROTOTYPE</div>
  <button class="btn-exit" onclick="showHub()">Exit practice</button>
</header>

<main id="app-root">
  <!-- Content dynamically rendered by JS -->
</main>

<script>
// --- CHESS.JS EMBEDDED ---
const Chess = (function() {
  const exports = {};
  const module = { exports };
  ${chessCjs}
  return exports.Chess || module.exports.Chess || Chess;
})();

// --- 150 PUZZLES BANK EMBEDDED ---
const PUZZLES = ${JSON.stringify(puzzles)};

// SVGs
const PIECES = {
  p: ${pieceSvg.p.toString()},
  n: ${pieceSvg.n.toString()},
  b: ${pieceSvg.b.toString()},
  r: ${pieceSvg.r.toString()},
  q: ${pieceSvg.q.toString()},
  k: ${pieceSvg.k.toString()}
};

// State
let currentView = 'hub'; // 'hub' | 'practice' | 'sprint' | 'speed_duel'
let activeTheme = 'All 150';
let practicePuzzles = [...PUZZLES];
let puzzleIdx = 0;
let currentChess = null;
let setupFen = '';
let solutionMoves = [];
let solutionStep = 0;
let solverTurn = 'w';
let selectedSq = null;
let hintSq = null;
let isSolved = false;
let isReplying = false;
let practiceNotice = 'Find the best continuation.';
let sessionSolved = 0;
let sessionErrors = 0;

// Mate Sprint State
let sprintPuzzles = PUZZLES.filter(p => p.themes.includes('mateIn1'));
let sprintIdx = 0;
let sprintScore = 0;
let sprintStrikes = 0;
let sprintTimer = 180;
let sprintInterval = null;

// Speed Duel State
let mathDuration = 60;
let mathDifficulty = 'easy';
let mathDeadline = 0;
let mathTimerInterval = null;
let mathTimeLeft = 60;
let mathCorrect = 0;
let mathErrors = 0;
let mathQuestion = null;
let mathInput = '';
let mathMissed = [];
let mathPhase = 'setup'; // 'setup' | 'countdown' | 'active' | 'results' | 'retry'
let retryQueue = [];
let retryIdx = 0;

// Progress Store in LocalStorage
function getStoredProgress() {
  try {
    return JSON.parse(localStorage.getItem('chaturanga-training-v2')) || {
      bankSolved: [],
      mathsBestScore: 0,
      bestRush: 0
    };
  } catch(e) {
    return { bankSolved: [], mathsBestScore: 0, bestRush: 0 };
  }
}

function saveBankSolve(id) {
  const p = getStoredProgress();
  if (!p.bankSolved.includes(id)) {
    p.bankSolved.push(id);
    localStorage.setItem('chaturanga-training-v2', JSON.stringify(p));
  }
}

function saveMathScore(score) {
  const p = getStoredProgress();
  p.mathsBestScore = Math.max(p.mathsBestScore || 0, score);
  localStorage.setItem('chaturanga-training-v2', JSON.stringify(p));
}

function saveRushScore(score) {
  const p = getStoredProgress();
  p.bestRush = Math.max(p.bestRush || 0, score);
  localStorage.setItem('chaturanga-training-v2', JSON.stringify(p));
}

// ==========================================
// RENDER: Training Hub
// ==========================================
function showHub() {
  currentView = 'hub';
  if (sprintInterval) clearInterval(sprintInterval);
  if (mathTimerInterval) clearInterval(mathTimerInterval);
  render();
}

function renderHub() {
  const prog = getStoredProgress();
  const solvedCount = Math.min(150, prog.bankSolved.length);
  const pct = Math.round((solvedCount / 150) * 100);

  return \`
    <div class="hub-title-row">
      <div>
        <div class="kicker">CHESS, MATHS &amp; SHARPER MOVES</div>
        <h1 class="hub-title">TRAINING</h1>
      </div>
      <div class="device-pill">Progress stays on this device</div>
    </div>

    <div class="section-subhead">
      <h2>CHOOSE YOUR MODE</h2>
      <span>Tap to practise →</span>
    </div>

    <div class="bento-grid">
      <button class="bento-card bento-card-yellow" onclick="startPractice('All 150')">
        <div>
          <div class="bento-kicker">150 PUZZLES · OFFLINE BANK</div>
          <div class="bento-title">PUZZLE PRACTICE</div>
        </div>
        <div class="bento-illustration">
          \${PIECES.n('w')}
        </div>
        <div class="bento-bottom">
          <div class="bento-desc">Untimed · Choose a theme</div>
          <div class="btn-arrow-circle">↗</div>
        </div>
      </button>

      <button class="bento-card bento-card-lavender" onclick="startSprint()">
        <div>
          <div class="bento-kicker">CHESS AGAINST THE CLOCK</div>
          <div class="bento-title">MATE SPRINT</div>
        </div>
        <div class="bento-illustration" style="gap:8px">
          \${PIECES.q('w')}
          <span style="font-family:'Bebas Neue', Impact; font-size:44px; font-weight:900;">3:00</span>
        </div>
        <div class="bento-bottom">
          <div class="bento-desc">3 min · 3 mistakes ends run</div>
          <span style="font-size:11px; font-weight:bold">Best: \${prog.bestRush || 0}</span>
        </div>
      </button>

      <button class="bento-card bento-card-teal" onclick="startSpeedDuel()">
        <div>
          <div class="bento-kicker">QUICK MATHS · SOLO PRACTICE</div>
          <div class="bento-title">SPEED DUEL</div>
        </div>
        <div class="bento-illustration">
          <span style="font-family:'Bebas Neue', Impact; font-size:52px; font-weight:900;">7 × 8</span>
        </div>
        <div class="bento-bottom">
          <div class="bento-desc">Timer · Errors · Review misses</div>
          <div class="btn-arrow-circle">↗</div>
        </div>
      </button>
    </div>

    <div class="secondary-grid">
      <div class="card-charcoal">
        <div>
          <div class="kicker">PICK A PATTERN</div>
          <h2 style="font-size:24px; color:#FFF; margin-bottom:8px">WHAT WILL YOU SPOT TODAY?</h2>
          <div class="pattern-chips">
            <button class="chip" onclick="startPractice('All 150')">All 150</button>
            <button class="chip" onclick="startPractice('Mate')">Mate</button>
            <button class="chip" onclick="startPractice('Fork')">Fork</button>
            <button class="chip" onclick="startPractice('Pin')">Pin</button>
            <button class="chip" onclick="startPractice('Endgame')">Endgame</button>
          </div>
        </div>
        <p style="font-size:11px; color:var(--text-secondary)">Lichess open database · CC0 · Included locally</p>
      </div>

      <div class="card-charcoal">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <h2 style="font-size:24px; color:#FFF">YOUR PRACTICE</h2>
          <span style="font-size:11px; color:var(--text-secondary); font-weight:600">On this device</span>
        </div>
        <div class="stats-row-3">
          <div class="stat-col">
            <div class="stat-val">\${solvedCount}/150</div>
            <div class="stat-lbl">Unique Solved</div>
          </div>
          <div class="stat-col">
            <div class="stat-val">\${solvedCount > 0 ? pct + '%' : '—'}</div>
            <div class="stat-lbl">Accuracy</div>
          </div>
          <div class="stat-col">
            <div class="stat-val">\${prog.mathsBestScore || 0}</div>
            <div class="stat-lbl">Maths Best</div>
          </div>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: \${pct}%"></div>
        </div>
      </div>
    </div>
  \`;
}

// ==========================================
// PUZZLE PRACTICE
// ==========================================
function startPractice(theme) {
  activeTheme = theme;
  if (!theme || theme.toLowerCase().includes('all')) {
    practicePuzzles = [...PUZZLES];
  } else {
    practicePuzzles = PUZZLES.filter(p => p.themes.some(t => t.toLowerCase().includes(theme.toLowerCase())));
  }
  puzzleIdx = 0;
  loadPuzzle();
  currentView = 'practice';
  render();
}

function loadPuzzle() {
  const p = practicePuzzles[puzzleIdx];
  if (!p) return;
  const c = new Chess(p.fen);
  // Apply opponent's setup move moves[0]
  const u0 = p.moves[0];
  c.move({ from: u0.slice(0,2), to: u0.slice(2,4), promotion: u0.length > 4 ? u0[4] : undefined });
  setupFen = c.fen();
  currentChess = new Chess(setupFen);
  solverTurn = currentChess.turn();
  solutionMoves = p.moves.slice(1);
  solutionStep = 0;
  selectedSq = null;
  hintSq = null;
  isSolved = false;
  isReplying = false;
  practiceNotice = 'Find the best continuation.';
}

function nextPuzzle() {
  if (practicePuzzles.length === 0) return;
  puzzleIdx = (puzzleIdx + 1) % practicePuzzles.length;
  loadPuzzle();
  render();
}

function showHint() {
  if (isSolved || isReplying) return;
  const uci = solutionMoves[solutionStep];
  if (uci) {
    hintSq = uci.slice(0, 2);
    practiceNotice = 'Hint: Look at the piece on ' + hintSq.toUpperCase();
    render();
  }
}

function handleSquareClick(sq) {
  if (isSolved || isReplying || !currentChess) return;

  if (!selectedSq) {
    const piece = currentChess.get(sq);
    if (piece && piece.color === currentChess.turn()) {
      selectedSq = sq;
      render();
    }
    return;
  }

  if (selectedSq === sq) {
    selectedSq = null;
    render();
    return;
  }

  const moves = currentChess.moves({ square: selectedSq, verbose: true });
  const legal = moves.find(m => m.to === sq);

  if (legal) {
    const expected = solutionMoves[solutionStep];
    const candidateUci = selectedSq + sq + (legal.promotion || '');
    const isDirectMatch = candidateUci === expected || candidateUci.slice(0,4) === expected.slice(0,4);

    const testChess = new Chess(currentChess.fen());
    testChess.move({ from: selectedSq, to: sq, promotion: legal.promotion || 'q' });
    const deliversMate = testChess.isCheckmate();
    const isMatePz = practicePuzzles[puzzleIdx].themes.some(t => t.toLowerCase().includes('mate'));

    if (isDirectMatch || (isMatePz && deliversMate)) {
      currentChess.move({ from: selectedSq, to: sq, promotion: legal.promotion || 'q' });
      selectedSq = null;
      hintSq = null;

      const nextStep = solutionStep + 1;
      if (nextStep >= solutionMoves.length || deliversMate) {
        isSolved = true;
        practiceNotice = deliversMate ? 'Checkmate! Brilliant finish.' : 'Solved! Outstanding tactic.';
        sessionSolved++;
        saveBankSolve(practicePuzzles[puzzleIdx].id);
        render();
      } else {
        solutionStep = nextStep;
        isReplying = true;
        practiceNotice = 'Opponent is replying...';
        render();

        setTimeout(() => {
          const oppUci = solutionMoves[nextStep];
          currentChess.move({ from: oppUci.slice(0,2), to: oppUci.slice(2,4), promotion: oppUci[4] });
          solutionStep = nextStep + 1;
          isReplying = false;
          practiceNotice = 'Your turn to continue.';
          render();
        }, 350);
      }
    } else {
      sessionErrors++;
      practiceNotice = 'Not quite right. Try another move.';
      selectedSq = null;
      render();
    }
  } else {
    const piece = currentChess.get(sq);
    if (piece && piece.color === currentChess.turn()) {
      selectedSq = sq;
    } else {
      selectedSq = null;
    }
    render();
  }
}

function renderPractice() {
  const p = practicePuzzles[puzzleIdx];
  const flip = solverTurn === 'b';
  const ranks = flip ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];
  const files = flip ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h'];

  const legalTargs = selectedSq ? currentChess.moves({ square: selectedSq, verbose: true }).map(m => m.to) : [];

  let boardHtml = '';
  ranks.forEach((r, rIdx) => {
    files.forEach((f, fIdx) => {
      const sq = f + r;
      const isDark = (rIdx + fIdx) % 2 === 1;
      const piece = currentChess.get(sq);
      const isSel = selectedSq === sq;
      const isHint = hintSq === sq;
      const isDot = legalTargs.includes(sq) && !piece;
      const isCap = legalTargs.includes(sq) && piece;

      boardHtml += \`
        <div class="square \${isDark?'dark':'light'} \${isSel?'selected':''} \${isHint?'hint':''}" onclick="handleSquareClick('\${sq}')">
          \${fIdx === 0 ? \`<span class="coord-rank">\${r}</span>\` : ''}
          \${rIdx === 7 ? \`<span class="coord-file">\${f}</span>\` : ''}
          \${piece ? PIECES[piece.type](piece.color) : ''}
          \${isDot ? '<div class="move-dot"></div>' : ''}
          \${isCap ? '<div class="capture-ring"></div>' : ''}
        </div>
      \`;
    });
  });

  return \`
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
      <div>
        <div class="kicker">LICHESS PUZZLE BANK</div>
        <h1 class="hub-title" style="font-size:36px">PUZZLE PRACTICE</h1>
      </div>
      <button class="btn-exit" onclick="showHub()">← Modes</button>
    </div>

    <div class="session-layout">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
          <div style="font-size:24px; font-weight:900; font-family:'Bebas Neue', Impact;">
            \${solverTurn === 'w' ? 'WHITE TO MOVE' : 'BLACK TO MOVE'}
          </div>
          <div class="device-pill">\${puzzleIdx + 1} / \${practicePuzzles.length}</div>
        </div>

        <div class="board-wrapper">
          \${boardHtml}
        </div>

        <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:center">
          <div style="font-size:13px; font-weight:600; color:\${isSolved?'var(--color-lime)':(practiceNotice.includes('Not quite')?'var(--color-red)':'var(--text-secondary)')}">
            \${practiceNotice}
          </div>
          <div style="display:flex; gap:10px">
            <button class="chip" onclick="showHint()">Hint</button>
            <button class="chip" onclick="nextPuzzle()">Skip →</button>
          </div>
        </div>
      </div>

      <div class="card-charcoal" style="gap:20px">
        <div class="kicker">YOUR SESSION</div>
        <div class="stats-row-3">
          <div class="stat-col" style="background:#242424; padding:10px; border-radius:14px; text-align:center">
            <div class="stat-val">∞</div>
            <div class="stat-lbl">Untimed</div>
          </div>
          <div class="stat-col" style="background:#242424; padding:10px; border-radius:14px; text-align:center">
            <div class="stat-val" style="color:var(--color-lime)">\${sessionSolved}</div>
            <div class="stat-lbl">Solved</div>
          </div>
          <div class="stat-col" style="background:#242424; padding:10px; border-radius:14px; text-align:center">
            <div class="stat-val" style="color:var(--color-red)">\${sessionErrors}</div>
            <div class="stat-lbl">Errors</div>
          </div>
        </div>

        <div>
          <h3 style="font-size:20px; color:#FFF; margin-bottom:10px">MIXED TACTICS</h3>
          <div style="display:flex; flex-wrap:wrap; gap:6px">
            \${p.themes.map(t => \`<span class="device-pill" style="padding:4px 10px; font-size:10px">\${t}</span>\`).join('')}
          </div>
        </div>

        <div style="font-size:11px; color:var(--text-secondary); border-top:1px solid #2B2B2B; padding-top:14px">
          <div>Lichess puzzle \${p.id} · Rating \${p.rating}</div>
          <div style="margin-top:4px">150 distinct puzzles. Daily puzzle remains a separate bonus in the app.</div>
        </div>

        <button class="lime-btn" onclick="nextPuzzle()">Next puzzle →</button>
      </div>
    </div>
  \`;
}

// ==========================================
// MATE SPRINT
// ==========================================
function startSprint() {
  currentView = 'sprint';
  sprintIdx = 0;
  sprintScore = 0;
  sprintStrikes = 0;
  sprintTimer = 180;
  loadSprintPuzzle();

  if (sprintInterval) clearInterval(sprintInterval);
  sprintInterval = setInterval(() => {
    sprintTimer--;
    if (sprintTimer <= 0) {
      clearInterval(sprintInterval);
      saveRushScore(sprintScore);
      alert('Time up! Sprint finished: ' + sprintScore + ' solves.');
      showHub();
    } else {
      render();
    }
  }, 1000);

  render();
}

function loadSprintPuzzle() {
  const p = sprintPuzzles[sprintIdx];
  if (!p) {
    clearInterval(sprintInterval);
    saveRushScore(sprintScore);
    alert('Incredible! You cleared all 20 mate-in-one puzzles!');
    showHub();
    return;
  }
  const c = new Chess(p.fen);
  const u0 = p.moves[0];
  c.move({ from: u0.slice(0,2), to: u0.slice(2,4), promotion: u0[4] });
  currentChess = c;
  solverTurn = c.turn();
  selectedSq = null;
}

function handleSprintSquareClick(sq) {
  if (!currentChess) return;

  if (!selectedSq) {
    const piece = currentChess.get(sq);
    if (piece && piece.color === currentChess.turn()) {
      selectedSq = sq;
      render();
    }
    return;
  }

  if (selectedSq === sq) {
    selectedSq = null;
    render();
    return;
  }

  const moves = currentChess.moves({ square: selectedSq, verbose: true });
  const legal = moves.find(m => m.to === sq);

  if (legal) {
    const test = new Chess(currentChess.fen());
    test.move({ from: selectedSq, to: sq, promotion: 'q' });
    if (test.isCheckmate()) {
      sprintScore++;
      sprintIdx++;
      loadSprintPuzzle();
      render();
    } else {
      sprintStrikes++;
      selectedSq = null;
      if (sprintStrikes >= 3) {
        clearInterval(sprintInterval);
        saveRushScore(sprintScore);
        alert('3 Strikes! Sprint complete: ' + sprintScore + ' solves.');
        showHub();
      } else {
        render();
      }
    }
  } else {
    selectedSq = null;
    render();
  }
}

function renderSprint() {
  const p = sprintPuzzles[sprintIdx];
  const flip = solverTurn === 'b';
  const ranks = flip ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];
  const files = flip ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h'];
  const legalTargs = selectedSq ? currentChess.moves({ square: selectedSq, verbose: true }).map(m => m.to) : [];

  let boardHtml = '';
  ranks.forEach((r, rIdx) => {
    files.forEach((f, fIdx) => {
      const sq = f + r;
      const isDark = (rIdx + fIdx) % 2 === 1;
      const piece = currentChess.get(sq);
      const isSel = selectedSq === sq;
      const isDot = legalTargs.includes(sq) && !piece;
      const isCap = legalTargs.includes(sq) && piece;

      boardHtml += \`
        <div class="square \${isDark?'dark':'light'} \${isSel?'selected':''}" onclick="handleSprintSquareClick('\${sq}')">
          \${piece ? PIECES[piece.type](piece.color) : ''}
          \${isDot ? '<div class="move-dot"></div>' : ''}
          \${isCap ? '<div class="capture-ring"></div>' : ''}
        </div>
      \`;
    });
  });

  const mins = Math.floor(sprintTimer / 60);
  const secs = String(sprintTimer % 60).padStart(2, '0');

  return \`
    <div style="max-width:600px; margin:0 auto">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
        <div>
          <div class="kicker">CHESS AGAINST THE CLOCK</div>
          <h1 class="hub-title" style="font-size:36px">MATE SPRINT</h1>
        </div>
        <button class="btn-exit" onclick="showHub()">End Sprint</button>
      </div>

      <div class="stats-row-3" style="margin-bottom:16px">
        <div class="stat-col" style="background:#1A1A1A; padding:12px; border-radius:16px; text-align:center">
          <div class="stat-val" style="color:var(--color-lavender)">\${mins}:\${secs}</div>
          <div class="stat-lbl">Time Left</div>
        </div>
        <div class="stat-col" style="background:#1A1A1A; padding:12px; border-radius:16px; text-align:center">
          <div class="stat-val" style="color:var(--color-lime)">\${sprintScore}</div>
          <div class="stat-lbl">Solved</div>
        </div>
        <div class="stat-col" style="background:#1A1A1A; padding:12px; border-radius:16px; text-align:center">
          <div class="stat-val" style="color:var(--color-red)">\${'●'.repeat(sprintStrikes)}\${'○'.repeat(3 - sprintStrikes)}</div>
          <div class="stat-lbl">Strikes (3 max)</div>
        </div>
      </div>

      <div class="board-wrapper">
        \${boardHtml}
      </div>
    </div>
  \`;
}

// ==========================================
// SPEED DUEL SOLO PRACTICE
// ==========================================
function startSpeedDuel() {
  currentView = 'speed_duel';
  mathPhase = 'setup';
  render();
}

function generateMathQuestion() {
  const ops = ['+', '-', '×', '÷'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let max = mathDifficulty === 'easy' ? 12 : (mathDifficulty === 'medium' ? 30 : 99);
  let a = Math.floor(Math.random() * (max - 2)) + 2;
  let b = Math.floor(Math.random() * (max - 2)) + 2;
  let ans = 0;

  if (op === '+') { ans = a + b; }
  else if (op === '-') { if (a < b) { const t = a; a = b; b = t; } ans = a - b; }
  else if (op === '×') {
    if (mathDifficulty === 'hard') { a = Math.min(a, 25); b = Math.min(b, 12); }
    ans = a * b;
  }
  else if (op === '÷') {
    const divisor = Math.floor(Math.random() * 10) + 2;
    const quotient = Math.floor(Math.random() * 12) + 1;
    a = divisor * quotient;
    b = divisor;
    ans = quotient;
  }

  return { prompt: \`\${a} \${op} \${b} = ?\`, answer: ans };
}

function launchMathCountdown() {
  mathPhase = 'countdown';
  let cnt = 3;
  render();
  const cTimer = setInterval(() => {
    cnt--;
    if (cnt <= 0) {
      clearInterval(cTimer);
      startMathSession();
    } else {
      const el = document.getElementById('cnt-val');
      if (el) el.textContent = cnt;
    }
  }, 750);
}

function startMathSession() {
  mathPhase = 'active';
  mathCorrect = 0;
  mathErrors = 0;
  mathMissed = [];
  mathInput = '';
  mathQuestion = generateMathQuestion();
  mathDeadline = Date.now() + mathDuration * 1000;
  mathTimeLeft = mathDuration;

  if (mathTimerInterval) clearInterval(mathTimerInterval);
  mathTimerInterval = setInterval(() => {
    const leftMs = mathDeadline - Date.now();
    mathTimeLeft = Math.max(0, Math.ceil(leftMs / 1000));
    if (leftMs <= 0) {
      clearInterval(mathTimerInterval);
      mathPhase = 'results';
      saveMathScore(mathCorrect);
    }
    render();
  }, 200);

  render();
}

function handleKeypadDigit(digit) {
  if (mathInput.length < 6) {
    mathInput += digit;
    render();
  }
}

function handleKeypadBackspace() {
  mathInput = mathInput.slice(0, -1);
  render();
}

function handleKeypadClear() {
  mathInput = '';
  render();
}

function submitMathAnswer() {
  if (!mathInput.trim()) return;
  const val = parseInt(mathInput.trim(), 10);
  if (isNaN(val)) return;

  if (mathPhase === 'active') {
    if (val === mathQuestion.answer) {
      mathCorrect++;
    } else {
      mathErrors++;
      mathMissed.push({ prompt: mathQuestion.prompt, entered: mathInput, answer: mathQuestion.answer });
    }
    mathInput = '';
    mathQuestion = generateMathQuestion();
    render();
  } else if (mathPhase === 'retry') {
    const item = retryQueue[retryIdx];
    mathInput = '';
    retryIdx++;
    if (retryIdx >= retryQueue.length) {
      mathPhase = 'results';
    }
    render();
  }
}

function retryMissed() {
  if (mathMissed.length === 0) return;
  retryQueue = [...mathMissed];
  retryIdx = 0;
  mathInput = '';
  mathPhase = 'retry';
  render();
}

// Global keydown handler for math practice
window.addEventListener('keydown', (e) => {
  if (currentView === 'speed_duel' && (mathPhase === 'active' || mathPhase === 'retry')) {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      handleKeypadDigit(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      handleKeypadBackspace();
    } else if (e.key === 'Delete' || e.key.toLowerCase() === 'c') {
      e.preventDefault();
      handleKeypadClear();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submitMathAnswer();
    }
  }
});

function renderSpeedDuel() {
  if (mathPhase === 'setup') {
    return \`
      <div class="speed-duel-container">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <div>
            <div class="kicker">QUICK MATHS · SOLO PRACTICE</div>
            <h1 class="hub-title" style="font-size:36px">SPEED DUEL</h1>
          </div>
          <button class="btn-exit" onclick="showHub()">← Modes</button>
        </div>

        <div class="card-charcoal" style="gap:20px">
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase">Session Duration</label>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-top:8px">
              \${[30, 60, 120].map(d => \`
                <button class="chip \${mathDuration===d?'active':''}" style="padding:12px; font-size:14px" onclick="mathDuration=\${d}; render()">\${d}S</button>
              \`).join('')}
            </div>
          </div>

          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase">Difficulty</label>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-top:8px">
              \${['easy', 'medium', 'hard'].map(l => \`
                <button class="chip \${mathDifficulty===l?'active':''}" style="padding:12px; font-size:14px; text-transform:uppercase" onclick="mathDifficulty='\${l}'; render()">\${l}</button>
              \`).join('')}
            </div>
          </div>

          <button class="lime-btn" style="padding:16px" onclick="launchMathCountdown()">START PRACTICE →</button>
        </div>
      </div>
    \`;
  }

  if (mathPhase === 'countdown') {
    return \`
      <div style="text-align:center; padding:100px 0">
        <div class="kicker">GET READY</div>
        <div id="cnt-val" style="font-family:'Bebas Neue', Impact; font-size:120px; color:var(--color-teal); line-height:1">3</div>
      </div>
    \`;
  }

  if (mathPhase === 'results') {
    const total = mathCorrect + mathErrors;
    const acc = total > 0 ? Math.round((mathCorrect / total) * 100) : 100;

    return \`
      <div class="speed-duel-container">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <div>
            <div class="kicker">PRACTICE COMPLETE</div>
            <h1 class="hub-title" style="font-size:36px">RESULTS</h1>
          </div>
          <button class="btn-exit" onclick="showHub()">← Modes</button>
        </div>

        <div class="stats-row-3">
          <div class="stat-col" style="background:#1A1A1A; padding:12px; border-radius:16px; text-align:center">
            <div class="stat-val" style="color:var(--color-lime)">\${mathCorrect}</div>
            <div class="stat-lbl">Correct</div>
          </div>
          <div class="stat-col" style="background:#1A1A1A; padding:12px; border-radius:16px; text-align:center">
            <div class="stat-val" style="color:var(--color-red)">\${mathErrors}</div>
            <div class="stat-lbl">Errors</div>
          </div>
          <div class="stat-col" style="background:#1A1A1A; padding:12px; border-radius:16px; text-align:center">
            <div class="stat-val">\${acc}%</div>
            <div class="stat-lbl">Accuracy</div>
          </div>
        </div>

        \${mathMissed.length > 0 ? \`
          <div class="card-charcoal" style="gap:12px">
            <div style="display:flex; justify-content:space-between; align-items:center">
              <span style="font-size:12px; font-weight:700; text-transform:uppercase">Review Missed (\${mathMissed.length})</span>
              <button class="chip" style="background:var(--color-teal); color:#000" onclick="retryMissed()">Retry Missed Only ↺</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto">
              \${mathMissed.map(m => \`
                <div style="display:flex; justify-content:space-between; padding:8px 12px; background:#242424; border-radius:10px; font-size:13px">
                  <span>\${m.prompt.replace('= ?','')}</span>
                  <span><s style="color:var(--color-red)">\${m.entered}</s> <b style="color:var(--color-lime); margin-left:8px">= \${m.answer}</b></span>
                </div>
              \`).join('')}
            </div>
          </div>
        \` : \`
          <div class="card-charcoal" style="text-align:center; padding:30px">
            <div style="font-size:32px">🎯</div>
            <h3 style="font-size:20px; color:var(--color-lime)">Flawless Session!</h3>
          </div>
        \`}

        <button class="lime-btn" onclick="startMathSession()">Play Again ↻</button>
      </div>
    \`;
  }

  // Active / Retry keypad screen
  const curPrompt = mathPhase === 'retry' ? retryQueue[retryIdx].prompt : mathQuestion.prompt;

  return \`
    <div class="speed-duel-container">
      <div style="display:flex; justify-content:space-between; align-items:center">
        <div>
          <div class="kicker">QUICK MATHS · SOLO PRACTICE</div>
          <h1 class="hub-title" style="font-size:32px">\${mathPhase==='retry'?'RETRY MISSED':'SPEED DUEL'}</h1>
        </div>
        <button class="btn-exit" onclick="showHub()">← Modes</button>
      </div>

      \${mathPhase === 'active' ? \`
        <div class="stats-row-3">
          <div class="stat-col" style="background:#1A1A1A; padding:10px; border-radius:14px; text-align:center">
            <div class="stat-val">\${mathTimeLeft}S</div>
            <div class="stat-lbl">Remaining</div>
          </div>
          <div class="stat-col" style="background:#1A1A1A; padding:10px; border-radius:14px; text-align:center">
            <div class="stat-val">\${mathCorrect}</div>
            <div class="stat-lbl">Correct</div>
          </div>
          <div class="stat-col" style="background:#1A1A1A; padding:10px; border-radius:14px; text-align:center">
            <div class="stat-val">\${mathErrors}</div>
            <div class="stat-lbl">Errors</div>
          </div>
        </div>
      \` : ''}

      <div class="card-charcoal" style="gap:16px">
        <div style="text-align:center; font-family:'Bebas Neue', Impact; font-size:54px; letter-spacing:2px; padding:12px 0">
          \${curPrompt}
        </div>

        <div style="height:56px; border-radius:14px; background:#111; border:1px solid #333; display:flex; align-items:center; justify-content:center; font-size:32px; font-family:monospace; font-weight:bold; color:var(--color-teal)">
          \${mathInput || '<span style="color:#444">?</span>'}
        </div>

        <div class="keypad-grid">
          \${[1,2,3,4,5,6,7,8,9].map(n => \`
            <button class="key-btn" onclick="handleKeypadDigit('\${n}')">\${n}</button>
          \`).join('')}
          <button class="key-btn" onclick="handleKeypadBackspace()">⌫</button>
          <button class="key-btn" onclick="handleKeypadDigit('0')">0</button>
          <button class="key-btn" onclick="handleKeypadClear()">C</button>
        </div>

        <button class="lime-btn" onclick="submitMathAnswer()">Check answer ↵</button>
        <p style="text-align:center; font-size:11px; color:var(--text-secondary)">Type an answer, then press Enter.</p>
      </div>
    </div>
  \`;
}

// ==========================================
// ROOT RENDERER
// ==========================================
function render() {
  const root = document.getElementById('app-root');
  if (currentView === 'hub') {
    root.innerHTML = renderHub();
  } else if (currentView === 'practice') {
    root.innerHTML = renderPractice();
  } else if (currentView === 'sprint') {
    root.innerHTML = renderSprint();
  } else if (currentView === 'speed_duel') {
    root.innerHTML = renderSpeedDuel();
  }
}

// Initial render
render();
</script>
</body>
</html>
`;

fs.writeFileSync('chaturanga-training-interactive.html', htmlContent, 'utf8');
console.log('Successfully generated chaturanga-training-interactive.html! Size:', htmlContent.length);
