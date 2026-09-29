
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
  isFlipped = false
}: ChessBoardProps) {
  const ranks = isFlipped ? [...RANKS].reverse() : RANKS;
  const files = isFlipped ? [...FILES].reverse() : FILES;

  return (
    <div className="aspect-square w-full max-w-[600px] border-4 border-surface-container-highest shadow-[0_0_40px_rgba(163,19,43,0.3)] rounded grid grid-cols-8 grid-rows-8 overflow-hidden">
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

          let bgClass = isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]';
          if (isSelected) bgClass = 'bg-tertiary-container/80';
          else if (inCheck) bgClass = 'bg-crimson-glow/80 animate-pulse';
          else if (isLastMove) bgClass = 'bg-secondary-container/60';
          
          if (isExploding) bgClass = 'bg-orange-500 animate-ping';
          if (customSquareStyles[sq]) bgClass = customSquareStyles[sq];

          return (
            <div
              key={sq}
              className={`relative flex items-center justify-center cursor-pointer transition-colors ${bgClass}`}
              onClick={() => isVisible && onSquareClick(sq)}
            >
              {/* Fog of war overlay */}
              {!isVisible && (
                <div className="absolute inset-0 bg-void-black z-10 pointer-events-none" />
              )}
              
              {/* Legal move indicator */}
              {isLegal && isVisible && (
                <div className={`absolute z-10 rounded-full bg-black/20 pointer-events-none ${piece ? 'w-full h-full border-4 border-black/20 bg-transparent' : 'w-1/3 h-1/3'}`} />
              )}
              
              {/* Rank/File coordinates */}
              {f === 0 && <span className="absolute top-1 left-1 text-[10px] font-bold text-black/40 pointer-events-none select-none">{rank}</span>}
              {r === 7 && <span className="absolute bottom-1 right-1 text-[10px] font-bold text-black/40 pointer-events-none select-none">{file}</span>}
              
              {/* Piece image */}
              {piece && isVisible && (
                <img
                  src={PIECE_IMAGES[`${piece.color}-${piece.type}`]}
                  alt={`${piece.color} ${piece.type}`}
                  className="w-[85%] h-[85%] drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] pointer-events-none select-none"
                  draggable={false}
                />
              )}
            </div>
          );
        });
      })}
    </div>
  );
}
