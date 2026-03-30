# 服务器部署（单机 Docker Compose）

本项目可在一台 Linux 服务器上通过 Docker Compose 一键部署：Postgres/Redis + 5 个后端服务 + bots + web（Nginx 反代）。

## 1. 服务器准备

- 安装 Docker 与 Docker Compose plugin
- 开放端口：80（Web）。本部署默认不对外暴露 Postgres/Redis/api-gateway 端口。

## 2. 配置环境变量

在服务器上创建 `deploy/.env.server`（可从示例复制）：

- [deploy/.env.server.example](file:///d:/projects/rainbowpaw_new/deploy/.env.server.example)

也可以用脚本从示例生成（会自动生成随机的 `INTERNAL_TOKEN` 与 `POSTGRES_PASSWORD`）：

```bash
sh deploy/gen-env.sh
```

Windows PowerShell：

```powershell
powershell -ExecutionPolicy Bypass -File deploy\gen-env.ps1
```

说明：部分 Windows 终端会出现中文输出乱码，相关 PowerShell 脚本的提示信息统一使用英文以避免误判。

推荐先做一次预检（会检查 Docker daemon 是否可用，以及关键环境变量是否满足启动条件）：

```bash
sh deploy/preflight.sh
```

Windows PowerShell：

```powershell
powershell -ExecutionPolicy Bypass -File deploy\preflight.ps1
```

提示：如果你在 Windows 上本地调试并遇到 `dockerDesktopLinuxEngine` 相关报错，通常是 Docker Desktop 未启动或未启用 Linux Containers；先启动 Docker Desktop 再重试即可。

至少需要填写：

- `INTERNAL_TOKEN`
- `AI_API_KEY`（nvapi- 开头）
- `CLAW_BOT_TOKEN` / `RAINBOW_BOT_TOKEN`（如要启用 bots）
- `VITE_API_BASE_URL`（你的域名）
- `PUBLIC_WEB_BASE_URL`（你的域名，用于 Bot 菜单跳转）

## 3. 启动

在仓库根目录执行：

```bash
docker compose --env-file deploy/.env.server \
  -f deploy/docker-compose.server.yml \
  -f deploy/docker-compose.server.http.yml \
  up -d --build
```

Windows PowerShell：

```powershell
powershell -ExecutionPolicy Bypass -File deploy\server-up.ps1
```

如果你希望服务器直接自动签发 HTTPS（Let’s Encrypt），使用 Caddy 版本：

```bash
docker compose --env-file deploy/.env.server \
  -f deploy/docker-compose.server.yml \
  -f deploy/docker-compose.server.tls.yml \
  up -d --build
```

Windows PowerShell：

```powershell
powershell -ExecutionPolicy Bypass -File deploy\server-up-https.ps1
```

并在 `deploy/.env.server` 里配置 `DOMAIN=你的域名`（需要域名 A 记录已指向服务器公网 IP）。

## 4. 健康检查

- Web：`http://<你的域名>/`
- Admin：`http://<你的域名>/admin/`
- API（经 Nginx）：`http://<你的域名>/api/me`

后端联通（示例）：

```bash
curl -s http://<你的域名>/api/admin/ai/ops/daily | head
```

如需临时直连 `api-gateway` 做调试，可在 `deploy/docker-compose.server.yml` 里给 `api-gateway` 加 `ports: - "3012:3012"`。

## 5. 真实 NVIDIA 模型

把 `AI_MOCK_MODE=false`，并配置：

- `AI_BASE_URL=https://integrate.api.nvidia.com`
- `AI_CHAT_COMPLETIONS_PATH=/v1/chat/completions`
- `AI_EMBEDDINGS_PATH=/v1/embeddings`
- `AI_RERANK_PATH=/v1/ranking`
- `AI_PII_PATH=/v1/extract`

说明：chat 与 embeddings/ranking/pii 在 NVIDIA API Catalog 的不同模型上可能会出现差异；当某个 endpoint 返回结构不一致时，可先把该能力的开关关掉（例如 `AI_ENABLE_PII_REDACTION=false`）。
