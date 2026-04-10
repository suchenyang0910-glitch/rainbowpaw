import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClawPoolEntity } from './entities/claw-pool.entity';
import { ClawPoolItemEntity } from './entities/claw-pool-item.entity';
import { ClawPlayEntity } from './entities/claw-play.entity';
import { ClawRewardEntity } from './entities/claw-reward.entity';
import { ClawController } from './claw.controller';
import { ClawService } from './claw.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClawPoolEntity, ClawPoolItemEntity, ClawPlayEntity, ClawRewardEntity])],
  controllers: [ClawController],
  providers: [ClawService],
  exports: [ClawService],
})
export class ClawModule {}
