import { useState, useEffect, lazy, Suspense } from "react";
import { PreferenceProvider } from "./chaturanga/preferences";
import ProductNav from "./chaturanga/ProductNav";
import { getCurrentUser, signOutUser, signInWithGoogle, onUserChange, ChaturangaUser } from "./services/authStore";
import GoogleAuthModal from "./components/auth/GoogleAuthModal";
import FeedbackModal from "./components/feedback/FeedbackModal";
const TournamentPage = lazy(() => import("./chaturanga/TournamentPage"));
const TrainingPage = lazy(() => import("./chaturanga/TrainingPage"));
const StudyBoard = lazy(() => import("./chaturanga/StudyBoard"));
import LandingPage from "./LandingPage";
const AuthPage = lazy(() => import("./AuthPage"));
const BotSelectScreen = lazy(() => import("./BotSelectScreen"));
const DrillsPage = lazy(() => import("./chaturanga/DrillsPage"));
const OfflineGameView = lazy(() => import("./OfflineGameView"));
const OnlinePage = lazy(() => import("./online/OnlinePage"));
const PolicyPage = lazy(() => import("./PolicyPage"));
const LearnPage = lazy(() => import("./LearnPage"));
const AboutPage = lazy(() => import("./AboutPage"));
const StampBookPage = lazy(() => import("./chaturanga/StampBookPage"));
const ProgressPage = lazy(() => import("./chaturanga/ProgressPage"));
const ProfilePage = lazy(() => import("./ProfilePage"));
import AchievementCelebration from "./chaturanga/AchievementCelebration";
import { Achievement } from "./chaturanga/achievements";

import "./index.css";
import "./chaturanga/matiks-theme.css";

const VariantPage = lazy(() => import("./chaturanga/VariantPage"));
type Screen =
  | "online"
  | "friends"
  | "drills"
  | "rule_variants"
  | "tournaments"
  | "training"
  | "study"
  | "quick"
  | "bots"
  | "chaturanga"
  | "chaturanga_demo"
  | "landing"
  | "auth"
  | "bot_select"
  | "versus"
  | "playing"
  | "policy"
  | "learn"
  | "about"
  | "profile"
  | "stamps"
  | "progress";

import { authConfigured, getSupabase } from "./lib/supabase";

