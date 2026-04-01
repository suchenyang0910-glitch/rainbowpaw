import axios from 'axios';
import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { SupportReplyDto } from './dto/support-reply.dto';
import { GrowthGenerateDto } from './dto/growth-generate.dto';
import { OpsAnalyzeDto } from './dto/ops-analyze.dto';
import { ProductOptimizeDto } from './dto/product-optimize.dto';
import { RiskAnalyzeDto } from './dto/risk-analyze.dto';
import { RecommendNextDto } from './dto/recommend-next.dto';
import { CALL_LOG_STORE } from '../call-log/call-log.store';
import type { CallLogStore } from '../call-log/call-log.store';
import { VisionAnalyzeDto } from './dto/vision-analyze.dto';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content:
    | string
    | Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } }
      >;
};

function toJsonString(x: any) {
  try {
    return JSON.stringify(x ?? null);
  } catch {
    return 'null';
  }
}

function renderTemplate(tpl: string, vars: Record<string, any>) {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k) => {
    const v = vars[k];
    if (v === undefined) return '';
    if (typeof v === 'string') return v;
    return toJsonString(v);
  });
}

function extractFirstJsonObject(text: string) {
  const s = String(text || '').trim();
  const start = s.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (c === '{') depth++;
    if (c === '}') depth--;
    if (depth === 0) return s.slice(start, i + 1);
  }
  return null;
}

function safeJsonParse(text: string) {
  try {
    return { ok: true as const, value: JSON.parse(text) };
  } catch {
    return { ok: false as const, value: null };
  }
}

function computeCostUsd(params: {
  promptTokens?: number | null;
  completionTokens?: number | null;
  priceInPer1k?: number | null;
  priceOutPer1k?: number | null;
}) {
  const inT = params.promptTokens ?? null;
  const outT = params.completionTokens ?? null;
  const pIn = params.priceInPer1k ?? null;
  const pOut = params.priceOutPer1k ?? null;
  if (inT == null || outT == null || pIn == null || pOut == null) return null;
  const usd = (inT / 1000) * pIn + (outT / 1000) * pOut;
  return Number.isFinite(usd) ? String(usd) : null;
}

function dot(a: number[], b: number[]) {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

function norm(a: number[]) {
  return Math.sqrt(dot(a, a));
}

function cosine(a: number[], b: number[]) {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return 0;
  return dot(a, b) / (na * nb);
}

function redactTextBasic(input: string) {
  let s = String(input || '');
  s = s.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]');
  s = s.replace(/\b(\+?\d[\d\s-]{7,}\d)\b/g, '[PHONE]');
  s = s.replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[CARD]');
  s = s.replace(/\b0x[a-fA-F0-9]{40}\b/g, '[EVM_ADDRESS]');
  s = s.replace(/\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g, '[BTC_ADDRESS]');
  s = s.replace(/\b\d{5,}\b/g, '[NUMBER]');
  return s;
}

const GENERAL_RULES =
  '【角色定位】\n你是 Open Claw 系统中的一个AI模块，不是聊天机器人。\n\n【目标】\n最大化平台长期利润 + 提升用户转化 + 控制风险\n\n【输出规则】\n1. 必须结构化输出（JSON）\n2. 不允许输出多余解释\n3. 不允许幻想不存在的数据\n4. 不允许模糊表达（必须给具体数值或建议）\n5. 所有建议必须可执行\n\n【风格】\n- 简洁\n- 决策导向\n- 不情绪化';

const SUPPORT_PROMPT =
  '你是 Open Claw 平台的 AI 客服接待官。\n\n你的目标：\n1. 引导用户消费（抽奖 / 购买）\n2. 提高转化率\n3. 降低流失\n\n你不是聊天机器人，你是销售助手。\n\n你必须根据用户当前状态，输出最优引导策略。\n\n---\n\n【输入】\n用户消息：\n{{user_message}}\n\n用户状态：\n{{user_profile}}\n（包含：pet_type, spend_level, last_action, wallet_balance）\n\n当前上下文：\n{{context}}\n（例如：刚抽奖 / 未付款 / 查看商品）\n\n---\n\n【策略规则】\n\n优先级：\n1. 引导继续抽奖（如果刚参与）\n2. 引导充值（如果余额不足）\n3. 引导进入商城\n4. 引导进入善终服务（RainbowPaw）\n\n---\n\n【输出格式】\n\n必须输出 JSON：\n\n{\n  "reply_text": "给用户的回复",\n  "buttons": [\n    {\n      "text": "按钮文案",\n      "action": "claw|recharge|shop|memorial"\n    }\n  ],\n  "intent": "claw_continue|recharge|shop|memorial|faq",\n  "confidence": 0.0\n}';

const GROWTH_PROMPT =
  '你是 Open Claw 的 AI 增长官。\n\n你的目标：\n1. 获取新用户\n2. 提高点击率\n3. 提高转化率\n\n你负责生成：\n- 短视频脚本（TikTok）\n- 裂变文案\n- Push消息\n\n---\n\n【输入】\n\n当前活动：\n{{campaign}}\n\n用户数据：\n{{metrics}}\n（新增用户、转化率、点击率）\n\n目标：\n{{goal}}\n\n---\n\n【输出规则】\n\n必须生成：\n1. 一个短视频脚本\n2. 一个裂变文案\n3. 一个Push通知\n\n---\n\n【输出格式】\n\n{\n  "video_script": {\n    "hook": "开头3秒",\n    "content": "中间内容",\n    "cta": "结尾引导"\n  },\n  "viral_copy": "裂变文案",\n  "push_message": "推送文案",\n  "strategy": "核心增长策略一句话总结"\n}';

