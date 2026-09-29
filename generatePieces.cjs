const fs = require('fs');
const path = require('path');

const dir = 'public/pieces';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Highly stylized Anime/Horror Chess SVG Paths
const pieces = {
  P: `<path d="M50 20 C60 20 65 30 65 40 C65 55 55 60 50 80 C45 60 35 55 35 40 C35 30 40 20 50 20 Z M45 35 A5 5 0 1 0 55 35 A5 5 0 1 0 45 35" fill="currentColor"/>`,
  N: `<path d="M30 80 L40 40 L20 20 L50 10 L80 30 L60 50 L70 80 Z" fill="currentColor"/><circle cx="65" cy="35" r="3" fill="#000"/>`,
  B: `<path d="M50 10 L65 40 L70 80 L30 80 L35 40 Z M50 25 L50 50 M40 35 L60 35" stroke="currentColor" stroke-width="4" fill="none"/><circle cx="50" cy="50" r="5" fill="currentColor"/>`,
  R: `<path d="M25 20 L35 20 L35 35 L50 25 L65 35 L65 20 L75 20 L75 80 L25 80 Z" fill="currentColor"/><path d="M40 50 L60 50" stroke="#000" stroke-width="3"/>`,
  Q: `<path d="M10 20 L30 40 L50 10 L70 40 L90 20 L75 80 L25 80 Z" fill="currentColor"/><circle cx="50" cy="25" r="4" fill="#000"/><circle cx="30" cy="35" r="3" fill="#000"/><circle cx="70" cy="35" r="3" fill="#000"/>`,
  K: `<path d="M45 10 L55 10 L55 20 L65 20 L65 30 L55 30 L55 45 L75 35 L80 80 L20 80 L25 35 L45 45 L45 30 L35 30 L35 20 L45 20 Z" fill="currentColor"/>`
};

const colors = {
  w: '#E8DDC8', // Bone Ivory
  b: '#FF1E44'  // Crimson Glow
};

Object.keys(colors).forEach(c => {
  Object.keys(pieces).forEach(p => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g style="color: ${colors[c]}; filter: url(#glow); drop-shadow: 0px 8px 12px rgba(0,0,0,0.8);">
        ${pieces[p]}
      </g>
    </svg>`;
    fs.writeFileSync(path.join(dir, `${c}${p}.svg`), svg);
  });
});
console.log('Custom SVG pieces generated.');
