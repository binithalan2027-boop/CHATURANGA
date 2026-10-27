import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import {
  isPlausiblePremove,
  enqueuePremove,
  crossCheckAndExecutePremove,
  getPremoveSquares,
  Premove,
} from '../premoveManager';

describe('Premove Manager - Single & Limitless Queue Logic', () => {
  it('validates plausibility correctly for off-turn premoves', () => {
    const chess = new Chess();

    // White's pawn on e2 moving to empty e4 (plausible)
    expect(isPlausiblePremove(chess, 'e2', 'e4', 'w')).toBe(true);

    // White cannot move black's pawn on e7
    expect(isPlausiblePremove(chess, 'e7', 'e5', 'w')).toBe(false);

    // White cannot move e2 to e2 (same square)
    expect(isPlausiblePremove(chess, 'e2', 'e2', 'w')).toBe(false);

    // White cannot move e2 onto own piece on d2
    expect(isPlausiblePremove(chess, 'e2', 'd2', 'w')).toBe(false);

    // White cannot move from empty square e3
    expect(isPlausiblePremove(chess, 'e3', 'e4', 'w')).toBe(false);
  });

  describe('Single Mode (Limited to 1 premove)', () => {
    it('replaces any existing premove so queue length is at most 1', () => {
      let queue: Premove[] = [];
      const move1: Premove = { id: '1', from: 'e2', to: 'e4' };
      const move2: Premove = { id: '2', from: 'g1', to: 'f3' };

      queue = enqueuePremove(queue, move1, 'single');
      expect(queue).toHaveLength(1);
      expect(queue[0].from).toBe('e2');

      // Queuing a new move in single mode replaces the previous one
      queue = enqueuePremove(queue, move2, 'single');
      expect(queue).toHaveLength(1);
      expect(queue[0].from).toBe('g1');
      expect(queue[0].to).toBe('f3');
    });
  });

  describe('Limitless Mode (Unlimited queued premoves)', () => {
    it('queues multiple sequential premoves', () => {
      let queue: Premove[] = [];
      const move1: Premove = { id: '1', from: 'e2', to: 'e4' };
      const move2: Premove = { id: '2', from: 'g1', to: 'f3' };
      const move3: Premove = { id: '3', from: 'd2', to: 'd4' };

      queue = enqueuePremove(queue, move1, 'limitless');
      queue = enqueuePremove(queue, move2, 'limitless');
      queue = enqueuePremove(queue, move3, 'limitless');

      expect(queue).toHaveLength(3);
      expect(queue[0].to).toBe('e4');
      expect(queue[1].to).toBe('f3');
      expect(queue[2].to).toBe('d4');
    });
  });

  describe('Legality Cross-Check at Execution Time', () => {
    it('cross-checks and executes a valid premove against live position', () => {
      const chess = new Chess();
      const premove: Premove = { id: '1', from: 'e2', to: 'e4' };

      const result = crossCheckAndExecutePremove(chess, premove);
      expect(result.valid).toBe(true);
      expect(result.moveResult?.san).toBe('e4');
      expect(chess.get('e4')?.type).toBe('p');
      expect(chess.get('e2')).toBeFalsy();
    });

    it('cross-checks and rejects an illegal premove without mutating the board', () => {
      const chess = new Chess();
      const fenBefore = chess.fen();
      // e2 to e5 is illegal for a pawn on turn 1
      const illegalPremove: Premove = { id: '2', from: 'e2', to: 'e5' };

      const result = crossCheckAndExecutePremove(chess, illegalPremove);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('illegal');
      // Board state must remain unchanged
      expect(chess.fen()).toBe(fenBefore);
    });

    it('cross-checks and rejects a premove when a piece has been pinned or blocked by opponent move', () => {
      const chess = new Chess();
      // Bot plays d7d5, then we set up a scenario where bishop blocks or destination is blocked
      chess.move('e4');
      chess.move('d5');

      // White wants to play e4 to d5 (capture)
      const validCapture: Premove = { id: '3', from: 'e4', to: 'd5' };
      const captureResult = crossCheckAndExecutePremove(chess, validCapture);
      expect(captureResult.valid).toBe(true);
      expect(captureResult.moveResult?.captured).toBe('p');

      // Now pawn on d5 trying to move to d6 with black piece or empty blocked
      const blockedMove: Premove = { id: '4', from: 'd5', to: 'd7' };
      const blockedResult = crossCheckAndExecutePremove(chess, blockedMove);
      expect(blockedResult.valid).toBe(false);
    });

    it('auto-promotes pawn premoves to Queen upon reaching 8th rank', () => {
      const chess = new Chess('8/4P3/8/8/8/8/8/4K2k w - - 0 1');
      const promoPremove: Premove = { id: '5', from: 'e7', to: 'e8', promotion: 'q' };

      const result = crossCheckAndExecutePremove(chess, promoPremove);
      expect(result.valid).toBe(true);
      expect(result.moveResult?.promotion).toBe('q');
      expect(chess.get('e8')?.type).toBe('q');
    });
  });

  describe('Premove Square Extraction for UI Highlighting', () => {
    it('returns all from/to squares for styling as .premove on the board', () => {
      const queue: Premove[] = [
        { id: '1', from: 'e2', to: 'e4' },
        { id: '2', from: 'g1', to: 'f3' },
      ];

      const squares = getPremoveSquares(queue);
      expect(squares.has('e2')).toBe(true);
      expect(squares.has('e4')).toBe(true);
      expect(squares.has('g1')).toBe(true);
      expect(squares.has('f3')).toBe(true);
      expect(squares.has('c4')).toBe(false);
    });
  });
});
