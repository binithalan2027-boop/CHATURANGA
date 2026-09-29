import { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import AuthPage from './AuthPage';
import BotSelectScreen from './BotSelectScreen';
import OfflineGameView from './OfflineGameView';
import PolicyPage from './PolicyPage';
import LearnPage from './LearnPage';
import AboutPage from './AboutPage';
import { BotPersonality } from './ai/useStockfish';
import './index.css';

type Screen = 'landing' | 'auth' | 'bot_select' | 'playing' | 'policy' | 'learn' | 'about';

interface User {
  name: string;
  email: string;
}

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [selectedBot, setSelectedBot] = useState<BotPersonality>('martin');
  const [timeMinutes, setTimeMinutes] = useState<number>(10);
  const [gameMode, setGameMode] = useState<string>('standard');

  // Check for stored user on mount
  useEffect(() => {
    const stored = localStorage.getItem('chaturanga_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }

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
  }, []);

  const handleAuth = (u: User) => {
    setUser(u);
    localStorage.setItem('chaturanga_user', JSON.stringify(u));
    setScreen('bot_select');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('chaturanga_user');
    setScreen('landing');
  };

  const triggerPlay = () => {
    if (user) {
      setScreen('bot_select');
    } else {
      setScreen('auth');
    }
  };

  // --- PLAYING ---
  if (screen === 'playing') {
    return (
      <OfflineGameView
        botId={selectedBot}
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
        onStart={(botId, time, mode) => {
          setSelectedBot(botId);
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
    />
  );
}

export default App;
