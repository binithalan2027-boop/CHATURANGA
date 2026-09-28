import { Chess } from 'chess.js';
export class StandardChessRuleset {
    variant = 'standard';
    getInitialState(players) {
        const chess = new Chess();
        return {
            version: 0,
            variant: this.variant,
            status: 'playing',
            turn: 'w',
            board: this.extractBoard(chess),
            history: [],
            players,
            fen: chess.fen()
        };
    }
    applyCommand(state, command) {
        if (state.status !== 'playing') {
            return { newState: state, events: [], error: 'Game is over' };
        }
        if (command.playerColor !== state.turn) {
            return { newState: state, events: [], error: 'Not your turn' };
        }
        if (command.type !== 'move') {
            return { newState: state, events: [], error: 'Unsupported command' };
        }
        const moveCmd = command;
        const chess = new Chess(state.fen);
        try {
            const move = chess.move({
                from: moveCmd.from,
                to: moveCmd.to,
                promotion: moveCmd.promotion
            });
            if (!move) {
                return { newState: state, events: [], error: 'Illegal move' };
            }
            const events = [{
                    type: 'move',
                    from: moveCmd.from,
                    to: moveCmd.to,
                    piece: { color: move.color, type: move.piece }
                }];
            if (move.captured) {
                // Find captured color (usually opposite of move.color, but en passant is same)
                // chess.js provides move.color, captured piece is opposite color
                const capturedColor = move.color === 'w' ? 'b' : 'w';
                events.push({
                    type: 'capture',
                    square: move.to, // Not quite exact for en passant, but ok for now
                    captured: { color: capturedColor, type: move.captured }
                });
            }
            let status = state.status;
            let winner = state.winner;
            if (chess.isCheckmate()) {
                status = 'win';
                winner = move.color;
            }
            else if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
                status = 'draw';
                winner = null;
            }
            const newState = {
                ...state,
                version: state.version + 1,
                turn: chess.turn(),
                board: this.extractBoard(chess),
                history: [...state.history, command],
                status,
                winner,
                fen: chess.fen(),
                lastMove: { from: moveCmd.from, to: moveCmd.to, piece: { color: move.color, type: move.piece } }
            };
            return { newState, events };
        }
        catch (e) {
            return { newState: state, events: [], error: 'Illegal move' };
        }
    }
    getPlayerView(state, playerColor) {
        return {
            version: state.version,
            variant: state.variant,
            status: state.status,
            turn: state.turn,
            board: state.board, // Standard chess has full visibility
            myColor: playerColor,
            winner: state.winner,
            lastMove: state.lastMove
        };
    }
    extractBoard(chess) {
        const board = {};
        const chessBoard = chess.board();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = chessBoard[r][c];
                if (piece) {
                    const file = String.fromCharCode('a'.charCodeAt(0) + c);
                    const rank = 8 - r;
                    const square = `${file}${rank}`;
                    board[square] = {
                        color: piece.color,
                        type: piece.type
                    };
                }
            }
        }
        return board;
    }
}
