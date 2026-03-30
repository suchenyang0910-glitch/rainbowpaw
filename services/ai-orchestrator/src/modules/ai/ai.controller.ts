import { Body, Controller, Post, Req } from '@nestjs/common';
import { success } from '../../common/utils/response';
import { AiService } from './ai.service';
import { SupportReplyDto } from './dto/support-reply.dto';
import { GrowthGenerateDto } from './dto/growth-generate.dto';
import { OpsAnalyzeDto } from './dto/ops-analyze.dto';
import { ProductOptimizeDto } from './dto/product-optimize.dto';
import { RiskAnalyzeDto } from './dto/risk-analyze.dto';
import { RecommendNextDto } from './dto/recommend-next.dto';
import { VisionAnalyzeDto } from './dto/vision-analyze.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('support/reply')
  async supportReply(@Body() dto: SupportReplyDto, @Req() req: any) {
    const out = await this.aiService.supportReply(dto, req);
    return success(out);
  }

  @Post('growth/generate')
  async growthGenerate(@Body() dto: GrowthGenerateDto, @Req() req: any) {
    const out = await this.aiService.growthGenerate(dto, req);
    return success(out);
  }

  @Post('ops/analyze')
  async opsAnalyze(@Body() dto: OpsAnalyzeDto, @Req() req: any) {
    const out = await this.aiService.opsAnalyze(dto, req);
    return success(out);
  }

  @Post('ops/analyze-report')
  async opsAnalyzeReport(@Body() dto: OpsAnalyzeDto, @Req() req: any) {
    const out = await this.aiService.opsAnalyze(dto, req);
    return success(out);
  }

  @Post('product/optimize')
  async productOptimize(@Body() dto: ProductOptimizeDto, @Req() req: any) {
    const out = await this.aiService.productOptimize(dto, req);
    return success(out);
  }

  @Post('risk/analyze')
  async riskAnalyze(@Body() dto: RiskAnalyzeDto, @Req() req: any) {
    const out = await this.aiService.riskAnalyze(dto, req);
    return success(out);
  }

  @Post('recommend/next')
  async recommendNext(@Body() dto: RecommendNextDto, @Req() req: any) {
    const out = await this.aiService.recommendNext(dto, req);
    return success(out);
  }

  @Post('vision/analyze')
  async visionAnalyze(@Body() dto: VisionAnalyzeDto, @Req() req: any) {
    const out = await this.aiService.visionAnalyze(dto, req);
    return success(out);
  }
}
