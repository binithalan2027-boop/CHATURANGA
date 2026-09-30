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
import FriendsSanctumModal from './components/FriendsSanctumModal';
import LoadingVersusScreen from './components/LoadingVersusScreen';
import './index.css';

type Screen = 'landing' | 'auth' | 'bot_select' | 'versus' | 'playing' | 'policy' | 'learn' | 'about' | 'profile';

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

  const [showSanctum, setShowSanctum] = useState<boolean>(false);
  const [privateMatch, setPrivateMatch] = useState<{ roomCode: string; mode: 'host' | 'guest' } | null>(null);

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
      setGameMode('online_match');
      setScreen('versus');
    }
  }, [matchStatus, match]);

  const triggerPlay = () => {
    // Login is NOT mandatory - guests can play immediately
    setScreen('bot_select');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleStartPrivateMatch = (roomCode: string, mode: 'host' | 'guest') => {
    setShowSanctum(false);
    setPrivateMatch({ roomCode, mode });
    setGameMode('online_match');
    setScreen('versus');
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
          setScreen('versus');
        }}
        onBack={() => setScreen('landing')}
      />
    );
  }

  if (screen === 'versus') {
    const isOnline = gameMode === 'online_match';
    const playerInfo = {
      name: user?.name || 'Vanguard Commander',
      avatar: '👑',
      elo: 1500,
      title: 'FM',
      fideRating: 2310
    };
    const opponentInfo = isOnline ? {
      name: match?.opponentName || (privateMatch ? `Room Opponent (${privateMatch.roomCode.slice(0, 4)})` : 'Cursed Duelist'),
      avatar: '⚔️',
      elo: 1650,
      title: 'IM',
      fideRating: 2420
    } : {
      name: `Cursed Bot (${selectedElo} ELO)`,
      avatar: '💀',
      elo: selectedElo,
      title: selectedElo >= 2800 ? 'GM' : 'BOT'
    };

    return (
      <LoadingVersusScreen
        player={playerInfo}
        opponent={opponentInfo}
        onComplete={() => setScreen('playing')}
      />
    );
  }

  if (screen === 'playing') {
    if (gameMode === 'online_match') {
       return (
         <OnlineGameMode
           matchId={match?.matchId || (privateMatch ? `room-${privateMatch.roomCode}` : 'demo-online')}
           color={match?.color || (privateMatch?.mode === 'host' ? 'w' : 'b')}
           opponentName={match?.opponentName || 'Grim Rival'}
           playerName={user?.name || 'Player'}
           timeMinutes={timeMinutes}
           onExit={() => { stopSearch(); setPrivateMatch(null); setScreen('landing'); }}
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
    <>
      <LandingPage
        user={user}
        onPlay={triggerPlay}
        onLogin={() => setScreen('auth')}
        onLogout={handleLogout}
        onOpenPolicy={() => setScreen('policy')}
        onOpenLearn={() => setScreen('learn')}
        onOpenAbout={() => setScreen('about')}
        onOpenProfile={() => setScreen('profile')}
        onOpenFriendsSanctum={() => setShowSanctum(true)}
        matchStatus={matchStatus}
        onSearchMatch={startSearch}
        onCancelMatch={stopSearch}
      />
      {showSanctum && (
        <FriendsSanctumModal
          user={user}
          onClose={() => setShowSanctum(false)}
          onStartPrivateMatch={handleStartPrivateMatch}
        />
      )}
    </>
  );
}

export default App;
