# Architecture

## Overview
Chaturanga uses a standard authoritative-server real-time multiplayer architecture. The server holds the canonical game state and resolves all actions. Clients are "dumb" renderers that send intents (commands) and receive state updates (or partial views of the state).

## Stack
- **Client:** React + Vite + TypeScript.
- **Server:** Node.js + Express + Colyseus + TypeScript.
- **Shared:** TypeScript (types, constants, pure logic).
- **Monorepo:** npm workspaces (`packages/client`, `packages/server`, `packages/shared`).

## Tradeoffs and Decisions
- **Why React?** Massive ecosystem for complex UI animations (framer-motion, react-spring) and robust drag-and-drop libraries (dnd-kit), which are crucial for the "joyful, tactile" visual direction.
- **Why Colyseus?** Handles WebSocket room management, state synchronization, client reconnection, and basic rate-limiting out-of-the-box. Writing a custom socket.io room manager with state diffing and robust reconnect logic is time-consuming and error-prone. Colyseus abstracts this well.
- **Why not Next.js?** The core of the app is a real-time multiplayer board. Vercel (the default Next.js host) serverless functions don't support long-lived WebSockets. While we could use Next.js with a custom server or a separate WS server, a simple Vite SPA + a dedicated Node/Colyseus server is cleaner for a real-time MVP.
- **Persistence:** In the MVP phase, game state is stored entirely in memory within the Colyseus room instance on the server. There is no database. If the server restarts, ongoing games are lost. Client reconnects (e.g. refreshing the page) are supported via Colyseus's built-in session resumption, provided the server process hasn't restarted.

## Directory Structure
```
chaturanga/
├── docs/
├── package.json
└── packages/
    ├── client/        (React/Vite app)
    ├── server/        (Node/Colyseus server)
    └── shared/        (Shared types, constants, pure game logic/reducers)
```

## Security & Fog of War
- **No Client Trust:** The client never sends game state, only commands (e.g., `move(from, to)`).
- **Visibility Projection:** For Fog of War, the server maintains the canonical complete state. Before sending state to a client, the server projects a `PlayerView`. The server *must never* serialize hidden squares, unseen piece types, or complete move lists to the client. This projection happens on the server before Colyseus serializes the state.
