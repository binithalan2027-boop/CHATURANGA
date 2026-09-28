import { describe, it, expect } from 'vitest';
import { StandardChessRuleset } from './StandardChessRuleset.js';
import { Chess } from 'chess.js';
describe('StandardChessRuleset Baseline', () => {
    const rules = new StandardChessRuleset();
    const players = { w: 'player1', b: 'player2' };
    it('initializes correctly', () => {
        const state = rules.getInitialState(players);
        expect(state.status).toBe('playing');
        expect(state.turn).toBe('w');
        expect(state.board['e2'].type).toBe('p');
        expect(state.board['e2'].color).toBe('w');
    });
    it('rejects out of turn moves', () => {
        const state = rules.getInitialState(players);
        const cmd = { type: 'move', playerColor: 'b', from: 'e7', to: 'e5', version: 0 };
        const result = rules.applyCommand(state, cmd);
        expect(result.error).toBe('Not your turn');
    });
    it('rejects illegal moves', () => {
        const state = rules.getInitialState(players);
        const cmd = { type: 'move', playerColor: 'w', from: 'e2', to: 'e5', version: 0 };
        const result = rules.applyCommand(state, cmd);
        expect(result.error).toBe('Illegal move');
    });
    it('applies legal moves and toggles turn', () => {
        let state = rules.getInitialState(players);
        const cmd1 = { type: 'move', playerColor: 'w', from: 'e2', to: 'e4', version: 0 };
        let result = rules.applyCommand(state, cmd1);
        expect(result.error).toBeUndefined();
        state = result.newState;
        expect(state.turn).toBe('b');
        expect(state.board['e4'].type).toBe('p');
        expect(state.board['e2']).toBeUndefined();
        const cmd2 = { type: 'move', playerColor: 'b', from: 'e7', to: 'e5', version: 1 };
        result = rules.applyCommand(state, cmd2);
        expect(result.error).toBeUndefined();
        expect(result.newState.turn).toBe('w');
    });
    // Perft Test function using standard chess logic
    function perft(chess, depth) {
        if (depth === 0)
            return 1;
        const moves = chess.moves();
        let nodes = 0;
        for (const move of moves) {
            chess.move(move);
            nodes += perft(chess, depth - 1);
            chess.undo();
        }
        return nodes;
    }
    it('Perft Depth 1-3 for standard chess baseline', () => {
        const chess = new Chess();
        // Depth 1: 20
        expect(perft(chess, 1)).toBe(20);
        // Depth 2: 400
        expect(perft(chess, 2)).toBe(400);
        // Depth 3: 8902
        expect(perft(chess, 3)).toBe(8902);
    });
    it('Handles castling correctly', () => {
        const chess = new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
        const state = {
            version: 0,
            variant: 'standard',
            status: 'playing',
            turn: 'w',
            board: {},
            history: [],
            players,
            fen: chess.fen()
        };
        const result = rules.applyCommand(state, { type: 'move', playerColor: 'w', from: 'e1', to: 'g1', version: 0 });
        expect(result.error).toBeUndefined();
        expect(result.newState.fen).toContain('b kq -'); // White castling rights gone
    });
    it('Handles en passant correctly', () => {
        const chess = new Chess('rnbqkbnr/pppp1ppp/8/3Pp3/8/8/PPP1PPPP/RNBQKBNR w KQkq e6 0 1');
        const state = { version: 0, variant: 'standard', status: 'playing', turn: 'w', board: {}, history: [], players, fen: chess.fen() };
        const result = rules.applyCommand(state, { type: 'move', playerColor: 'w', from: 'd5', to: 'e6', version: 0 });
        expect(result.newState.board['e5']).toBeUndefined();
        expect(result.newState.board['e6'].type).toBe('p');
    });
    it('Handles checkmate correctly', () => {
        const chess = new Chess('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'); // Fool's mate position (black just moved)
        const state = { version: 0, variant: 'standard', status: 'playing', turn: 'w', board: {}, history: [], players, fen: chess.fen() };
        // Oh wait, fool's mate is black checkmating white. Let's set it up right before mate.
        const chessBeforeMate = new Chess('rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2');
        const stateBeforeMate = { version: 0, variant: 'standard', status: 'playing', turn: 'b', board: {}, history: [], players, fen: chessBeforeMate.fen() };
        const result = rules.applyCommand(stateBeforeMate, { type: 'move', playerColor: 'b', from: 'd8', to: 'h4', version: 0 });
        expect(result.newState.status).toBe('win');
        expect(result.newState.winner).toBe('b');
    });
    it('Handles stalemate correctly', () => {
        // Set up right before stalemate
        const chessBeforeStalemate = new Chess('k7/8/PK6/8/8/8/8/8 w - - 0 1'); // White pawn on a6, King on b6. Black king on a8.
        const state = { version: 0, variant: 'standard', status: 'playing', turn: 'w', board: {}, history: [], players, fen: chessBeforeStalemate.fen() };
        const result = rules.applyCommand(state, { type: 'move', playerColor: 'w', from: 'a6', to: 'a7', version: 0 });
        expect(result.error).toBeUndefined();
        expect(result.newState.status).toBe('draw');
        expect(result.newState.winner).toBeNull();
    });
});
