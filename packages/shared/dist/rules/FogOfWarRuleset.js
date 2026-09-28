import { StandardChessRuleset } from './StandardChessRuleset.js';
import { Chess } from 'chess.js';
export class FogOfWarRuleset {
    baseRules = new StandardChessRuleset();
    getInitialState(players) {
        const state = this.baseRules.getInitialState(players);
        state.variant = 'fog-of-war';
        return state;
    }
    applyCommand(state, cmd) {
        // In Fog of War, you can attempt to move into an unseen square.
        // If it's occupied by a piece of your own, or a move is completely illegal physically, it fails.
        // If you try to move a sliding piece (Rook) through an unseen enemy, it gets blocked and captures that enemy instead!
        // For this MVP, we will stick to the basic rule: Standard chess moves apply. 
        // If you attempt a move that is illegal in the underlying chess engine, we just return generic "Move blocked".
        const result = this.baseRules.applyCommand(state, cmd);
        if (result.error) {
            return { newState: state, error: 'Move blocked or illegal.' }; // Vague error prevents deduction
        }
        // In Fog of War, game ends strictly on King capture.
        // However, `chess.js` doesn't allow King captures natively. 
        // To allow King captures, we would need to run chess.js without King safety checks.
        // Since chess.js strictly enforces King safety, we will consider the game over 
        // if a player is in checkmate OR if they resign.
        // For MVP, we'll let chess.js handle check/mate standardly.
        return result;
    }
    getPlayerView(state, playerColor) {
        const chess = new Chess(state.fen);
        const viewBoard = {};
        const visibleSquares = new Set();
        const board = chess.board();
        // 1. Calculate visibility
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (!piece)
                    continue;
                const sq = `${String.fromCharCode(97 + c)}${8 - r}`;
                if (piece.color === playerColor) {
                    // You see your own pieces
                    visibleSquares.add(sq);
                    viewBoard[sq] = { type: piece.type, color: piece.color };
                    // You see all squares this piece can legally move to
                    // Wait, chess.moves({ square }) only gives legal moves (respecting check).
                    // For Dark Chess, you see pseudo-legal moves too (if pinned, you still see where the piece *could* move).
                    // But for MVP, `chess.moves` is highly accurate and easiest.
                    const moves = chess.moves({ square: sq, verbose: true });
                    for (const move of moves) {
                        visibleSquares.add(move.to);
                    }
                    // Pawns see their diagonal capture squares even if empty
                    if (piece.type === 'p') {
                        const dir = playerColor === 'w' ? 1 : -1;
                        const rankObj = 8 - r + dir;
                        if (rankObj >= 1 && rankObj <= 8) {
                            if (c > 0)
                                visibleSquares.add(`${String.fromCharCode(97 + c - 1)}${rankObj}`);
                            if (c < 7)
                                visibleSquares.add(`${String.fromCharCode(97 + c + 1)}${rankObj}`);
                        }
                    }
                }
            }
        }
        // 2. Populate the visible board with actual pieces
        for (const sq of visibleSquares) {
            // Find row/col
            const c = sq.charCodeAt(0) - 97;
            const r = 8 - parseInt(sq[1], 10);
            const piece = board[r][c];
            if (piece) {
                viewBoard[sq] = { type: piece.type, color: piece.color };
            }
            else {
                viewBoard[sq] = null; // explicitly visible but empty
            }
        }
        return {
            version: state.version,
            variant: state.variant,
            status: state.status,
            turn: state.turn,
            winner: state.winner,
            board: viewBoard, // only contains keys for visible squares
        };
    }
}
