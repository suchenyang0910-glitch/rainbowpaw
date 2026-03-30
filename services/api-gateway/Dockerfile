FROM node:22-alpine AS build
WORKDIR /app

COPY services/api-gateway/package.json services/api-gateway/package-lock.json ./
RUN npm ci

COPY services/api-gateway ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3012
CMD ["node", "dist/main"]

