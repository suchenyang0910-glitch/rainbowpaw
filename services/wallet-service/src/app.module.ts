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
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/rainbowpaw',
      autoLoadEntities: true,
      synchronize: false,
    }),
    WalletModule,
    AdminModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: InternalAuthGuard }],
})
export class AppModule {}
