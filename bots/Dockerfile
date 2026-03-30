FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY bots/package.json bots/package-lock.json ./
RUN npm ci --omit=dev

COPY bots/src ./src

CMD ["node", "src/app.js"]

