import { useState, useMemo, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { useStockfish, getBotByElo } from '../ai/useStockfish';
import ChessBoard from '../components/ChessBoard';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export interface GameModeProps {
  onExit: () => void;
  botElo: number;
}

export default function StandardMode({ onExit, botElo }: GameModeProps) {
  const [chess, setChess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]);
  const [winner, setWinner] = useState<'w' | 'b' | null>(null);

  const [perspectiveMode, setPerspectiveMode] = useState<'3d_isometric' | 'top_2d' | 'action_cam' | 'tilt_45'>('3d_isometric');
  const [burstMeter, setBurstMeter] = useState<number>(85);

  const [currentBotElo, setCurrentBotElo] = useState<number>(botElo);
  const { isReady, isThinking, getBestMove, engineError } = useStockfish();
  const currentBot = getBotByElo(currentBotElo);

  const legalMoves = useMemo(() => {
    if (!selectedSquare || winner) return new Set<string>();
    try {
      const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
      return new Set(moves.map((m: Move) => m.to));
    } catch (e) {
      return new Set<string>();
    }
  }, [selectedSquare, fen, chess, winner]);

  const checkSquare = useMemo(() => {
    if (winner) return null;
    try {
      if (!chess.isCheck()) return null;
      const turn = chess.turn();
      const board = chess.board();
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const piece = board[r][f];
          if (piece && piece.type === 'k' && piece.color === turn) {
            return `${FILES[f]}${RANKS[r]}`;
          }
        }
      }
    } catch (e) {}
    return null;
  }, [fen, chess, winner]);

  const materialAdvantage = useMemo(() => {
    const whiteScore = capturedByWhite.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
    const blackScore = capturedByBlack.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
    return whiteScore - blackScore;
  }, [capturedByWhite, capturedByBlack]);

  const recordCapture = (moveResult: any) => {
    if (moveResult.captured) {
      if (moveResult.color === 'w') {
        setCapturedByWhite(prev => [...prev, moveResult.captured]);
      } else {
        setCapturedByBlack(prev => [...prev, moveResult.captured]);
      }
      setBurstMeter(b => Math.min(100, b + 15));
    }
  };

  const handleSquareClick = (sq: string) => {
    if (winner || chess.turn() !== 'w') return;

    if (selectedSquare) {
      if (legalMoves.has(sq)) {
        try {
          const move = chess.move({ from: selectedSquare, to: sq, promotion: 'q' });
          recordCapture(move);
          setFen(chess.fen());
          setLastMove({ from: selectedSquare, to: sq });
          setSelectedSquare(null);

          if (chess.isGameOver()) {
            if (chess.isCheckmate()) setWinner('w');
          }
        } catch (e) {
          setSelectedSquare(null);
        }
      } else {
        const piece = chess.get(sq as Square);
        if (piece && piece.color === 'w') {
          setSelectedSquare(sq);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      const piece = chess.get(sq as Square);
      if (piece && piece.color === 'w') {
        setSelectedSquare(sq);
      }
    }
  };

  useEffect(() => {
    if (winner || chess.turn() === 'w') return;
    let isActive = true;

    const playBotMove = async () => {
      const moveStr = await getBestMove(chess.fen(), currentBot);
      if (!isActive || !moveStr) return;

      try {
        const from = moveStr.slice(0, 2);
        const to = moveStr.slice(2, 4);
        const promotion = moveStr.length > 4 ? moveStr[4] : undefined;

        const move = chess.move({ from, to, promotion });
        recordCapture(move);
        setFen(chess.fen());
        setLastMove({ from, to });

        if (chess.isGameOver()) {
          if (chess.isCheckmate()) setWinner('b');
        }
      } catch (e) {
        console.error("Bot attempted illegal move:", moveStr);
      }
    };
    playBotMove();

    return () => { isActive = false; };
  }, [fen, chess, getBestMove, currentBot, winner]);

  const handleNewGame = () => {
    const newChess = new Chess();
    setChess(newChess);
    setFen(newChess.fen());
    setSelectedSquare(null);
    setLastMove(null);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setWinner(null);
    setBurstMeter(85);
  };

  // Unit inspector info based on selected square
  const selectedPiece = selectedSquare ? chess.get(selectedSquare as Square) : null;

  return (
    <div className="min-h-screen bg-ink-black flex flex-col justify-between p-space-md text-bone-ivory font-body-md select-none">
      
      {/* HEADER MATCH TELEMETRY HUD BAR */}
      <header className="w-full bg-void-surface border border-void-border p-space-sm flex flex-wrap items-center justify-between gap-space-md shadow-xl">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isReady ? (engineError ? 'bg-yellow-400' : (isThinking ? 'bg-orange-500 animate-ping' : 'bg-green-500')) : 'bg-red-500'}`} />
            <span className="font-headline-sm text-sm uppercase tracking-wider text-bone-ivory">RANKED BLITZ 3+2</span>
          </div>
          <span className="text-void-border font-mono text-xs">/</span>
          <span className="font-mono text-xs text-pumpkin-orange font-bold">
            EVAL: {materialAdvantage >= 0 ? `+${materialAdvantage}.0` : `${materialAdvantage}.0`} ADVANTAGE
          </span>
          <span className="px-2 py-0.5 bg-blood-crimson/20 text-blood-crimson border border-blood-crimson/50 font-label-sm text-[10px] uppercase font-bold">
            BOT ELO: {currentBotElo}
          </span>
        </div>

        {/* Viewport Camera Perspective Controls */}
        <div className="flex items-center gap-space-xs bg-ink-black p-1 border border-void-border">
          {[
            { id: '3d_isometric', label: '3D ISOMETRIC' },
            { id: 'top_2d', label: 'TOP 2D' },
            { id: 'action_cam', label: 'ACTION CAM' },
            { id: 'tilt_45', label: 'TILT 45°' },
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setPerspectiveMode(view.id as any)}
              className={`px-2 py-1 font-label-sm text-[10px] uppercase tracking-wider transition-colors ${
                perspectiveMode === view.id
                  ? 'bg-blood-crimson text-bone-ivory font-bold shadow-[0_0_10px_rgba(163,19,43,0.5)]'
                  : 'text-bone-ivory-dim hover:text-bone-ivory'
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-space-md">
          <button onClick={handleNewGame} className="px-3 py-1 bg-surface-container hover:bg-surface-container-high text-xs font-headline-sm uppercase tracking-wider border border-void-border">
            RESTART
          </button>
          <button onClick={onExit} className="px-3 py-1 bg-blood-crimson hover:bg-blood-crimson-bright text-bone-ivory text-xs font-headline-sm uppercase tracking-widest shadow-[0_0_12px_rgba(163,19,43,0.5)]">
            SURRENDER
          </button>
        </div>
      </header>

      {/* MAIN COMBAT COCKPIT (3-COLUMN LAYOUT) */}
      <main className="w-full max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter my-space-md items-start">
        
        {/* COLUMN 1: SOUL DOMINANCE, UNIT INSPECTOR & GRAVEYARD (3 COLS) */}
        <div className="lg:col-span-3 flex flex-col gap-space-md">
          {/* Soul Dominance Bar */}
          <div className="bg-void-surface border border-void-border p-space-md flex flex-col gap-space-xs shadow-md">
            <div className="flex items-center justify-between font-label-sm text-xs">
              <span className="text-bone-ivory font-bold uppercase tracking-wider">SOUL DOMINANCE</span>
              <span className="text-pumpkin-orange font-mono font-bold">+1.4 CP</span>
            </div>
            <div className="w-full h-2.5 bg-ink-black border border-void-border flex overflow-hidden">
              <div className="h-full bg-blood-crimson" style={{ width: '58%' }} />
              <div className="h-full bg-cursed-violet" style={{ width: '42%' }} />
            </div>
            <div className="flex items-center justify-between font-mono text-[10px] text-bone-ivory-dim">
              <span>CARNIVAL (58%)</span>
              <span>SWARM (42%)</span>
            </div>
          </div>

          {/* Selected Unit Inspection Box */}
          <div className="bg-void-surface border border-void-border p-space-md flex flex-col gap-space-sm shadow-md">
            <div className="flex items-center justify-between border-b border-void-border pb-space-xs">
              <span className="font-headline-sm text-xs uppercase tracking-wider text-bone-ivory flex items-center gap-1">
                <span className="w-2 h-2 bg-blood-crimson" />
                SELECTED UNIT
              </span>
              <span className="font-mono text-[10px] text-pumpkin-orange">{selectedSquare || 'SQUARE F7'}</span>
            </div>

            <div className="flex items-center gap-space-md">
              <div className="w-14 h-14 bg-ink-black border border-blood-crimson flex items-center justify-center text-3xl shadow-md">
                {selectedPiece ? selectedPiece.type.toUpperCase() : '🕷️'}
              </div>
              <div className="flex flex-col">
                <span className="font-headline-md text-sm text-bone-ivory uppercase">
                  {selectedPiece ? `${selectedPiece.color === 'w' ? 'CARNIVAL' : 'SWARM'} ${selectedPiece.type.toUpperCase()}` : 'BONE SPIDER'}
                </span>
                <span className="font-label-sm text-[10px] text-blood-crimson font-bold uppercase">KNIGHT // INFILTRATOR</span>
                <span className="font-mono text-[10px] text-bone-ivory-dim mt-0.5">HP: 420 / 500</span>
              </div>
            </div>

            <div className="bg-ink-black border border-void-border p-space-xs flex flex-col gap-1 text-[11px]">
              <span className="font-headline-sm text-pumpkin-orange uppercase">SIGNATURE SKILL: ABYSSAL LEAP</span>
              <p className="font-body-sm text-bone-ivory-dim text-[10px] leading-tight">
                Jumps intervening pawns while seeding necrotic web strands across d7 and f7 tiles. Restricts target bishop traversal.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-space-xs font-mono text-[9px]">
              <div className="bg-ink-black p-1 border border-void-border text-center text-bone-ivory-dim">
                ARMOR: <strong className="text-bone-ivory">CHITIN BONE</strong>
              </div>
              <div className="bg-ink-black p-1 border border-void-border text-center text-bone-ivory-dim">
                AURA: <strong className="text-cursed-violet-bright">VOID ROT</strong>
              </div>
            </div>
          </div>

          {/* Soul Graveyard */}
          <div className="bg-void-surface border border-void-border p-space-md flex flex-col gap-space-xs shadow-md">
            <div className="flex items-center justify-between border-b border-void-border pb-space-xs">
              <span className="font-headline-sm text-xs uppercase tracking-wider text-bone-ivory">SOUL GRAVEYARD</span>
              <span className="font-mono text-[10px] text-blood-crimson font-bold">11 PIECES SLAIN</span>
            </div>

            <div className="flex flex-col gap-2 mt-1 font-mono text-xs">
              <div>
                <span className="text-[10px] text-bone-ivory-dim uppercase block">CARNIVAL SACRIFICES:</span>
                <div className="flex flex-wrap gap-1 text-blood-crimson">
                  {capturedByWhite.map((p, i) => <span key={i} className="px-1 bg-ink-black border border-void-border">{p.toUpperCase()}</span>)}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-bone-ivory-dim uppercase block">SWARM BIOMASS CONSUMED:</span>
                <div className="flex flex-wrap gap-1 text-cursed-violet-bright">
                  {capturedByBlack.map((p, i) => <span key={i} className="px-1 bg-ink-black border border-void-border">{p.toUpperCase()}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: 3D VOLUMETRIC CHESS ARENA (6 COLS) */}
        <div className="lg:col-span-6 flex flex-col gap-space-md items-center relative">
          
          {/* Header Status Indicator */}
          <div className="w-full bg-void-surface border border-void-border px-space-md py-space-xs flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blood-crimson animate-ping" />
              <span className="font-mono text-xs text-bone-ivory font-bold">TACTICAL MATRIX 8X8 // TICK #{chess.history().length}</span>
            </div>
            <span className="font-mono text-xs text-red-400 font-bold uppercase">PUPPET THREAT DETECTED</span>
          </div>

          {/* Volumetric 3D Board Viewport */}
          <div className="relative w-full flex items-center justify-center">
            <ChessBoard
              board={chess.board()}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              lastMove={lastMove}
              checkSquare={checkSquare}
              onSquareClick={handleSquareClick}
              perspectiveMode={perspectiveMode}
            />

            {/* Anime Finisher Combo Ready Badge */}
            <div className="absolute bottom-4 right-4 bg-ink-black/90 border-2 border-blood-crimson px-space-md py-2 shadow-[0_0_20px_rgba(163,19,43,0.8)] animate-pulse flex items-center gap-2">
              <span className="material-symbols-outlined text-blood-crimson text-[20px]">bolt</span>
              <span className="font-display-sm text-sm uppercase tracking-widest text-bone-ivory">ANIME FINISHER COMBO READY</span>
            </div>

            {winner && (
              <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-md animate-fadeIn">
                <h2 className="font-display-xl text-6xl text-blood-crimson uppercase tracking-tighter mb-4 animate-pulse drop-shadow-[0_0_30px_rgba(163,19,43,1)]">
                  {winner === 'w' ? 'VICTORY SECURED' : 'SOUL CLAIMED'}
                </h2>
                <button 
                  onClick={handleNewGame} 
                  className="px-8 py-3 bg-bone-ivory text-void-black font-display-sm text-lg uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                >
                  RE-ENTER VOID ARENA
                </button>
              </div>
            )}
          </div>

          {/* Action Control Buttons */}
          <div className="w-full grid grid-cols-2 gap-space-sm mt-space-xs">
            <button 
              disabled={!selectedSquare}
              className="py-3 bg-blood-crimson disabled:opacity-40 hover:bg-blood-crimson-bright text-bone-ivory font-display-sm text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(163,19,43,0.5)] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">swords</span>
              EXECUTE MOVE (ENTER)
            </button>
            <button 
              onClick={() => chess.undo() && setFen(chess.fen())}
              className="py-3 bg-surface-container hover:bg-surface-container-high border border-void-border text-bone-ivory font-headline-sm text-xs uppercase tracking-wider"
            >
              REQUEST TAKEBACK
            </button>
          </div>
        </div>

        {/* COLUMN 3: ANIME BURST METER & BATTLE CHRONICLE (3 COLS) */}
        <div className="lg:col-span-3 flex flex-col gap-space-md">
          {/* Anime Burst Meter */}
          <div className="bg-void-surface border border-void-border p-space-md flex flex-col gap-space-sm shadow-md">
            <div className="flex items-center justify-between font-label-sm text-xs">
              <span className="text-bone-ivory font-bold uppercase tracking-wider">ANIME BURST METER</span>
              <span className="text-blood-crimson font-mono font-bold">{burstMeter}% FULL</span>
            </div>

            <div className="w-full h-3 bg-ink-black border border-void-border overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-blood-crimson via-pumpkin-orange to-red-500 animate-pulse transition-all duration-300"
                style={{ width: `${burstMeter}%` }}
              />
            </div>

            <button className="w-full py-2.5 bg-blood-crimson hover:bg-blood-crimson-bright text-bone-ivory font-display-sm text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(163,19,43,0.6)] flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
              UNLEASH VOID RIFT (BURST)
            </button>
          </div>

          {/* Battle Chronicle Move Log */}
          <div className="bg-void-surface border border-void-border p-space-md flex flex-col gap-space-xs shadow-md">
            <div className="flex items-center justify-between border-b border-void-border pb-space-xs">
              <span className="font-headline-sm text-xs uppercase tracking-wider text-bone-ivory">BATTLE CHRONICLE</span>
              <span className="font-mono text-[10px] text-bone-ivory-dim">{chess.history().length} TURNS LOGGED</span>
            </div>

            <div className="bg-ink-black border border-void-border p-space-xs h-64 overflow-y-auto flex flex-col gap-1.5 font-mono text-[11px]">
              {chess.history({ verbose: true }).map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-1 bg-void-surface border-b border-void-border/40">
                  <span className="text-pumpkin-orange font-bold">{idx + 1}. {m.san}</span>
                  <span className="text-[9px] text-blood-crimson font-bold uppercase">
                    {m.captured ? 'CRITICAL HIT' : 'TACTICAL STRIKE'}
                  </span>
                </div>
              ))}
              {chess.history().length === 0 && (
                <span className="text-bone-ivory-dim italic text-[10px] p-2 text-center">
                  Awaiting initial move sequence...
                </span>
              )}
            </div>
          </div>

          {/* Spectator Telemetry */}
          <div className="bg-void-surface border border-void-border p-space-sm flex items-center justify-between font-mono text-[10px] text-bone-ivory-dim shadow-md">
            <span>🎶 SFX: ANIME ORCHESTRA</span>
            <span className="text-green-400 font-bold">👁️ 3,194 WATCHING</span>
          </div>
        </div>

      </main>

      {/* FACTION ARSENAL // 3D FIGURINE INSPECTION REPERTOIRE SECTION */}
      <section className="w-full max-w-[1440px] mx-auto px-margin py-space-lg border-t border-void-border mt-space-md">
        <div className="flex items-center justify-between mb-space-md">
          <div>
            <span className="font-label-sm text-xs text-blood-crimson uppercase tracking-wider font-bold">FACTION ARSENAL // 3D FIGURINE INSPECTION</span>
            <h2 className="font-display-lg text-display-lg text-bone-ivory uppercase tracking-tight">THE CURSED REPERTOIRE</h2>
          </div>
          <p className="font-body-sm text-xs text-bone-ivory-dim max-w-md text-right">
            Select a miniature archetype to rotate viewport, inspect hand-sculpted porcelain and chitin materials, and calibrate unique anime execution triggers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {[
            {
              name: 'HARLEQUIN SLAUGHTERER',
              role: 'QUEEN',
              archetype: 'EXECUTION ASSASSIN',
              desc: 'Forged in cursed porcelain and blood-dyed silks. Whenever capturing enemy heavy pieces, gains an instantaneous 1-tile intimidation aura that freezes adjacent enemy rooks.',
              move: 'GRIM FORK (+1200)',
              texture: 'CRACKED ENAMEL',
              avatar: '🎭',
              tier: 'TIER I: ELDRITCH'
            },
            {
              name: 'SKULLCARVE ARACHNID',
              role: 'KNIGHT',
              archetype: 'INFILTRATOR',
              desc: 'Assembled from ancestral grave bones and venomous silk. Leaps over closed pawn chains and anchors an invisible thread on the target square to enable retroactive retreats.',
              move: 'ABYSSAL TRAP',
              texture: 'CALCIFIED CHITIN',
              avatar: '🕷️',
              tier: 'TIER I: NIGHTMARE'
            },
            {
              name: 'PUMPKIN PYROMANCER',
              role: 'BISHOP',
              archetype: 'SPELLCASTER',
              desc: 'Infused with burning witch embers and void embers. Fires piercing psychic flame along diagonal lanes, igniting scorched ground that chips 50 HP per turn on any occupying unit.',
              move: 'SOUL PYRE BEAM',
              texture: 'CARVED GOURD ASH',
              avatar: '🎃',
              tier: 'TIER I: OCCULT'
            }
          ].map((fig, i) => (
            <div key={i} className="bg-void-surface border border-void-border p-space-md flex flex-col gap-space-sm relative group hover:border-blood-crimson transition-all shadow-lg">
              <div className="flex items-center justify-between font-label-sm text-[10px]">
                <span className="text-blood-crimson font-bold">{fig.tier}</span>
                <span className="material-symbols-outlined text-bone-ivory-dim group-hover:text-bone-ivory">3d_rotation</span>
              </div>

              {/* 3D Figurine Canvas Placeholder */}
              <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-ink-black to-void-surface border border-void-border flex items-center justify-center overflow-hidden">
                <span className="text-6xl filter drop-shadow-[0_0_20px_rgba(163,19,43,0.7)] group-hover:scale-110 transition-transform">
                  {fig.avatar}
                </span>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-ink-black/90 font-mono text-[9px] text-bone-ivory-dim">
                  DIAGONAL &amp; ORTHOGONAL
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-md text-sm text-bone-ivory uppercase">{fig.name}</h3>
                  <span className="font-label-sm text-xs text-blood-crimson font-bold">{fig.role}</span>
                </div>
                <span className="font-label-sm text-[9px] text-pumpkin-orange font-bold uppercase block mt-0.5">ARCHETYPE: {fig.archetype}</span>
                <p className="font-body-sm text-[11px] text-bone-ivory-dim mt-2 leading-relaxed">{fig.desc}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[9px] border-t border-void-border pt-space-xs mt-auto">
                <div>
                  <span className="text-bone-ivory-dim block">TEXTURE</span>
                  <span className="text-bone-ivory font-bold">{fig.texture}</span>
                </div>
                <div>
                  <span className="text-bone-ivory-dim block">SPECIAL MOVE</span>
                  <span className="text-pumpkin-orange font-bold">{fig.move}</span>
                </div>
              </div>

              <button className="w-full mt-space-xs py-2 bg-ink-black hover:bg-blood-crimson text-bone-ivory font-headline-sm text-xs uppercase tracking-wider border border-void-border transition-colors">
                SELECT SKILL DECK
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER SYSTEM TELEMETRY & ELO TUNER */}
      <footer className="w-full bg-ink-black border-t border-void-border px-margin py-space-xs font-mono text-[10px] text-bone-ivory-dim flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4 bg-void-surface px-space-md py-1 border border-void-border">
          <span className="uppercase text-pumpkin-orange font-bold">STOCKFISH NEURAL ELO TUNER: {currentBotElo} ELO</span>
          <input
            type="range"
            min="450"
            max="3200"
            value={currentBotElo}
            onChange={(e) => setCurrentBotElo(Number(e.target.value))}
            className="w-64 h-1 bg-surface-container appearance-none cursor-pointer accent-blood-crimson"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-space-md">
          <div>STOCKFISH 16.1 HORROR ENGINE // DEPTH 28 PLY // 4.8M NODES/S // LATENCY 14MS</div>
          <div>SPECTATOR CHAT: 382 MSGS/MIN • HUD SETTINGS • PGN EXPORT</div>
          <div className="text-green-400">[GRID STATUS: OPTIMAL]</div>
        </div>
      </footer>
    </div>
  );
}
