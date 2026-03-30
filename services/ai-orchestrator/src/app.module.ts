import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { InternalAuthGuard } from './common/guards/internal-auth.guard';
import { AiModule } from './modules/ai/ai.module';
import { AiCallLogEntity } from './modules/ai/entities/ai-call-log.entity';
import { CallLogModule } from './modules/call-log/call-log.module';

@Module({
  imports: (() => {
    const enableDb = String(process.env.AI_ENABLE_DB || '').trim() === 'true';
    const imports: any[] = [AiModule, CallLogModule.forRoot({ enableDb })];
    if (enableDb) {
      imports.unshift(
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'postgres',
            host: process.env.POSTGRES_HOST || '127.0.0.1',
            port: Number(process.env.POSTGRES_PORT || 5432),
            username: process.env.POSTGRES_USER || 'rainbowpaw',
            password: process.env.POSTGRES_PASSWORD || 'rainbowpaw',
            database: process.env.POSTGRES_DB || 'rainbowpaw',
            entities: [AiCallLogEntity],
            synchronize: false,
          }),
        }),
      );
    }
    return imports;
  })(),
  providers: [{ provide: APP_GUARD, useClass: InternalAuthGuard }],
})
export class AppModule {}
