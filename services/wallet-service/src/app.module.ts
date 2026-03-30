import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { InternalAuthGuard } from './common/guards/internal-auth.guard';
import { WalletModule } from './modules/wallet/wallet.module';
import { IdempotencyKeyEntity } from './modules/wallet/entities/idempotency-key.entity';
import { WalletEntity } from './modules/wallet/entities/wallet.entity';
import { WalletLogEntity } from './modules/wallet/entities/wallet-log.entity';
import { WithdrawRequestEntity } from './modules/wallet/entities/withdraw-request.entity';
import { AdminModule } from './modules/admin/admin.module';

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
        entities: [WalletEntity, WalletLogEntity, WithdrawRequestEntity, IdempotencyKeyEntity],
        synchronize: false,
      }),
    }),
    WalletModule,
    AdminModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: InternalAuthGuard }],
})
export class AppModule {}
