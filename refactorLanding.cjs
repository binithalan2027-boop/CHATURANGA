const fs = require('fs');

const landingContent = fs.readFileSync('src/LandingPage.tsx', 'utf8');

// 1. Extract Navbar
const navbarContent = `
import React from 'react';

interface NavbarProps {
  user: { name: string; email: string } | null;
  onPlay: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onOpenLearn?: () => void;
  onOpenAbout?: () => void;
  onOpenProfile?: () => void;
}

export default function Navbar({
  user, onPlay, onLogin, onLogout, onOpenLearn, onOpenAbout, onOpenProfile
}: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-void-black/90 backdrop-blur-xl">
      <div className="h-20 w-full px-margin-mobile lg:px-margin flex items-center justify-between gap-gutter">
        <div className="flex items-center gap-space-md shrink-0">
          <img alt="Chaturanga Battle Chess Logo" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1WoLNWXp7LvnAJAdBP1a4f52kjIzsDI0LIMK4kc73s_CWz5G3G4xGePZMurtPn-R452y_QzVXx1VFH4NyHWzsCgMuYPIFW1b0v2uxe7Ml03ImUZLc3xAfGfkul6ylIkgLDQGAmM1rolht19xKJS3WIx_9SzBAigc7IM1kH8iUqr4MsQ-kCrEociK0N9oRHnR8dDBpqdNH4e_KS5GdrV1utRTGEGzF21HgVV7TFpdFp7kVIo7uLCM9CUA2A=s2048" />
          <a className="flex items-baseline gap-space-xs" href="#" onClick={(e) => { e.preventDefault(); onPlay(); }}>
            <span className="font-headline-lg text-headline-lg tracking-wider text-bone-ivory uppercase">CHATURANGA</span>
          </a>
          <span className="hidden xl:inline-flex items-center px-space-sm py-space-xs bg-surface-container-high rounded text-primary font-label-sm text-label-sm uppercase tracking-widest">[ S1 : BLOODLINE ]</span>
        </div>
        
        <nav className="hidden lg:flex items-center gap-space-sm">
          <a aria-current="page" className="uppercase transition-colors bg-primary-container text-on-primary-container font-label-md text-label-md rounded px-space-md py-space-sm" href="#" onClick={(e) => { e.preventDefault(); onPlay(); }}>Play</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface px-space-md py-space-sm rounded uppercase transition-colors" href="#character-sets">Game Modes</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface px-space-md py-space-sm rounded uppercase transition-colors" href="#character-sets">Characters & Sets</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface px-space-md py-space-sm rounded uppercase transition-colors" href="#leaderboardList">Leaderboard</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface px-space-md py-space-sm rounded uppercase transition-colors" href="#" onClick={(e) => { e.preventDefault(); onOpenLearn?.(); }}>Watch Live</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface px-space-md py-space-sm rounded uppercase transition-colors" href="#" onClick={(e) => { e.preventDefault(); onOpenAbout?.(); }}>Community</a>
        </nav>
        
        <div className="flex items-center gap-space-md shrink-0">
          {user ? (
            <>
              <div className="hidden sm:flex items-center bg-surface-container-lowest px-space-md py-space-sm rounded gap-space-sm">
                <div className="flex flex-col items-start leading-none">
                  <span className="font-label-sm text-label-sm text-primary uppercase">ELO 1840</span>
                  <span className="font-body-sm text-body-sm text-bone-ivory tracking-wide">{user.name}</span>
                </div>
              </div>
              <button aria-label="Notifications" className="relative p-space-sm rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors" onClick={onLogout}>
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </>
          ) : (
            <button aria-label="Login" className="relative p-space-sm rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors uppercase font-label-sm" onClick={onLogin}>
              Log In
            </button>
          )}
          <button className="hidden sm:inline-flex items-center justify-center bg-primary-container hover:bg-crimson-glow text-on-primary-container hover:text-on-surface font-headline-md text-headline-md px-space-lg py-space-xs rounded tracking-wider uppercase transition-all duration-150 active:scale-95 shadow-lg" onClick={onPlay}>
            {user ? 'FIGHT NOW' : 'FIGHT FREE'}
          </button>
          <button onClick={onOpenProfile} className="w-8 h-8 rounded-full bg-primary hover:bg-white flex items-center justify-center cursor-pointer transition-colors shadow-[0_0_15px_rgba(var(--color-primary),0.5)]">
            <span className="material-symbols-outlined text-on-primary hover:text-black text-[18px]">person</span>
          </button>
        </div>
      </div>
    </header>
  );
}
`;
fs.mkdirSync('src/components/layout', { recursive: true });
fs.writeFileSync('src/components/layout/Navbar.tsx', navbarContent);