const PRODUCT_PROMPT =
  '你是 Open Claw 的 AI 商品经理。\n\n你的目标：\n1. 确保平台盈利\n2. 优化奖池结构\n3. 提高用户参与率\n\n---\n\n【输入】\n\n商品列表：\n{{products}}\n（成本、类型、库存）\n\n抽奖价格：\n{{claw_price}}\n\n当前奖池：\n{{current_pool}}\n\n用户偏好：\n{{user_preference}}\n\n---\n\n【任务】\n\n你需要输出：\n\n1. 奖池结构建议\n2. 概率分布\n3. 利润测算\n4. 风险提示\n\n---\n\n【约束】\n\n- 必须保证利润 > 8%\n- 不允许高奖过多\n- 必须有“诱饵奖”\n\n---\n\n【输出格式】\n\n{\n  "pool_structure": [\n    {\n      "level": "common|rare|epic|legendary",\n      "ratio": 0.0,\n      "avg_cost": 0\n    }\n  ],\n  "probability_config": {\n    "common": 0.6,\n    "rare": 0.3,\n    "epic": 0.09,\n    "legendary": 0.01\n  },\n  "profit_estimate": {\n    "cost_per_draw": 0,\n    "revenue_per_draw": 0,\n    "profit_rate": 0\n  },\n  "risk_notes": "风险说明",\n  "adjustment": "调优建议"\n}';

const OPS_PROMPT =
  '你是 Open Claw 的 AI 运营经理。\n\n你的目标：\n1. 保证平台盈利\n2. 提高活跃\n3. 发现问题并修复\n\n---\n\n【输入】\n\n日报数据：\n{{report}}\n\n关键指标：\n- revenue\n- cost\n- profit_rate\n- active_users\n- claw_count\n- conversion_rate\n\n---\n\n【任务】\n\n分析数据并输出：\n\n1. 当前状态判断\n2. 问题分析\n3. 调整建议\n4. 优先级排序\n\n---\n\n【输出格式】\n\n{\n  "status": "healthy|warning|critical",\n  "issues": ["问题1"],\n  "analysis": "原因分析",\n  "actions": [\n    {\n      "action": "具体动作",\n      "priority": "high|mid|low"\n    }\n  ],\n  "parameter_adjustment": {\n    "claw_probability_adjustment": "↑ or ↓",\n    "recycle_ratio_adjustment": "↑ or ↓"\n  }\n}';

const RISK_PROMPT =
  '你是 Open Claw 的 AI 风控官。\n\n你的目标：\n1. 防止套利\n2. 防止资金损失\n3. 标记异常用户\n\n---\n\n【输入】\n\n用户行为数据：\n{{user_behavior}}\n\n交易数据：\n{{wallet_logs}}\n\n抽奖数据：\n{{claw_plays}}\n\n---\n\n【检测规则】\n\n检测：\n\n1. 高频中奖\n2. 提现异常\n3. 拼团刷单\n4. 分销循环\n\n---\n\n【输出格式】\n\n{\n  "risk_level": "low|medium|high",\n  "risk_score": 0,\n  "flags": ["异常中奖"],\n  "evidence": "具体说明",\n  "action": {\n    "freeze": false,\n    "delay_withdraw": false,\n    "monitor": true\n  }\n}';

const RECOMMEND_PROMPT =
  '你是 Open Claw 的 AI 推荐官。\n\n你的目标：\n1. 提高用户二次消费\n2. 提高客单价\n3. 引导用户进入RainbowPaw\n\n---\n\n【输入】\n\n用户标签：\n{{user_profile}}\n\n最近行为：\n{{recent_actions}}\n\n抽奖结果：\n{{last_result}}\n\n---\n\n【策略优先级】\n\n1. 抽奖后继续抽\n2. 推荐商品\n3. 推荐拼团\n4. 推荐善终服务\n\n---\n\n【输出格式】\n\n{\n  "next_action": "claw|shop|group|memorial",\n  "recommendations": [\n    {\n      "type": "product|service|group",\n      "reason": "推荐原因",\n      "priority": "high|mid|low"\n    }\n  ],\n  "message": "推荐话术"\n}';

const VISION_PROMPT =
  '你是 Open Claw 的 AI 视觉分析官。\n\n你的目标：\n1. 从图片/截图/视频帧中提取关键信息\n2. 输出可执行结论\n3. 避免泄露敏感信息\n\n---\n\n【输入】\n任务：{{task}}\n图片URL：{{image_url}}\n\n---\n\n【输出格式】\n必须输出 JSON：\n{\n  "task": "string",\n  "summary": "string",\n  "signals": ["string"],\n  "action": {\n    "needs_human_review": true,\n    "suggested_next": "support|ops|risk|none"\n  },\n  "confidence": 0.0\n}';

export class AiService {
  constructor(
    @Inject(CALL_LOG_STORE)
    private readonly callLogStore: CallLogStore,
  ) {}

