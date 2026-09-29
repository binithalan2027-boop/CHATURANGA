

export default function ModesSection() {
  return (
    <>
      <section id="character-sets" className="w-full px-margin-mobile lg:px-margin py-space-xl bg-surface-container-lowest">
        <div className="flex flex-col gap-space-lg w-full">
          <div className="flex flex-col items-center text-center gap-space-xs mb-space-md">
            <h2 className="font-display-lg text-bone-ivory uppercase tracking-tight">The 9 Realms of Combat</h2>
            <p className="text-on-surface-variant font-body-md max-w-2xl">From standard tactical warfare to cursed explosive chaos, choose your battlefield.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {[
              { name: 'Ranked Classic', icon: '⚔️', desc: 'Standard 8x8 rules. Pure skill, no magic. Prove you are the true grandmaster.' },
              { name: 'Spell Chess', icon: '🔮', desc: 'Void Freeze & Shadow Swap. Cast dark magic to manipulate the board.' },
              { name: 'Cursed Blast', icon: '☠️', desc: 'Atomic rules. Captures cause explosive 3x3 shockwaves. Protect your King.' },
              { name: 'Stealth Ambush', icon: '🌑', desc: 'Fog of war. You can only see the squares your pieces can physically move to.' },
              { name: 'Fischer Chaos', icon: '🎲', desc: 'Chess960. Back rank starting positions are completely randomized.' },
              { name: 'Chaturanga 14x14', icon: '🗺️', desc: 'Massive 4-player combat. Form alliances, betray friends, dominate.' },
              { name: 'Grim AI Arena', icon: '🤖', desc: 'Test your might against the infinite scaling Eldritch God engine (1-3500 ELO).' },
              { name: 'Friends Sanctum', icon: '🤝', desc: 'Private unrated lobbies. Share your 16-digit Grimoire Code to duel.' }
            ].map((mode, i) => (
              <div key={i} className="bg-surface-card border border-surface-container hover:border-primary-container p-space-md rounded-xl transition-colors cursor-pointer group flex flex-col gap-3">
                <div className="text-4xl group-hover:scale-110 transition-transform">{mode.icon}</div>
                <h3 className="font-headline-md text-bone-ivory uppercase">{mode.name}</h3>
                <p className="font-body-sm text-on-surface-variant">{mode.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full px-margin-mobile lg:px-margin py-space-xl bg-void-black border-t border-surface-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-xl items-center">
          <div className="flex flex-col gap-space-md">
            <h2 className="font-display-lg text-bone-ivory uppercase tracking-tight">Cursed Armies</h2>
            <p className="text-on-surface-variant font-body-lg">
              Unlock and command unique faction aesthetics. Swap the classic Staunton pieces for 
              glowing demonic sigils, ancient runes, or spectral weaponry. Your army, your aesthetic.
            </p>
            <ul className="flex flex-col gap-3 font-headline-sm text-bone-ivory mt-2">
              <li className="flex items-center gap-3"><span className="text-primary material-symbols-outlined">check_circle</span> The Voidborn (Default)</li>
              <li className="flex items-center gap-3"><span className="text-primary material-symbols-outlined">check_circle</span> Blood Court Vampires (Unlock at Level 10)</li>
              <li className="flex items-center gap-3"><span className="text-primary material-symbols-outlined">check_circle</span> Cult of the Deep (Unlock at Level 25)</li>
            </ul>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-8 border border-surface-container flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20"></div>
             <div className="grid grid-cols-3 gap-8 relative z-10">
               <img src="/pieces/wK.svg" alt="King" className="w-16 h-16 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
               <img src="/pieces/wQ.svg" alt="Queen" className="w-16 h-16 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
               <img src="/pieces/wN.svg" alt="Knight" className="w-16 h-16 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
             </div>
          </div>
        </div>
      </section>
    </>
  );
}
