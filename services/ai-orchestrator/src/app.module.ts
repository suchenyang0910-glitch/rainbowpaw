import { Module } from '@nestjs/common';
import { AiOrchestratorModule } from './modules/ai/ai-orchestrator.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [AiOrchestratorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
