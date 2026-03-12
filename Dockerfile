FROM node:20-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY server.js ./
COPY public ./public

# Create data directory for SQLite database
RUN mkdir -p /data

EXPOSE 3333

CMD ["node", "server.js"]
