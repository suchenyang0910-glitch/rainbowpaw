import { Controller, Post, Body, Get } from '@nestjs/common';
import { AiOrchestratorService } from './ai-orchestrator.service';

@Controller('ai')
export class AiOrchestratorController {
  constructor(private readonly aiService: AiOrchestratorService) {}

  @Post('care/plan')
  async getCarePlan(@Body() dto: { global_user_id: string; profile: any }) {
    const result = await this.aiService.generateCarePlan(dto.global_user_id, dto.profile);
    return { code: 0, data: result };
  }

  @Post('recommend')
  async getRecommendations(@Body() dto: { global_user_id: string; context: any }) {
    const result = await this.aiService.generateRecommendations(dto.global_user_id, dto.context);
    return { code: 0, data: result };
  }

  @Post('support/chat')
  async chatSupport(@Body() dto: { global_user_id: string; question: string; context: any }) {
    const result = await this.aiService.generateSupportResponse(dto.global_user_id, dto.question, dto.context);
    return { code: 0, data: result };
  }

  @Get('health')
  healthCheck() {
    return { status: 'ok', service: 'ai-orchestrator' };
  }
}
