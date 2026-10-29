
export type NavTab = 'home' | 'play' | 'bots' | 'study' | 'training' | 'learn' | 'tournaments' | 'stamps' | 'profile' | 'drills';

export interface ProductNavProps {
  active: string;
  onHome: () => void;
  onPlay: () => void;
  onBots: () => void;
  onLearn: () => void;
  onStudy: () => void;
  onTournaments: () => void;
  onProfile: () => void;
  onStamps?: () => void;
  onProgress?: () => void;
  onDrills?: () => void;
  user?: { name: string; email: string; playerId?: string; provider?: string } | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function ProductNav({
  active,
  onHome,
  onPlay,
  onBots,
  onLearn,
  onStudy,
  onTournaments,
  onProfile,
  onStamps,
  onProgress,
  user,
  onLogin,
  onLogout,
}: ProductNavProps) {

    const navItems = [
    { id: 'home', label: 'Home', icon: '/icons/home.svg', action: onHome },
    { id: 'play', label: 'Play', icon: '/icons/play.svg', action: onPlay },
    { id: 'bots', label: 'Bots', icon: '/icons/swap.svg', action: onBots },
    { id: 'study', label: 'Study', icon: '/icons/study.svg', action: onStudy },
    { id: 'learn', label: 'Training', icon: '/icons/train.svg', action: onLearn },
    { id: 'tournaments', label: 'Tournaments', icon: '/icons/trophy.svg', action: onTournaments },
    ...(onProgress ? [{ id: 'progress', label: 'Progress', icon: '/icons/stamp.svg', action: onProgress }] : onStamps ? [{ id: 'stamps', label: 'Stamps', icon: '/icons/stamp.svg', action: onStamps }] : []),
    { id: 'profile', label: 'Profile', icon: '/icons/user.svg', action: onProfile },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full h-16 bg-[#1A1A1A] border-b border-white/5 px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user && (user.provider === "google" || !user.email.includes("@chaturanga.local")) ? (
            <div className="flex items-center gap-2 bg-[#262626] border border-white/10 py-1.5 px-3 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#AFF65B]" />
              <button
                onClick={onProfile}
                className="font-body text-xs font-medium text-[#F4F4F4] hover:text-[#AFF65B] bg-transparent border-none cursor-pointer truncate max-w-[100px]"
              >
                {user.name}
              </button>
              {user.playerId && (
                <span className="hidden sm:inline-block font-mono text-[10px] text-[#AFF65B] bg-[#0E0E0E] px-2 py-0.5 rounded-full border border-white/5">
                  ID: {user.playerId}
                </span>
              )}
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="text-[#8A8A8A] hover:text-[#E5484D] text-xs bg-transparent border-none cursor-pointer ml-1"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            onLogin && (
              <button
                type="button"
                onClick={onLogin}
                className="flex items-center gap-2 bg-white hover:bg-[#F2F2F2] text-[#222] text-xs py-1.5 px-3 sm:px-4 rounded-full font-bold shadow-md cursor-pointer transition-all active:scale-95"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.36 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.89 0 12c0 2.11.45 3.86 1.24 5.42l4.04-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            )
          )}

          {/* The ONE Lime button */}
          <button
            onClick={onPlay}
            className="btn-lime text-xs py-2 px-3 sm:px-4 uppercase tracking-wider font-semibold whitespace-nowrap"
          >
            Play Free
          </button>
        </div>
      </header>

      {/* Persistent Left Rail Navigation for Desktop (hidden on screens < 1024px and on landing home) */}
      {active !== 'home' && (
        <aside className="hidden lg:flex flex-col w-56 fixed top-16 bottom-0 left-0 bg-[#1A1A1A] border-r border-white/5 p-4 z-30 justify-between">
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-body text-sm font-medium transition-all text-left border-none cursor-pointer ${
                    isActive
                      ? 'bg-[#262626] text-[#AFF65B] shadow-sm'
                      : 'bg-transparent text-[#8A8A8A] hover:text-[#F4F4F4] hover:bg-[#262626]/50'
                  }`}
                >
                  <img
                    src={item.icon}
                    alt=""
                    className={`w-5 h-5 transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}
                    style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(175, 246, 91, 0.6))' } : undefined}
                  />
                  <span className="tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer info in rail */}
          <div className="pt-4 border-t border-white/5 px-2">
            <div className="text-[10px] font-body text-[#AFF65B] font-semibold tracking-widest uppercase">
              MATIKS WEB
            </div>
            <div className="text-[10px] font-body text-[#8A8A8A] mt-0.5">
              Client-Side Offline Ready
            </div>
          </div>
        </aside>
      )}

      {/* Fixed Bottom Tab Bar for Mobile Phone Browsers (< 1024px and not on landing home) */}
      {active !== 'home' && (
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A1A] border-t border-white/10 flex items-center justify-around px-2 py-1"
          style={{ minHeight: '56px' }}
        >
          {[
            { id: 'home', label: 'Home', icon: '/icons/home.svg', action: onHome },
            { id: 'play', label: 'Play', icon: '/icons/play.svg', action: onPlay },
            { id: 'bots', label: 'Bots', icon: '/icons/swap.svg', action: onBots },
            ...(onStamps ? [{ id: 'stamps', label: 'Stamps', icon: '/icons/stamp.svg', action: onStamps }] : []),
            { id: 'profile', label: 'Profile', icon: '/icons/user.svg', action: onProfile },
          ].map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="flex flex-col items-center justify-center flex-1 py-1 bg-transparent border-none cursor-pointer"
                style={{ minHeight: '44px' }}
              >
                <img
                  src={item.icon}
                  alt=""
                  className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-50'}`}
                />
                <span
                  className={`text-[10px] font-body mt-1 ${
                    isActive ? 'text-[#AFF65B] font-semibold' : 'text-[#8A8A8A]'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
}
