#!/usr/bin/env sh
set -eu

target="deploy/.env.server"
example="deploy/.env.server.example"

ensure_optional_keys() {
  f="$1"
  if ! grep -qE '^AI_VL_MODEL=' "$f" 2>/dev/null; then
    printf '%s\n' 'AI_VL_MODEL=' >> "$f"
  fi
  if ! grep -qE '^AI_VOICE_MODEL=' "$f" 2>/dev/null; then
    printf '%s\n' 'AI_VOICE_MODEL=' >> "$f"
  fi
}

if [ -f "$target" ]; then
  ensure_optional_keys "$target"
  printf '%s\n' "SKIP: $target exists (ensured optional keys)"
  exit 0
fi

if [ ! -f "$example" ]; then
  printf '%s\n' "找不到示例文件：$example"
  exit 1
fi

gen_token() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
    return
  fi
  if [ -r /dev/urandom ]; then
    dd if=/dev/urandom bs=32 count=1 2>/dev/null | od -An -tx1 | tr -d ' \n'
    return
  fi
  date +%s | od -An -tx1 | tr -d ' \n'
}

INTERNAL_TOKEN_VALUE="$(gen_token)"
POSTGRES_PASSWORD_VALUE="$(gen_token)"

tmp="${target}.tmp"
cp "$example" "$tmp"

if command -v perl >/dev/null 2>&1; then
  perl -0777 -i -pe "s/^INTERNAL_TOKEN=.*/INTERNAL_TOKEN=$INTERNAL_TOKEN_VALUE/m; s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD_VALUE/m" "$tmp"
else
  awk -v t="$INTERNAL_TOKEN_VALUE" -v p="$POSTGRES_PASSWORD_VALUE" 'BEGIN{OFS=FS} { if ($0 ~ /^INTERNAL_TOKEN=/) { print "INTERNAL_TOKEN=" t; next } if ($0 ~ /^POSTGRES_PASSWORD=/) { print "POSTGRES_PASSWORD=" p; next } print $0 }' "$tmp" > "$target"
  rm -f "$tmp"
  printf '%s\n' "已生成：$target"
  exit 0
fi

mv "$tmp" "$target"
ensure_optional_keys "$target"
printf '%s\n' "已生成：$target"
