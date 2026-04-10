import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskRuleEntity } from './entities/risk-rule.entity';
import { RiskAlertEntity } from './entities/risk-alert.entity';
import { FrozenUserEntity } from './entities/frozen-user.entity';
import { RiskController } from './risk.controller';
import { RiskService } from './risk.service';

@Module({
  imports: [TypeOrmModule.forFeature([RiskRuleEntity, RiskAlertEntity, FrozenUserEntity])],
  controllers: [RiskController],
  providers: [RiskService],
  exports: [RiskService],
})
export class RiskModule {}