  private throwUpstreamError(prefix: string, e: any): never {
    if (axios.isAxiosError(e)) {
      const status = e.response?.status;
      const data = e.response?.data;
      const errStr = (() => {
        if (data == null) return '';
        if (typeof data === 'string') return data;
        if (typeof data === 'object') {
          const maybe = (data as any).error;
          const inner =
            typeof maybe === 'string'
              ? maybe
              : typeof maybe === 'object'
                ? (maybe?.message || maybe?.detail || JSON.stringify(maybe))
                : '';
          return (
            inner ||
            (data as any).message ||
            (data as any).detail ||
            JSON.stringify(data)
          );
        }
        return String(data);
      })();
      const short = errStr.length > 400 ? `${errStr.slice(0, 400)}…` : errStr;
      const code = status
        ? `HTTP ${status}`
        : e.code
          ? String(e.code)
          : 'ERR';

      const msg = `${prefix} failed: ${code}${short ? ` - ${short}` : ''}`;
      const errCode = String(e.code || '').toUpperCase();
      if (errCode === 'ECONNABORTED' || errCode === 'ETIMEDOUT') {
        throw new GatewayTimeoutException(
          `${msg} (可能需要调大 AI_HTTP_TIMEOUT_MS 或检查容器出网/DNS)`,
        );
      }
      if (status === 429) throw new HttpException(msg, HttpStatus.TOO_MANY_REQUESTS);
      if (typeof status === 'number' && status >= 500)
        throw new BadGatewayException(msg);
      throw new BadRequestException(msg);
    }
    throw new BadRequestException(`${prefix} failed`);
  }

