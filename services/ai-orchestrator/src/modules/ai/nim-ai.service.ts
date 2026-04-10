import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class NimAiService {
  private readonly logger = new Logger(NimAiService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY || 'mock-key',
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  }

  /**
   * Helper to call NVIDIA NIM chat completions
   * Following the core memory constraint: Open Claw AI roles must output strict JSON
   */
  async generateJsonResponse(
    systemPrompt: string,
    userPrompt: string,
    model: string = 'nvidia/llama-3.1-nemotron-70b-instruct'
  ): Promise<any> {
    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 1024,
      });

      const rawResponse = completion.choices[0]?.message?.content || '{}';
      
      // Extract JSON if it's wrapped in markdown blocks
      let jsonStr = rawResponse;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0];
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0];
      }

      return JSON.parse(jsonStr.trim());
    } catch (error) {
      this.logger.error(`AI Generation Failed: ${error.message}`, error.stack);
      // Fallback response format if AI fails, to keep the system operational
      return { error: 'ai_generation_failed', fallback: true };
    }
  }
}
