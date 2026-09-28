import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { StandardChessRuleset, FogOfWarRuleset, GameState, Command } from '@chaturanga/shared';
import crypto from 'crypto';

const port = 11429;
const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const ruleset = new FogOfWarRuleset(); // Phase 3: Now running Fog of War!
let gameState: GameState | null = null;
const players: { w?: string; b?: string } = {};
const clients = new Map<string, WebSocket>();

function broadcastState() {
  if (!gameState) return;
  for (const [sessionId, ws] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      const color = players.w === sessionId ? 'w' : players.b === sessionId ? 'b' : 'w'; // default spectator to w view for now
      const playerView = ruleset.getPlayerView(gameState, color);
      ws.send(JSON.stringify({ type: 'state', state: playerView }));
    }
  }
}

wss.on('connection', (ws) => {
  const sessionId = crypto.randomUUID();
  clients.set(sessionId, ws);
  console.log(`[Server] Player connected: ${sessionId}`);

  // Auto-seat players
  if (!players.w) {
    players.w = sessionId;
    ws.send(JSON.stringify({ type: 'seat', color: 'w' }));
  } else if (!players.b) {
    players.b = sessionId;
    ws.send(JSON.stringify({ type: 'seat', color: 'b' }));
  } else {
    ws.send(JSON.stringify({ type: 'seat', color: 'spectator' }));
  }

  // Start game if 2 players
  if (players.w && players.b && !gameState) {
    gameState = ruleset.getInitialState(players);
    broadcastState();
  } else if (gameState) {
    // Send current state to reconnecting/spectating client
    const color = players.w === sessionId ? 'w' : players.b === sessionId ? 'b' : 'w';
    ws.send(JSON.stringify({ type: 'state', state: ruleset.getPlayerView(gameState, color) }));
  }

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'command') {
        const cmd = message.command as Command;
        
        if (!gameState) return;

        // Map sessionId to color
        const color = players.w === sessionId ? 'w' : players.b === sessionId ? 'b' : null;
        if (color !== cmd.playerColor) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not your turn or spectator' }));
          return;
        }

        const result = ruleset.applyCommand(gameState, cmd);
        if (result.error) {
          ws.send(JSON.stringify({ type: 'error', message: result.error }));
          return;
        }

        gameState = result.newState;
        broadcastState();
      }
    } catch (e) {
      console.error('Invalid message', e);
    }
  });

  ws.on('close', () => {
    clients.delete(sessionId);
    if (players.w === sessionId) delete players.w;
    if (players.b === sessionId) delete players.b;
    console.log(`[Server] Player disconnected: ${sessionId}`);
  });
});

function broadcast(msg: any) {
  const payload = JSON.stringify(msg);
  for (const client of clients.values()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

server.listen(port, () => {
  console.log(`[Chaturanga Server] Ultra-low latency WS running on ws://localhost:${port}`);
});
