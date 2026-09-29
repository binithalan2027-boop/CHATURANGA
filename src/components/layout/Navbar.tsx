

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