  private resolveModelForRole(role: string) {
    const fallback = String(process.env.AI_MODEL || 'nvidia_build').trim();
    const k = String(role || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_');
    const v = String((process.env as any)[`AI_MODEL_${k}`] || '').trim();
    if (v) return v;
    if (k === 'VISION_AI') {
      const vl = String(process.env.AI_VL_MODEL || '').trim();
      if (vl) return vl;
    }
    if (k === 'VOICE_AI') {
      const voice = String(process.env.AI_VOICE_MODEL || '').trim();
      if (voice) return voice;
    }
    return fallback;
  }

  private resolveMaxTokensForRole(role: string) {
    const k = String(role || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_');
    const roleKey = (process.env as any)[`AI_MAX_TOKENS_${k}`];
    const n = this.numOrNull(roleKey) ?? this.numOrNull(process.env.AI_MAX_TOKENS) ?? 800;
    return Math.min(4096, Math.max(16, Math.floor(n)));
  }

  private resolveTimeoutMsForRole(role: string) {
    const k = String(role || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_');
    const roleKey = (process.env as any)[`AI_HTTP_TIMEOUT_MS_${k}`];
    const n =
      this.numOrNull(roleKey) ?? this.numOrNull(process.env.AI_HTTP_TIMEOUT_MS) ?? 60000;
    return Math.min(300000, Math.max(5000, Math.floor(n)));
  }

  async supportReply(dto: SupportReplyDto, req: any) {
    const prompt = renderTemplate(SUPPORT_PROMPT, {
      user_message: dto.user_message,
      user_profile: dto.user_profile ?? {},
      context: dto.context ?? {},
    });
    return this.runRole('support_ai', prompt, {
      global_user_id: this.extractGlobalUserId(req),
      input: dto,
    });
  }

  async growthGenerate(dto: GrowthGenerateDto, req: any) {
    const prompt = renderTemplate(GROWTH_PROMPT, {
      campaign: dto.campaign ?? {},
      metrics: dto.metrics ?? {},
      goal: dto.goal ?? '',
    });
    return this.runRole('growth_ai', prompt, {
      global_user_id: this.extractGlobalUserId(req),
      input: dto,
    });
  }

  async productOptimize(dto: ProductOptimizeDto, req: any) {
    const prompt = renderTemplate(PRODUCT_PROMPT, {
      products: dto.products ?? [],
      claw_price: dto.claw_price ?? null,
      current_pool: dto.current_pool ?? {},
      user_preference: dto.user_preference ?? {},
    });
    return this.runRole('product_ai', prompt, {
      global_user_id: this.extractGlobalUserId(req),
      input: dto,
    });
  }

  async opsAnalyze(dto: OpsAnalyzeDto, req: any) {
    const prompt = renderTemplate(OPS_PROMPT, {
      report: dto.report ?? {},
    });
    return this.runRole('ops_ai', prompt, {
      global_user_id: this.extractGlobalUserId(req),
      input: dto,
    });
  }

  async riskAnalyze(dto: RiskAnalyzeDto, req: any) {
    const redacted = await this.redactPiiForRisk(dto, req);
    const prompt = renderTemplate(RISK_PROMPT, {
      user_behavior: redacted.user_behavior,
      wallet_logs: redacted.wallet_logs,
      claw_plays: redacted.claw_plays,
    });
    return this.runRole('risk_ai', prompt, {
      global_user_id: this.extractGlobalUserId(req),
      input: dto,
    });
  }

  async recommendNext(dto: RecommendNextDto, req: any) {
    const supportsRetrieval = this.canUseEmbedding() && this.canUseRerank();
    const userProfile = dto.user_profile ?? {};
    const recentActions = dto.recent_actions ?? [];
    const lastResult = dto.last_result ?? {};
    const candidateProducts = Array.isArray((dto as any).candidate_products)
      ? (dto as any).candidate_products
      : [];
    const candidateEntries = Array.isArray((dto as any).candidate_entries)
      ? (dto as any).candidate_entries
      : [];

    if (supportsRetrieval && (candidateProducts.length || candidateEntries.length)) {
      let ranked: any[] | null = null;
      let retrievalError: string | null = null;

      try {
        const query = this.buildRecommendQuery({
          userProfile,
          recentActions,
          lastResult,
        });
        const docs = this.buildRecommendDocuments({
          candidateProducts,
          candidateEntries,
        });
        ranked = await this.rankCandidates({ query, docs, req });
      } catch (e: any) {
        const msg = (() => {
          const m = e?.response?.message;
          if (typeof m === 'string') return m;
          if (Array.isArray(m)) return m.map(String).join('; ');
          const r = e?.response;
          if (typeof r === 'string') return r;
          if (typeof e?.message === 'string' && e.message.trim()) return e.message;
          return 'retrieval_failed';
        })();
        retrievalError = String(msg || 'retrieval_failed');
        try {
          await this.callLogStore.insert({
            global_user_id: this.extractGlobalUserId(req),
            role: 'recommend_retrieval',
            model: String(process.env.AI_EMBED_MODEL || '').trim() || 'unknown',
            provider_base_url: String(process.env.AI_BASE_URL || '').trim() || null,
            request_json: {
              candidate_products: candidateProducts.length,
              candidate_entries: candidateEntries.length,
            },
            response_json: { error: retrievalError },
            status: 'error',
          });
        } catch {}
      }

      if (ranked?.length) {
        const prompt = renderTemplate(RECOMMEND_PROMPT, {
          user_profile: userProfile,
          recent_actions: recentActions,
          last_result: lastResult,
        });

        const enrichedPrompt =
          prompt +
          `\n\n候选项（已排序，分数越高越优先）：\n${toJsonString(ranked.slice(0, 10))}`;

        const out = await this.runRole('recommend_ai', enrichedPrompt, {
          global_user_id: this.extractGlobalUserId(req),
          input: dto,
        });
        return {
          ...out,
          retrieval_used: true,
          ranked_candidates: ranked.slice(0, 10),
        };
      }
      const prompt = renderTemplate(RECOMMEND_PROMPT, {
        user_profile: userProfile,
        recent_actions: recentActions,
        last_result: lastResult,
      });
      const out = await this.runRole('recommend_ai', prompt, {
        global_user_id: this.extractGlobalUserId(req),
        input: dto,
      });
      return {
        ...out,
        retrieval_used: false,
        retrieval_error: retrievalError,
      };
    }

    const prompt = renderTemplate(RECOMMEND_PROMPT, {
      user_profile: userProfile,
      recent_actions: recentActions,
      last_result: lastResult,
    });
    const out = await this.runRole('recommend_ai', prompt, {
      global_user_id: this.extractGlobalUserId(req),
      input: dto,
    });
    return { ...out, retrieval_used: false };
  }

  async visionAnalyze(dto: VisionAnalyzeDto, req: any) {
    const prompt = renderTemplate(VISION_PROMPT, {
      task: dto.task || 'generic',
      image_url: dto.image_url,
    });

    const mockMode = String(process.env.AI_MOCK_MODE || '').trim() === 'true';
    const role = 'vision_ai';
    const model = this.resolveModelForRole(role);
    const baseUrl = String(process.env.AI_BASE_URL || '').trim() || null;

    if (mockMode) {
      const out = {
        task: dto.task || 'generic',
        summary: '图片已接收（mock）。建议人工复核关键字段。',
        signals: [],
        action: { needs_human_review: true, suggested_next: 'support' },
        confidence: 0.4,
      };
      await this.callLogStore.insert({
        global_user_id: this.extractGlobalUserId(req),
        role,
        model: model || 'mock',
        provider_base_url: baseUrl,
        request_json: dto as any,
        response_json: out as any,
        status: 'mock',
      });
      return { ...out, model_hint: 'mock' };
    }

    const apiKey = String(process.env.AI_API_KEY || '').trim();
    const chatPath = String(
      process.env.AI_CHAT_COMPLETIONS_PATH || '/v1/chat/completions',
    ).trim();
    if (!apiKey) throw new BadRequestException('AI_API_KEY 未配置');
    if (!baseUrl) throw new BadRequestException('AI_BASE_URL 未配置');

    await this.enforceDailyBudget();

    const messages: ChatMessage[] = [
      { role: 'system', content: GENERAL_RULES },
      {
        role: 'system',
        content: '严格只输出一个 JSON 对象，不要输出任何额外文本。',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: dto.image_url } },
        ],
      },
    ];

    const t0 = Date.now();
    const res = await this.callOpenAiCompatible({
      baseUrl,
      path: chatPath,
      apiKey,
      model,
      messages,
      maxTokens: this.resolveMaxTokensForRole(role),
      temperature: Number(process.env.AI_TEMPERATURE || 0.2),
      timeoutMs: this.resolveTimeoutMsForRole(role),
    });
    const latencyMs = Date.now() - t0;

    const assistantText = String(
      res?.choices?.[0]?.message?.content || '',
    ).trim();
    const parsed = await this.parseJsonWithRetry({
      baseUrl,
      chatPath,
      apiKey,
      model,
      messages,
      assistantText,
      maxTokens: this.resolveMaxTokensForRole(role),
      timeoutMs: this.resolveTimeoutMsForRole(role),
    });

    const usage = res?.usage || null;
    const promptTokens =
      typeof usage?.prompt_tokens === 'number' ? usage.prompt_tokens : null;
    const completionTokens =
      typeof usage?.completion_tokens === 'number'
        ? usage.completion_tokens
        : null;
    const totalTokens =
      typeof usage?.total_tokens === 'number' ? usage.total_tokens : null;
    const costUsd = computeCostUsd({
      promptTokens,
      completionTokens,
      priceInPer1k: this.numOrNull(process.env.AI_PRICE_INPUT_PER_1K),
      priceOutPer1k: this.numOrNull(process.env.AI_PRICE_OUTPUT_PER_1K),
    });

    await this.callLogStore.insert({
      global_user_id: this.extractGlobalUserId(req),
      role,
      model,
      provider_base_url: baseUrl,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      cost_usd: costUsd,
      latency_ms: latencyMs,
      request_json: dto as any,
      response_json: parsed,
      status: 'ok',
    });

    return { ...parsed, model_hint: `${model}` };
  }

