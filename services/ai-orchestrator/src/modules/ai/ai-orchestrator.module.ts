import { Module } from '@nestjs/common';
import { NimAiService } from './nim-ai.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiOrchestratorController } from './ai-orchestrator.controller';

@Module({
  controllers: [AiOrchestratorController],
  providers: [NimAiService, AiOrchestratorService],
  exports: [AiOrchestratorService],
})
export class AiOrchestratorModule {}
