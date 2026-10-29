import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HeroSection from './components/landing/HeroSection';
import ModesSection from './components/landing/ModesSection';

export interface LandingPageProps {
  user: { name: string; email: string } | null;
  onPlay: (mode?: string, timeMinutes?: number) => void;
  onRuleVariants?: () => void;
  onQuick?: () => void;
  onTraining?: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onChaturanga?: () => void;
  onChaturangaDemo?: () => void;
  onBots?: () => void;
  onOpenPolicy?: () => void;
  onOpenLearn?: () => void;
  onOpenAbout?: () => void;
  onOpenProfile?: () => void;
  onOpenStamps?: () => void;
  onOpenProgress?: () => void;
  onOpenFeedback?: () => void;
  onOpenFriendsSanctum?: () => void;
  onCreatePrivateRoom?: () => void;
  onOpenOnline?: () => void;
  matchStatus?: 'idle' | 'searching' | 'found';
  onSearchMatch?: () => void;
  onCancelMatch?: () => void;
}

export default function LandingPage(props: LandingPageProps) {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#0E0E0E] text-[#F4F4F4]">
      <Navbar
        user={props.user}
        onPlay={props.onPlay}
        onBots={props.onBots}
        onLogin={props.onLogin}
        onLogout={props.onLogout}
        onOpenLearn={props.onOpenLearn}
        onOpenAbout={props.onOpenAbout}
        onOpenProfile={props.onOpenProfile}
        onOpenStamps={props.onOpenStamps}
        onOpenProgress={props.onOpenProgress}
        onOpenFeedback={props.onOpenFeedback}
      />

      <main className="w-full pt-16 flex-1">
        <HeroSection
          onPlay={(timeMinutes) => props.onPlay(undefined, timeMinutes)}
          onBots={props.onBots}
          matchStatus={props.matchStatus || 'idle'}
          onSearchMatch={props.onSearchMatch || (() => props.onPlay())}
          onCancelMatch={props.onCancelMatch || (() => {})}
          onOpenFriendsSanctum={props.onOpenFriendsSanctum}
          onCreatePrivateRoom={props.onCreatePrivateRoom}
        />
        <ModesSection onPlayMode={(modeId) => props.onPlay(modeId)} />
      </main>

      <Footer
        onOpenPolicy={props.onOpenPolicy}
        onOpenAbout={props.onOpenAbout}
        onOpenLearn={props.onOpenLearn}
        onOpenFeedback={props.onOpenFeedback}
      />
    </div>
  );
}
