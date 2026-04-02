# 业务端到端测试（下单/支付）

## 目标

用一条命令跑通核心业务链路（可重复运行）：

- 支付：创建支付单 + 上传/下载打款凭证
- 下单（商城）：加购 → checkout（含幂等性校验）→ 订单列表可查询
- 下单（善终）：`/v1/orders/intake` 创建订单 → 订单详情可查询
- Claw（强制）：积分直购 + 拼团下单 + join_pay（含幂等性校验）

脚本入口：`tools/business-e2e.mjs`。

## 依赖与前置条件

### 必须

- `api-gateway` 可访问（默认 `http://localhost:3012/api`）
- `identity-service`、`wallet-service` 可用（Claw E2E 会调用 `/dev/plays/add` 与 `/purchase/direct`）

### 推荐（本地一键启动）

仓库已提供联调用 compose：`deploy/docker-compose.e2e.yml`。

准备 `.env`（至少包含 `INTERNAL_TOKEN`，用于服务间鉴权）：

```bash
INTERNAL_TOKEN=replace-with-strong-token
POSTGRES_DB=rainbowpaw
POSTGRES_USER=rainbowpaw
POSTGRES_PASSWORD=rainbowpaw
```

启动：

```bash
docker compose -f deploy/docker-compose.e2e.yml up -d --build
```

查看网关是否就绪：

```bash
curl http://localhost:3012/api/marketplace/products
```

## 运行方式

默认运行（包含 Claw 直购+拼团+join_pay）：

```bash
npm run test:business
```

自定义网关地址：

```bash
API_BASE_URL=http://localhost:3012/api npm run test:business
```

设置测试账号：

```bash
TEST_PHONE=+85510000001 DEV_TELEGRAM_ID=10001 npm run test:business
```

临时跳过 Claw（仅用于快速排查；正式联调不建议）：

```bash
E2E_SKIP_CLAW=1 npm run test:business
```

## 输出与判定

- 每个步骤会输出 `OK/ERR` 与耗时
- 任意关键步骤失败会 `exit 1`
- 全部通过会输出 `ALL PASSED`

## 常见问题

- `wallet service unavailable` / 5xx：通常是 `wallet-service` 或 `identity-service` 未启动、或 `INTERNAL_TOKEN` 不一致。
- `insufficient points`：脚本会先调用 `/dev/plays/add` 充值 points_locked，若仍不足，检查 wallet-service 数据库是否正常。

