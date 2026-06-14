# --- build stage ---
# node:20 (bookworm) inkluderer build-essential + python, så better-sqlite3 kan kompilere.
FROM node:20 AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY web/package.json web/package.json
COPY server/package.json server/package.json
RUN npm ci

COPY . .
RUN npm run build

# --- runtime stage ---
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/movemore.db \
    STATIC_ROOT=web/dist

# Kun det nødvendige: node_modules (med kompileret better-sqlite3) + byggede artefakter.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/web/dist ./web/dist
COPY --from=build /app/package.json ./package.json

RUN mkdir -p /data
EXPOSE 3000
CMD ["node", "server/dist/index.js"]
