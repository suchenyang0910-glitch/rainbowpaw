FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_SUPPORT_LINK
ARG VITE_DEV_TELEGRAM_ID
ARG VITE_MOCK_INIT_DATA

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SUPPORT_LINK=$VITE_SUPPORT_LINK
ENV VITE_DEV_TELEGRAM_ID=$VITE_DEV_TELEGRAM_ID
ENV VITE_MOCK_INIT_DATA=$VITE_MOCK_INIT_DATA

COPY web-app/package.json web-app/package-lock.json ./
RUN npm ci

COPY web-app ./
RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