function AppContent() {
  const [screen, setScreen] = useState<Screen>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get("room") || params.get("join");
      if (roomParam) return "online";
      const q = params.get("screen");
      if (q) return q as Screen;
    } catch {}
    return "landing";
  });
  const [onlineAutoCreate, setOnlineAutoCreate] = useState(false);
  const [user, setUser] = useState<ChaturangaUser>(() => getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  useEffect(() => {
    return onUserChange((u) => setUser(u));
  }, []);
  const [selectedElo, setSelectedElo] = useState<number>(1300);
  const [timeMinutes, setTimeMinutes] = useState<number>(10);
  const [gameMode, setGameMode] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const m = params.get("mode");
      if (m) return m;
    } catch {}
    return "standard";
  });
  const [mathSubMode, setMathSubMode] = useState<'showdown' | 'gate'>(() => {
    try {
      const sub = new URLSearchParams(window.location.search).get("submode");
      if (sub === 'gate' || sub === 'showdown') return sub;
    } catch {}
    return "showdown";
  });
  const [selectedPlayerColor, setSelectedPlayerColor] = useState<"w" | "b">("w");

  useEffect(() => {
    if (!authConfigured) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    void getSupabase().then((supabase) => {
      if (cancelled) return;
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          signInWithGoogle({
            name:
              session.user.user_metadata?.display_name ||
              session.user.email?.split("@")[0] ||
              "Player",
            email: session.user.email || "",
            picture: session.user.user_metadata?.avatar_url,
          });
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          signInWithGoogle({
            name:
              session.user.user_metadata?.display_name ||
              session.user.email?.split("@")[0] ||
              "Player",
            email: session.user.email || "",
            picture: session.user.user_metadata?.avatar_url,
          });
        }
      });

      unsubscribe = () => subscription.unsubscribe();
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const [celebratedAchievement, setCelebratedAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    const handleAchievementUnlocked = (e: Event) => {
      const customEvent = e as CustomEvent<Achievement>;
      if (customEvent.detail) {
        setCelebratedAchievement(customEvent.detail);
      }
    };

    window.addEventListener("chaturanga:achievement_unlocked", handleAchievementUnlocked);
    return () => {
      window.removeEventListener("chaturanga:achievement_unlocked", handleAchievementUnlocked);
    };
  }, []);

  const triggerPlay = (modeOrTime?: string | number, time?: number) => {
    // If a mode string is passed directly, jump straight into the match with that mode (no double selection!)
    if (typeof modeOrTime === "string") {
      setGameMode(modeOrTime);
      if (typeof time === "number") {
        setTimeMinutes(time);
      }
      setScreen("playing");
      return;
    }
    if (typeof modeOrTime === "number") {
      setTimeMinutes(modeOrTime);
    }
    // Clicking Play leads to the online game screen
    setScreen("online");
  };

  const handleLogout = async () => {
    signOutUser();
    if (authConfigured) {
      try {
        await (await getSupabase()).auth.signOut();
      } catch {}
    }
  };

  const renderScreen = () => {
    if (screen === "profile") {
      return (
        <ProfilePage
          user={user}
          onBack={() => setScreen("landing")}
          onOpenStamps={() => setScreen("stamps")}
          onOpenFeedback={() => setFeedbackModalOpen(true)}
          onOpenAuth={() => setAuthModalOpen(true)}
        />
      );
    }
    if (screen === "stamps") {
      return (
        <StampBookPage
          onPlay={triggerPlay}
          onBack={() => setScreen("landing")}
        />
      );
    }
    if (screen === "progress") {
      return (
        <ProgressPage
          onBack={() => setScreen("landing")}
          onOpenStampBook={() => setScreen("stamps")}
          onOpenDrills={() => setScreen("drills")}
        />
      );
    }
    if (screen === "online" || screen === "friends")
      return (
        <OnlinePage
          user={user}
          onExit={() => {
            setOnlineAutoCreate(false);
            setScreen("landing");
          }}
          onPlayBot={() => setScreen("bot_select")}
          onOpenAuth={() => setAuthModalOpen(true)}
          autoCreateRoom={onlineAutoCreate}
          initialTab={
            screen === "friends"
              ? "friends"
              : "play"
          }
        />
      );
    if (screen === "rule_variants")
      return <VariantPage onExit={() => setScreen("landing")} />;
    if (screen === "drills")
      return <DrillsPage onExit={() => setScreen("landing")} />;
    if (screen === "tournaments")
      return (
        <TournamentPage
          onExit={() => setScreen("landing")}
          onPlayBot={() => setScreen("bot_select")}
        />
      );
    if (screen === "training")
      return <TrainingPage onExit={() => setScreen("landing")} />;
    if (screen === "study")
      return <StudyBoard onExit={() => setScreen("landing")} />;
    if (screen === "auth") {
      return (
        <AuthPage
          onAuth={(u) => {
            setUser(u);
            setScreen("landing");
          }}
          onBack={() => setScreen("landing")}
        />
      );
    }

    if (screen === "quick") {
      return (
        <OfflineGameView
          botElo={1300}
          timeMinutes={10}
          gameMode="standard"
          onExit={() => setScreen("bot_select")}
        />
      );
    }

    if (screen === "bots" || screen === "chaturanga" || screen === "chaturanga_demo" || screen === "bot_select") {
      return (
        <BotSelectScreen
          initialTimeMinutes={timeMinutes}
          onStart={(elo, time, mode, subMode, color) => {
            setSelectedElo(elo);
            setTimeMinutes(time);
            setGameMode(mode);
            if (subMode === 'gate' || subMode === 'showdown') {
              setMathSubMode(subMode);
            }
            setSelectedPlayerColor(color || 'w');
            setScreen("playing");
          }}
          onBack={() => setScreen("landing")}
          onPlayOnline={() => setScreen("online")}
        />
      );
    }

    if (screen === "playing") {
      return (
        <OfflineGameView
          botElo={selectedElo}
          timeMinutes={timeMinutes}
          gameMode={
            gameMode as
              | "standard"
              | "chess960"
              | "fog"
              | "atomic"
              | "math"
              | "matiks"
              | "cross3"
              | "cross4"
          }
          mathSubMode={mathSubMode}
          playerColor={selectedPlayerColor}
          onExit={() =>
            setScreen(gameMode === "cross3" || gameMode === "cross4" ? "landing" : "bot_select")
          }
          onPlayOnline={() => {
            setScreen("online");
          }}
        />
      );
    }

    if (screen === "policy") {
      return <PolicyPage onBack={() => setScreen("landing")} />;
    }

    if (screen === "learn") {
      return (
        <LearnPage onBack={() => setScreen("landing")} onPlay={triggerPlay} />
      );
    }

    if (screen === "about") {
      return (
        <AboutPage onBack={() => setScreen("landing")} onPlay={triggerPlay} />
      );
    }

    // --- LANDING ---
    return (
      <>
        <LandingPage
          onRuleVariants={() => setScreen("rule_variants")}
          onQuick={() => setScreen("quick")}
          onTraining={() => setScreen("training")}
          onChaturanga={() => setScreen("chaturanga")}
          onChaturangaDemo={() => setScreen("chaturanga_demo")}
          onBots={() => setScreen("bots")}
          user={user}
          onPlay={triggerPlay}
          onLogin={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
          onOpenPolicy={() => setScreen("policy")}
          onOpenLearn={() => setScreen("learn")}
          onOpenAbout={() => setScreen("about")}
          onOpenProfile={() => setScreen("profile")}
          onOpenStamps={() => setScreen("stamps")}
          onOpenProgress={() => setScreen("progress")}
          onOpenOnline={() => setScreen("online")}
          onCreatePrivateRoom={() => {
            setOnlineAutoCreate(true);
            setScreen("online");
          }}
          onOpenFriendsSanctum={() => setScreen("friends")}
          onSearchMatch={() => setScreen("online")}
          onOpenFeedback={() => setFeedbackModalOpen(true)}
        />
      </>
    );
  };
  return (
    <>
      {screen !== "landing" && (
        <ProductNav
        active={
          screen === "drills"
            ? "drills"
            : screen === "tournaments"
              ? "tournaments"
              : screen === "training"
                ? "learn"
                : screen === "study"
                  ? "study"
                  : screen === "bots" || screen === "bot_select"
                    ? "bots"
                    : screen === "learn"
                      ? "learn"
                      : screen === "profile"
                        ? "profile"
                        : screen === "stamps" || screen === "progress"
                          ? "progress"
                          : screen === "online"
                            ? "online"
                            : "play"
        }
        onHome={() => setScreen("landing")}
        onPlay={() => setScreen("online")}
        onBots={() => setScreen("bot_select")}
        onTournaments={() => setScreen("tournaments")}
        onStudy={() => setScreen("study")}
        onLearn={() => setScreen("training")}
        onDrills={() => setScreen("drills")}
        onProfile={() => setScreen("profile")}
        onStamps={() => setScreen("stamps")}
        onProgress={() => setScreen("progress")}
        onOpenFeedback={() => setFeedbackModalOpen(true)}
        user={user}
        onLogin={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />
      )}
      <div className={`product-content ${screen === "landing" ? "w-full" : "w-full lg:pl-56 pb-16 lg:pb-0 min-h-[calc(100vh-64px)]"}`}>
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center text-[#AFF65B] font-heading text-2xl" role="status">
              Opening your board…
            </div>
          }
        >
          {renderScreen()}
        </Suspense>
      </div>
      {celebratedAchievement && (
        <AchievementCelebration
          achievement={celebratedAchievement}
          onDismiss={() => setCelebratedAchievement(null)}
        />
      )}
      <GoogleAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          setAuthModalOpen(false);
          setScreen("profile");
        }}
      />
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        user={user}
      />
    </>
  );
}

export default function App() {
  return (
    <PreferenceProvider>
      <AppContent />
    </PreferenceProvider>
  );
}