// 2. Extract Hero Section
const heroContent = `
import React, { useState } from 'react';

interface HeroSectionProps {
  onPlay: () => void;
}

export default function HeroSection({ onPlay }: HeroSectionProps) {
  const [timeControl, setTimeControl] = useState('10');
  const [isQueued, setIsQueued] = useState(false);
  const [matchBtnText, setMatchBtnText] = useState('FIND IMMEDIATE MATCH');

  const handleMatchmaking = () => {
    if (!isQueued) {
      setIsQueued(true);
      setMatchBtnText("SEARCHING COMBATANTS (00:03)...");
      setTimeout(() => {
        setMatchBtnText("OPPONENT FOUND! ENTERING ARENA...");
        setTimeout(() => {
          setMatchBtnText("FIND IMMEDIATE MATCH");
          setIsQueued(false);
          onPlay(); 
        }, 1800);
      }, 2400);
    } else {
      setIsQueued(false);
      setMatchBtnText("FIND IMMEDIATE MATCH");
    }
  };

  return (
    <>
      <div className="w-full bg-surface-container-lowest px-margin-mobile lg:px-margin py-2 flex items-center justify-between overflow-x-auto gap-gutter">
        <div className="flex items-center gap-space-md shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-crimson-glow animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-bone-ivory uppercase tracking-widest">SEASON 1: BLOODLINE</span>
          </div>
          <span className="text-outline-variant font-label-sm">/</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">WORLD ARENA #4 LIVE</span>
        </div>
        <div className="flex items-center gap-space-lg shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-primary uppercase">AVG QUEUE:</span>
            <span className="font-label-sm text-label-sm text-bone-ivory">00:09s</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-secondary-container uppercase">CHECKMATE STRIKES TODAY:</span>
            <span className="font-label-sm text-label-sm text-bone-ivory">48,219</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-tertiary">
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider">ANIME ENGINE 2.4 READY</span>
          </div>
        </div>
      </div>

      <section className="relative w-full px-margin-mobile lg:px-margin pt-space-md pb-space-xl overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-primary-container/20 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-tertiary-container/25 rounded-full blur-[160px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-secondary-container/15 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div className="inline-flex items-center gap-2 self-start bg-surface-container-high px-space-sm py-1 rounded">
              <span className="font-label-sm text-label-sm text-crimson-glow uppercase tracking-widest">[ HORROR CHARACTERS × ANIME ACTION ]</span>
              <span className="w-1 h-1 rounded-full bg-bone-ivory"></span>
              <span className="font-label-sm text-label-sm text-bone-ivory/80 uppercase">TACTICAL BATTLE ARENA</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display-xl text-display-xl text-bone-ivory uppercase tracking-normal select-none">CHESS, BUT EVERY</span>
              <span className="font-display-xl text-display-xl text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary uppercase tracking-tight select-none">PIECE WANTS BLOOD.</span>
            </div>
            <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mt-4">
              Step into the cursed void. Command armies of vampires, shadow fiends, and liches in 
              high-stakes tactical combat. Climb the Grim Leaderboards, execute perfect sacrifices, 
              and unleash hellish spells on your opponent's king.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-space-sm">
            <div className="bg-surface-card border border-surface-container-high rounded-xl p-space-lg shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-container/10 to-transparent pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-space-md">
                <h3 className="font-headline-md text-bone-ivory uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">swords</span>
                  Enter the Arena
                </h3>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="font-mono text-xs text-on-surface-variant">4,291 Online</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-space-md">
                {['1', '3', '5', '10'].map((time) => (
                  <button 
                    key={time}
                    onClick={() => setTimeControl(time)}
                    className={\`py-2 rounded font-headline-sm flex flex-col items-center justify-center transition-all \${timeControl === time ? 'bg-primary text-void-black shadow-[0_0_15px_rgba(var(--color-primary),0.5)] scale-105' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low hover:text-white'}\`}
                  >
                    <span>{time}</span>
                    <span className="text-[10px] uppercase opacity-70">Min</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={handleMatchmaking}
                className={\`w-full py-space-md rounded-lg font-display-sm uppercase tracking-widest transition-all duration-300 relative overflow-hidden \${isQueued ? 'bg-surface-container-highest text-primary animate-pulse border border-primary/30' : 'bg-bone-ivory text-void-black hover:bg-white hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]'}\`}
              >
                {isQueued && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite]"></div>
                )}
                {matchBtnText}
              </button>

              <div className="flex items-center justify-center gap-4 mt-space-md pt-space-md border-t border-surface-container">
                <button onClick={onPlay} className="text-on-surface-variant hover:text-white font-label-sm uppercase tracking-widest transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                  Grim AI Arena
                </button>
                <span className="text-surface-container-highest">|</span>
                <button className="text-on-surface-variant hover:text-white font-label-sm uppercase tracking-widest transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">group</span>
                  Friends Sanctum
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
`;
fs.mkdirSync('src/components/landing', { recursive: true });
fs.writeFileSync('src/components/landing/HeroSection.tsx', heroContent);

