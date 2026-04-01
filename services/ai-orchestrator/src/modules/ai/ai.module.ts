import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiMetricsStore } from './ai.metrics';

@Module({
  controllers: [AiController],
  providers: [AiService, AiMetricsStore],
})
export class AiModule {}
