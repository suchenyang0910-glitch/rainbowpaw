FROM node:22-alpine AS build
WORKDIR /app

COPY services/wallet-service/package.json services/wallet-service/package-lock.json ./
RUN npm ci

COPY services/wallet-service ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3002
CMD ["node", "dist/main"]

