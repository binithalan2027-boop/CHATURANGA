interface FooterProps {
  onOpenPolicy?: () => void;
  onOpenAbout?: () => void;
  onOpenLearn?: () => void;
  onOpenFeedback?: () => void;
}

export default function Footer({ onOpenPolicy, onOpenAbout, onOpenLearn, onOpenFeedback }: FooterProps) {
  return (
    <footer className="w-full bg-[#0E0E0E] border-t border-white/5 pt-12 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="flex flex-col gap-3 md:col-span-2">
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-2xl text-[#F4F4F4] tracking-wider">
              CHATURANGA
            </span>
            <span className="text-[10px] font-body text-[#AFF65B] font-semibold tracking-widest uppercase">
              MATIKS EDITION
            </span>
          </div>
          <p className="text-xs font-body text-[#8A8A8A] max-w-sm leading-relaxed">
            Desktop-first tactical battle chess platform. Five combat modes, Stockfish AI engine, and collectible postage-stamp achievements.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="font-heading text-base text-[#F4F4F4] tracking-wider mb-1 uppercase">
            Game Modes
          </h4>
          <span className="text-xs font-body text-[#8A8A8A]">Classic Chess</span>
          <span className="text-xs font-body text-[#8A8A8A]">Chess960 (Fischer Random)</span>
          <span className="text-xs font-body text-[#8A8A8A]">Fog of War</span>
          <span className="text-xs font-body text-[#8A8A8A]">Atomic Chess</span>
          <span className="text-xs font-body text-[#8A8A8A]">Chess MM (Mental Math)</span>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="font-heading text-base text-[#F4F4F4] tracking-wider mb-1 uppercase">
            Information
          </h4>
          {onOpenLearn && (
            <button
              onClick={onOpenLearn}
              className="text-xs font-body text-[#8A8A8A] hover:text-[#AFF65B] text-left bg-transparent border-none cursor-pointer p-0"
            >
              Study & Rules
            </button>
          )}
          {onOpenAbout && (
            <button
              onClick={onOpenAbout}
              className="text-xs font-body text-[#8A8A8A] hover:text-[#AFF65B] text-left bg-transparent border-none cursor-pointer p-0"
            >
              About Chaturanga
            </button>
          )}
          {onOpenPolicy && (
            <button
              onClick={onOpenPolicy}
              className="text-xs font-body text-[#8A8A8A] hover:text-[#AFF65B] text-left bg-transparent border-none cursor-pointer p-0"
            >
              Privacy & Local Storage
            </button>
          )}
          {onOpenFeedback && (
            <button
              onClick={onOpenFeedback}
              className="text-xs font-body text-[#8A8A8A] hover:text-[#AFF65B] text-left bg-transparent border-none cursor-pointer p-0 flex items-center gap-1.5"
            >
              <span>💬</span>
              <span>Feedback & New Modes</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-6 text-[11px] font-body text-[#8A8A8A]">
        <span>© 2026 Chaturanga. Built with React 18, TypeScript & Vite.</span>
        <span className="mt-2 sm:mt-0">Original SVG illustrations • SIL Open Font License fonts</span>
      </div>
    </footer>
  );
}
