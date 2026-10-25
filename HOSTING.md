# Hosting CHATURANGA 24/7 (Online Multiplayer & Game Server)

This guide explains how to host CHATURANGA online 24/7 so that anyone around the world can play multiplayer matches, create private rooms with 6-digit codes, and play against bots anytime.

---

## Architecture Overview

CHATURANGA is designed as an **all-in-one single-process deploy**:
- **Frontend**: React + Vite + Tailwind + WebAudio (compiled into `/dist`).
- **Backend API & WebSockets**: Node.js + WebSocket (`/api/live`) + SQLite database (`data/chaturanga.sqlite`).
- When started in production (`npm run server`), the backend serves both the static frontend and the live multiplayer WebSocket server on a single port.

---

## Option 1: Render.com (Recommended — 100% Free, 24/7, Automatic SSL)

The repository already includes `render.yaml` for automatic 1-click configuration.

### Steps:
1. Go to [https://render.com](https://render.com) and create a free account (sign in with GitHub).
2. Click **New +** → **Web Service**.
3. Select **Build and deploy from a Git repository**.
4. Choose your repository: `binithalan2027-boop/CHATURANGA`.
5. Render will automatically detect the settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run server`
   - **Plan**: `Free`
6. Click **Deploy Web Service**.
7. In ~2 minutes, Render will provide a live public HTTPS link (e.g., `https://chaturanga.onrender.com`).
   - Anyone opening that link can play online 24/7!
   - Every time you push to `main`, Render automatically rebuilds and deploys the update.

---

## Option 2: Railway.app (Instant Deploy with Persistent SQLite Storage)

The repository includes `railway.json`.

### Steps:
1. Go to [https://railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo** → select `CHATURANGA`.
3. Railway automatically detects `railway.json` and builds the project.
4. Go to **Settings** → **Networking** → **Generate Domain**.
5. Your game is live 24/7 at `https://chaturanga.up.railway.app`.

*(Optional)* Under **Volumes**, click **Add Volume** and mount `/app/data` to keep user ratings, match history, and custom rooms permanently saved across server restarts.

---

## Option 3: Docker / Fly.io / VPS / Cloud Run

The repository includes a multi-stage `Dockerfile` (`node:22-alpine`):

```bash
# Build the Docker container
docker build -t chaturanga .

# Run the container (binds to port 8787 with persistent volume)
docker run -d \
  --name chaturanga \
  -p 8787:8787 \
  -v chaturanga_data:/app/data \
  --restart unless-stopped \
  chaturanga
```

### Deploy to Fly.io:
```bash
fly launch
fly deploy
```

---

## Option 4: Run 24/7 on your Own Machine or Windows VPS (Free Cloudflare Tunnel)

If you have a computer or Windows VPS running, you can expose your local server to the whole world with a permanent, secure HTTPS domain using Cloudflare's free tunnel (no port forwarding or static IP needed):

1. Install Cloudflare Tunnel (`cloudflared`):
   ```powershell
   winget install Cloudflare.cloudflared
   ```
2. Run your server in the background:
   ```powershell
   npm run build
   npm run server
   ```
3. Expose it securely to the world:
   ```powershell
   cloudflared tunnel --url http://127.0.0.1:8787
   ```
4. Cloudflare outputs a permanent public URL (e.g., `https://xyz.trycloudflare.com`) that anyone can open from anywhere.

---

## Environment Variables Reference

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `8787` | Port for the HTTP and WebSocket server (Render/Railway set this automatically). |
| `HOST` | `0.0.0.0` (prod) / `127.0.0.1` (dev) | Network interface to bind to. |
| `AUTH_MODE` | `local` | `local` provides instant guest ID / local sessions. `supabase` enables social OAuth. |
| `ALLOWED_ORIGINS` | `*` | Allowed CORS origins for the API and WebSocket connections. |
| `DB_PATH` | `data/chaturanga.sqlite` | SQLite file location. |
