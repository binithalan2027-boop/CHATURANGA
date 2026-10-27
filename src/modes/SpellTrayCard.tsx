import { SpellDef } from './spells';
import { SPELL_CONFIG } from './spellConfig';
import SpellIcon from './SpellIcon';

export interface SpellTrayCardProps {
  spells: SpellDef[];
  maxSlots?: number;
  armedSpellId: string | null;
  castsThisTurn: number;
  isPlayerTurn: boolean;
  isGameOver: boolean;
  surgeActive?: boolean;
  onSelectSpell: (spell: SpellDef) => void;
  onDisarmSpell: () => void;
  onCastInstant: (spell: SpellDef) => void;
  onOpenCatalogue: () => void;
}

export default function SpellTrayCard({
  spells,
  maxSlots = SPELL_CONFIG.slotCap,
  armedSpellId,
  castsThisTurn,
  isPlayerTurn,
  isGameOver,
  surgeActive = false,
  onSelectSpell,
  onDisarmSpell,
  onCastInstant,
  onOpenCatalogue,
}: SpellTrayCardProps) {
  const canCast = isPlayerTurn && !isGameOver && castsThisTurn < SPELL_CONFIG.castsPerTurn;

  return (
    <div className="bento-card bento-charcoal p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="matiks-kicker text-[10px]">
            SPELLBOOK ({spells.length} / {maxSlots})
          </span>
          {surgeActive && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#F2D500] text-[#0E0E0E] animate-pulse">
              +3 SURGE READY
            </span>
          )}
        </div>
        <button
          onClick={onOpenCatalogue}
          className="text-[10px] text-[#AFF65B] hover:underline bg-transparent border-none cursor-pointer font-bold uppercase tracking-wider"
        >
          View all (9)
        </button>
      </div>

      {/* Cast per turn notice if cast used */}
      {castsThisTurn >= SPELL_CONFIG.castsPerTurn && (
        <span className="text-[10px] text-[#8A8A8A] font-mono italic">
          Turn limit reached (1 cast/turn)
        </span>
      )}

      {/* Slots Container */}
      <div className="space-y-2.5">
        {Array.from({ length: maxSlots }, (_, i) => {
          const spell = spells[i];

          if (!spell) {
            // Empty Slot
            return (
              <div
                key={`empty-${i}`}
                className="w-full h-16 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center text-[#8A8A8A] text-xs font-mono select-none"
              >
                <span>SLOT {i + 1} · EMPTY</span>
              </div>
            );
          }

          const isArmed = armedSpellId === spell.id;
          const isDarkBg = spell.accent === '#E5484D';
          const primaryText = isDarkBg ? '#F4F4F4' : '#0E0E0E';
          const secondaryText = isDarkBg ? '#F4F4F4AA' : '#0E0E0EAA';

          return (
            <div
              key={`${spell.id}-${i}`}
              className={`relative rounded-xl p-3 cursor-pointer transition-all ${
                isArmed
                  ? 'ring-3 ring-[#AFF65B] -translate-y-1 shadow-lg shadow-[#AFF65B]/25'
                  : 'hover:scale-[1.01]'
              } ${!canCast ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ backgroundColor: spell.accent }}
              onClick={() => {
                if (!canCast) return;
                if (isArmed) {
                  onDisarmSpell();
                } else {
                  onSelectSpell(spell);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#111111] p-1 flex items-center justify-center shadow-md">
                    <SpellIcon id={spell.id} size={30} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong
                        className="font-heading text-lg tracking-wide block"
                        style={{ color: primaryText }}
                      >
                        {spell.name}
                      </strong>
                      <span className="text-[8px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-black/20 text-black">
                        {spell.rarity}
                      </span>
                    </div>
                    <span
                      className="text-[11px] block leading-tight font-medium line-clamp-1"
                      style={{ color: secondaryText }}
                    >
                      {spell.effect}
                    </span>
                  </div>
                </div>

                {isArmed && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0E0E0E] text-[#AFF65B] border border-[#AFF65B]/40">
                    ARMED
                  </span>
                )}
              </div>

              {/* Instant Cast button if armed and needs no target */}
              {isArmed && spell.needsTarget === 'none' && (
                <div className="mt-2.5 pt-2 border-t border-black/10 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCastInstant(spell);
                    }}
                    className="py-1.5 px-3 rounded-lg bg-[#0E0E0E] hover:bg-[#262626] text-[#AFF65B] text-xs font-heading tracking-wide border border-[#AFF65B]/40 cursor-pointer"
                  >
                    CAST {spell.name.toUpperCase()} NOW →
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDisarmSpell();
                    }}
                    className="text-[10px] text-black font-semibold hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State message when 0 spells */}
      {spells.length === 0 && (
        <p className="text-xs text-[#8A8A8A] m-0 italic text-center py-2">
          No spells yet. Win a maths duel to roll a drop.
        </p>
      )}
    </div>
  );
}
