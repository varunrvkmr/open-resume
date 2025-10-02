FROM node:18-alpine as production
WORKDIR /app
COPY . .
RUN npm install --production
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]

FROM node:18-alpine as development
WORKDIR /app
COPY . .
RUN npm install --include=dev
CMD ["npm", "run", "dev"]