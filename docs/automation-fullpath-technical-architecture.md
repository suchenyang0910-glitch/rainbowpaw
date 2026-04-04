# 自动化系统（完整路径）技术架构

## 组件

- `api-gateway`：对外 API、admin API、事件入口 `/api/events`、CRM/报价/AI 内容接口。
- `bridge-service`：事件落库（`bridge.bridge_events`），提供 deep link 解析。
- `identity-service`：global_user_id 统一身份。
- `wallet-service`：积分与幂等扣款。
- `ai-orchestrator`：ops/growth/risk/support 等角色化 AI 能力。
- `web-app`：Web/miniapp 前端事件上报与内容展示。
- `n8n`（外部服务）：定时任务、跟进编排、内容分发。

## 数据表

- `bridge.bridge_events`：事件流（新增 `idempotency_key` 唯一索引）。
- `crm.leads`：线索主表。
- `crm.lead_events`：线索事件时间线。
- `crm.lead_stage_logs`：阶段变化审计（最小版）。
- `crm.followups`：待跟进任务队列。
- `crm.outreach_logs`：触达发送日志。
- `pricing.aftercare_pricebooks`：善终报价 pricebook（country+city+package_code）。
- `ai.growth_contents`：AI 增长内容池（draft）。

## 关键 API 面

### 事件

- `POST /api/events`
  - 输入：`event_name/source_bot/global_user_id?/event_data{country,city,language,session_id,utm,ref}`
  - 行为：补齐 `idempotency_key` 透传、写入 `bridge.bridge_events`、best-effort 写入 `crm`。
  - 严格模式：`EVENT_STRICT=true` 时对关键事件字段强校验。

### Admin（n8n 拉取/写回）

- `GET /api/admin/bridge/events`
- `GET /api/admin/bridge/reports/summary`
- `GET /api/admin/crm/leads`
- `GET /api/admin/crm/leads/:leadId/events`
- `GET /api/admin/crm/followups`
- `POST /api/admin/crm/followups`
- `POST /api/admin/crm/followups/:id/result`
- `POST /api/admin/outreach/telegram/send`

### 善终报价

- `POST /api/v1/aftercare/quote`

### AI

- `POST /api/admin/ai/growth/generate`（支持 `save=true`）
- `GET /api/admin/ai/growth/contents`
- `POST /api/admin/ai/support/reply`（支持 `send=true` 走 Telegram 发送）

## n8n 参考工作流

### D0/D1/D3/D7 自动跟进

1) Cron 触发 → `GET /api/admin/crm/followups?due_before=now&status=pending`
2) 逐条处理 → `POST /api/admin/outreach/telegram/send`
3) 成功 → `POST /api/admin/crm/followups/:id/result` status=sent/done；失败 status=failed 并写 last_error

### AI 内容分发

1) `POST /api/admin/ai/growth/generate`（save=true）生成入库
2) n8n 拉取 `GET /api/admin/ai/growth/contents?status=draft`
3) 人审后发布（外部发布系统）并回写 status（下一轮可加接口）

## 安全与配置

- `INTERNAL_TOKEN` 必须在生产配置，避免内部接口无鉴权。
- `EVENT_STRICT` 建议逐步开启（先观测缺字段比例，再强制）。
- Telegram 发送依赖 `RAINBOW_BOT_TOKEN/CLAW_BOT_TOKEN`。

