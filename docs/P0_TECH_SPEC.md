# P0 技术实现说明（接口/数据/通知闭环）

## 目标
把 P0 主链路做成“可跑通 + 可观测 + 可人工介入”的系统闭环。

## 统一口径（必须）
- 用户主键：`global_user_id`（identity-service 统一生成，Bot/Web 都以此为主）
- 重要事件都要有：`idempotency_key`（防重复扣费/重复下单/重复通知）
- API 统一前缀：对外走 `api-gateway` 的 `/api/*`

## 关键接口（P0 必跑通）

### 1) 用户建档（Identity）
- `POST /api/identity/link-user`
- `POST /api/identity/profile/:globalUserId/pet`

画像字段（最小）：
- `petType`（cat/dog）
- `petAgeStage`（<1/1-3/4-7/7+）
- `petWeightKg`（数值或区间映射）
- `healthIssues`（数组：joint/kidney/digestive/skin）

### 2) 护理推荐（AI Orchestrator）
- `POST /api/care/plan`（网关代理）
  - 网关会先 `GET identity/profile/:global_user_id` 获取画像
  - 再调用 `ai-orchestrator /ai/care/plan`

返回结构固定：
- `plan: string[]`
- `recommendedPack: {id,name,price}`
- `rationale?: string`

### 3) 商品下单与支付（MiniApp）
P0 要求：
- 下单能落库（订单号可追踪）
- 支付能对账（支付单号可追踪）
- 支付确认后才展示成功（轮询/回调）

关键接口：
- `POST /api/marketplace/checkout` 或 `POST /api/v1/orders/intake`
- `POST /api/payments/miniapp`（创建支付单）
- `GET /api/payments/:display_id`（轮询确认）
- `POST /api/payments/:id/proof` / `POST /api/payments/:id/proof_file`（人工凭证）

### 4) 跨 Bot 导流（Bridge）
- `POST /api/bridge/create`
  - 入参兼容：`global_user_id`、`to_bot`、`scene`、`extra_data`、`ttl_minutes`
  - 返回：`data.link`（deep link）

Rainbow Bot 在消费 token 后，如果 `extra_data.path` 存在，应发送 WebApp 按钮直接打开对应路径。

## 通知闭环（管理员 Telegram）

### 环境变量
- `ADMIN_TELEGRAM_IDS=123,456`
- `CLAW_BOT_TOKEN` 或 `RAINBOW_BOT_TOKEN`（用于发送通知）
- `PUBLIC_WEB_BASE_URL=https://rainbowpaw.org`（生成可点击链接）

### 触发点（P0 必须覆盖）
- 新订单/新咨询：订单创建时推送（包含 order_id、金额、联系方式/城市等）
- 支付凭证：凭证提交时推送（包含 payment_id、proof_file 链接）
- 新预约：服务预约创建时推送（包含 booking_id、时间、用户标识）

## 数据落库（P0 最小集合）
- `identity.*`：用户与画像
- `orders.*`：订单
- `payments.*`：支付映射与 webhook 事件
- `crm.*`：跟进与触达日志
- `risk.*`：活动日志与基础规则（保底即可）

## 可观测性（最小）
- 每个关键操作写一条 admin_audit_logs（谁做了什么）
- 订单/支付/预约都能通过 ID 查询到状态

## 上线检查清单（P0）
1) Bot 建档完成后，identity/profile 能查到画像字段
2) Bot 里 care plan 能返回推荐并能跳转到商店
3) 商店下单后能创建支付单并进入 pending 轮询
4) 提交凭证后管理员 Telegram 必收到通知
5) 创建预约后管理员 Telegram 必收到通知

