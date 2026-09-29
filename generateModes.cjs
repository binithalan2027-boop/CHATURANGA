const fs = require('fs');
const standard = fs.readFileSync('src/modes/StandardMode.tsx', 'utf8');

// FOG MODE
let fog = standard.replace(/StandardMode/g, 'FogMode').replace('Ranked Classic', 'Stealth Ambush (Fog of War)');
fog = fog.replace(/const legalMoves = useMemo/g, `
  const visibleSquares = useMemo(() => {
    const visible = new Set<string>();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = board[r][f];
        if (piece && piece.color === 'w') {
          const sq = \`\${FILES[f]}\${RANKS[r]}\`;
          visible.add(sq);
          try {
            const moves = chess.moves({ square: sq as Square, verbose: true });
            moves.forEach(m => visible.add(m.to));
          } catch(e) {}
        }
      }
    }
    return visible;
  }, [fen, chess]);

  const legalMoves = useMemo`);
fog = fog.replace(/<ChessBoard/g, '<ChessBoard visibleSquares={visibleSquares} ');
fs.writeFileSync('src/modes/FogMode.tsx', fog);

// ATOMIC MODE
let atomic = standard.replace(/StandardMode/g, 'AtomicMode').replace('Ranked Classic', 'Cursed Blast (Atomic)');
atomic = atomic.replace(/const recordCapture =.*?}/s, `
  const [explodingSquares, setExplodingSquares] = useState<Set<string>>(new Set());

  const applyAtomicExplosion = (sq: string) => {
    const file = FILES.indexOf(sq[0]);
    const rank = RANKS.indexOf(sq[1]);
    const radius = [-1, 0, 1];
    const destroyed = new Set<string>();
    destroyed.add(sq);
    
    radius.forEach(dr => {
      radius.forEach(df => {
        const r = rank + dr;
        const f = file + df;
        if (r >= 0 && r < 8 && f >= 0 && f < 8) {
          const targetSq = \`\${FILES[f]}\${RANKS[r]}\`;
          const piece = chess.get(targetSq as Square);
          if (piece && piece.type !== 'p') {
            destroyed.add(targetSq);
          }
        }
      });
    });

    destroyed.forEach(s => {
      const piece = chess.get(s as Square);
      if (piece && piece.type === 'k') {
        setWinner(piece.color === 'w' ? 'b' : 'w');
      }
      chess.remove(s as Square);
    });

    setExplodingSquares(destroyed);
    setTimeout(() => setExplodingSquares(new Set()), 500);
  };

  const recordCapture = (moveResult: any) => {
    if (moveResult.captured) {
      if (moveResult.color === 'w') setCapturedByWhite(prev => [...prev, moveResult.captured]);
      else setCapturedByBlack(prev => [...prev, moveResult.captured]);
      applyAtomicExplosion(moveResult.to);
    }
  };`);
atomic = atomic.replace(/<ChessBoard/g, '<ChessBoard explodingSquares={explodingSquares} ');
fs.writeFileSync('src/modes/AtomicMode.tsx', atomic);

// CHESS960 MODE
let c960 = standard.replace(/StandardMode/g, 'Chess960Mode').replace('Ranked Classic', 'Fischer Chaos (Chess960)');
c960 = c960.replace(/export default function Chess960Mode/g, `
function generateChess960Fen() {
  const pieces = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  const rank = pieces.join('');
  return \`\${rank.toLowerCase()}/pppppppp/8/8/8/8/PPPPPPPP/\${rank.toUpperCase()} w KQkq - 0 1\`;
}

export default function Chess960Mode`);
c960 = c960.replace(/new Chess\(\)/g, 'new Chess(generateChess960Fen())');
fs.writeFileSync('src/modes/Chess960Mode.tsx', c960);
