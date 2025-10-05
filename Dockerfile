FROM node:18-alpine as production
WORKDIR /app

# Install dependencies for building
RUN apk add --no-cache wget python3 make g++

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Verify the build exists
RUN ls -la .next/
RUN ls -la .next/standalone/ || echo "No standalone directory"

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

EXPOSE 3000

# Use npm start which should work with the built app
CMD ["npm", "start"]

FROM node:18-alpine as development
WORKDIR /app
# Install wget for health checks
RUN apk add --no-cache wget
COPY . .
RUN npm install --include=dev
CMD ["npm", "run", "dev"]