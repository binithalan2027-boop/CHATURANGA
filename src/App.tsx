import { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import AuthPage from './AuthPage';
import BotSelectScreen from './BotSelectScreen';
import OfflineGameView from './OfflineGameView';
import PolicyPage from './PolicyPage';
import LearnPage from './LearnPage';
import AboutPage from './AboutPage';
import ProfilePage from './ProfilePage';
import './index.css';

type Screen = 'landing' | 'auth' | 'bot_select' | 'playing' | 'policy' | 'learn' | 'about' | 'profile';

interface User {
  name: string;
  email: string;
}

import { supabase } from './lib/supabase';

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [selectedElo, setSelectedElo] = useState<number>(1300);
  const [timeMinutes, setTimeMinutes] = useState<number>(10);
  const [gameMode, setGameMode] = useState<string>('standard');

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Player',
          email: session.user.email || ''
        });
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Player',
          email: session.user.email || ''
        });
      } else {
        setUser(null);
      }
    });

    // Admin / URL shortcuts
    const params = new URLSearchParams(window.location.search);
    if (params.has('admin') || params.has('play')) {
      setUser({ name: 'Admin', email: 'admin@chaturanga.dev' });
      setScreen('bot_select');
    } else if (params.has('policy')) {
      setScreen('policy');
    } else if (params.has('learn')) {
      setScreen('learn');
    } else if (params.has('about')) {
      setScreen('about');
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = (u: User) => {
    setUser(u);
    setScreen('bot_select');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setScreen('landing');
  };

  const triggerPlay = () => {
    if (user) {
      setScreen('bot_select');
    } else {
      setScreen('auth');
    }
  };

  if (screen === 'playing') {
    return (
      <OfflineGameView
        botElo={selectedElo}
        timeMinutes={timeMinutes}
        gameMode={gameMode as any}
        onExit={() => setScreen('bot_select')}
      />
    );
  }

  // --- BOT SELECT ---
  if (screen === 'bot_select') {
    return (
      <BotSelectScreen
        onStart={(elo, time, mode) => {
          setSelectedElo(elo);
          setTimeMinutes(time);
          setGameMode(mode);
          setScreen('playing');
        }}
        onBack={() => setScreen('landing')}
      />
    );
  }

  // --- AUTH ---
  if (screen === 'auth') {
    return (
      <AuthPage
        onAuth={handleAuth}
        onBack={() => setScreen('landing')}
      />
    );
  }

  // --- POLICY ---
  if (screen === 'policy') {
    return <PolicyPage onBack={() => setScreen('landing')} />;
  }

  // --- LEARN ---
  if (screen === 'learn') {
    return (
      <LearnPage
        onBack={() => setScreen('landing')}
        onPlay={triggerPlay}
      />
    );
  }

  // --- ABOUT ---
  if (screen === 'about') {
    return (
      <AboutPage
        onBack={() => setScreen('landing')}
        onPlay={triggerPlay}
      />
    );
  }

  // --- PROFILE ---
  if (screen === 'profile') {
    return (
      <ProfilePage
        user={user}
        onBack={() => setScreen('landing')}
      />
    );
  }

  // --- LANDING ---
  return (
    <LandingPage
      user={user}
      onPlay={triggerPlay}
      onLogin={() => setScreen('auth')}
      onLogout={handleLogout}
      onOpenPolicy={() => setScreen('policy')}
      onOpenLearn={() => setScreen('learn')}
      onOpenAbout={() => setScreen('about')}
      onOpenProfile={() => setScreen('profile')}
    />
  );
}

export default App;