// 3. Extract Game Modes & Armies
const modesContent = `
import React from 'react';

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
`;
fs.writeFileSync('src/components/landing/ModesSection.tsx', modesContent);

// 4. Extract Footer
const footerContent = `
import React from 'react';

interface FooterProps {
  onOpenPolicy?: () => void;
}

export default function Footer({ onOpenPolicy }: FooterProps) {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-surface-container pt-space-xl pb-space-md px-margin-mobile lg:px-margin">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-space-lg mb-space-xl">
        <div className="flex flex-col gap-4 col-span-1 md:col-span-2">
          <a className="flex items-baseline gap-space-xs" href="#">
            <span className="font-headline-lg text-headline-lg tracking-wider text-bone-ivory uppercase">CHATURANGA</span>
          </a>
          <p className="text-on-surface-variant font-body-sm max-w-sm">
            The ultimate Horror x Anime battle chess engine. Compete in ranked matchmaking, master dark spells, and command cursed armies.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-headline-sm text-bone-ivory uppercase tracking-widest mb-1">Play</h4>
          <a href="#" className="text-on-surface-variant hover:text-white font-body-sm transition-colors">Play Online</a>
          <a href="#" className="text-on-surface-variant hover:text-white font-body-sm transition-colors">Play Bots</a>
          <a href="#" className="text-on-surface-variant hover:text-white font-body-sm transition-colors">Tournaments</a>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-headline-sm text-bone-ivory uppercase tracking-widest mb-1">Community</h4>
          <a href="#" className="text-on-surface-variant hover:text-white font-body-sm transition-colors">Leaderboards</a>
          <a href="#" className="text-on-surface-variant hover:text-white font-body-sm transition-colors">Forums</a>
          <a href="#" className="text-on-surface-variant hover:text-white font-body-sm transition-colors" onClick={(e) => { e.preventDefault(); onOpenPolicy?.(); }}>Privacy Policy</a>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-surface-container pt-space-md">
        <span className="text-on-surface-variant font-body-sm">© 2026 Chaturanga Battle Chess. All rights reserved.</span>
        <div className="flex gap-4">
           {/* Social Icons would go here */}
        </div>
      </div>
    </footer>
  );
}
`;
fs.writeFileSync('src/components/layout/Footer.tsx', footerContent);

// 5. Rewrite LandingPage.tsx
const newLandingContent = `
import React from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HeroSection from './components/landing/HeroSection';
import ModesSection from './components/landing/ModesSection';

interface LandingPageProps {
  user: { name: string; email: string } | null;
  onPlay: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onOpenPolicy?: () => void;
  onOpenLearn?: () => void;
  onOpenAbout?: () => void;
  onOpenProfile?: () => void;
}

export default function LandingPage(props: LandingPageProps) {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Navbar {...props} />
      
      <main className="w-full pt-20 bg-void-black flex-1">
        <div className="flex flex-col w-full">
          <HeroSection onPlay={props.onPlay} />
          <ModesSection />
        </div>
      </main>

      <Footer onOpenPolicy={props.onOpenPolicy} />
    </div>
  );
}
`;
fs.writeFileSync('src/LandingPage.tsx', newLandingContent);

console.log("Successfully extracted layout components and refactored LandingPage.tsx!");
