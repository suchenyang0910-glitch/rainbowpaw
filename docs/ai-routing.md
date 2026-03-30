# Open Claw 模型调用路由图 + 什么时候调用

## 总体架构

```
Claw Bot / RainbowPaw Bot / Admin(Ops Center)
            ↓
      ai-orchestrator（唯一入口）
            ↓
 Support / Ops / Growth / Product / Risk / Recommend / Vision
            ↓
     NVIDIA build.nvidia.com Models
```

## 调用总表（按事件）

| 触发场景 | ai-orchestrator API | 角色 | 推荐 NVIDIA 模型（主） | 频率 | 说明 |
|---|---|---|---|---:|---|
| 用户私聊提问（未命中菜单/命令） | `POST /api/ai/support/reply` | Support AI | `nvidia/llama-3.1-nemotron-nano-4b-v1.1` | 高频 | 输出 `reply_text + buttons` 强引导 |
| 抽奖完成后的下一步推荐 | `POST /api/ai/recommend/next` | Recommend AI | Embed `nvidia/llama-nemotron-embed-1b-v2` + Rerank `nvidia/llama-3.2-nv-rerankqa-1b-v2` + 文案 `nvidia/llama-3.1-nemotron-nano-4b-v1.1` | 高频 | 先检索再重排，最后一句话术 |
| 管理员查看日报/利润（后台） | `POST /api/ai/ops/analyze-report` | Ops AI | `nvidia/nemotron-3-nano-30b-a3b` | 中频 | 输出状态/问题/动作/调参 |
| 生成活动文案/脚本/Push | `POST /api/ai/growth/generate` | Growth AI | `nvidia/nemotron-3-nano-30b-a3b` | 中频 | 生成短视频脚本+裂变+Push |
| 奖池/选品/囤货建议 | `POST /api/ai/product/optimize` | Product AI | `nvidia/nemotron-3-nano-30b-a3b` | 低-中 | 输出结构/概率/利润/风险 |
| 风控命中后摘要与动作建议 | `POST /api/ai/risk/analyze` | Risk AI | 规则优先 + `nvidia/gliner-pii`（脱敏） + `nvidia/nemotron-3-nano-30b-a3b`（摘要） | 中频 | LLM 只做解释/总结 |
| 付款截图/图片/视频理解 | `POST /api/ai/vision/analyze` | Vision AI | `nvidia/nemotron-nano-12b-v2-vl` | 低频 | 输出摘要/信号/是否人工复核 |

## 场景路由（最实用版本）

### 场景1：用户在 Claw Bot 提问
1. 规则判断：是否命中 `/start`、菜单按钮、斜杠命令
2. 未命中 → `support/reply`
3. 返回 `reply_text + buttons` → Bot 发送

### 场景2：抽奖结束后推荐下一步
1. 拉用户画像 + 候选商品/入口
2. `recommend/next`
3. （推荐链路）Embed → Rerank → 生成话术
4. Bot 发推荐

### 场景3：管理员日报分析
1. 管理员命令触发 → 先聚合报表数据
2. `ops/analyze-report`
3. 返回状态/问题/动作/调参 → 展示/发送

### 场景4：增长文案生成
1. 运营触发或定时任务
2. `growth/generate`
3. 保存到内容库/发给运营

### 场景5：奖池与 SKU 建议
1. 拉商品成本/库存/转化/抽奖数据
2. `product/optimize`
3. 输出可执行结构与利润测算

### 场景6：风控分析
1. 规则引擎检测（主）
2. 命中风险 → `risk/analyze` 输出摘要与动作建议
3. 如需脱敏 → 在进入 LLM 前先做 PII 识别

### 场景7：截图/图片/视频分析
1. 用户上传图片/截图
2. `vision/analyze`
3. 输出：摘要/信号/是否人工复核

