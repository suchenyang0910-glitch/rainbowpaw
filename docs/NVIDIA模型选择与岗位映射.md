# NVIDIA 模型选择与岗位映射

本项目通过 OpenAI 兼容接口调用 NVIDIA NIM/AI Endpoints：`/v1/chat/completions`、`/v1/embeddings`、`/v1/ranking`、`/v1/extract`。

参考：
- LLM API 端点说明：`https://docs.api.nvidia.com/nim/reference/llm-apis`
- 模型列表：`https://docs.api.nvidia.com/nim/reference/models-1`

## 1. 接口类型与用途

- `chat/completions`：所有“岗位智能体”输出 JSON（support/growth/ops/product/risk/recommend/vision）。
- `embeddings`：把候选商品/候选动作向量化，用于相似度检索。
- `ranking`：对候选文本重排（rerank），提高 TopN 质量。
- `extract`：从文本抽取 PII/实体（用于风控/脱敏）。

## 2. 项目内岗位与环境变量

岗位 → 环境变量键（按代码规则从 role 名推导）：

- `support_ai` → `AI_MODEL_SUPPORT_AI`
- `growth_ai` → `AI_MODEL_GROWTH_AI`
- `product_ai` → `AI_MODEL_PRODUCT_AI`
- `ops_ai` → `AI_MODEL_OPS_AI`
- `risk_ai` → `AI_MODEL_RISK_AI`
- `recommend_ai` → `AI_MODEL_RECOMMEND_AI`
- `vision_ai` → `AI_MODEL_VISION_AI`（若未设置，会 fallback 到 `AI_VL_MODEL`）
- `voice_ai` → `AI_MODEL_VOICE_AI`（若未设置，会 fallback 到 `AI_VOICE_MODEL`）

通用 fallback：若某岗位未配置，则使用 `AI_MODEL`。

## 3. 选择模型的“决策规则”（避免拍脑袋）

按岗位目标分三档：

- 低延迟/高 QPS（客服、推荐入口）
  - 优先选择更小的对话模型；必要时再升级。
- 中等推理（增长、运营、商品、风控）
  - 以“能稳定输出结构化 JSON、能做推理总结”为主要标准。
- 强推理/策略（可选）
  - 只在关键链路（例如 Weekly Plan、运营周报、重大风控复核）使用，避免成本与延迟拖垮主链路。

检索增强（embedding/rerank）原则：

- 当候选集较大、需要“从很多候选里选最对的”时，优先走 `embeddings + ranking`。
- 当候选集很小或上游不稳定时，允许自动降级为纯 `chat`（项目已支持）。

## 4. 推荐的默认配置（当前可用的一套）

这一套与你们当前选择一致，作为默认模板：

- 通用：
  - `AI_BASE_URL=https://integrate.api.nvidia.com`
  - `AI_CHAT_COMPLETIONS_PATH=/v1/chat/completions`
  - `AI_EMBEDDINGS_PATH=/v1/embeddings`
  - `AI_RERANK_PATH=/v1/ranking`
  - `AI_PII_PATH=/v1/extract`

- 岗位：
  - `AI_MODEL=nvidia/nemotron-3-nano-30b-a3b`
  - `AI_MODEL_SUPPORT_AI=nvidia/llama-3.1-nemotron-nano-4b-v1.1`
  - `AI_MODEL_RECOMMEND_AI=nvidia/llama-3.1-nemotron-nano-4b-v1.1`
  - `AI_MODEL_GROWTH_AI=nvidia/nemotron-3-nano-30b-a3b`
  - `AI_MODEL_PRODUCT_AI=nvidia/nemotron-3-nano-30b-a3b`
  - `AI_MODEL_OPS_AI=nvidia/nemotron-3-nano-30b-a3b`
  - `AI_MODEL_RISK_AI=nvidia/nemotron-3-nano-30b-a3b`

- 推荐检索：
  - `AI_EMBED_MODEL=nvidia/llama-nemotron-embed-1b-v2`
  - `AI_RERANK_MODEL=nvidia/llama-3.2-nv-rerankqa-1b-v2`

- PII（可选）：
  - `AI_PII_MODEL=nvidia/gliner-pii`

## 5. 如何“选择更多模型”并快速切换

你可以把任意在 NVIDIA 模型列表（`models-1`）或 build.nvidia.com 页面可调用的模型 ID，填到对应岗位的 `AI_MODEL_*`。

建议的切换顺序：

1. 先替换某一个岗位（例如 `AI_MODEL_SUPPORT_AI`），别一次全换。
2. 用 `POST /api/ai/...` 路由打一个最小 payload 验证输出 JSON。
3. 再逐步扩大到 ops/risk/product。

## 6. 最小验证用例

容器内验证 `recommend/next`（能看到错误体）：

```bash
docker exec -it deploy-ai-orchestrator-1 sh -lc 'node - <<"NODE"
const url = "http://localhost:3005/api/ai/recommend/next";
const token = process.env.INTERNAL_TOKEN || "";
(async () => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "x-global-user-id": "u_test",
    },
    body: JSON.stringify({
      user_profile: { global_user_id: "u_test", tags: ["shop"] },
      recent_actions: ["play_completed"],
      last_result: { plays: [{ tier: "common" }] },
      candidate_products: [{ id: 101, title: "Ceramic Urn", category: "shop", price: 89 }],
      candidate_entries: ["claw", "shop", "memorial"],
    }),
  });
  console.log("status:", res.status);
  console.log(await res.text());
})();
NODE'
```

