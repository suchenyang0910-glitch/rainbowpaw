import { Controller, Post, Body, Get, Headers } from '@nestjs/common';
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

  @Post('recommend/next')
  async getRecommendationsNext(@Body() dto: { global_user_id: string; context: any }) {
    const result = await this.aiService.generateRecommendations(dto.global_user_id, dto.context);
    return { code: 0, data: result };
  }

  @Post('support/chat')
  async chatSupport(@Body() dto: { global_user_id: string; question: string; context: any }) {
    const result = await this.aiService.generateSupportResponse(dto.global_user_id, dto.question, dto.context);
    return { code: 0, data: result };
  }

  @Post('support/reply')
  async supportReply(
    @Headers('x-global-user-id') globalUserId: string,
    @Body() dto: { user_message: string; user_profile?: any; context?: any },
  ) {
    const gid = String(globalUserId || 'admin');
    const context = {
      profile: dto?.user_profile && typeof dto.user_profile === 'object' ? dto.user_profile : {},
      ...(dto?.context && typeof dto.context === 'object' ? dto.context : {}),
    };
    const result = await this.aiService.supportReply(gid, String(dto?.user_message || ''), context);
    return { code: 0, data: result };
  }

  @Post('growth/generate')
  async growthGenerate(
    @Headers('x-global-user-id') globalUserId: string,
    @Body() dto: any,
  ) {
    const gid = String(globalUserId || 'admin');
    const result = await this.aiService.generateGrowthContent(gid, dto || {});
    return { code: 0, data: result };
  }

  @Post('ops/analyze')
  async opsAnalyze(
    @Headers('x-global-user-id') globalUserId: string,
    @Body() dto: any,
  ) {
    const gid = String(globalUserId || 'admin');
    const result = await this.aiService.analyzeOps(gid, dto || {});
    return { code: 0, data: result };
  }

  @Get('health')
  healthCheck() {
    return { status: 'ok', service: 'ai-orchestrator' };
  }
}
