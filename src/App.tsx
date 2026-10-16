import { useState, useEffect, lazy, Suspense } from "react";
import { PreferenceProvider } from "./chaturanga/preferences";
import ProductNav from "./chaturanga/ProductNav";
const TournamentPage = lazy(() => import("./chaturanga/TournamentPage"));
const TrainingPage = lazy(() => import("./chaturanga/TrainingPage"));
const StudyBoard = lazy(() => import("./chaturanga/StudyBoard"));
const ChaturangaMode = lazy(() => import("./chaturanga/ChaturangaMode"));
import LandingPage from "./LandingPage";
const AuthPage = lazy(() => import("./AuthPage"));
const BotSelectScreen = lazy(() => import("./BotSelectScreen"));
const DrillsPage = lazy(() => import("./chaturanga/DrillsPage"));
const OfflineGameView = lazy(() => import("./OfflineGameView"));
const OnlinePage = lazy(() => import("./online/OnlinePage"));
const PolicyPage = lazy(() => import("./PolicyPage"));
const LearnPage = lazy(() => import("./LearnPage"));
const AboutPage = lazy(() => import("./AboutPage"));

import "./index.css";
import "./design-v7.css";

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
  | "profile";

interface User {
  id: string;
  name: string;
  email: string;
}

import { authConfigured, getSupabase } from "./lib/supabase";

function AppContent() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [user, setUser] = useState<User | null>(null);
  const [selectedElo, setSelectedElo] = useState<number>(1300);
  const [timeMinutes, setTimeMinutes] = useState<number>(10);
  const [gameMode, setGameMode] = useState<string>("standard");

  useEffect(() => {
    if (!authConfigured) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    void getSupabase().then((supabase) => {
      if (cancelled) return;
      supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name:
            session.user.user_metadata?.display_name ||
            session.user.email?.split("@")[0] ||
            "Player",
          email: session.user.email || "",
        });
      }
    });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name:
            session.user.user_metadata?.display_name ||
            session.user.email?.split("@")[0] ||
            "Player",
          email: session.user.email || "",
        });
      } else {
        setUser(null);
      }
    });

      unsubscribe = () => subscription.unsubscribe();
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const triggerPlay = () => {
    // Login is NOT mandatory - guests can play immediately
    setScreen("bot_select");
  };

  const handleLogout = async () => {
    await (await getSupabase()).auth.signOut();
    setUser(null);
  };

  const renderScreen = () => {
    if (screen === "online" || screen === "friends" || screen === "profile")
      return (
        <OnlinePage
          onExit={() => setScreen("landing")}
          initialTab={
            screen === "friends"
              ? "friends"
              : screen === "profile"
                ? "profile"
                : "play"
          }
        />
      );
    if (screen === "rule_variants")
      return <VariantPage onExit={() => setScreen("landing")} />;
    if (screen === "drills")
      return <DrillsPage onExit={() => setScreen("landing")} />;
    if (screen === "tournaments")
      return <TournamentPage onExit={() => setScreen("landing")} />;
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

    if (screen === "quick")
      return (
        <ChaturangaMode
          initialMode="classic"
          quickStart
          onExit={() => setScreen("landing")}
        />
      );
    if (screen === "bots")
      return (
        <ChaturangaMode
          initialMode="classic"
          onExit={() => setScreen("landing")}
        />
      );

    if (screen === "chaturanga")
      return (
        <ChaturangaMode key="chaturanga" onExit={() => setScreen("landing")} />
      );
    if (screen === "chaturanga_demo")
      return (
        <ChaturangaMode
          key="chaturanga-demo"
          demo
          onExit={() => setScreen("landing")}
        />
      );

    if (screen === "bot_select") {
      return (
        <BotSelectScreen
          onStart={(elo, time, mode) => {
            setSelectedElo(elo);
            setTimeMinutes(time);
            setGameMode(mode);
            setScreen("playing");
          }}
          onBack={() => setScreen("landing")}
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
              | "spell"
              | "math"
              | "matiks"
          }
          onExit={() => setScreen("bot_select")}
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
          onLogin={() => setScreen("auth")}
          onLogout={handleLogout}
          onOpenPolicy={() => setScreen("policy")}
          onOpenLearn={() => setScreen("learn")}
          onOpenAbout={() => setScreen("about")}
          onOpenProfile={() => setScreen("profile")}
          onOpenFriendsSanctum={() => setScreen("friends")}
          onSearchMatch={() => setScreen("online")}
        />
      </>
    );
  };
  return (
    <>
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
                  : screen === "bots"
                    ? "bots"
                    : screen === "learn"
                      ? "learn"
                      : screen === "profile"
                        ? "profile"
                        : "play"
        }
        onHome={() => setScreen("landing")}
        onPlay={() => setScreen("chaturanga")}
        onBots={() => setScreen("bots")}
        onTournaments={() => setScreen("tournaments")}
        onStudy={() => setScreen("study")}
        onLearn={() => setScreen("training")}
        onDrills={() => setScreen("drills")}
        onProfile={() => setScreen("profile")}
        onOnline={() => setScreen("online")}
      />
      <div className="product-content">
        <Suspense
          fallback={
            <div className="courtyard court-setup" role="status">
              Opening your board…
            </div>
          }
        >
          {renderScreen()}
        </Suspense>
      </div>
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
