import { useState, useEffect, useMemo } from 'react';
import { SpellDef } from './spells';
import { SPELL_CONFIG } from './spellConfig';
import SpellIcon from './SpellIcon';

export interface SpellDropModalProps {
  spell: SpellDef;
  currentSpellCount: number;
  maxSlots?: number;
  currentSpells?: SpellDef[];
  onAddToSpellbook: (spell: SpellDef) => void;
  onReplaceSpell?: (replaceIndex: number, newSpell: SpellDef) => void;
  onDiscard?: () => void;
}

interface ConfettiChip {
  id: number;
  dx: string;
  dy: string;
  rot: string;
  size: number;
  color: string;
  isSquare: boolean;
}

export default function SpellDropModal({
  spell,
  currentSpellCount,
  maxSlots = SPELL_CONFIG.slotCap,
  currentSpells = [],
  onAddToSpellbook,
  onReplaceSpell,
  onDiscard,
}: SpellDropModalProps) {
  const [phase, setPhase] = useState<'fall' | 'impact' | 'reveal' | 'ready' | 'flying'>('fall');
  const [replaceMode, setReplaceMode] = useState(false);

  // Check prefers-reduced-motion
  const prefersReduced = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Generate deterministic confetti chips based on rarity
  const chips = useMemo(() => {
    const chipCount = spell.rarity === 'epic' ? 48 : spell.rarity === 'rare' ? 36 : 24;
    const colors = [spell.accent, '#F4F4F4', '#F2D500', '#66D4C2', '#A594F0', '#F07040'];
    const list: ConfettiChip[] = [];

    for (let i = 0; i < chipCount; i++) {
      const angle = (i / chipCount) * Math.PI * 2 + (i % 3) * 0.2;
      const dist = 70 + (i % 7) * 22;
      const dx = `${Math.cos(angle) * dist}px`;
      const dy = `${Math.sin(angle) * dist}px`;
      const rot = `${(i * 37) % 360}deg`;
      const size = 6 + (i % 5) * 2;
      const color = colors[i % colors.length];
      const isSquare = i % 2 === 0;

      list.push({ id: i, dx, dy, rot, size, color, isSquare });
    }
    return list;
  }, [spell]);

  useEffect(() => {
    if (prefersReduced) {
      setPhase('ready');
      return;
    }

    const { fallMs, squashMs, settleMs } = SPELL_CONFIG.animation;

    // Timeline steps:
    // 0ms: fall
    const tImpact = setTimeout(() => {
      setPhase('impact');
    }, fallMs);

    // After impact squash: reveal flip
    const tReveal = setTimeout(() => {
      setPhase('reveal');
    }, fallMs + squashMs);

    // After settle: details and CTA active
    const tReady = setTimeout(() => {
      setPhase('ready');
    }, fallMs + squashMs + settleMs + 100);

    return () => {
      clearTimeout(tImpact);
      clearTimeout(tReveal);
      clearTimeout(tReady);
    };
  }, [prefersReduced]);

  const isFull = currentSpellCount >= maxSlots;

  const handleAction = () => {
    if (isFull) {
      setReplaceMode(true);
      return;
    }
    setPhase('flying');
    setTimeout(() => {
      onAddToSpellbook(spell);
    }, SPELL_CONFIG.animation.flyToSlotMs);
  };

  const handleReplaceSlot = (idx: number) => {
    setPhase('flying');
    setTimeout(() => {
      if (onReplaceSpell) {
        onReplaceSpell(idx, spell);
      } else {
        onAddToSpellbook(spell);
      }
    }, SPELL_CONFIG.animation.flyToSlotMs);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0E0E0E]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Spell Drop"
    >
      <div
        className={`relative w-full max-w-[440px] flex flex-col items-center text-center ${
          phase === 'impact' && !prefersReduced ? 'spell-anim-shake' : ''
        }`}
        style={
          phase === 'impact' && !prefersReduced
            ? { animation: 'spell-shake 120ms ease-in-out' }
            : {}
        }
      >
        {/* Banner Pill */}
        <div className="inline-flex items-center gap-2 bg-[#262626] border border-[#AFF65B]/40 px-4 py-1.5 rounded-full mb-6 shadow-lg shadow-[#AFF65B]/10">
          <span className="w-2 h-2 rounded-full bg-[#AFF65B] animate-pulse" />
          <span className="font-heading text-sm sm:text-base tracking-widest text-[#AFF65B] uppercase">
            MATHS DUEL WON · SPELL DROP
          </span>
        </div>

        {/* Center Animation Stage */}
        <div className="relative w-44 h-44 flex items-center justify-center my-2">
          {/* Floor Shadow Ellipse */}
          <div
            className="absolute bottom-2 w-32 h-6 rounded-full bg-black/60 blur-xs"
            style={{
              animation:
                phase === 'fall' && !prefersReduced
                  ? 'spell-shadow-grow 260ms ease-in forwards'
                  : 'none',
              transform: phase === 'fall' && !prefersReduced ? 'scale(0.3)' : 'scale(1)',
              opacity: phase === 'fall' && !prefersReduced ? 0.2 : 0.45,
            }}
          />

          {/* Shockwave Rings on Impact */}
          {(phase === 'impact' || phase === 'reveal' || phase === 'ready') && !prefersReduced && (
            <>
              <div
                className="absolute inset-0 rounded-3xl border-4 pointer-events-none"
                style={{
                  borderColor: spell.accent,
                  animation: 'spell-ring 360ms ease-out forwards',
                }}
              />
              <div
                className="absolute inset-0 rounded-3xl border-3 pointer-events-none"
                style={{
                  borderColor: spell.accent,
                  animation: 'spell-ring 360ms 40ms ease-out forwards',
                }}
              />
              <div
                className="absolute inset-0 rounded-3xl border-2 pointer-events-none"
                style={{
                  borderColor: '#F4F4F4',
                  animation: 'spell-ring 360ms 80ms ease-out forwards',
                }}
              />
            </>
          )}

          {/* Confetti Chips on Impact */}
          {(phase === 'impact' || phase === 'reveal') && !prefersReduced && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {chips.map((c) => (
                <span
                  key={c.id}
                  className="absolute"
                  style={{
                    width: `${c.size}px`,
                    height: `${c.size}px`,
                    backgroundColor: c.color,
                    borderRadius: c.isSquare ? '2px' : '999px',
                    ['--dx' as any]: c.dx,
                    ['--dy' as any]: c.dy,
                    ['--rot' as any]: c.rot,
                    animation: 'spell-chip 600ms cubic-bezier(0.2, 0.8, 0.3, 1) forwards',
                  }}
                />
              ))}
            </div>
          )}

          {/* Spell Card Tile */}
          <div
            className="relative z-10 w-36 h-36 rounded-3xl p-3 flex flex-col items-center justify-center shadow-2xl transition-all"
            style={{
              backgroundColor: spell.accent,
              animation:
                prefersReduced
                  ? 'none'
                  : phase === 'fall'
                    ? 'spell-fall 260ms ease-in forwards'
                    : phase === 'impact'
                      ? 'spell-squash 80ms ease-out forwards'
                      : phase === 'reveal'
                        ? 'spell-reveal-flip 260ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                        : 'none',
              transform:
                phase === 'ready'
                  ? spell.rarity === 'epic'
                    ? 'rotate(-2deg)'
                    : 'none'
                  : undefined,
            }}
          >
            <div className="w-20 h-20 rounded-2xl bg-[#111111] p-2 flex items-center justify-center shadow-inner">
              <SpellIcon id={spell.id} size={64} />
            </div>
          </div>
        </div>

        {/* Revealed Details */}
        <div
          className={`w-full max-w-[380px] bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 mt-4 transition-all duration-300 ${
            phase === 'ready' || prefersReduced
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="text-[11px] font-bold text-[#8A8A8A] tracking-[2px] uppercase block mb-1">
            YOU GOT
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl tracking-wider text-[#F4F4F4] m-0 mb-2">
            {spell.name}
          </h2>

          {/* Chips: Status & Rarity */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-[#F4F4F4]">
              {spell.status}
            </span>
            <span
              className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${spell.accent}30`,
                color: spell.accent === '#F4F4F4' ? '#FAFAFA' : spell.accent,
                border: `1px solid ${spell.accent}60`,
              }}
            >
              {spell.rarity}
            </span>
            <span className="text-[10px] uppercase font-bold text-[#8A8A8A] font-mono">
              SPELLBOOK {currentSpellCount} / {maxSlots}
            </span>
          </div>

          <p className="text-xs text-[#8A8A8A] leading-relaxed mb-5">
            {spell.effect}
          </p>

          {/* Normal Add Button or Replace Options */}
          {!replaceMode ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleAction}
                className="w-full py-3.5 px-6 rounded-xl font-heading text-xl tracking-wide bg-[#AFF65B] hover:bg-[#c2f882] active:scale-98 text-[#0E0E0E] cursor-pointer shadow-lg shadow-[#AFF65B]/20 transition-all font-bold"
              >
                {isFull ? 'SPELLBOOK FULL · REPLACE A SPELL' : 'ADD TO SPELLBOOK'}
              </button>
              {isFull && onDiscard && (
                <button
                  onClick={onDiscard}
                  className="w-full py-2 text-xs text-[#8A8A8A] hover:text-[#F4F4F4] cursor-pointer bg-transparent border-none"
                >
                  Discard this spell
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-[#F2D500]">
                Choose a spell in your spellbook to replace:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {currentSpells.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleReplaceSlot(idx)}
                    className="p-2 rounded-xl border border-white/10 hover:border-[#AFF65B] bg-[#262626] flex flex-col items-center gap-1 cursor-pointer transition-colors"
                  >
                    <SpellIcon id={s.id} size={32} />
                    <span className="text-[10px] font-bold text-[#F4F4F4] truncate w-full">
                      {s.name}
                    </span>
                    <span className="text-[9px] text-[#E5484D]">Replace</span>
                  </button>
                ))}
              </div>
              {onDiscard && (
                <button
                  onClick={onDiscard}
                  className="py-2 text-xs text-[#8A8A8A] hover:text-red-400 cursor-pointer bg-transparent border-none"
                >
                  Cancel & Discard Spell
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
