# --- Build Stage ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# RUN npx drizzle-kit generate --config drizzle.config.ts  # ← ENTFERNT: Verwende committed migrations
RUN npm run build

# --- Runtime Stage ---
FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/src ./src
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY drizzle.config.ts ./

# Robustes entrypoint.sh verwenden
COPY entrypoint.sh ./
RUN sed -i 's/\r$//' entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 3000

# Entrypoint statt CMD
ENTRYPOINT ["sh", "./entrypoint.sh"]