FROM node:18-alpine as production
WORKDIR /app
# Install wget for health checks
RUN apk add --no-cache wget
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]

FROM node:18-alpine as development
WORKDIR /app
# Install wget for health checks
RUN apk add --no-cache wget
COPY . .
RUN npm install --include=dev
CMD ["npm", "run", "dev"]