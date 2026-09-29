import { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import AuthPage from './AuthPage';
import BotSelectScreen from './BotSelectScreen';
import OfflineGameView from './OfflineGameView';
import OnlineGameMode from './modes/OnlineGameMode';
import PolicyPage from './PolicyPage';
import LearnPage from './LearnPage';
import AboutPage from './AboutPage';
import ProfilePage from './ProfilePage';
import './index.css';

type Screen = 'landing' | 'auth' | 'bot_select' | 'playing' | 'policy' | 'learn' | 'about' | 'profile';

interface User {
  id: string;
  name: string;
  email: string;
}

import { supabase } from './lib/supabase';
import { useMatchmaking } from './lib/useMatchmaking';

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [selectedElo, setSelectedElo] = useState<number>(1300);
  const [timeMinutes, setTimeMinutes] = useState<number>(10);
  const [gameMode, setGameMode] = useState<string>('standard');

  const { status: matchStatus, match, startSearch, stopSearch } = useMatchmaking(user);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Player',
          email: session.user.email || ''
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Player',
          email: session.user.email || ''
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (matchStatus === 'found' && match) {
      // Transition to multiplayer match!
      setScreen('playing'); 
      setGameMode('online_match');
    }
  }, [matchStatus, match]);

  const triggerPlay = () => {
    if (user) {
      setScreen('bot_select');
    } else {
      setScreen('auth');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (screen === 'auth') {
    return (
      <AuthPage
        onAuth={(u) => {
          setUser(u);
          setScreen('landing');
        }}
        onBack={() => setScreen('landing')}
      />
    );
  }

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

  if (screen === 'playing') {
    if (gameMode === 'online_match' && match) {
       return (
         <OnlineGameMode
           matchId={match.matchId}
           color={match.color}
           opponentName={match.opponentName}
           playerName={user?.name || 'Player'}
           timeMinutes={timeMinutes}
           onExit={() => { stopSearch(); setScreen('landing'); }}
         />
       );
    }

    return (
      <OfflineGameView
        botElo={selectedElo}
        timeMinutes={timeMinutes}
        gameMode={gameMode as any}
        onExit={() => setScreen('bot_select')}
      />
    );
  }

  if (screen === 'policy') {
    return <PolicyPage onBack={() => setScreen('landing')} />;
  }

  if (screen === 'learn') {
    return <LearnPage onBack={() => setScreen('landing')} onPlay={triggerPlay} />;
  }

  if (screen === 'about') {
    return (
      <AboutPage
        onBack={() => setScreen('landing')}
        onPlay={triggerPlay}
      />
    );
  }

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
      matchStatus={matchStatus}
      onSearchMatch={startSearch}
      onCancelMatch={stopSearch}
    />
  );
}

export default App;
