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
}
