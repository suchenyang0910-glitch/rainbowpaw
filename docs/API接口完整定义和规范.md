# API 接口完整定义和规范

## 统一规范

### 1. 基础规范

**请求头**
- `Content-Type`: `application/json`
- `X-Request-Id`: `<uuid>`
- `X-Service-Name`: `claw-bot` | `rainbowpaw-bot` | `admin-bot`
- `Authorization`: `Bearer <internal-token>`

**成功响应格式**
```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

**失败响应格式**
```json
{
  "code": 40001,
  "message": "invalid parameter",
  "data": null
}
```

---

## 2. identity-service API

### 2.1 建立 / 获取统一用户
**`POST /identity/link-user`**

**请求**
```json
{
  "source_bot": "claw_bot",
  "source_user_id": "c_10001",
  "telegram_id": 123456789,
  "username": "test_user",
  "first_source": "tiktok"
}
```

**响应**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "global_user_id": "g_abc123",
    "is_new": true
  }
}
```
**逻辑**: 
1. 先按 `(source_bot, source_user_id)` 查。
2. 再按 `telegram_id` 查。
3. 都没有则创建。

### 2.2 查询用户画像
**`GET /identity/profile/:globalUserId`**

**响应**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "global_user_id": "g_abc123",
    "telegram_id": 123456789,
    "pet_type": "cat",
    "spend_total": 25.5,
    "spend_level": "mid",
    "status": "active",
    "tags": [
      {
        "tag_key": "toy_interest",
        "tag_value": "high",
        "score": 3
      }
    ]
  }
}
```

### 2.3 更新标签
**`POST /identity/tags/upsert`**

**请求**
```json
{
  "global_user_id": "g_abc123",
  "tags": [
    {
      "tag_key": "memorial_interest",
      "tag_value": "medium",
      "score": 2
    }
  ]
}
```

---

## 3. wallet-service API

### 3.1 查询钱包
**`GET /wallet/:globalUserId`**

**响应**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "global_user_id": "g_abc123",
    "points_total": 18.0,
    "points_locked": 12.4,
    "points_cashable": 5.6,
    "wallet_cash": 2.8
  }
}
```

### 3.2 发奖励 / 入账
**`POST /wallet/earn`**

**请求**
```json
{
  "global_user_id": "g_abc123",
  "biz_type": "referral_reward",
  "changes": [
    {
      "asset_type": "points_cashable",
      "amount": 2.0
    },
    {
      "asset_type": "points_locked",
      "amount": 2.0
    }
  ],
  "ref_type": "order",
  "ref_id": "o_10001",
  "remark": "referral reward"
}
```

### 3.3 消费 / 扣减
**`POST /wallet/spend`**

**请求**
```json
{
  "global_user_id": "g_abc123",
  "biz_type": "store_consume",
  "spend_amount": 10,
  "spend_strategy": "locked_first",
  "ref_type": "store_order",
  "ref_id": "so_10001",
  "remark": "buy product"
}
```
**逻辑**: 优先扣 `points_locked`，不足再扣 `points_cashable`。

### 3.4 回收商品
**`POST /wallet/recycle`**

**请求**
```json
{
  "global_user_id": "g_abc123",
  "biz_type": "claw_recycle",
  "origin_amount": 3.0,
  "recycle_amount": 2.4,
  "split_rule": {
    "locked_ratio": 0.6,
    "cashable_ratio": 0.4
  },
  "ref_type": "claw_play",
  "ref_id": "cp_10001"
}
```

**响应**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "points_locked_added": 1.44,
    "points_cashable_added": 0.96
  }
}
```

### 3.5 提现申请
**`POST /wallet/withdraw`**

**请求**
```json
{
  "global_user_id": "g_abc123",
  "points_cashable_amount": 20,
  "method": "usdt_trc20",
  "account_info": {
    "address": "Txxx..."
  }
}
```
**规则建议**: 至少 20 积分，2 积分 = 1 美元，平台手续费 5%-10%。

### 3.6 钱包流水
**`GET /wallet/logs/:globalUserId?page=1&pageSize=20`**

---

## 4. bridge-service API

### 4.1 上报事件
**`POST /bridge/events`**

**请求**
```json
{
  "event_name": "order_completed",
  "global_user_id": "g_abc123",
  "source_bot": "claw_bot",
  "source_user_id": "c_10001",
  "telegram_id": 123456789,
  "event_data": {
    "amount": 10,
    "currency": "USD",
    "order_type": "store"
  }
}
```

### 4.2 生成 deep link
**`POST /bridge/generate-link`**

**请求**
```json
{
  "global_user_id": "g_abc123",
  "from_bot": "claw_bot",
  "to_bot": "rainbowpaw_bot",
  "scene": "memorial",
  "extra_data": {
    "entry": "post_purchase"
  },
  "ttl_minutes": 1440
}
```

**响应**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "dl_xxx",
    "deep_link": "https://t.me/RainbowPawbot?start=dl_xxx"
  }
}
```

### 4.3 解析 deep link
**`GET /bridge/deep-link/:token`**

**响应**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "valid": true,
    "global_user_id": "g_abc123",
    "from_bot": "claw_bot",
    "to_bot": "rainbowpaw_bot",
    "scene": "memorial",
    "extra_data": {
      "entry": "post_purchase"
    }
  }
}
```
