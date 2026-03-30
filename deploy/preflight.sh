#!/usr/bin/env sh
set -eu

env_file="deploy/.env.server"
example_file="deploy/.env.server.example"

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "缺少命令：$1"
}

need_cmd docker

if ! docker info >/dev/null 2>&1; then
  fail "Docker daemon 未就绪：请先启动 Docker（Linux: systemctl start docker；Docker Desktop: 打开应用并等待启动完成）"
fi

if [ ! -f "$env_file" ]; then
  if [ -f "$example_file" ]; then
    fail "未找到 $env_file。可先运行：sh deploy/gen-env.sh"
  fi
  fail "未找到 $env_file，且也没有示例文件 $example_file"
fi

get_kv() {
  key="$1"
  val="$(awk -F= -v k="$key" 'BEGIN{v=""} $0 ~ "^"k"=" {sub("^"k"=","",$0); v=$0} END{print v}' "$env_file")"
  printf '%s' "$val"
}

trim() {
  printf '%s' "$1" | awk '{$1=$1;print}'
}

INTERNAL_TOKEN_VAL="$(trim "$(get_kv INTERNAL_TOKEN)")"
AI_MOCK_MODE_VAL="$(trim "$(get_kv AI_MOCK_MODE)")"
AI_BASE_URL_VAL="$(trim "$(get_kv AI_BASE_URL)")"
AI_API_KEY_VAL="$(trim "$(get_kv AI_API_KEY)")"
DOMAIN_VAL="$(trim "$(get_kv DOMAIN)")"
PUBLIC_WEB_BASE_URL_VAL="$(trim "$(get_kv PUBLIC_WEB_BASE_URL)")"
VITE_API_BASE_URL_VAL="$(trim "$(get_kv VITE_API_BASE_URL)")"

if [ -z "$INTERNAL_TOKEN_VAL" ] || [ "$INTERNAL_TOKEN_VAL" = "change-me" ]; then
  fail "INTERNAL_TOKEN 未配置或仍为 change-me：请在 $env_file 中填写一个随机长 token"
fi

if [ "$AI_MOCK_MODE_VAL" != "true" ]; then
  if [ -z "$AI_BASE_URL_VAL" ]; then
    fail "AI_MOCK_MODE=false 时必须配置 AI_BASE_URL"
  fi
  if [ -z "$AI_API_KEY_VAL" ]; then
    fail "AI_MOCK_MODE=false 时必须配置 AI_API_KEY"
  fi
fi

if [ -z "$DOMAIN_VAL" ] || [ "$DOMAIN_VAL" = "your-domain.com" ]; then
  printf '%s\n' "WARN: DOMAIN 未配置或仍为 your-domain.com；使用 HTTPS(Caddy) 时需要把 DOMAIN 改成你的真实域名（例如 rainbowpaw.org）" >&2
fi

if [ -n "$PUBLIC_WEB_BASE_URL_VAL" ] && printf '%s' "$PUBLIC_WEB_BASE_URL_VAL" | grep -q 'your-domain.com'; then
  printf '%s\n' "WARN: PUBLIC_WEB_BASE_URL 仍包含 your-domain.com；建议改成你的真实域名（例如 https://rainbowpaw.org）" >&2
fi

if [ -n "$VITE_API_BASE_URL_VAL" ] && printf '%s' "$VITE_API_BASE_URL_VAL" | grep -q 'your-domain.com'; then
  printf '%s\n' "WARN: VITE_API_BASE_URL 仍包含 your-domain.com；建议改成你的真实域名（例如 https://rainbowpaw.org）" >&2
fi

printf '%s\n' "预检通过：Docker daemon 可用，关键环境变量满足启动条件"
