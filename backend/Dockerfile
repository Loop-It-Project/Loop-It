# --- Build Stage ---
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx drizzle-kit generate --config drizzle.config.ts
RUN npm run build

# --- Runtime Stage ---
FROM node:22-alpine
WORKDIR /app

# Kopiere alle notwendigen Dateien
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/src ./src
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY drizzle.config.ts ./
COPY entrypoint.sh ./

# FIX: Konvertiere Windows Line-Endings zu Unix
RUN sed -i 's/\r$//' entrypoint.sh

# Make executable
RUN chmod +x entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["sh", "./entrypoint.sh"]