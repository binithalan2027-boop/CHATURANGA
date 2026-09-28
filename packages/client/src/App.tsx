import { useState } from 'react';
import LandingPage from './LandingPage';
import GameView from './GameView';
import { SocketProvider, useSocket } from './SocketContext';
import './index.css';

function MainApp() {
  const { connected, connect } = useSocket();

  if (connected) {
    return <GameView />;
  }

  return <LandingPage onPlay={() => connect()} />;
}

function App() {
  return (
    <SocketProvider>
      <MainApp />
    </SocketProvider>
  );
}

export default App;
