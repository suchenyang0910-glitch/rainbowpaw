import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemorialPageEntity } from './entities/memorial-page.entity';
import { MemorialController } from './memorial.controller';
import { MemorialService } from './memorial.service';

@Module({
  imports: [TypeOrmModule.forFeature([MemorialPageEntity])],
  controllers: [MemorialController],
  providers: [MemorialService],
  exports: [MemorialService],
})
export class MemorialModule {}