  private extractGlobalUserId(req: any) {
    const v = String(req?.headers?.['x-global-user-id'] || '').trim();
    return v || null;
  }

  private async runRole(
    role: string,
    rolePrompt: string,
    meta: { global_user_id: string | null; input: any },
  ) {
    const mockMode = String(process.env.AI_MOCK_MODE || '').trim() === 'true';
    const model = this.resolveModelForRole(role);
    const baseUrl = String(process.env.AI_BASE_URL || '').trim() || null;

    if (mockMode) {
      const out = this.mock(role, meta.input);
      await this.callLogStore.insert({
        global_user_id: meta.global_user_id,
        role,
        model: model || 'mock',
        provider_base_url: baseUrl,
        request_json: meta.input,
        response_json: out as any,
        status: 'mock',
      });
      return { ...out, model_hint: 'mock' };
    }

    const apiKey = String(process.env.AI_API_KEY || '').trim();
    const chatPath = String(
      process.env.AI_CHAT_COMPLETIONS_PATH || '/v1/chat/completions',
    ).trim();
    if (!apiKey) throw new BadRequestException('AI_API_KEY 未配置');
    if (!baseUrl) throw new BadRequestException('AI_BASE_URL 未配置');

    const maxTokens = this.resolveMaxTokensForRole(role);
    const temperature = Number(process.env.AI_TEMPERATURE || 0.2);
    const timeoutMs = this.resolveTimeoutMsForRole(role);

    await this.enforceDailyBudget();

    const messages: ChatMessage[] = [
      { role: 'system', content: GENERAL_RULES },
      {
        role: 'system',
        content: '严格只输出一个 JSON 对象，不要输出任何额外文本。',
      },
      { role: 'user', content: rolePrompt },
    ];

    const t0 = Date.now();
    const res = await this.callOpenAiCompatible({
      baseUrl,
      path: chatPath,
      apiKey,
      model,
      messages,
      maxTokens,
      temperature,
      timeoutMs,
    });
    const latencyMs = Date.now() - t0;

    const assistantText = String(
      res?.choices?.[0]?.message?.content || '',
    ).trim();
    const parsed = await this.parseJsonWithRetry({
      baseUrl,
      chatPath,
      apiKey,
      model,
      messages,
      assistantText,
      maxTokens,
      timeoutMs,
    });

    const usage = res?.usage || null;
    const promptTokens =
      typeof usage?.prompt_tokens === 'number' ? usage.prompt_tokens : null;
    const completionTokens =
      typeof usage?.completion_tokens === 'number'
        ? usage.completion_tokens
        : null;
    const totalTokens =
      typeof usage?.total_tokens === 'number' ? usage.total_tokens : null;
    const costUsd = computeCostUsd({
      promptTokens,
      completionTokens,
      priceInPer1k: this.numOrNull(process.env.AI_PRICE_INPUT_PER_1K),
      priceOutPer1k: this.numOrNull(process.env.AI_PRICE_OUTPUT_PER_1K),
    });

    await this.callLogStore.insert({
      global_user_id: meta.global_user_id,
      role,
      model,
      provider_base_url: baseUrl,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      cost_usd: costUsd,
      latency_ms: latencyMs,
      request_json: meta.input,
      response_json: parsed,
      status: 'ok',
    });

    return { ...parsed, model_hint: `${model}` };
  }

