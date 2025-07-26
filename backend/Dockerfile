FROM node:22-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies first (for building)
RUN npm ci && npm cache clean --force

RUN mkdir uploads
RUN cd uploads && mkdir posts && mkdir profiles && mkdir temp
RUN cd ..

# Copy source code and build
COPY . .
RUN npm run build

RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]