import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalUserEntity } from '../global-user/entities/global-user.entity';
import { UserTagEntity } from '../global-user/entities/user-tag.entity';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GlobalUserEntity, UserTagEntity])],
  controllers: [AdminController],
})
export class AdminModule {}
