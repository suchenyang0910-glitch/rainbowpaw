# P0 上线后 10 分钟验收清单（DoD Checklist）

> 目标：每次上线后 10 分钟内确认“第一条赚钱流水线”可跑通。

## 0. 上线前 2 分钟（一次性）

### 0.1 代码与容器更新
- 服务器：`git pull --ff-only`
- 重建并启动：`api-gateway`、`bots`、`web`

### 0.2 必要配置检查
- `PUBLIC_WEB_BASE_URL=https://rainbowpaw.org`
- `ADMIN_TELEGRAM_IDS=...`（管理员 Telegram 数字 ID，逗号分隔）
- `CLAW_BOT_TOKEN` / `RAINBOW_BOT_TOKEN`（至少一个可用）
- 管理员账号已与 bot 对话并 `/start`（否则无法主动推送）

---

## 1. 10 分钟验收脚本（从 Bot 到管理员收到通知）

### Step 1（1 分钟）：Claw Bot 新用户建档
操作：
- 打开 Claw Bot 发送 `/start`
- 依次点击：宠物类型 → 年龄段 → 体重段 → 健康问题

预期：
- 60 秒内进入主菜单（含 `Care Plan` / `Shop` / `Services`）

通过标准：
- 无报错、不卡死；能进入主菜单。

---

### Step 2（2 分钟）：护理建议（Care Plan）可用
操作：
- 点击 `Care Plan`（或抽奖后点 `Get Care Advice`）

预期：
- 返回 `Personalized Care Plan` 文案
- 有 `Subscribe Care Pack` 与 `Talk to Us` 按钮

通过标准：
- 文案与推荐能稳定返回（允许偶尔 fallback，但必须可继续购买路径）。

---

### Step 3（2 分钟）：从 Care 跳转商城
操作：
- 点击 `Subscribe Care Pack`

预期：
- 收到“打开 RainbowPaw 商城”按钮
- 点击后进入 RainbowPaw Bot（deep link）
- 如携带 `extra_data.path`，应出现“立即打开” WebApp 按钮

通过标准：
- 能进入商城购买入口（不要求精确落到某 SKU，但必须能进入可购买页面）。

---

### Step 4（3 分钟）：下单 → 提交凭证 → 管理员收到通知
操作：
- 在 WebApp（`/rainbowpaw/marketplace`）加入购物车并 Checkout
- 发起支付并提交支付凭证（文本或图片均可）

预期：
- 管理员 Telegram 在 10 秒内收到推送，包含：
  - `✅ 收到支付凭证`
  - `payment: <display_id>`
  - `proof_file: <链接>`（上传文件时）

通过标准：
- 管理员确实收到消息；proof_file 链接可打开。

---

### Step 5（2 分钟）：善终咨询预约 → 管理员收到通知
操作：
- 打开 `https://rainbowpaw.org/services` 创建一次预约

预期：
- 管理员收到 `🧾 新订单/咨询` 类通知（包含 booking_id 或 order_id）

通过标准：
- 管理员收到通知，能人工跟进。

---

## 2. 失败时的快速排障（3 分钟内定位）

### 2.1 管理员收不到通知
- 检查 `ADMIN_TELEGRAM_IDS` 是否正确
- 管理员是否对 bot `/start` 过
- 查 `api-gateway` 日志（过滤 telegram）：
  - 服务器：`docker logs --tail=200 deploy-api-gateway-1 | grep -i telegram`

### 2.2 Care Plan 一直 fallback 或报错
- 优先检查 identity 是否能返回画像（global_user_id 是否正确）

### 2.3 Bridge 跳转失败
- 检查 `BRIDGE_SERVICE_URL`、bridge-service 是否在线

