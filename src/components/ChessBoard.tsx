const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const PIECE_IMAGES: Record<string, string> = {
  'w-k': '/pieces/wK.svg', 'w-q': '/pieces/wQ.svg', 'w-r': '/pieces/wR.svg',
  'w-b': '/pieces/wB.svg', 'w-n': '/pieces/wN.svg', 'w-p': '/pieces/wP.svg',
  'b-k': '/pieces/bK.svg', 'b-q': '/pieces/bQ.svg', 'b-r': '/pieces/bR.svg',
  'b-b': '/pieces/bB.svg', 'b-n': '/pieces/bN.svg', 'b-p': '/pieces/bP.svg',
};

export interface ChessBoardProps {
  board: ({ type: string; color: string } | null)[][];
  selectedSquare: string | null;
  legalMoves: Set<string>;
  lastMove: { from: string; to: string } | null;
  checkSquare: string | null;
  visibleSquares?: Set<string> | null; 
  explodingSquares?: Set<string> | null;
  onSquareClick: (sq: string) => void;
  customSquareStyles?: Record<string, string>;
  isFlipped?: boolean;
  perspectiveMode?: '3d_isometric' | 'top_2d' | 'action_cam' | 'tilt_45';
}

export default function ChessBoard({
  board,
  selectedSquare,
  legalMoves,
  lastMove,
  checkSquare,
  visibleSquares,
  explodingSquares,
  onSquareClick,
  customSquareStyles = {},
  isFlipped = false,
  perspectiveMode = '3d_isometric'
}: ChessBoardProps) {
  const ranks = isFlipped ? [...RANKS].reverse() : RANKS;
  const files = isFlipped ? [...FILES].reverse() : FILES;

  let transformStyle = '';
  if (perspectiveMode === '3d_isometric') {
    transformStyle = 'rotateX(32deg) rotateZ(-18deg) scale(0.92)';
  } else if (perspectiveMode === 'tilt_45') {
    transformStyle = 'rotateX(45deg) scale(0.95)';
  } else if (perspectiveMode === 'action_cam') {
    transformStyle = 'rotateX(20deg) rotateZ(-10deg) scale(1.02)';
  }

  return (
    <div className="w-full flex items-center justify-center p-2 perspective-[1200px]">
      <div 
        className="aspect-square w-full max-w-[580px] border-4 border-void-border bg-ink-black shadow-[0_20px_50px_rgba(9,9,13,0.9)] rounded grid grid-cols-8 grid-rows-8 overflow-hidden transition-transform duration-500 ease-out"
        style={{ transform: transformStyle, transformStyle: 'preserve-3d' }}
      >
        {ranks.map((rank, r) => {
          const boardR = isFlipped ? 7 - r : r;
          return files.map((file, f) => {
            const boardF = isFlipped ? 7 - f : f;
            const sq = `${file}${rank}`;
            const isLight = (boardR + boardF) % 2 === 0;
            const piece = board[boardR][boardF];
            
            const isSelected = selectedSquare === sq;
            const isLegal = legalMoves.has(sq);
            const isLastMove = lastMove?.from === sq || lastMove?.to === sq;
            const inCheck = checkSquare === sq;
            
            const isVisible = visibleSquares ? visibleSquares.has(sq) : true;
            const isExploding = explodingSquares ? explodingSquares.has(sq) : false;

            let bgClass = isLight ? 'bg-[#2a2430]' : 'bg-[#151219]';
            if (isSelected) bgClass = 'bg-blood-crimson/70 shadow-[inset_0_0_15px_rgba(255,0,0,0.8)]';
            else if (inCheck) bgClass = 'bg-blood-crimson animate-pulse shadow-[inset_0_0_20px_rgba(255,0,0,1)]';
            else if (isLastMove) bgClass = 'bg-cursed-violet/60';
            
            if (isExploding) bgClass = 'bg-pumpkin-orange animate-ping';
            if (customSquareStyles[sq]) bgClass = customSquareStyles[sq];

            return (
              <div
                key={sq}
                className={`relative flex items-center justify-center cursor-pointer border border-void-border/30 transition-colors group ${bgClass}`}
                onClick={() => isVisible && onSquareClick(sq)}
              >
                {/* Fog of war overlay */}
                {!isVisible && (
                  <div className="absolute inset-0 bg-ink-black z-10 pointer-events-none" />
                )}
                
                {/* Legal move indicator */}
                {isLegal && isVisible && (
                  <div className={`absolute z-10 rounded-full bg-blood-crimson/50 pointer-events-none ${piece ? 'w-full h-full border-2 border-blood-crimson bg-transparent animate-pulse' : 'w-3 h-3 bg-blood-crimson shadow-[0_0_8px_rgba(163,19,43,0.9)]'}`} />
                )}

                {/* Target reticle on selected square */}
                {isSelected && (
                  <div className="absolute inset-0 border-2 border-blood-crimson z-20 pointer-events-none animate-pulse flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-blood-crimson rounded-full" />
                  </div>
                )}
                
                {/* Coordinates */}
                {f === 0 && <span className="absolute top-0.5 left-1 text-[9px] font-mono font-bold text-bone-ivory-muted pointer-events-none select-none">{rank}</span>}
                {r === 7 && <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold text-bone-ivory-muted pointer-events-none select-none">{file}</span>}
                
                {/* Piece image with 3D drop shadow */}
                {piece && isVisible && (
                  <img
                    src={PIECE_IMAGES[`${piece.color}-${piece.type}`]}
                    alt={`${piece.color} ${piece.type}`}
                    className="w-[85%] h-[85%] drop-shadow-[0_8px_10px_rgba(0,0,0,0.85)] group-hover:scale-110 transition-transform pointer-events-none select-none"
                    draggable={false}
                  />
                )}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
