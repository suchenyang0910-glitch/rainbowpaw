FROM node:22-alpine AS build
WORKDIR /app

COPY services/identity-service/package.json services/identity-service/package-lock.json ./
RUN npm ci

COPY services/identity-service ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/main"]

