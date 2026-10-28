import { useState, useEffect, useMemo, useRef } from 'react';
import { SpellDef } from './spells';
import { SPELL_CONFIG } from './spellConfig';
import SpellIcon from './SpellIcon';
import { useReducedMotion } from '../lib/motion';
import { playThreeParticleBurst } from '../lib/threeParticles';

export interface SpellDropModalProps {
  spell: SpellDef;
  currentSpellCount: number;
  maxSlots?: number;
  currentSpells?: SpellDef[];
  onAddToSpellbook: (spell: SpellDef) => void;
  onReplaceSpell?: (replaceIndex: number, newSpell: SpellDef) => void;
  onDiscard?: () => void;
  onToggleAutoCollect?: (enabled: boolean) => void;
  autoCollectEnabled?: boolean;
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
  onToggleAutoCollect,
  autoCollectEnabled = false,
}: SpellDropModalProps) {
  const [phase, setPhase] = useState<'fall' | 'impact' | 'reveal' | 'ready' | 'flying'>('fall');
  const [replaceMode, setReplaceMode] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(autoCollectEnabled);
  const stageRef = useRef<HTMLDivElement>(null);

  // Check prefers-reduced-motion (OS and in-app preference)
  const prefersReduced = useReducedMotion();

  // Generate deterministic confetti chips based on rarity
  const chips = useMemo(() => {
    const chipCount = spell.rarity === 'epic' ? 56 : spell.rarity === 'rare' ? 40 : 28;
    const colors = [spell.accent, '#F4F4F4', '#AFF65B', '#F2D500', '#66D4C2', '#A594F0', '#F07040'];
    const list: ConfettiChip[] = [];

    for (let i = 0; i < chipCount; i++) {
      const angle = (i / chipCount) * Math.PI * 2 + (i % 3) * 0.25;
      const dist = 90 + (i % 7) * 28;
      const dx = `${Math.cos(angle) * dist}px`;
      const dy = `${Math.sin(angle) * dist}px`;
      const rot = `${(i * 47) % 360}deg`;
      const size = 6 + (i % 5) * 3;
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

    const tImpact = setTimeout(() => {
      setPhase('impact');
    }, fallMs);

    const tReveal = setTimeout(() => {
      setPhase('reveal');
    }, fallMs + squashMs);

    const tReady = setTimeout(() => {
      setPhase('ready');
    }, fallMs + squashMs + settleMs + 100);

    return () => {
      clearTimeout(tImpact);
      clearTimeout(tReveal);
      clearTimeout(tReady);
    };
  }, [prefersReduced]);

  // Progressive enhancement: Trigger GPU point sprite particle burst on impact
  useEffect(() => {
    if (phase === 'impact' && !prefersReduced && stageRef.current) {
      playThreeParticleBurst({
        container: stageRef.current,
        count: spell.rarity === 'epic' ? 64 : spell.rarity === 'rare' ? 48 : 32,
        accentColors: [spell.accent, '#AFF65B', '#F2D500', '#F4F4F4'],
        durationMs: 700,
      }).catch(() => {});
    }
  }, [phase, prefersReduced, spell]);

  const isFull = currentSpellCount >= maxSlots;

  const handleTogglePreference = (checked: boolean) => {
    setDontShowAgain(checked);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('chaturanga_auto_collect_spells', checked ? 'true' : 'false');
      }
    } catch {
      // storage unavailable
    }
    onToggleAutoCollect?.(checked);
  };

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
      className="fixed inset-0 z-50 bg-[#0E0E0E]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Spell Drop"
    >
      <div
        className={`relative w-full max-w-[560px] my-auto flex flex-col items-center text-center ${
          phase === 'impact' && !prefersReduced ? 'spell-anim-shake' : ''
        }`}
        style={
          phase === 'impact' && !prefersReduced
            ? { animation: 'spell-shake 140ms ease-in-out' }
            : {}
        }
      >
        {/* Banner Pill */}
        <div className="inline-flex items-center gap-2 bg-[#1A1A1A] border border-[#AFF65B]/50 px-4 py-1.5 rounded-full mb-4 shadow-lg shadow-[#AFF65B]/15">
          <span className="w-2.5 h-2.5 rounded-full bg-[#AFF65B] animate-pulse" />
          <span className="font-heading text-sm sm:text-base tracking-widest text-[#AFF65B] uppercase">
            MATHS DUEL WON · SPELL DROP
          </span>
        </div>

        {/* Drop Animation Stage */}
        <div ref={stageRef} className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center my-1">
          {/* Ground Contact Shadow */}
          <div
            className="absolute -bottom-2 w-32 h-6 rounded-full bg-black blur-md transition-all pointer-events-none"
            style={{
              animation:
                phase === 'fall' && !prefersReduced
                  ? 'spell-shadow-grow 260ms ease-in forwards'
                  : 'none',
              transform: phase === 'fall' && !prefersReduced ? 'scale(0.3)' : 'scale(1)',
              opacity: phase === 'fall' && !prefersReduced ? 0.2 : 0.5,
            }}
          />

          {/* Shockwave Rings on Impact */}
          {(phase === 'impact' || phase === 'reveal' || phase === 'ready') && !prefersReduced && (
            <>
              <div
                className="absolute inset-0 rounded-3xl border-4 pointer-events-none"
                style={{
                  borderColor: spell.accent,
                  animation: 'spell-ring 420ms ease-out forwards',
                }}
              />
              <div
                className="absolute inset-0 rounded-3xl border-3 pointer-events-none"
                style={{
                  borderColor: spell.accent,
                  animation: 'spell-ring 420ms 50ms ease-out forwards',
                }}
              />
              <div
                className="absolute inset-0 rounded-3xl border-2 pointer-events-none"
                style={{
                  borderColor: '#AFF65B',
                  animation: 'spell-ring 420ms 100ms ease-out forwards',
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
                    animation: 'spell-chip 650ms cubic-bezier(0.2, 0.8, 0.3, 1) forwards',
                  }}
                />
              ))}
            </div>
          )}

          {/* Spell Card Tile with Glow */}
          <div
            className="relative z-10 w-36 h-36 sm:w-40 sm:h-40 rounded-3xl p-3 flex flex-col items-center justify-center shadow-2xl transition-all"
            style={{
              backgroundColor: spell.accent,
              boxShadow: `0 12px 40px ${spell.accent}55`,
              animation:
                prefersReduced
                  ? 'none'
                  : phase === 'fall'
                    ? 'spell-fall 260ms ease-in forwards'
                    : phase === 'impact'
                      ? 'spell-squash 80ms ease-out forwards'
                      : phase === 'reveal'
                        ? 'spell-reveal-flip 320ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                        : 'none',
              transform:
                phase === 'ready'
                  ? spell.rarity === 'epic'
                    ? 'rotate(-2deg)'
                    : 'none'
                  : undefined,
            }}
          >
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#111111] p-2.5 flex items-center justify-center shadow-inner">
              <SpellIcon id={spell.id} size={72} />
            </div>
          </div>
        </div>

        {/* Revealed Spacious Details Card */}
        <div
          className={`w-full bg-[#1A1A1A] border border-white/10 rounded-3xl p-5 sm:p-7 mt-3 text-left shadow-2xl transition-all duration-300 ${
            phase === 'ready' || prefersReduced
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="text-xs font-bold text-[#8A8A8A] tracking-[2.5px] uppercase">
              YOU UNLOCKED
            </span>
            <span className="text-xs uppercase font-mono font-bold text-[#AFF65B] bg-[#AFF65B]/10 px-2.5 py-0.5 rounded-full border border-[#AFF65B]/30">
              SPELLBOOK {currentSpellCount} / {maxSlots}
            </span>
          </div>

          <h2 className="font-heading text-4xl sm:text-5xl tracking-wide text-[#F4F4F4] m-0 mb-3">
            {spell.name}
          </h2>

          {/* Chips: Status & Rarity */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-white/10 text-[#F4F4F4]">
              {spell.status}
            </span>
            <span
              className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full font-mono"
              style={{
                backgroundColor: `${spell.accent}25`,
                color: spell.accent === '#F4F4F4' ? '#FAFAFA' : spell.accent,
                border: `1px solid ${spell.accent}60`,
              }}
            >
              ★ {spell.rarity.toUpperCase()}
            </span>
            {spell.sourceTag && (
              <span className="text-[11px] text-[#8A8A8A] border border-white/5 px-2.5 py-1 rounded-full bg-[#262626]">
                {spell.sourceTag}
              </span>
            )}
          </div>

          {/* WHAT IT DOES */}
          <div className="mb-4">
            <div className="text-[11px] font-heading tracking-widest text-[#8A8A8A] uppercase mb-1">
              WHAT IT DOES
            </div>
            <p className="font-body text-sm sm:text-base text-[#F4F4F4] leading-relaxed m-0 font-medium">
              {spell.effect}
            </p>
          </div>

          {/* Detailed Instructions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
            {/* WHEN TO USE */}
            <div className="bg-[#242424] border border-white/5 rounded-2xl p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#F2D500] uppercase tracking-wide">
                <span>⚡</span>
                <span>WHEN TO USE</span>
              </div>
              <p className="font-body text-xs text-[#D9D5C7] leading-snug m-0">
                {spell.whenToUse || 'Instant cast on your turn. Consumes 1 spell cast per turn.'}
              </p>
            </div>

            {/* HOW TO CAST */}
            <div className="bg-[#242424] border border-white/5 rounded-2xl p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#66D4C2] uppercase tracking-wide">
                <span>🎯</span>
                <span>HOW TO CAST</span>
              </div>
              <p className="font-body text-xs text-[#D9D5C7] leading-snug m-0">
                {spell.howItWorks || spell.effect}
              </p>
            </div>
          </div>

          {/* TACTICAL TIP (if available) */}
          {spell.tacticalTip && (
            <div className="bg-[#AFF65B]/10 border border-[#AFF65B]/30 rounded-2xl p-3 mb-5 flex items-start gap-2.5">
              <span className="text-base leading-none shrink-0">💡</span>
              <div className="text-xs text-[#E0F8B2] leading-snug">
                <strong className="text-[#AFF65B] uppercase font-bold mr-1">Pro Tip:</strong>
                {spell.tacticalTip}
              </div>
            </div>
          )}

          {/* Normal Add Button or Replace Options */}
          {!replaceMode ? (
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleAction}
                className="w-full py-4 px-6 rounded-2xl font-heading text-xl sm:text-2xl tracking-wider bg-[#AFF65B] hover:bg-[#c2f882] active:scale-98 text-[#0E0E0E] cursor-pointer shadow-xl shadow-[#AFF65B]/25 transition-all font-bold uppercase text-center"
              >
                {isFull ? 'SPELLBOOK FULL · REPLACE A SPELL' : 'ADD TO SPELLBOOK'}
              </button>
              {isFull && onDiscard && (
                <button
                  onClick={onDiscard}
                  className="w-full py-2.5 text-xs text-[#8A8A8A] hover:text-[#F4F4F4] cursor-pointer bg-transparent border-none font-medium"
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
                    className="p-3 rounded-2xl border border-white/10 hover:border-[#AFF65B] bg-[#262626] flex flex-col items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <SpellIcon id={s.id} size={36} />
                    <span className="text-xs font-bold text-[#F4F4F4] truncate w-full">
                      {s.name}
                    </span>
                    <span className="text-[10px] text-[#E5484D] font-bold uppercase">Replace</span>
                  </button>
                ))}
              </div>
              {onDiscard && (
                <button
                  onClick={onDiscard}
                  className="py-2 text-xs text-[#8A8A8A] hover:text-red-400 cursor-pointer bg-transparent border-none font-medium"
                >
                  Cancel & Discard Spell
                </button>
              )}
            </div>
          )}

          {/* Seamless "Don't show this again" Toggle */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-col items-center gap-1 text-center">
            <label className="inline-flex items-center gap-2.5 text-xs text-[#8A8A8A] hover:text-[#F4F4F4] cursor-pointer select-none py-1 transition-colors">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => handleTogglePreference(e.target.checked)}
                className="w-4 h-4 accent-[#AFF65B] rounded cursor-pointer"
              />
              <span>Don't show drop animations again (seamless auto-collect to tray)</span>
            </label>
            <span className="text-[11px] text-[#8A8A8A]/70">
              You can always inspect any spell anytime via the 3×3 Spellbook catalogue.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
