FROM node:22-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies first (for building)
RUN npm ci && npm cache clean --force

# Copy source code and build
COPY . .
RUN npm run build

# Setup entrypoint (keep dev dependencies for drizzle-kit)
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]