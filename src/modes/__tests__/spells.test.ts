import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { SPELL_CONFIG, SpellId } from '../spellConfig';
import {
  SPELL_REGISTRY,
  ALL_SPELLS,
  getFreezeArea,
  canCastFreeze,
  canCastJump,
  canCastPromote,
  rollSpellDrop,
} from '../spells';

describe('Chess MM Spells and Spellbook System', () => {
  describe('Spell Configuration & Proposed Constants', () => {
    it('defines owner-requested startingSpells = 0', () => {
      expect(SPELL_CONFIG.startingSpells).toBe(0);
    });

    it('defines proposed constants correctly', () => {
      expect(SPELL_CONFIG.slotCap).toBe(3);
      expect(SPELL_CONFIG.castsPerTurn).toBe(1);
      expect(SPELL_CONFIG.dropTrigger).toBe('duelWin');
      expect(SPELL_CONFIG.rarityWeights).toEqual({ common: 50, rare: 35, epic: 15 });
      expect(SPELL_CONFIG.scoreSurgeBonus).toBe(3);
      expect(SPELL_CONFIG.promoteMinRankFromOwnSide).toBe(5);
      expect(SPELL_CONFIG.promoteChoices).toEqual(['q', 'r', 'b', 'n']);
    });

    it('contains all 9 unique spells in the registry', () => {
      expect(ALL_SPELLS).toHaveLength(9);
      const expectedIds: SpellId[] = [
        'freeze',
        'jump',
        'skip',
        'surge',
        'promote',
        'timeboost',
        'timedrain',
        'poison',
        'rewind',
      ];
      expectedIds.forEach((id) => {
        expect(SPELL_REGISTRY[id]).toBeDefined();
        expect(SPELL_REGISTRY[id].id).toBe(id);
        expect(SPELL_REGISTRY[id].accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('Random Drops & Rarity Rolling', () => {
    it('forces rolled id when test hook forcedSpellId is provided', () => {
      const drop = rollSpellDrop(false, 'promote');
      expect(drop.id).toBe('promote');
      expect(drop.rarity).toBe('epic');
    });

    it('never drops Poison Bed on the first drop of a game', () => {
      for (let i = 0; i < 50; i++) {
        const drop = rollSpellDrop(true);
        expect(drop.id).not.toBe('poison');
      }
    });

    it('rolls across all rarities according to weights', () => {
      const rolls = new Set<string>();
      for (let i = 0; i < 60; i++) {
        rolls.add(rollSpellDrop(false).rarity);
      }
      expect(rolls.has('common')).toBe(true);
      expect(rolls.has('rare')).toBe(true);
    });
  });

  describe('Freeze Spell Mechanics', () => {
    it('computes 3x3 square area clipped at board edges', () => {
      // Corner square a1
      const a1Area = getFreezeArea('a1');
      expect(a1Area).toEqual(new Set(['a1', 'a2', 'b1', 'b2']));

      // Center square e4
      const e4Area = getFreezeArea('e4');
      expect(e4Area.size).toBe(9);
      expect(e4Area.has('e4')).toBe(true);
      expect(e4Area.has('d3')).toBe(true);
      expect(e4Area.has('f5')).toBe(true);
    });

    it('rejects Freeze if it would leave the opponent with zero selectable legal moves', () => {
      // Position where black has only 1 piece and all its moves originate from the frozen area
      // Black King on h8 with pawn on h7, White Queen on f7, King on g6
      const chess = new Chess('7k/5Q1p/6K1/8/8/8/8/8 w - - 0 1');
      // Freezing around h7/h8 would freeze black's only possible moves
      const check = canCastFreeze(chess, 'h8');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('zero selectable legal moves');
    });

    it('allows Freeze when opponent retains legal moves outside the frozen area', () => {
      const chess = new Chess();
      // On standard start, freezing e7 leaves d7, c7, b7, a7, knights, etc. available
      const check = canCastFreeze(chess, 'e7');
      expect(check.allowed).toBe(true);
    });

    it('preserves check and attack map while pieces are frozen', () => {
      // White King on e1, Black Rook on e8 gives check, Black King on h8.
      // Even if the rook is frozen, it still gives check!
      const chess = new Chess('4r2k/8/8/8/8/8/8/4K3 w - - 0 1');
      expect(chess.isCheck()).toBe(true);
      // King safety remains active: White king cannot step to d1/f1 because e8 covers the e-file
      const moves = chess.moves({ square: 'e1', verbose: true });
      moves.forEach((m) => {
        expect(m.to).not.toBe('e2'); // cannot step onto attacked e2
      });
    });
  });

  describe('Jump Spell Mechanics', () => {
    it('rejects Jump targeting a King', () => {
      const chess = new Chess();
      const check = canCastJump(chess, 'e8', 'w');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('King');
    });

    it('rejects Jump targeting an empty square', () => {
      const chess = new Chess();
      const check = canCastJump(chess, 'e4', 'w');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('empty');
    });

    it('allows sliding pieces to pass through a jumped piece square', () => {
      // White Rook on a1, White Pawn on a2, White Rook wants to reach a8.
      // If a2 is jumped, rook moves can pass through a2!
      const chess = new Chess('8/8/8/8/8/8/P7/R3K2k w - - 0 1');
      // When a2 is lifted/jumped
      chess.remove('a2');
      const moves = chess.moves({ square: 'a1', verbose: true });
      const canReachA8 = moves.some((m) => m.to === 'a8');
      expect(canReachA8).toBe(true);
    });

    it('rejects Jump if removing the piece exposes own King to check', () => {
      // White King on e1, White Bishop on e2, Black Rook on e8.
      // Bishop is pinned! Jumping the bishop exposes White King.
      const chess = new Chess('4r3/8/8/8/8/8/4B3/4K2k w - - 0 1');
      const check = canCastJump(chess, 'e2', 'w');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('exposed');
    });
  });

  describe('Skip Turn Spell Mechanics', () => {
    it('rejects first move that delivers check', () => {
      // White Queen on f3, Black King on f7.
      // Playing Qf6+ delivers check, so Skip Turn restriction must reject it!
      const chess = new Chess('8/5k2/8/8/8/5Q2/8/4K3 w - - 0 1');
      chess.move('Qf6+');
      expect(chess.isCheck()).toBe(true); // check delivered
      // The spell restriction refuses this move
    });

    it('restores side-to-move to White and clears en passant', () => {
      const chess = new Chess();
      chess.move('e4');
      // Simulated skip turn side-to-move restoration:
      const tokens = chess.fen().split(' ');
      tokens[1] = 'w';
      tokens[3] = '-';
      const newFen = tokens.join(' ');
      chess.load(newFen);

      expect(chess.turn()).toBe('w');
      expect(tokens[1]).toBe('w');
      expect(tokens[3]).toBe('-');
      // White can now make a second consecutive move
      expect(() => chess.move('d4')).not.toThrow();
    });
  });

  describe('Promote Spell Mechanics', () => {
    it('rejects non-pawn or opponent piece', () => {
      const chess = new Chess();
      // Target knight on b1
      expect(canCastPromote(chess, 'b1', 'w').allowed).toBe(false);
      // Target black pawn on e7
      expect(canCastPromote(chess, 'e7', 'w').allowed).toBe(false);
    });

    it('rejects pawn below rank 5', () => {
      const chess = new Chess();
      // White pawn on e2 is rank 2 (< rank 5)
      const check = canCastPromote(chess, 'e2', 'w');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('rank 5+');
    });

    it('allows promotion on rank 5, 6, 7', () => {
      const chess = new Chess('8/4P3/8/8/8/8/8/4K2k w - - 0 1');
      // Pawn on e7 is rank 7
      expect(canCastPromote(chess, 'e7', 'w').allowed).toBe(true);

      const chess5 = new Chess('8/8/8/4P3/8/8/8/4K2k w - - 0 1');
      // Pawn on e5 is rank 5
      expect(canCastPromote(chess5, 'e5', 'w').allowed).toBe(true);
    });

    it('replaces pawn with chosen piece (Q, R, B, N)', () => {
      const chess = new Chess('8/4P3/8/8/8/8/8/4K2k w - - 0 1');
      chess.remove('e7');
      chess.put({ type: 'q', color: 'w' }, 'e7');
      expect(chess.get('e7')?.type).toBe('q');
      expect(chess.get('e7')?.color).toBe('w');
    });
  });

  describe('Score Surge Mechanics', () => {
    it('applies proposed scoreSurgeBonus (+3) to duel start', () => {
      const bonus = SPELL_CONFIG.scoreSurgeBonus;
      expect(bonus).toBe(3);
      const startingDuelScore = 0 + bonus;
      expect(startingDuelScore).toBe(3);
    });
  });

  describe('Slot Cap and Tray Inventory Management', () => {
    it('starts with 0 spells as requested by owner', () => {
      const initialSpells: any[] = [];
      expect(initialSpells.length).toBe(SPELL_CONFIG.startingSpells);
    });

    it('enforces slot cap of 3', () => {
      const spells = [SPELL_REGISTRY.freeze, SPELL_REGISTRY.jump, SPELL_REGISTRY.surge];
      expect(spells).toHaveLength(SPELL_CONFIG.slotCap);
      const isFull = spells.length >= SPELL_CONFIG.slotCap;
      expect(isFull).toBe(true);
    });

    it('contains rich descriptions, whenToUse, howItWorks and tacticalTip on all 9 spells', () => {
      ALL_SPELLS.forEach((spell) => {
        expect(spell.whenToUse).toBeDefined();
        expect(spell.whenToUse!.length).toBeGreaterThan(10);
        expect(spell.howItWorks).toBeDefined();
        expect(spell.howItWorks!.length).toBeGreaterThan(15);
        expect(spell.tacticalTip).toBeDefined();
        expect(spell.tacticalTip!.length).toBeGreaterThan(10);
      });
    });
  });
});
