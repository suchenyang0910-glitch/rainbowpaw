import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalUserEntity } from '../global-user/entities/global-user.entity';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GlobalUserEntity])],
  controllers: [AdminController],
})
export class AdminModule {}

