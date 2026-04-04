# 自动化系统（完整路径）PRD

## 背景与目标

RainbowPaw 业务形态：宠物电商 + 善终服务（按国家/城市差异定价）+ 引流游戏（Claw）+ 分析/运营 bot。

目标：把“获客 → 私域承接 → 报价 → 付款 → 履约 → 复购召回”的重复工作交给系统自动化（n8n + AI + 事件闭环 + CRM）。

## 范围

渠道：TikTok / Facebook / Telegram

国家：越南（VN）/柬埔寨（KH）/泰国（TH）

私域承接：Telegram Bot 私聊为主，群为辅。

## 关键需求（核对清单）

### 1. 事件字段规范 + 去重策略

- 事件统一字段：`country/city/language/session_id/utm/ref`。
- `idempotency_key`：同一事件重试不重复入库。

验收：同一 `idempotency_key` 上报多次，最终只记录一次；关键事件在严格模式下缺字段会被拒绝。

### 2. adminBridgeSummary 真实统计

- admin 可查看近 24h：click/landing/leads/conversions，并按 campaign/scene 聚合。

验收：后台接口返回真实聚合数据，不再固定空数组。

### 3. 增加 CRM（最小版）

- lead 主表（阶段、归因、国家/城市/语言）
- lead 事件表（timeline）
- 阶段日志（stage_logs）

验收：事件上报后能自动写入/更新 lead，并可拉取 lead 列表与事件明细。

### 4. 事件 → CRM 归并逻辑

- 归并 key：`global_user_id` + `session_id` + `channel/utm`。

验收：同一用户同一 session 的多事件落到同一 `lead_id`。

### 5. 善终 pricebook（按国家/城市差价）

- 价目表支持 `country + city + package_code` 维度。
- 报价接口输出：base/pickup/weight/total。

验收：同参数下返回一致报价；不同城市/国家可返回不同报价。

### 6. n8n 所需接口（拉取/写回/发消息）

- 拉取待跟进 followups（到期、未完成）
- 写回跟进结果（sent/failed/done）
- 发送 Telegram 私聊消息并记录日志

验收：n8n 可用接口实现 D0/D1/D3/D7 自动跟进闭环。

### 7. AI Growth 内容生成落库（可追踪/可复用/可 AB）

- 生成内容支持保存到内容池（draft）。
- n8n/运营可拉取待发布内容。

验收：生成后可查询列表，内容可带 country/language/tone/topic。

### 8. AI 客服回复接入 bots（人审 + 风控）

- 后台可调用 AI 生成建议回复。
- 支持可选发送到 Telegram（默认建议先人审）。

验收：返回 reply；开启 send 时可发送并记录日志。

## 严格模式开关

- `EVENT_STRICT=true`：关键事件强制要求 `country/language/session_id/utm/ref`。

## 非目标

- 不在本轮实现“全自动投放/自动上架发布”。

