import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BridgeController } from './bridge.controller';
import { BridgeService } from './bridge.service';
import { BridgeEventEntity } from './entities/bridge-event.entity';
import { DeepLinkTokenEntity } from './entities/deep-link-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BridgeEventEntity, DeepLinkTokenEntity])],
  controllers: [BridgeController],
  providers: [BridgeService],
  exports: [BridgeService],
})
export class BridgeModule {}
