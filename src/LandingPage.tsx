import { useState } from 'react';

interface LandingPageProps {
  user: { name: string; email: string } | null;
  onPlay: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onOpenPolicy?: () => void;
  onOpenLearn?: () => void;
  onOpenAbout?: () => void;
}

export default function LandingPage({
  user,
  onPlay,
  onLogin,
  onLogout,
  onOpenPolicy,
  onOpenLearn,
  onOpenAbout,
}: LandingPageProps) {
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
          onPlay(); // Trigger the actual game start after animation
        }, 1800);
      }, 2400);
    } else {
      setIsQueued(false);
      setMatchBtnText("FIND IMMEDIATE MATCH");
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* HEADER */}
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
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="w-full pt-20 bg-void-black flex-1">
        <div className="flex flex-col w-full">
          {/* Top Hero Ticker & Matchmaking Status Bar */}
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

          {/* SECTION 1: HERO ARENA WITH LIVE QUICK-PLAY DOCK */}
          <section className="relative w-full px-margin-mobile lg:px-margin pt-space-md pb-space-xl overflow-hidden">
            <div className="absolute -top-32 left-1/4 w-96 h-96 bg-primary-container/20 rounded-full blur-[140px] pointer-events-none"></div>
            <div className="absolute top-1/3 -right-24 w-96 h-96 bg-tertiary-container/25 rounded-full blur-[160px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-10 w-80 h-80 bg-secondary-container/15 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
              {/* Left Column */}
              <div className="lg:col-span-7 flex flex-col gap-space-md">
                <div className="inline-flex items-center gap-2 self-start bg-surface-container-high px-space-sm py-1 rounded">
                  <span className="font-label-sm text-label-sm text-crimson-glow uppercase tracking-widest">[ HORROR CHARACTERS × ANIME ACTION ]</span>
                  <span className="w-1 h-1 rounded-full bg-bone-ivory"></span>
                  <span className="font-label-sm text-label-sm text-bone-ivory/80 uppercase">TACTICAL BATTLE ARENA</span>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-display-xl text-display-xl text-bone-ivory uppercase tracking-normal select-none">CHESS, BUT EVERY</span>
                  <span className="font-display-xl text-display-xl text-primary uppercase tracking-normal select-none -mt-3">MOVE IS A BATTLE.</span>
                </div>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                  Multiplayer strategy possessed by horror archetypes and fueled by hyper-kinetic anime combat spectacle. 8 cutthroat game modes, custom 3D character sets, and lethal execution mechanics.
                </p>
                <div className="flex flex-wrap items-center gap-space-md pt-2">
                  <a className="group relative inline-flex items-center justify-center gap-space-sm bg-primary-container hover:bg-crimson-glow text-bone-ivory font-headline-md text-headline-md px-space-xl py-space-sm rounded tracking-wider uppercase transition-all duration-200 active:scale-95 shadow-xl shadow-primary-container/30" href="#quick-play">
                    <span className="material-symbols-outlined text-[24px]">swords</span>
                    <span>ENTER THE ARENA (PLAY FREE)</span>
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </a>
                  <a className="inline-flex items-center gap-space-xs bg-surface-card hover:bg-surface-hover text-bone-ivory font-title-md text-title-md px-space-lg py-space-sm rounded uppercase tracking-wider transition-colors" href="#character-sets">
                    <span className="material-symbols-outlined text-secondary text-[20px]">psychology</span>
                    <span>EXPLORE ARMIES & SETS</span>
                  </a>
                </div>

                {/* Quick Play Dock */}
                <div className="mt-space-md bg-surface-card p-space-md lg:p-space-lg rounded shadow-2xl flex flex-col gap-space-md" id="quick-play">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[22px]">stadia_controller</span>
                      <span className="font-headline-md text-headline-md text-bone-ivory uppercase tracking-wide">QUICK PLAY DOCK</span>
                      <span className="bg-surface-container px-2 py-0.5 rounded font-label-sm text-label-sm text-secondary uppercase">GUEST INSTANT PASS</span>
                    </div>
                    <span className="hidden sm:inline-flex font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">MATCH REGION: US-EAST (12ms)</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-label-sm text-bone-ivory uppercase tracking-wider">SELECT BATTLE MODE</label>
                      <div className="relative bg-surface-container-lowest rounded flex items-center px-space-md py-2.5">
                        <span className="material-symbols-outlined text-tertiary text-[20px] mr-2">chess_pawn</span>
                        <select className="w-full bg-transparent text-bone-ivory font-title-md text-title-md focus:outline-none cursor-pointer appearance-none" id="modeSelect">
                          <option className="bg-surface-dark text-bone-ivory" value="classic">Standard Ranked (1v1 Horror ELO)</option>
                          <option className="bg-surface-dark text-bone-ivory" value="chaturanga4p">Chaturanga 14x14 (4-Player Crossfire)</option>
                          <option className="bg-surface-dark text-bone-ivory" value="fog">Fog of War (Stealth Ambush)</option>
                          <option className="bg-surface-dark text-bone-ivory" value="spell">Spell Chess (Cursed Teleport & Freeze)</option>
                          <option className="bg-surface-dark text-bone-ivory" value="blitz">Cursed Blitz (Anime Speedrun)</option>
                        </select>
                        <span className="material-symbols-outlined text-on-surface-variant pointer-events-none">expand_more</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-label-sm text-bone-ivory uppercase tracking-wider">STARTER FACTION ATTUNEMENT</label>
                      <div className="relative bg-surface-container-lowest rounded flex items-center px-space-md py-2.5">
                        <span className="material-symbols-outlined text-crimson-glow text-[20px] mr-2">theater_comedy</span>
                        <select className="w-full bg-transparent text-bone-ivory font-title-md text-title-md focus:outline-none cursor-pointer appearance-none" id="factionSelect">
                          <option className="bg-surface-dark text-bone-ivory" value="carnival">The Carnival (Jesters & Clowns)</option>
                          <option className="bg-surface-dark text-bone-ivory" value="swarm">The Swarm (Spiders & Bone Queens)</option>
                          <option className="bg-surface-dark text-bone-ivory" value="harvest">The Cursed Harvest (Pumpkins & Witches)</option>
                        </select>
                        <span className="material-symbols-outlined text-on-surface-variant pointer-events-none">expand_more</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="font-label-sm text-label-sm text-bone-ivory uppercase tracking-wider">TIME CONTROL</span>
                    <div className="grid grid-cols-4 gap-space-sm">
                      {['1', '3', '10', '30'].map(t => (
                        <button 
                          key={t}
                          className={`py-2 px-space-sm rounded font-title-md text-title-md uppercase transition-all text-center ${timeControl === t ? 'bg-primary-container text-on-primary-container shadow-md shadow-primary-container/40' : 'bg-surface-container text-on-surface-variant hover:text-bone-ivory'}`}
                          onClick={() => setTimeControl(t)}
                        >
                          {t} MIN <span className={`block font-label-sm text-label-sm ${timeControl === t ? 'text-on-primary-container/80' : 'text-on-surface-variant'}`}>{t === '1' ? 'BULLET' : t === '3' ? 'BLITZ' : t === '10' ? 'RAPID' : 'CLASSIC'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-space-sm pt-2">
                    <button 
                      className={`w-full sm:flex-1 font-headline-md text-headline-md py-3 px-space-lg rounded tracking-wider uppercase flex items-center justify-center gap-space-sm transition-all duration-150 active:scale-98 shadow-lg ${isQueued ? 'bg-crimson-glow text-bone-ivory animate-pulse' : 'bg-bone-ivory hover:bg-white text-void-black'}`}
                      onClick={handleMatchmaking}
                    >
                      <span className="material-symbols-outlined text-[24px]">play_arrow</span>
                      <span>{matchBtnText}</span>
                    </button>
                    <button className="w-full sm:w-auto bg-surface-container-high hover:bg-surface-hover text-bone-ivory font-title-md text-title-md py-3 px-space-lg rounded uppercase tracking-wider flex items-center justify-center gap-2 transition-colors" onClick={onPlay}>
                      <span className="material-symbols-outlined text-secondary text-[20px]">smart_toy</span>
                      <span>PLAY VS GRIM AI</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm pt-1">
                    <span>• Instant guest match. No password required.</span>
                    <span className="text-spectral-cyan font-label-sm text-label-sm">CURRENT QUEUE: 3,421 COMBATANTS</span>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-5 flex flex-col gap-space-md">
                <div className="relative bg-surface-dark rounded-xl overflow-hidden shadow-2xl group">
                  <div className="relative aspect-[16/10] sm:aspect-square w-full overflow-hidden bg-void-black">
                    <img className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out" alt="Cinematic 3D render" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBG9bMyg55WJHWfs3fJtRzTj1K0aLzBhxx3PVqbzM-csipIwRIIsRfsrzZzxh236Y8KHmJyoprJW82XMNZjPtYF1JejvkEcv0hl-vNcU3QlOk-vwiA9hqMEBm_kKhdIT4BMuYMMH7yVH--VEPhj0b4w5vd4xfvXrQyFeNuhD-BzELfGn5bQShxJyXGFmpO58zUoHqjpjG_a1TEd8MBXfjmH7y6Xl84U64SU6POiVvZRzAC_e_0j7D_y=s2048" />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-void-black/20 to-transparent"></div>
                    <div className="absolute top-4 left-4 bg-void-black/85 backdrop-blur-md px-space-md py-2 rounded flex items-center gap-space-sm shadow-xl">
                      <span className="w-2.5 h-2.5 rounded-full bg-crimson-glow animate-ping"></span>
                      <div className="flex flex-col leading-none">
                        <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">CRITICAL CAPTURE</span>
                        <span className="font-headline-md text-headline-md text-bone-ivory">NIGHTMARE KNIGHT LEAPS</span>
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 bg-surface-card/90 backdrop-blur-md px-3 py-1.5 rounded flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary-container text-[18px]">local_fire_department</span>
                      <span className="font-label-sm text-label-sm text-bone-ivory uppercase tracking-wider">SPECTRAL COMBO x3</span>
                    </div>
                  </div>
                  <div className="p-space-md bg-surface-card flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-space-xs">
                        <span className="font-headline-md text-headline-md text-bone-ivory uppercase">RANKED COLOSSEUM MATCH</span>
                        <span className="bg-primary-container/30 text-primary font-label-sm text-label-sm px-2 py-0.5 rounded uppercase">LIVE DEMO</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">TURN 18 • WHITE TO MOVE</span>
                    </div>
                    <div className="grid grid-cols-8 gap-1 p-2 bg-surface-container-lowest rounded select-none">
                      {['♜','♞','♝','♛','♚','♝','♞','♜'].map((p, i) => (
                        <div key={i} className={`aspect-square flex items-center justify-center font-headline-md text-headline-md ${i % 2 === 0 ? 'bg-surface-container' : 'bg-surface-dark'} ${i === 1 ? 'text-primary animate-pulse' : i === 3 ? 'text-tertiary' : i === 6 ? 'text-secondary' : 'text-bone-ivory text-opacity-80'}`}>
                          {p}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-spectral-cyan"></span> Bone Spider Queen locked d5</span>
                      <span className="text-primary font-label-sm uppercase tracking-wider">CHECK THREAT ACTIVE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: ARMIES */}
          <section className="w-full bg-surface-container-lowest px-margin-mobile lg:px-margin py-space-xl flex flex-col gap-space-xl" id="character-sets">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
              <div className="flex flex-col gap-space-xs max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">[ STORE-KIT ARMIES ]</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-bone-ivory"></span>
                  <span className="font-label-sm text-label-sm text-bone-ivory/70 uppercase">CHOOSE YOUR MONSTER</span>
                </div>
                <h2 className="font-display-lg text-display-lg text-bone-ivory uppercase tracking-tight">THREE CURSED ARMIES. INFINITE BLOODSHED.</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">Characters are living, breathing horror icons. When they capture, teleport, or deliver checkmate, anime-level transformation sequences shake the arena.</p>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">FILTER BY TRAIT:</span>
                <button className="bg-surface-card text-bone-ivory font-label-sm text-label-sm px-3 py-1.5 rounded uppercase hover:bg-surface-hover">SPEED</button>
                <button className="bg-surface-card text-bone-ivory font-label-sm text-label-sm px-3 py-1.5 rounded uppercase hover:bg-surface-hover">DARK MAGIC</button>
                <button className="bg-surface-card text-bone-ivory font-label-sm text-label-sm px-3 py-1.5 rounded uppercase hover:bg-surface-hover">ARMOR</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {/* Carnival */}
              <div className="group relative bg-surface-card rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-2xl hover:shadow-primary-container/30">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-void-black">
                  <img className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" alt="Jester" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAld1Z9E60WE9DgTNKCsqAIP8Qg6xeRspGyRYoT8DHgTl2TTMQ_R5dMqCLfTYHpE6evQMd2lC2yKqpmzmDMtk8lUmC6YHx0_ka9yj7m3V_pCh5lhzfCPCK4iNN5YcaU-D_VrlbuyenPaRxHDndkcJrMuKZhkdFxLakpamOWKaCXNfTvxZVo0H3AzmZsAv36FZrKOeNriJUxqFv_MbjNsxd3mekeNAOzpSTcjqoaty86RtDVLy7H7ux2=s2048" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 bg-primary-container text-on-primary-container font-label-sm text-label-sm px-space-sm py-0.5 rounded uppercase tracking-wider">SET A • CRIMSON</span>
                </div>
                <div className="p-space-lg flex flex-col flex-1 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">JESTERS • CLOWNS • ACROBATS</span>
                    <h3 className="font-headline-lg text-headline-lg text-bone-ivory uppercase tracking-wide">THE CARNIVAL</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Twisted circus performers with exaggerated expressions, worn fabric, and cracked porcelain visage. Built for hyper-mobile flank attacks.</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2 mt-auto">
                    <span className="bg-surface-container px-2 py-1 rounded font-label-sm text-label-sm text-bone-ivory uppercase">[ JESTER KNIGHT ]</span>
                    <span className="bg-surface-container px-2 py-1 rounded font-label-sm text-label-sm text-primary uppercase">[ MANIC FEINT ]</span>
                  </div>
                  <button className="w-full mt-2 bg-surface-container hover:bg-primary-container text-bone-ivory hover:text-on-primary-container font-headline-md text-headline-md py-2 rounded uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                    <span>SELECT THE CARNIVAL</span><span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Swarm */}
              <div className="group relative bg-surface-card rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-2xl hover:shadow-tertiary-container/30">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-void-black">
                  <img className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" alt="Spider Queen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDo-zXX-r3Wi_zMjNs4n0FeTU07-BGk-JmB6-gY_H0rJpWWqb-95cIG2_jmHSsyxwY5CizYmrkm0zim4tTRVRtf7dOJYamZegNyXLTsTnpFKMTC-PilwQalUD3jYyX5A1lLp5_AXaaOckgh9lSPiM1iVj2QJ4QkUOPUeMSRIBavDNQIYKa1PRb74pr7cdaw5oJkWV2COFKAmDHHidMPmZeHBhzxHDEotL4ksQ0cR-a1MtAa61ysD2n=s2048" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm px-space-sm py-0.5 rounded uppercase tracking-wider">SET B • CURSED VIOLET</span>
                </div>
                <div className="p-space-lg flex flex-col flex-1 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest">SPIDERS • SKELETONS • CHITIN</span>
                    <h3 className="font-headline-lg text-headline-lg text-bone-ivory uppercase tracking-wide">THE SWARM</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Dimensional nightmare entities forged from bone and obsidian carapace. Masters of zone denial and multi-square pin attacks.</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2 mt-auto">
                    <span className="bg-surface-container px-2 py-1 rounded font-label-sm text-label-sm text-bone-ivory uppercase">[ SPIDER QUEEN ]</span>
                    <span className="bg-surface-container px-2 py-1 rounded font-label-sm text-label-sm text-tertiary uppercase">[ WEB-LOCK ]</span>
                  </div>
                  <button className="w-full mt-2 bg-surface-container hover:bg-tertiary-container text-bone-ivory hover:text-on-tertiary-container font-headline-md text-headline-md py-2 rounded uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                    <span>SELECT THE SWARM</span><span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Harvest */}
              <div className="group relative bg-surface-card rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-2xl hover:shadow-secondary-container/30">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-void-black">
                  <img className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" alt="Witch Bishop" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoqcRKYxWZigH-tb-g60twYF2396nkO58LnBVeKuFQy24KnldeFLRsdNlM0wn22PPHv18eDwxzrg_oPkagDtXYZj2nIhLy2j6BFSbVxAbMmWbMLrNvrKWytk_Ynq_8dk7bwQOZI7dObbGmLYsru_JPh_JtP2H3W5jzCEYg28K5vtEKZcv9z8DGv1_Jyv5EicDNSHWK8k0p5OvROXJocrHCHvcTFoIgKVc0q32xx2WGzrLoXeDMNyfH=s2048" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-space-sm py-0.5 rounded uppercase tracking-wider">SET C • ORANGE</span>
                </div>
                <div className="p-space-lg flex flex-col flex-1 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">PUMPKINS • WITCHES</span>
                    <h3 className="font-headline-lg text-headline-lg text-bone-ivory uppercase tracking-wide">THE CURSED HARVEST</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Dark agrarian folklore re-imagined as tactical royalty. Carved pumpkin cores that ignite upon capture.</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2 mt-auto">
                    <span className="bg-surface-container px-2 py-1 rounded font-label-sm text-label-sm text-bone-ivory uppercase">[ WITCH BISHOP ]</span>
                    <span className="bg-surface-container px-2 py-1 rounded font-label-sm text-label-sm text-secondary uppercase">[ EXPLOSIVE PAWN ]</span>
                  </div>
                  <button className="w-full mt-2 bg-surface-container hover:bg-secondary-container text-bone-ivory hover:text-on-secondary-container font-headline-md text-headline-md py-2 rounded uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                    <span>SELECT HARVEST</span><span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: GAME MODES */}
          <section className="w-full px-margin-mobile lg:px-margin py-space-xl flex flex-col gap-space-xl">
            <div className="text-center flex flex-col items-center gap-space-xs max-w-3xl mx-auto">
              <span className="font-label-sm text-label-sm text-secondary-container uppercase tracking-widest">[ 8 ARENA FORMATS ]</span>
              <h2 className="font-display-lg text-display-lg text-bone-ivory uppercase tracking-tight">CHOOSE YOUR GAME. COMMAND THE CHAOS.</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Every mode brings customized horror physics, time controls, dynamic capture sequences, and distinct victories.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
              {[
                { id: 'classic', icon: 'shield', color: 'text-primary', bg: 'group-hover:bg-primary-container', title: 'CLASSIC RANKED', subtitle: '1v1 ELO', desc: 'Pure FIDE chess rules electrified with high-speed anime capture strikes.' },
                { id: '4p', icon: 'grid_4x4', color: 'text-secondary', bg: 'group-hover:bg-secondary-container', title: 'CHATURANGA 4P', subtitle: 'CROSSFIRE', desc: 'Ancient 14×14 four-player battlefield. Execute simultaneous 3-way checkmates.' },
                { id: 'fog', icon: 'visibility_off', color: 'text-tertiary', bg: 'group-hover:bg-tertiary-container', title: 'FOG OF WAR', subtitle: 'STEALTH', desc: 'Squares vanish behind creeping darkness. See only what your monsters see.' },
                { id: 'spell', icon: 'auto_fix_high', color: 'text-crimson-glow', bg: 'group-hover:bg-primary-container', title: 'SPELL CHESS', subtitle: 'CURSED', desc: 'Cast supernatural cards: Instant Tile Freeze and Demonic Teleportation.' },
                { id: '960', icon: 'shuffle', color: 'text-spectral-cyan', bg: 'group-hover:bg-surface-container-high', title: 'CHESS960 CHAOS', subtitle: 'FISCHER', desc: 'Shuffled back-rank monsters eliminate opening book memorization.' },
                { id: 'puzzle', icon: 'timer', color: 'text-primary', bg: 'group-hover:bg-primary-container', title: 'CURSED TRIALS', subtitle: 'SPEED RUSH', desc: 'Solve lethal mate-in-1 and mate-in-2 scenarios against a 3-minute blood clock.' },
                { id: 'ai', icon: 'psychology_alt', color: 'text-secondary', bg: 'group-hover:bg-secondary-container', title: 'GRIM AI ARENA', subtitle: 'OFFLINE', desc: 'Challenge 5 depths of neural engines voiced by dark entity archetypes.' },
                { id: 'friends', icon: 'group_add', color: 'text-bone-ivory', bg: 'group-hover:bg-surface-container-high', title: 'FRIENDS SANCTUM', subtitle: 'PRIVATE ROOM', desc: 'Create custom password lobbies with time handicaps and piece bans.' },
                { id: 'atomic', icon: 'dangerous', color: 'text-crimson-glow', bg: 'group-hover:bg-primary-container', title: 'CURSED BLAST', subtitle: 'ATOMIC', desc: 'Explosive sacrifices. Captures wipe out the surrounding 3x3 blast radius.' }
              ].map(mode => (
                <div key={mode.id} className="group bg-surface-card hover:bg-surface-hover rounded-xl p-space-md flex flex-col gap-space-md transition-all duration-200 cursor-pointer" onClick={onPlay}>
                  <div className={`w-12 h-12 rounded bg-surface-container flex items-center justify-center ${mode.color} ${mode.bg} group-hover:text-white transition-colors`}>
                    <span className="material-symbols-outlined text-[28px]">{mode.icon}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline-md text-headline-md text-bone-ivory uppercase">{mode.title}</h3>
                      <span className={`font-label-sm text-label-sm ${mode.color} uppercase`}>{mode.subtitle}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{mode.desc}</p>
                  </div>
                  <a className={`mt-auto inline-flex items-center justify-between text-bone-ivory hover:${mode.color} font-title-md text-title-md uppercase tracking-wider py-1`} href="#" onClick={(e) => { e.preventDefault(); onPlay(); }}>
                    <span>ENTER QUEUE</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: HOW IT WORKS */}
          <section className="w-full bg-surface-container-lowest px-margin-mobile lg:px-margin py-space-xl flex flex-col gap-space-xl">
            <div className="text-center flex flex-col items-center gap-space-xs max-w-2xl mx-auto">
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">[ DEPLOYMENT PROTOCOL ]</span>
              <h2 className="font-display-lg text-display-lg text-bone-ivory uppercase tracking-tight">START COMBAT IN 3 STEPS</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Traditional chess is only the beginning. Seamless guest matchmaking lets you unleash your army within ten seconds.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter relative">
              <div className="bg-surface-card p-space-lg rounded-xl flex flex-col gap-space-md shadow-lg">
                <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container font-headline-lg text-headline-lg flex items-center justify-center">1</div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-bone-ivory uppercase">PICK A MODE & ARMY</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Select between 1v1 Ranked, 14x14 Chaturanga, or Fog of War. Lock in your starter faction.</p>
                </div>
                <div className="mt-auto pt-space-sm flex items-center gap-2 text-primary font-label-sm text-label-sm uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>OVER 80 UNIQUE CHARACTER PIECES</span>
                </div>
              </div>
              <div className="bg-surface-card p-space-lg rounded-xl flex flex-col gap-space-md shadow-lg">
                <div className="w-12 h-12 rounded-full bg-surface-container-high text-bone-ivory font-headline-lg text-headline-lg flex items-center justify-center">2</div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-bone-ivory uppercase">GET INSTANTLY MATCHED</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Our global matchmaking engine pairs your ELO rating across worldwide low-latency nodes.</p>
                </div>
                <div className="mt-auto pt-space-sm flex items-center gap-2 text-secondary-container font-label-sm text-label-sm uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  <span>AVERAGE QUEUE: UNDER 10 SECONDS</span>
                </div>
              </div>
              <div className="bg-surface-card p-space-lg rounded-xl flex flex-col gap-space-md shadow-lg">
                <div className="w-12 h-12 rounded-full bg-surface-container-high text-bone-ivory font-headline-lg text-headline-lg flex items-center justify-center">3</div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-bone-ivory uppercase">PLAY, STRIKE & CLIMB</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Execute cinematic anime impact captures. Unlock seasonal title flairs and master the leaderboard.</p>
                </div>
                <div className="mt-auto pt-space-sm flex items-center gap-2 text-tertiary font-label-sm text-label-sm uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">military_tech</span>
                  <span>TIER REWARDS & BATTLE PASS XP</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: FINAL CTA */}
          <section className="w-full px-margin-mobile lg:px-margin py-space-xl">
            <div className="relative w-full rounded-2xl bg-gradient-to-r from-void-black via-surface-dark to-surface-card overflow-hidden p-space-lg lg:p-space-xl flex flex-col items-center justify-center text-center gap-space-md shadow-2xl">
              <div className="absolute inset-0 bg-primary-container/10 pointer-events-none"></div>
              <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-crimson-glow/20 rounded-full blur-[100px] pointer-events-none"></div>
              <div className="absolute -left-10 -top-10 w-80 h-80 bg-tertiary-container/20 rounded-full blur-[100px] pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col items-center gap-space-xs max-w-2xl">
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">[ READY FOR DEPLOYMENT ]</span>
                <h2 className="font-display-xl text-display-xl text-bone-ivory uppercase tracking-normal select-none">YOUR MOVE. YOUR MONSTER.</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">Traditional chess is only the beginning. Claim your free starter army, unlock high-velocity anime action, and join 140,000+ tactical combatants right now.</p>
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-space-md pt-space-sm w-full max-w-md">
                <button className="w-full bg-primary-container hover:bg-crimson-glow text-on-primary-container hover:text-white font-headline-md text-headline-md py-3 px-space-xl rounded uppercase tracking-wider text-center transition-all duration-150 active:scale-95 shadow-xl shadow-primary-container/40" onClick={onPlay}>
                  CREATE FREE ACCOUNT & FIGHT
                </button>
              </div>
              <span className="relative z-10 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest pt-2">NO CREDIT CARD REQUIRED • CROSS-PLAY PC, MAC, & BROWSER</span>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-surface-container-lowest mt-auto">
        <div className="w-full px-margin-mobile lg:px-margin py-space-xl flex flex-col gap-space-xl">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-gutter">
            <div className="col-span-2 flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm">
                <span className="font-headline-lg text-headline-lg tracking-widest text-bone-ivory uppercase">CHATURANGA</span>
                <span className="font-label-sm text-label-sm text-primary bg-primary-container/20 px-space-xs py-0.5 rounded uppercase">HORROR x ANIME</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">A hyper-kinetic tactical arena fusing grim horror entities with ruthless, adrenaline-fueled competitive battle chess mechanics.</p>
              <div className="flex items-center gap-space-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-spectral-cyan animate-ping"></span>
                <span className="font-label-sm text-label-sm text-bone-ivory uppercase tracking-wider">Server Status: ONLINE • 14,892 Battles Live</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-space-sm">
              <span className="font-headline-md text-headline-md text-bone-ivory tracking-wide uppercase">Modes</span>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#" onClick={(e) => { e.preventDefault(); onPlay(); }}>Cursed Blitz</a>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#" onClick={(e) => { e.preventDefault(); onPlay(); }}>Standard 960 Horror</a>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#" onClick={(e) => { e.preventDefault(); onPlay(); }}>Colosseum Brawl</a>
            </div>
            <div className="flex flex-col gap-space-sm">
              <span className="font-headline-md text-headline-md text-bone-ivory tracking-wide uppercase">Armies & Sets</span>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#character-sets">The Carnivalesque</a>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#character-sets">Cursed Harvest</a>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#character-sets">The Spectral Swarm</a>
            </div>
            <div className="flex flex-col gap-space-sm">
              <span className="font-headline-md text-headline-md text-bone-ivory tracking-wide uppercase">Learn</span>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#" onClick={(e) => { e.preventDefault(); onOpenLearn?.(); }}>GothamChess Acad</a>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#" onClick={(e) => { e.preventDefault(); onOpenLearn?.(); }}>Tactics & Rules</a>
            </div>
            <div className="flex flex-col gap-space-sm">
              <span className="font-headline-md text-headline-md text-bone-ivory tracking-wide uppercase">Network</span>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#" onClick={(e) => { e.preventDefault(); onOpenAbout?.(); }}>About the Game</a>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#" onClick={(e) => { e.preventDefault(); onOpenPolicy?.(); }}>Privacy Policy</a>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#" onClick={(e) => { e.preventDefault(); onOpenPolicy?.(); }}>Terms of Combat</a>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-lg bg-surface-container-lowest">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">© 2026 CHATURANGA BATTLE CHESS. ALL NIGHTMARES RESERVED.</span>
            <div className="flex items-center gap-space-md">
              <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors uppercase" href="#">DISCORD</a>
              <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors uppercase" href="#">TWITCH</a>
              <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors uppercase" href="#">X / TWITTER</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
