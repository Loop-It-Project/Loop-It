# --- Build Stage ---
FROM node:lts-alpine AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Use Docker-specific vite config if it exists, otherwise use default
RUN if [ -f "vite.config.docker.js" ]; then \
      echo "Using Docker-specific Vite config"; \
      npm run build -- --config vite.config.docker.js; \
    else \
      echo "Using default Vite config"; \
      npm run build; \
    fi

# --- Production Stage ---
FROM nginx:alpine

# Copy custom nginx configuration FIRST!
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]