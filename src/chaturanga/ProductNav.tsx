import { usePreferences } from "./preferences";

export type NavTab = 'home' | 'play' | 'bots' | 'study' | 'training' | 'learn' | 'tournaments' | 'stamps' | 'profile' | 'drills' | 'online';

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
  onOnline?: () => void;
  user?: { name: string; email: string } | null;
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
  onOnline,
  user,
  onLogin,
  onLogout,
}: ProductNavProps) {
  const { open } = usePreferences();

  const navItems = [
    { id: 'home', label: 'Home', icon: '/icons/home.svg', action: onHome },
    { id: 'play', label: 'Play', icon: '/icons/play.svg', action: onPlay },
    { id: 'bots', label: 'Bots', icon: '/icons/swap.svg', action: onBots },
    { id: 'study', label: 'Study', icon: '/icons/study.svg', action: onStudy },
    { id: 'learn', label: 'Training', icon: '/icons/train.svg', action: onLearn },
    { id: 'tournaments', label: 'Tournaments', icon: '/icons/trophy.svg', action: onTournaments },
    ...(onOnline ? [{ id: 'online', label: 'Online', icon: '/icons/swap.svg', action: onOnline }] : []),
    ...(onProgress ? [{ id: 'progress', label: 'Progress', icon: '/icons/stamp.svg', action: onProgress }] : onStamps ? [{ id: 'stamps', label: 'Stamps', icon: '/icons/stamp.svg', action: onStamps }] : []),
    { id: 'profile', label: 'Profile', icon: '/icons/user.svg', action: onProfile },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full h-16 bg-[#1A1A1A] border-b border-white/5 px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onHome}
            className="flex items-baseline gap-2 bg-transparent border-none cursor-pointer p-0 text-left"
          >
            <span className="font-heading text-2xl lg:text-3xl tracking-wider text-[#F4F4F4]">
              CHATURANGA
            </span>
            <span className="hidden sm:inline-block font-body text-[10px] font-semibold tracking-[2px] text-[#AFF65B] uppercase">
              CHESS. REIMAGINED.
            </span>
          </button>
        </div>

        {/* User profile / session pill & Lime Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={open}
            title="Open board settings"
            className="hidden sm:flex items-center gap-1.5 text-xs font-body text-[#8A8A8A] hover:text-[#F4F4F4] bg-[#262626] border border-white/5 py-1.5 px-3 rounded-full cursor-pointer transition-colors"
          >
            <img src="/icons/gear.svg" alt="" className="w-3.5 h-3.5 opacity-70" />
            <span>Settings</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2 bg-[#262626] border border-white/5 py-1.5 px-3 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#AFF65B]" />
              <button
                onClick={onProfile}
                className="font-body text-xs font-medium text-[#F4F4F4] hover:text-[#AFF65B] bg-transparent border-none cursor-pointer truncate max-w-[100px]"
              >
                {user.name}
              </button>
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
                onClick={onLogin}
                className="btn-raised text-xs py-1.5 px-3 sm:px-4 rounded-full font-medium"
              >
                Sign In
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
            ...(onOnline ? [{ id: 'online', label: 'Online', icon: '/icons/swap.svg', action: onOnline }] : []),
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
