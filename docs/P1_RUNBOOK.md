# P1 运行手册（增长闭环）

## 目的
把“归因 + 邀请 + 跟进”变成可重复执行的系统动作。

## 1) Referral（邀请）上线动作

### 数据库迁移
- 执行：`database/migrations/referrals_schema.sql`
- 结果：新增 `ops.referral_codes` 与 `ops.user_referrals`

### 运行校验
- A 用户打开 Claw Bot 的“分销中心”，生成 `ref_*` 邀请码并转发
- B 用户通过 `/start ref_*` 进入，并完成建档
- 预期：
  - `ops.user_referrals` 出现一条 invitee 绑定记录
  - 邀请双方各获得 3 点积分（points_locked）

## 2) 归因与 CRM（事件→线索）

### Bot 上报事件
Claw Bot 会在关键动作上报：
- 建档完成：`event_name=lead_submit`
- 点击购买护理包：`event_name=checkout_started`

事件包含最小字段：`country/city/language/session_id/utm/ref/chat_id/telegram_id`，用于 CRM 归并与追单。

### 运行校验
- 触发一次建档完成后，检查：
  - `crm.leads` 是否新增/更新
  - `crm.lead_events` 是否写入 `lead_submit`

## 3) 追单（Followups）

### 自动生成（已内置）
当写入以下事件时，会自动插入 `crm.followups`：
- `lead_submit`：立即 welcome + 2h 提醒
- `checkout_started/order_created/checkout_completed`：2h/24h 追单
- `aftercare*`：2h 咨询信息确认

### 执行到期追单
调用：`POST /api/admin/crm/followups/run-due`

请求示例：
```json
{ "limit": 50, "bot": "rainbow" }
```

预期：
- 到期 `pending` followups 会调用 Telegram 发送，并将状态更新为 `sent/failed`

