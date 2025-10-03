FROM node:18-alpine as production
WORKDIR /app
# Install wget for health checks
RUN apk add --no-cache wget
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm ci --only=production && npm cache clean --force

EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]

FROM node:18-alpine as development
WORKDIR /app
# Install wget for health checks
RUN apk add --no-cache wget
COPY . .
RUN npm install --include=dev
CMD ["npm", "run", "dev"]