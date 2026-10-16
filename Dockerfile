# syntax=docker/dockerfile:1
# Chaturanga: single-container deploy (client build + Node/WS/SQLite server).
# Build:  docker build -t chaturanga .
# Run:    docker run -d --name chaturanga -p 127.0.0.1:8787:8787 \
#           --env-file .env -v chaturanga-data:/app/data chaturanga

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S chaturanga && adduser -S chaturanga -G chaturanga
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server ./server
# The server imports shared game logic from src/ (engine, crossRules, types).
COPY src/chaturanga ./src/chaturanga
COPY src/online ./src/online
RUN mkdir -p data && chown -R chaturanga:chaturanga /app
USER chaturanga
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8787/healthz || exit 1
CMD ["node", "--import", "tsx", "server/index.ts"]
