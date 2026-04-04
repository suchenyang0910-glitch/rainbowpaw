import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { WalletLogEntity } from '../wallet/entities/wallet-log.entity';
import { WithdrawRequestEntity } from '../wallet/entities/withdraw-request.entity';
import { WalletModule } from '../wallet/wallet.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WalletEntity, WalletLogEntity, WithdrawRequestEntity]), WalletModule],
  controllers: [AdminController],
})
export class AdminModule {}
