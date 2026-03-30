import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { IdempotencyKeyEntity } from './entities/idempotency-key.entity';
import { WalletEntity } from './entities/wallet.entity';
import { WalletLogEntity } from './entities/wallet-log.entity';
import { WithdrawRequestEntity } from './entities/withdraw-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WalletEntity, WalletLogEntity, WithdrawRequestEntity, IdempotencyKeyEntity])],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
