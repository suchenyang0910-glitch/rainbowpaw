import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CemeteryZoneEntity } from './entities/cemetery-zone.entity';
import { CemeterySlotEntity } from './entities/cemetery-slot.entity';
import { CemeteryController } from './cemetery.controller';
import { CemeteryService } from './cemetery.service';

@Module({
  imports: [TypeOrmModule.forFeature([CemeteryZoneEntity, CemeterySlotEntity])],
  controllers: [CemeteryController],
  providers: [CemeteryService],
  exports: [CemeteryService],
})
export class CemeteryModule {}
