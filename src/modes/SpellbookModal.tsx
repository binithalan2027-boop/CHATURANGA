import { ALL_SPELLS } from './spells';
import { SPELL_CONFIG } from './spellConfig';
import SpellIcon from './SpellIcon';

export interface SpellbookModalProps {
  onClose: () => void;
}

export default function SpellbookModal({ onClose }: SpellbookModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-[#0E0E0E]/90 backdrop-blur-md flex items-center justify-center p-4 lg:p-8 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Spellbook Catalogue"
    >
      <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl max-w-[1080px] w-full p-6 sm:p-8 flex flex-col shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div>
            <span className="text-[11px] font-bold text-[#AFF65B] tracking-[2px] uppercase block mb-1">
              CHESS MM · SPELLBOOK (9)
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl tracking-wide text-[#F4F4F4] m-0">
              ALL SPELLS & EFFECTS
            </h1>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#262626] hover:bg-[#333333] border border-white/10 text-[#F4F4F4] flex items-center justify-center cursor-pointer transition-colors text-lg"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* 3x3 Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
          {ALL_SPELLS.map((spell) => {
            const isDarkBg = spell.accent === '#E5484D';
            const primaryTextColor = isDarkBg ? '#F4F4F4' : '#0E0E0E';
            const secondaryTextColor = isDarkBg ? '#F4F4F4CC' : '#0E0E0EAA';

            return (
              <div
                key={spell.id}
                className="rounded-2xl p-5 flex flex-col justify-between transition-transform hover:scale-[1.01] shadow-lg"
                style={{ backgroundColor: spell.accent }}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#111111] p-1.5 flex items-center justify-center shadow-md">
                      <SpellIcon id={spell.id} size={44} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/15 text-black">
                        {spell.status}
                      </span>
                      <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/25 text-black">
                        {spell.rarity}
                      </span>
                    </div>
                  </div>

                  <h3
                    className="font-heading text-2xl tracking-wide m-0 mb-1"
                    style={{ color: primaryTextColor }}
                  >
                    {spell.name}
                  </h3>
                  <p
                    className="text-xs leading-relaxed m-0 font-medium"
                    style={{ color: secondaryTextColor }}
                  >
                    {spell.effect}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-black/10 flex items-center justify-between text-[10px] font-mono font-semibold" style={{ color: secondaryTextColor }}>
                  <span>SOURCE: {spell.sourceTag}</span>
                  <span>{spell.needsTarget !== 'none' ? 'Targeted' : 'Instant'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Proposed Config Footer */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-[#8A8A8A] font-bold uppercase tracking-wider">
              PROPOSED RULES:
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#262626] border border-white/5 text-[#8A8A8A] font-mono text-[11px]">
              Slot Cap: {SPELL_CONFIG.slotCap}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#262626] border border-white/5 text-[#8A8A8A] font-mono text-[11px]">
              Casts/Turn: {SPELL_CONFIG.castsPerTurn}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#262626] border border-white/5 text-[#8A8A8A] font-mono text-[11px]">
              Starting Spells: {SPELL_CONFIG.startingSpells}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#262626] border border-white/5 text-[#8A8A8A] font-mono text-[11px]">
              Surge: +{SPELL_CONFIG.scoreSurgeBonus}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#262626] border border-white/5 text-[#8A8A8A] font-mono text-[11px]">
              Promote: Rank {SPELL_CONFIG.promoteMinRankFromOwnSide}+
            </span>
          </div>
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-[#AFF65B] hover:bg-[#bcf971] text-[#0E0E0E] font-heading text-base tracking-wider cursor-pointer font-bold border-none"
          >
            Back to match
          </button>
        </div>
      </div>
    </div>
  );
}