  private numOrNull(v: any) {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  private canUseEmbedding() {
    return (
      String(process.env.AI_MOCK_MODE || '').trim() !== 'true' &&
      Boolean(String(process.env.AI_BASE_URL || '').trim()) &&
      Boolean(String(process.env.AI_API_KEY || '').trim()) &&
      Boolean(String(process.env.AI_EMBED_MODEL || '').trim()) &&
      Boolean(String(process.env.AI_EMBEDDINGS_PATH || '').trim())
    );
  }

  private canUseRerank() {
    return (
      String(process.env.AI_MOCK_MODE || '').trim() !== 'true' &&
      Boolean(String(process.env.AI_BASE_URL || '').trim()) &&
      Boolean(String(process.env.AI_API_KEY || '').trim()) &&
      Boolean(String(process.env.AI_RERANK_MODEL || '').trim()) &&
      Boolean(String(process.env.AI_RERANK_PATH || '').trim())
    );
  }

  private buildRecommendQuery(params: {
    userProfile: any;
    recentActions: any;
    lastResult: any;
  }) {
    const pet = String(params.userProfile?.pet_type || '').trim();
    const spend = String(params.userProfile?.spend_level || '').trim();
    const tags = Array.isArray(params.userProfile?.tags)
      ? params.userProfile.tags
      : [];
    const acts = Array.isArray(params.recentActions)
      ? params.recentActions
      : [];
    const last = params.lastResult ?? {};
    const parts = [
      pet ? `pet_type=${pet}` : null,
      spend ? `spend_level=${spend}` : null,
      tags.length ? `tags=${tags.join(',')}` : null,
      acts.length ? `recent_actions=${acts.slice(-10).join(',')}` : null,
      Object.keys(last).length ? `last_result=${toJsonString(last)}` : null,
    ].filter(Boolean);
    return parts.join('\n');
  }

  private buildRecommendDocuments(params: {
    candidateProducts: any[];
    candidateEntries: any[];
  }) {
    const docs: Array<{ id: string; type: string; text: string; raw: any }> =
      [];
    for (const p of params.candidateProducts) {
      const id =
        String(p?.id || p?.sku || p?.product_id || '').trim() ||
        `p_${docs.length}`;
      const title = String(p?.title || p?.name || '').trim();
      const category = String(p?.category || '').trim();
      const price = p?.price != null ? String(p.price) : '';
      const text = `type=product\nid=${id}\ntitle=${title}\ncategory=${category}\nprice=${price}\nraw=${toJsonString(p)}`;
      docs.push({ id, type: 'product', text, raw: p });
    }
    for (const e of params.candidateEntries) {
      const raw = typeof e === 'string' ? { action: e } : e;
      const action =
        String(raw?.action || raw?.id || raw?.key || '').trim() ||
        String(e).trim();
      const id = action || `entry_${docs.length}`;
      const text = `type=entry\naction=${action}\nraw=${toJsonString(raw)}`;
      docs.push({ id, type: 'entry', text, raw });
    }
    return docs;
  }

  private async rankCandidates(params: {
    query: string;
    docs: Array<{ id: string; type: string; text: string; raw: any }>;
    req: any;
  }) {
    const topK = Math.min(
      200,
      Math.max(5, Number(process.env.AI_RECOMMEND_TOPK || 20)),
    );
    const batchSize = Math.min(
      64,
      Math.max(4, Number(process.env.AI_EMBED_BATCH_SIZE || 32)),
    );

    const queryEmb = await this.embedTexts(
      [params.query],
      params.req,
      'recommend_embed_query',
    );
    const qv = queryEmb[0] || [];

    const docVecs: number[][] = [];
    for (let i = 0; i < params.docs.length; i += batchSize) {
      const batch = params.docs.slice(i, i + batchSize).map((d) => d.text);
      const vecs = await this.embedTexts(
        batch,
        params.req,
        'recommend_embed_docs',
      );
      for (const v of vecs) docVecs.push(v);
    }

    const scored = params.docs
      .map((d, i) => ({
        index: i,
        id: d.id,
        type: d.type,
        score: cosine(qv, docVecs[i] || []),
        raw: d.raw,
        text: d.text,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(topK, params.docs.length));

    const reranked = await this.rerank({
      query: params.query,
      documents: scored.map((x) => x.text),
      req: params.req,
    });

    const merged = reranked
      .map((r) => {
        const s = scored[r.index];
        return {
          id: s?.id,
          type: s?.type,
          score: r.score,
          pre_score: s?.score,
          raw: s?.raw,
        };
      })
      .filter((x) => x.id != null);

    return merged;
  }

  private async embedTexts(texts: string[], req: any, role: string) {
    const baseUrl = String(process.env.AI_BASE_URL || '').trim();
    const apiKey = String(process.env.AI_API_KEY || '').trim();
    const path = String(
      process.env.AI_EMBEDDINGS_PATH || '/v1/embeddings',
    ).trim();
    const model = String(process.env.AI_EMBED_MODEL || '').trim();
    if (!baseUrl || !apiKey || !model)
      throw new BadRequestException('Embedding 配置不完整');

    const url =
      baseUrl.replace(/\/$/, '') + (path.startsWith('/') ? path : `/${path}`);
    const t0 = Date.now();
    const input_type = role.includes('query') ? 'query' : 'passage';
    const response = await axios
      .post(
        url,
        { model, input: texts, input_type },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: Number(process.env.AI_HTTP_TIMEOUT_MS || 60000),
        },
      )
      .catch((e) => this.throwUpstreamError('Embedding', e));
    const latencyMs = Date.now() - t0;
    const data = response.data;
    const arr = Array.isArray(data?.data) ? data.data : [];
    const vecs = arr.map((x: any) =>
      Array.isArray(x?.embedding) ? x.embedding.map((n: any) => Number(n)) : [],
    );

    await this.callLogStore.insert({
      global_user_id: this.extractGlobalUserId(req),
      role,
      model,
      provider_base_url: baseUrl,
      latency_ms: latencyMs,
      request_json: { input_count: texts.length },
      response_json: { returned: vecs.length },
      status: 'ok',
    });

    return vecs;
  }

  private async rerank(params: {
    query: string;
    documents: string[];
    req: any;
  }) {
    const baseUrl = String(process.env.AI_BASE_URL || '').trim();
    const apiKey = String(process.env.AI_API_KEY || '').trim();
    const path = String(process.env.AI_RERANK_PATH || '').trim();
    const model = String(process.env.AI_RERANK_MODEL || '').trim();
    if (!baseUrl || !apiKey || !path || !model)
      throw new BadRequestException('Rerank 配置不完整');

    const topN = Math.min(
      params.documents.length,
      Math.max(
        1,
        Number(process.env.AI_RERANK_TOP_N || params.documents.length),
      ),
    );

    const url =
      baseUrl.replace(/\/$/, '') + (path.startsWith('/') ? path : `/${path}`);
    const t0 = Date.now();
    const response = await axios
      .post(
        url,
        {
          model,
          query: params.query,
          documents: params.documents,
          top_n: topN,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: Number(process.env.AI_HTTP_TIMEOUT_MS || 60000),
        },
      )
      .catch((e) => this.throwUpstreamError('Rerank', e));
    const latencyMs = Date.now() - t0;
    const data = response.data;

    const resultsRaw = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data)
          ? data
          : [];
    const results = resultsRaw
      .map((x: any) => {
        const index = Number(x?.index ?? x?.document_index ?? x?.documentIndex);
        const score = Number(
          x?.relevance_score ?? x?.score ?? x?.relevanceScore,
        );
        return Number.isFinite(index)
          ? { index, score: Number.isFinite(score) ? score : 0 }
          : null;
      })
      .filter(Boolean) as Array<{ index: number; score: number }>;

    const sorted = results.length
      ? results.sort((a, b) => b.score - a.score)
      : params.documents.map((_d, i) => ({ index: i, score: 0 }));

    await this.callLogStore.insert({
      global_user_id: this.extractGlobalUserId(params.req),
      role: 'recommend_rerank',
      model,
      provider_base_url: baseUrl,
      latency_ms: latencyMs,
      request_json: { doc_count: params.documents.length },
      response_json: { returned: sorted.length },
      status: 'ok',
    });

    return sorted;
  }

  private async redactPiiForRisk(dto: RiskAnalyzeDto, req: any) {
    const userBehavior = dto.user_behavior ?? {};
    const walletLogs = dto.wallet_logs ?? [];
    const clawPlays = dto.claw_plays ?? [];
    const enable =
      String(process.env.AI_ENABLE_PII_REDACTION || '').trim() !== 'false';
    if (!enable)
      return {
        user_behavior: userBehavior,
        wallet_logs: walletLogs,
        claw_plays: clawPlays,
      };

    const raw = toJsonString({
      user_behavior: userBehavior,
      wallet_logs: walletLogs,
      claw_plays: clawPlays,
    });
    const redactedText = redactTextBasic(raw);
    await this.callLogStore.insert({
      global_user_id: this.extractGlobalUserId(req),
      role: 'pii_redact',
      model:
        String(process.env.AI_PII_MODEL || 'basic_redact').trim() ||
        'basic_redact',
      provider_base_url: String(process.env.AI_BASE_URL || '').trim() || null,
      request_json: { size: raw.length },
      response_json: { size: redactedText.length },
      status: 'ok',
    });
    return { user_behavior: redactedText, wallet_logs: '', claw_plays: '' };
  }

  private async enforceDailyBudget() {
    const budget = this.numOrNull(process.env.AI_DAILY_BUDGET_USD);
    if (budget == null) return;
    const spent = await this.callLogStore.sumTodayCostUsd();
    if (spent >= budget) throw new BadRequestException('AI 日预算已用尽');
  }

  private async callOpenAiCompatible(params: {
    baseUrl: string;
    path: string;
    apiKey: string;
    model: string;
    messages: ChatMessage[];
    maxTokens: number;
    temperature: number;
    timeoutMs?: number;
  }) {
    const url =
      params.baseUrl.replace(/\/$/, '') +
      (params.path.startsWith('/') ? params.path : `/${params.path}`);
    const enableResponseFormat =
      String(process.env.AI_RESPONSE_FORMAT || '').trim().toLowerCase() !==
      'false';
    const body: any = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
    };
    if (enableResponseFormat) body.response_format = { type: 'json_object' };
    const response = await axios
      .post(
        url,
        body,
        {
          headers: {
            Authorization: `Bearer ${params.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: Number(params.timeoutMs ?? process.env.AI_HTTP_TIMEOUT_MS ?? 60000),
        },
      )
      .catch((e) => this.throwUpstreamError('Chat', e));
    return response.data;
  }

  private async parseJsonWithRetry(params: {
    baseUrl: string;
    chatPath: string;
    apiKey: string;
    model: string;
    messages: ChatMessage[];
    assistantText: string;
    maxTokens: number;
    timeoutMs: number;
  }) {
    const assistant = String(params.assistantText || '').trim();
    const direct = safeJsonParse(params.assistantText);
    if (direct.ok) return direct.value;

    const extracted = extractFirstJsonObject(params.assistantText);
    if (extracted) {
      const exParsed = safeJsonParse(extracted);
      if (exParsed.ok) return exParsed.value;
    }

    if (!assistant) {
      const retryMessages: ChatMessage[] = [
        ...params.messages,
        {
          role: 'user',
          content:
            '上一次输出为空或只有控制字符。请重新输出一个可被 JSON.parse 解析的 JSON 对象，只输出 JSON。',
        },
      ];
      const resRetry = await this.callOpenAiCompatible({
        baseUrl: params.baseUrl,
        path: params.chatPath,
        apiKey: params.apiKey,
        model: params.model,
        messages: retryMessages,
        maxTokens: params.maxTokens,
        temperature: 0,
        timeoutMs: params.timeoutMs,
      });
      const tRetry = String(
        resRetry?.choices?.[0]?.message?.content || '',
      ).trim();
      const parsedRetry = safeJsonParse(tRetry);
      if (parsedRetry.ok) return parsedRetry.value;
      const exRetry = extractFirstJsonObject(tRetry);
      if (exRetry) {
        const exRetryParsed = safeJsonParse(exRetry);
        if (exRetryParsed.ok) return exRetryParsed.value;
      }
      throw new BadRequestException('AI 输出为空且无法修复成有效 JSON');
    }

    const repairMessages: ChatMessage[] = [
      ...params.messages,
      ...(assistant
        ? ([{ role: 'assistant', content: assistant }] as ChatMessage[])
        : []),
      {
        role: 'user',
        content:
          '把上面的输出修复成一个可被 JSON.parse 解析的 JSON 对象，只输出 JSON。',
      },
    ];

    const res2 = await this.callOpenAiCompatible({
      baseUrl: params.baseUrl,
      path: params.chatPath,
      apiKey: params.apiKey,
      model: params.model,
      messages: repairMessages,
      maxTokens: params.maxTokens,
      temperature: 0,
      timeoutMs: params.timeoutMs,
    });

    const t2 = String(res2?.choices?.[0]?.message?.content || '').trim();
    const parsed2 = safeJsonParse(t2);
    if (parsed2.ok) return parsed2.value;
    const ex2 = extractFirstJsonObject(t2);
    if (ex2) {
      const ex2Parsed = safeJsonParse(ex2);
      if (ex2Parsed.ok) return ex2Parsed.value;
    }
    throw new BadRequestException('AI 输出不是有效 JSON');
  }

  private mock(role: string, input: any) {
    if (role === 'support_ai') {
      return {
        reply_text:
          '🎁 抽奖只需3积分（约$1.5）。你现在最优动作：继续抽奖提高中奖概率。',
        buttons: [
          { text: '继续抽奖', action: 'claw' },
          { text: '查看商城', action: 'shop' },
          { text: '纪念服务', action: 'memorial' },
        ],
        intent: 'claw_continue',
        confidence: 0.7,
      };
    }

    if (role === 'growth_ai') {
      return {
        video_script: {
          hook: '1.5美元抽到50美元宠物用品？',
          content: '展示中奖+低成本+限时',
          cta: '点进Bot马上抽',
        },
        viral_copy: '1.5美元抽盲盒，真的能中宠物用品。拉1个好友一起试试！',
        push_message: '你的3积分还没用掉：点这里继续抽一次，中奖概率更高。',
        strategy: '用低门槛中奖案例驱动点击与进入Bot。',
      };
    }

    if (role === 'product_ai') {
      return {
        pool_structure: [
          { level: 'common', ratio: 0.6, avg_cost: 0.5 },
          { level: 'rare', ratio: 0.3, avg_cost: 1 },
          { level: 'epic', ratio: 0.09, avg_cost: 2 },
          { level: 'legendary', ratio: 0.01, avg_cost: 3 },
        ],
        probability_config: {
          common: 0.6,
          rare: 0.3,
          epic: 0.09,
          legendary: 0.01,
        },
        profit_estimate: {
          cost_per_draw: 0.93,
          revenue_per_draw: 1.5,
          profit_rate: 0.38,
        },
        risk_notes: '需要限制 legendary 连续出奖；注意库存低时降权。',
        adjustment: '把 epic 上限控制在 10% 内，legendary <= 1%。',
      };
    }

    if (role === 'ops_ai') {
      return {
        status: 'warning',
        issues: ['利润率下滑', '高奖比例偏高'],
        analysis: '奖励成本上升且回收比例不足。',
        actions: [
          { action: 'legendary 概率下调 2%', priority: 'high' },
          { action: '回收比例上调 5%', priority: 'high' },
        ],
        parameter_adjustment: {
          claw_probability_adjustment: '↓',
          recycle_ratio_adjustment: '↑',
        },
      };
    }

    if (role === 'risk_ai') {
      return {
        risk_level: 'medium',
        risk_score: 65,
        flags: ['异常中奖'],
        evidence: '短时间内高等级中奖比例偏离群体均值。',
        action: { freeze: false, delay_withdraw: true, monitor: true },
      };
    }

    if (role === 'recommend_ai') {
      return {
        next_action: 'claw',
        recommendations: [
          {
            type: 'product',
            reason: '与最近奖品品类匹配，提升客单',
            priority: 'high',
          },
          { type: 'service', reason: '高情绪场景时提升转化', priority: 'mid' },
        ],
        message:
          '你刚抽到了相关奖品，建议继续抽一次提高出奖档位，同时看看匹配的商品。',
      };
    }

    return { ok: true, role, input };
  }
}
