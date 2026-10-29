interface NavbarProps {
  user: { name: string; email: string; playerId?: string; provider?: string } | null;
  onPlay: () => void;
  onBots?: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onOpenLearn?: () => void;
  onOpenAbout?: () => void;
  onOpenProfile?: () => void;
  onOpenStamps?: () => void;
  onOpenProgress?: () => void;
}

export default function Navbar({
  user,
  onPlay,
  onBots,
  onLogin,
  onLogout,
  onOpenLearn,
  onOpenAbout,
  onOpenProfile,
  onOpenStamps,
  onOpenProgress,
}: NavbarProps) {
  const isGoogle = user?.provider === "google" || (user?.email && !user.email.includes("@chaturanga.local"));

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1A1A1A]/95 backdrop-blur-md border-b border-white/5">
      <div className="h-16 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={onPlay}
            className="flex items-baseline gap-2 bg-transparent border-none cursor-pointer p-0 text-left"
          >
            <span className="font-heading text-xl sm:text-3xl tracking-wider text-[#F4F4F4]">
              CHATURANGA
            </span>
            <span className="hidden md:inline-block text-[10px] font-body font-semibold tracking-[2px] text-[#AFF65B] uppercase">
              CHESS. REIMAGINED.
            </span>
          </button>
        </div>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={onPlay}
            className="text-xs font-body font-medium text-[#F4F4F4] hover:text-[#AFF65B] px-3 py-2 rounded-lg bg-transparent border-none cursor-pointer transition-colors"
          >
            Play
          </button>
          {onBots && (
            <button
              onClick={onBots}
              className="text-xs font-body font-medium text-[#8A8A8A] hover:text-[#AFF65B] px-3 py-2 rounded-lg bg-transparent border-none cursor-pointer transition-colors"
            >
              Bots
            </button>
          )}
          <a
            href="#modes-section"
            className="text-xs font-body font-medium text-[#8A8A8A] hover:text-[#F4F4F4] px-3 py-2 rounded-lg no-underline transition-colors"
          >
            Modes
          </a>
          {onOpenProgress ? (
            <button
              onClick={onOpenProgress}
              className="text-xs font-body font-medium text-[#8A8A8A] hover:text-[#AFF65B] px-3 py-2 rounded-lg bg-transparent border-none cursor-pointer transition-colors"
            >
              Progress
            </button>
          ) : onOpenStamps ? (
            <button
              onClick={onOpenStamps}
              className="text-xs font-body font-medium text-[#8A8A8A] hover:text-[#AFF65B] px-3 py-2 rounded-lg bg-transparent border-none cursor-pointer transition-colors"
            >
              Stamps
            </button>
          ) : null}
          {onOpenLearn && (
            <button
              onClick={onOpenLearn}
              className="text-xs font-body font-medium text-[#8A8A8A] hover:text-[#F4F4F4] px-3 py-2 rounded-lg bg-transparent border-none cursor-pointer transition-colors"
            >
              Study
            </button>
          )}
          {onOpenAbout && (
            <button
              onClick={onOpenAbout}
              className="text-xs font-body font-medium text-[#8A8A8A] hover:text-[#F4F4F4] px-3 py-2 rounded-lg bg-transparent border-none cursor-pointer transition-colors"
            >
              About
            </button>
          )}
        </nav>

        {/* Right CTA & Account */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user && isGoogle ? (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[#262626] border border-white/10 py-1.5 px-2.5 sm:px-3 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#AFF65B]" />
              <button
                onClick={onOpenProfile}
                className="font-body text-xs font-medium text-[#F4F4F4] hover:text-[#AFF65B] bg-transparent border-none cursor-pointer truncate max-w-[80px] sm:max-w-[120px]"
              >
                {user.name}
              </button>
              {user.playerId && (
                <span className="hidden sm:inline-block font-mono text-[10px] text-[#AFF65B] bg-[#0E0E0E] px-2 py-0.5 rounded-full border border-white/5">
                  ID: {user.playerId}
                </span>
              )}
              <button
                onClick={onLogout}
                title="Sign out"
                className="text-[#8A8A8A] hover:text-[#E5484D] text-xs bg-transparent border-none cursor-pointer ml-1"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className="flex items-center gap-2 bg-white hover:bg-[#F2F2F2] text-[#222] text-xs py-1.5 px-3 sm:px-4 rounded-full font-bold shadow-md cursor-pointer transition-all active:scale-95"
            >
              {/* Google G Icon */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.36 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.89 0 12c0 2.11.45 3.86 1.24 5.42l4.04-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}

          {/* The ONE lime action button */}
          <button
            onClick={onPlay}
            className="btn-lime text-xs py-2 px-3.5 sm:px-5 uppercase tracking-wider font-semibold whitespace-nowrap cursor-pointer"
          >
            Play Now
          </button>
        </div>
      </div>
    </header>
  );
}
