import { Injectable, Logger } from '@nestjs/common';
import { NimAiService } from './nim-ai.service';

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  // Based on user core memory rules:
  // support/recommend use smaller models like nemotron nano 4b
  // product/ops/risk use nemotron-3-nano-30b-a3b (mapped to available 70b instruct if 30b isn't directly available in current integration endpoints)
  private readonly MODEL_RECOMMEND = 'nvidia/llama-3.1-nemotron-70b-instruct'; // Using standard 70b instruct as reliable default for NVIDIA NIM
  private readonly MODEL_CARE_PLAN = 'nvidia/llama-3.1-nemotron-70b-instruct';
  private readonly MODEL_SUPPORT = 'nvidia/llama-3.1-nemotron-70b-instruct';

  constructor(private readonly aiService: NimAiService) {}

  /**
   * Generates a personalized care plan for a senior pet
   * AI Role: Professional pet products consultant and e-commerce operator (Southeast Asia pet market)
   */
  async generateCarePlan(globalUserId: string, userProfile: any) {
    const systemPrompt = `You are a professional pet products consultant and e-commerce operator specializing in the Southeast Asian pet market and pet bereavement industry.
You deeply understand pet parents' psychology. 
You MUST output ONLY a valid JSON object. No markdown, no explanations.

Input Data:
Pet Type: ${userProfile?.pet_type || 'Unknown'}
Pet Age: ${userProfile?.pet_age || 'Unknown'} (Stage: ${userProfile?.pet_age_stage || 'Unknown'})
Health Issues: ${userProfile?.health_issues || 'None mentioned'}

Based on this profile, generate a personalized "Care Plan" focused on senior/emotional care.
Return JSON format exactly like this:
{
  "plan": ["Joint Support", "Kidney Care"],
  "recommendedPack": {
    "id": "pack_1",
    "name": "Senior Care Pack",
    "price": 29,
    "description": "Monthly subscription for comfort and mobility."
  },
  "rationale": "Brief empathetic explanation for why this is recommended."
}`;

    const userPrompt = `Generate the care plan for the pet profile.`;

    const result = await this.aiService.generateJsonResponse(
      systemPrompt,
      userPrompt,
      this.MODEL_CARE_PLAN
    );

    if (result.fallback) {
      return {
        plan: ['Basic Health Support'],
        recommendedPack: { id: 'pack_base', name: 'General Care Pack', price: 25 },
        rationale: 'Standard care plan recommended due to processing error.'
      };
    }

    return result;
  }

  /**
   * Generates dynamic product recommendations after a Claw play or Shop visit
   */
  async generateRecommendations(globalUserId: string, contextData: any) {
    const systemPrompt = `You are the Recommendation AI for RainbowPaw (Pet Lifecycle System).
Output ONLY a valid JSON object. No extra text.

Input Context:
User Tags: ${JSON.stringify(contextData?.tags || [])}
Recent Activity: ${JSON.stringify(contextData?.recent_activity || {})}

Generate next-step recommendations to guide the user towards high-value care or emotional services.
Return JSON format exactly like this:
{
  "suggested_actions": [
    {"label": "Subscribe Care Pack", "action_type": "care_plan"},
    {"label": "Talk to Us", "action_type": "service"}
  ],
  "recommended_products": ["p_001", "p_002"]
}`;

    const userPrompt = `Provide recommendations based on context.`;

    const result = await this.aiService.generateJsonResponse(
      systemPrompt,
      userPrompt,
      this.MODEL_RECOMMEND
    );

    if (result.fallback) {
      return {
        suggested_actions: [{ label: 'View Products', action_type: 'shop' }],
        recommended_products: []
      };
    }

    return result;
  }

  /**
   * Generates conversational support responses (Support AI)
   */
  async generateSupportResponse(globalUserId: string, question: string, contextData: any) {
    const systemPrompt = `You are RainbowPaw's Support AI. Empathetic, professional pet care consultant.
Output ONLY a valid JSON object.

Context:
User Profile: ${JSON.stringify(contextData?.profile || {})}
User Tags: ${JSON.stringify(contextData?.tags || [])}

Generate a supportive response to the user's question.
Return JSON format exactly like this:
{
  "response_text": "Your empathetic answer here...",
  "suggested_buttons": [
    {"text": "View Care Plans", "callback_data": "action_care_plan"}
  ]
}`;

    const userPrompt = `User asks: "${question}"`;

    const result = await this.aiService.generateJsonResponse(
      systemPrompt,
      userPrompt,
      this.MODEL_SUPPORT
    );

    if (result.fallback) {
      return {
        response_text: "I'm currently unable to process your request perfectly, but I'm here for you. How can I help?",
        suggested_buttons: []
      };
    }

    return result;
  }

  async supportReply(globalUserId: string, userMessage: string, contextData: any) {
    const r = await this.generateSupportResponse(globalUserId, userMessage, contextData);
    return {
      reply: String(r?.response_text || '').trim(),
      suggested_buttons: Array.isArray(r?.suggested_buttons) ? r.suggested_buttons : [],
      model_hint: this.MODEL_SUPPORT,
    };
  }

  async generateGrowthContent(_globalUserId: string, input: any) {
    const topic = String(input?.campaign?.topic || '增长活动').trim();
    const kind = String(input?.campaign?.kind || 'push').trim();
    const tone = String(input?.campaign?.tone || 'warm').trim();
    const goal = String(input?.goal || '').trim();

    const systemPrompt = `You are Growth AI for a Telegram-first pet lifecycle product.
You MUST output ONLY valid JSON.

Campaign:
topic=${topic}
kind=${kind}
tone=${tone}
goal=${goal}

Return JSON exactly like:
{
  "push_message": "...",
  "viral_copy": "...",
  "strategy": "...",
  "video_script": {"hook":"...","content":"...","cta":"..."},
  "model_hint": "..."
}`;

    const userPrompt = `Generate growth content now.`;

    const result = await this.aiService.generateJsonResponse(
      systemPrompt,
      userPrompt,
      this.MODEL_RECOMMEND,
    );

    if (result?.fallback) {
      return {
        push_message: `【${topic}】别让奖励过期～点我立即完成。`,
        viral_copy: '转发给好友一起参与，领取额外奖励。',
        strategy: `语气=${tone}；渠道=Telegram；目标=${goal || '提升转化'}`,
        video_script: { hook: '开场3秒：一句情绪共鸣', content: '中段讲清楚利益点与截止时间', cta: '结尾CTA：点击进入参与' },
        model_hint: 'fallback',
      };
    }

    return {
      push_message: result?.push_message || '',
      viral_copy: result?.viral_copy || '',
      strategy: result?.strategy || '',
      video_script: result?.video_script || { hook: '', content: '', cta: '' },
      model_hint: result?.model_hint || this.MODEL_RECOMMEND,
    };
  }

  async analyzeOps(_globalUserId: string, input: any) {
    const systemPrompt = `You are Ops AI for a microservices pet lifecycle system.
You MUST output ONLY valid JSON.

Input report:
${JSON.stringify(input?.report || {})}

Return JSON exactly like:
{
  "summary": "...",
  "issues": ["..."],
  "pool_suggestion": "...",
  "reactivation_suggestion": "...",
  "model_hint": "..."
}`;

    const userPrompt = `Analyze and propose ops suggestions.`;

    const result = await this.aiService.generateJsonResponse(
      systemPrompt,
      userPrompt,
      this.MODEL_RECOMMEND,
    );

    if (result?.fallback) {
      return {
        summary: 'ops analyze fallback',
        issues: [],
        pool_suggestion: 'N/A',
        reactivation_suggestion: 'N/A',
        model_hint: 'fallback',
      };
    }
    return {
      summary: result?.summary || '',
      issues: Array.isArray(result?.issues) ? result.issues : [],
      pool_suggestion: result?.pool_suggestion || '',
      reactivation_suggestion: result?.reactivation_suggestion || '',
      model_hint: result?.model_hint || this.MODEL_RECOMMEND,
    };
  }
}
