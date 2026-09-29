import { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import AuthPage from './AuthPage';
import BotSelectScreen from './BotSelectScreen';
import OfflineGameView from './OfflineGameView';
import { BotPersonality } from './ai/useStockfish';
import './index.css';

type Screen = 'landing' | 'auth' | 'bot_select' | 'playing';

interface User {
  name: string;
  email: string;
}

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [selectedBot, setSelectedBot] = useState<BotPersonality>('martin');
  const [timeMinutes, setTimeMinutes] = useState<number>(10);

  // Check for stored user on mount
  useEffect(() => {
    const stored = localStorage.getItem('chaturanga_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }

    // Admin shortcut
    const params = new URLSearchParams(window.location.search);
    if (params.has('admin') || params.has('play')) {
      setUser({ name: 'Admin', email: 'admin@chaturanga.dev' });
      setScreen('bot_select');
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

  // --- PLAYING ---
  if (screen === 'playing') {
    return (
      <OfflineGameView
        botId={selectedBot}
        timeMinutes={timeMinutes}
        onExit={() => setScreen('bot_select')}
      />
    );
  }

  // --- BOT SELECT ---
  if (screen === 'bot_select') {
    return (
      <BotSelectScreen
        onStart={(botId, time) => {
          setSelectedBot(botId);
          setTimeMinutes(time);
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

  // --- LANDING ---
  return (
    <LandingPage
      user={user}
      onPlay={() => {
        if (user) {
          setScreen('bot_select');
        } else {
          setScreen('auth');
        }
      }}
      onLogin={() => setScreen('auth')}
      onLogout={handleLogout}
    />
  );
}

export default App;
