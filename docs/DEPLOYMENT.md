# Chaturanga deployment guide (single server)

Last verified: 2026-10-13, against the v8 codebase. This deploys ONE Node.js
process serving the built client, the HTTP API and the WebSocket push channel,
with SQLite storage on disk. A reverse proxy (Caddy) terminates HTTPS/WSS.

Target: a small Ubuntu 24.04 VPS (1 vCPU / 1 GB RAM is enough to start).
Cost note: only the VPS and domain cost money. Everything here is free software.

## 0. What you need first (owner decisions, not done by the agent)

1. A domain (e.g. `chaturanga.me`) with DNS access.
2. A VPS (Hetzner, DigitalOcean, OVH, AWS Lightsail...). Ubuntu 24.04 image.
3. For public accounts: a Supabase project + OAuth apps (see
   docs/ONLINE-SETUP-v6.md for Supabase steps) and `PUBLIC_LEGAL_REVIEW=approved`
   only after the legal checklist in docs/LEGAL-HANDBOOK-v7.md is done.

## 1. DNS

Create an A record: `chaturanga.me` -> your VPS IPv4 address.
Optional AAAA record for IPv6. Wait until `dig +short chaturanga.me` answers.

## 2. Server base setup

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install ufw
sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw enable
```

## 3. Install the app - pick ONE of A (Docker) or B (bare metal)

### A. Docker (recommended)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # log out/in after this

# Get the code
git clone https://github.com/binithalan2027-boop/CHATURANGA.git
cd CHATURANGA
cp .env.example .env && nano .env   # see section 4

docker build -t chaturanga .
docker run -d --name chaturanga --restart unless-stopped \
  -p 127.0.0.1:8787:8787 --env-file .env \
  -v chaturanga-data:/app/data chaturanga
docker logs -f chaturanga   # should print "Chaturanga server: ..."
```

### B. Bare metal (systemd)

```bash
# Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt -y install nodejs

sudo useradd -r -m -d /opt/chaturanga chaturanga
sudo -u chaturanga git clone https://github.com/binithalan2027-boop/CHATURANGA.git /opt/chaturanga/app
cd /opt/chaturanga/app
sudo -u chaturanga npm ci
sudo -u chaturanga npm run build
sudo -u chaturanga cp .env.example .env   # edit it (section 4)
sudo cp deploy/chaturanga.service /etc/systemd/system/
# The unit already points at /opt/chaturanga/app (paths match this guide).
sudo systemctl daemon-reload && sudo systemctl enable --now chaturanga
journalctl -u chaturanga -f
```

## 4. Environment (.env)

Minimum production values:

```
AUTH_MODE=supabase            # after Supabase is configured; until then keep local and DO NOT expose publicly
NODE_ENV=production
HOST=127.0.0.1                # never bind 0.0.0.0; the proxy exposes it
PORT=8787
ALLOWED_ORIGINS=https://chaturanga.me
TRUST_PROXY=1
BEHIND_TLS=1
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...       # service-role key, needed so account deletion also deletes the auth identity
AUTH_PROVIDERS=google
PUBLIC_LEGAL_REVIEW=approved  # ONLY after legal/ops checklist is genuinely done
```

`AUTH_MODE=local` is refused when `NODE_ENV=production`; local is for
development only.

## 5. HTTPS + WebSocket with Caddy (recommended)

```bash
sudo apt install -y caddy
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile     # replace the domain placeholder
sudo systemctl reload caddy
```

Caddy gets and renews the Let's Encrypt certificate automatically, redirects
HTTP->HTTPS, and upgrades WebSocket connections (WSS) on `/api/live` with no
extra config. Check: `curl -I https://chaturanga.me/healthz` -> `200 OK`.

nginx alternative: `deploy/nginx.conf.sample` + `sudo certbot --nginx`.

## 6. Backups

The database is one SQLite file. Online-safe backup (works while running):

```bash
# Docker:
docker exec chaturanga npm run backup -- /app/data/backups
docker cp chaturanga:/app/data/backups ./backups
# Bare metal (first time: sudo -u chaturanga mkdir -p /opt/chaturanga/backups):
cd /opt/chaturanga/app && sudo -u chaturanga npm run backup -- /opt/chaturanga/backups
```

Daily cron (bare metal example):

```bash
echo '17 3 * * * chaturanga cd /opt/chaturanga/app && npm run backup -- /opt/chaturanga/backups && find /opt/chaturanga/backups -name "*.sqlite" -mtime +14 -delete' | sudo tee /etc/cron.d/chaturanga-backup
```

Copy backups off the box weekly (rsync/object storage). A backup on the same
disk is not a backup.

## 7. Restore

```bash
# Stop the server, replace the DB file, start again.
sudo systemctl stop chaturanga           # or: docker stop chaturanga
cp /opt/chaturanga/backups/chaturanga-YYYY-MM-DD.sqlite /opt/chaturanga/app/data/chaturanga.sqlite
sudo chown chaturanga:chaturanga /opt/chaturanga/app/data/chaturanga.sqlite
sudo systemctl start chaturanga          # or: docker start chaturanga
```

Verify: open the site, sign in, check game history loads. Old WAL/SHM files
(`-wal`, `-shm`) next to the DB should be removed before restoring.

## 8. Updates and rollback

```bash
git pull
npm ci && npm test && npm run build      # run the suite before deploying
# Docker: docker build -t chaturanga . && docker rm -f chaturanga && (run command from 3A)
# Bare metal: sudo systemctl restart chaturanga
```

Rollback: `git checkout <previous-commit>`, rebuild, restart. Database backups
from before the update still work (schema is additive only).

## 9. Health, logs, limits

- Health: `https://chaturanga.me/healthz` (200 ok). No auth needed.
- Logs: `journalctl -u chaturanga` or `docker logs chaturanga`.
- Retention sweeps run hourly (sessions, finished games after
  GAME_RETENTION_DAYS, reports after REPORT_RETENTION_DAYS) and log what they
  purge.
- Rate limits: 120 HTTP req/min/IP, 30 WS connects/min/IP, 20 concurrent
  sockets/IP, 240 game actions/min/player, 15 local signups/min/IP.
- Scale: single process, in-memory room index + SQLite. Comfortable for
  hundreds of concurrent players. Beyond that: move state to a proper DB and
  run multiple nodes behind sticky sessions (future work, not built).
- The 1-second push tick recomputes state only for connected players, once per
  player regardless of open tabs.

## 10. First public launch checklist

- [ ] DNS resolves; `https://<domain>` loads; WSS connects (watch the online page say "Connected").
- [ ] `AUTH_MODE=supabase`, social login completes a real round trip.
- [ ] Legal gates: operator identity, privacy contact monitored, grievance workflow staffed, `PUBLIC_LEGAL_REVIEW=approved` (docs/LEGAL-HANDBOOK-v7.md).
- [ ] Backups ran at least once; restore tested once on a scratch copy.
- [ ] `npm audit` shows zero; `npm test` green; browser regression scripts pass.
- [ ] Delete-account test: profile, games, sessions and Supabase auth identity all removed.
