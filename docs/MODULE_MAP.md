# RainbowPaw 模块地图（Module Map）

> 目的：把“已有 70% 代码”变成 30 天现金流主线。模块不删除，只标记优先级与状态。

## 状态定义
- `active`：未来 30 天主力开发（P0/P1），必须可跑通闭环并可观测。
- `stable`：能用先放着，只修阻塞主线的 bug。
- `icebox`：暂停开发，仅保留与兼容，等主线稳定后再放量。

## 模块清单（按目录）

| 模块 | 状态 | 作用 | 目录/入口 |
|---|---|---|---|
| Identity（用户识别/画像） | `active` | 用户建档、画像沉淀、跨 Bot 识别 | `services/identity-service` |
| API Gateway（统一对外） | `active` | `/api` 聚合、鉴权、业务编排 | `services/api-gateway` |
| Orders（订单） | `active` | 下单、订单状态、售后与交付 | `services/order-service` |
| CRM（跟进/成交） | `active` | 线索归并、跟进任务、触达日志 | `database/migrations/crm_schema.sql` + `web-app/src/admin/views/crm` |
| Aftercare（善终报价/咨询） | `active` | 高毛利服务承接、报价与预约 | `database/migrations/pricing_aftercare_*` |
| Web App（MiniApp + Admin） | `active` | 购买/咨询入口、后台运营 | `web-app` |
| Bridge（深链路） | `active` | 双 Bot/双 MiniApp 导流 | `services/bridge-service` |
| Payments（USDT/凭证/回调） | `active` | 现金流闭环、对账、通知 | `database/migrations/settlecore_*` + `services/api-gateway` |
| Bots（claw/rainbow/admin） | `active` | 入口、触达、人工成交接口 | `bots/src/routes` |
| Report（日报/汇总） | `stable` | 每日数据看板与健康检查 | `services/report-service` |
| Wallet（积分/余额） | `stable` | 主线只保留“可支付/可扣减/可对账” | `services/wallet-service` |
| AI Orchestrator（推荐/客服） | `stable` | 先服务 P0 推荐与客服，不做复杂多智能体 | `services/ai-orchestrator` |
| Claw（抽奖） | `icebox` | 当前作为“流量外挂”，不扩玩法 | `services/claw-service` + `bots/src/routes/claw` |
| Risk（风控） | `icebox` | 先保底规则与冻结，不做完整矩阵 | `services/risk-service` |
| Store（商品/库存） | `stable` | 主线先卖少量 SKU/套餐，避免复杂 ERP | `services/store-service` |
| Service（服务履约） | `stable` | 先做“咨询预约 + SOP”，再做复杂履约状态机 | `services/service-service` |

## P0 主线（现金流核心）对应模块
- Bot 进入与建档：`bots` + `identity-service`
- AI 护理推荐：`ai-orchestrator`（轻量） + `api-gateway`
- 商品下单：`web-app` + `store-service` + `order-service`
- 管理员通知与人工成交：`api-gateway` + `bots(admin)` + CRM
- 善终咨询预约：`aftercare` + `crm` + `web-app`

