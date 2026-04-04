import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BridgeEventEntity } from './entities/bridge-event.entity';
import { OrderEntity } from './entities/order.entity';
import { WithdrawRequestEntity } from './entities/withdraw-request.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, BridgeEventEntity, WithdrawRequestEntity])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

