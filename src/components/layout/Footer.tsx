

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
