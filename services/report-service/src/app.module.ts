import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { InternalAuthGuard } from './common/guards/internal-auth.guard';
import { ReportsModule } from './modules/reports/reports.module';
import { BridgeEventEntity } from './modules/reports/entities/bridge-event.entity';
import { OrderEntity } from './modules/reports/entities/order.entity';
import { WithdrawRequestEntity } from './modules/reports/entities/withdraw-request.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.POSTGRES_HOST || '127.0.0.1',
        port: Number(process.env.POSTGRES_PORT || 5432),
        username: process.env.POSTGRES_USER || 'rainbowpaw',
        password: process.env.POSTGRES_PASSWORD || 'rainbowpaw',
        database: process.env.POSTGRES_DB || 'rainbowpaw',
        entities: [OrderEntity, BridgeEventEntity, WithdrawRequestEntity],
        synchronize: false,
      }),
    }),
    ReportsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: InternalAuthGuard }],
})
export class AppModule {}

