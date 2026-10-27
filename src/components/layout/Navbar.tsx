interface NavbarProps {
  user: { name: string; email: string } | null;
  onPlay: () => void;
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
  onLogin,
  onLogout,
  onOpenLearn,
  onOpenAbout,
  onOpenProfile,
  onOpenStamps,
  onOpenProgress,
}: NavbarProps) {
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
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[#262626] border border-white/5 py-1.5 px-2.5 sm:px-3 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#AFF65B]" />
              <button
                onClick={onOpenProfile}
                className="font-body text-xs font-medium text-[#F4F4F4] hover:text-[#AFF65B] bg-transparent border-none cursor-pointer truncate max-w-[80px] sm:max-w-[120px]"
              >
                {user.name}
              </button>
              <button
                onClick={onLogout}
                title="Log out"
                className="text-[#8A8A8A] hover:text-[#E5484D] text-xs bg-transparent border-none cursor-pointer ml-1"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="btn-raised text-xs py-1.5 px-3 sm:px-4 rounded-full font-medium"
            >
              Sign In
            </button>
          )}

          {/* The ONE lime action button */}
          <button
            onClick={onPlay}
            className="btn-lime text-xs py-2 px-3.5 sm:px-5 uppercase tracking-wider font-semibold whitespace-nowrap"
          >
            Play Now
          </button>
        </div>
      </div>
    </header>
  );
}
