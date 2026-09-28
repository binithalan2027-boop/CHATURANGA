import React, { createContext, useContext, useState } from 'react';
import { GameState, Command } from '@chaturanga/shared';

interface SocketContextValue {
  connected: boolean;
  gameState: GameState | null;
  playerColor: 'w' | 'b' | 'spectator' | null;
  error: string | null;
  connect: (variant: string) => void;
  sendCommand: (cmd: Command) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerColor, setPlayerColor] = useState<'w' | 'b' | 'spectator' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = (variant: string) => {
    if (ws) return;
    const socket = new WebSocket('ws://localhost:11429');
    
    socket.onopen = () => {
      setConnected(true);
      setError(null);
      socket.send(JSON.stringify({ type: 'join', variant }));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'seat') {
          setPlayerColor(msg.color);
        } else if (msg.type === 'state') {
          setGameState(msg.state);
        } else if (msg.type === 'error') {
          setError(msg.message);
          setTimeout(() => setError(null), 3000);
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    socket.onclose = () => {
      setConnected(false);
      setWs(null);
      setPlayerColor(null);
      setGameState(null);
    };

    setWs(socket);
  };

  const sendCommand = (cmd: Command) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'command', command: cmd }));
    }
  };

  return (
    <SocketContext.Provider value={{ connected, gameState, playerColor, error, connect, sendCommand }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
