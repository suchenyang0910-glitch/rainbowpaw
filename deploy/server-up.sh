#!/usr/bin/env sh
set -e

docker compose --env-file deploy/.env.server \
  -f deploy/docker-compose.server.yml \
  -f deploy/docker-compose.server.http.yml \
  up -d --build
