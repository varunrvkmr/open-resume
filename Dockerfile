FROM node:18-alpine as production
WORKDIR /app
COPY . .
RUN npm install --include=dev
RUN npm run build

FROM node:18-alpine as development
WORKDIR /app
COPY . .
RUN npm install --include=dev
CMD ["npm", "run", "dev"]

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone .
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]