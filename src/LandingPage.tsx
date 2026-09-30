
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
  onOpenFriendsSanctum?: () => void;
  matchStatus: 'idle' | 'searching' | 'found';
  onSearchMatch: () => void;
  onCancelMatch: () => void;
}

export default function LandingPage(props: LandingPageProps) {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Navbar {...props} />
      
      <main className="w-full pt-20 bg-void-black flex-1">
        <div className="flex flex-col w-full">
          <HeroSection 
            onPlay={props.onPlay}
            matchStatus={props.matchStatus}
            onSearchMatch={props.onSearchMatch}
            onCancelMatch={props.onCancelMatch}
            onOpenFriendsSanctum={props.onOpenFriendsSanctum}
          />
          <ModesSection />
        </div>
      </main>

      <Footer onOpenPolicy={props.onOpenPolicy} />
    </div>
  );
}
