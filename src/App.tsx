import { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import OfflineGameView from './OfflineGameView';
import './index.css';

function App() {
  const [activeVariant, setActiveVariant] = useState<string | null>(null);

  // Secret admin entry: add ?admin to the URL to skip the landing page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('admin') || params.has('play')) {
      setActiveVariant('offline_ai');
    }
  }, []);

  if (activeVariant === 'offline_ai') {
    return <OfflineGameView onExit={() => setActiveVariant(null)} />;
  }

  return (
    <LandingPage onPlay={(variant) => setActiveVariant(variant)} />
  );
}

export default App;
