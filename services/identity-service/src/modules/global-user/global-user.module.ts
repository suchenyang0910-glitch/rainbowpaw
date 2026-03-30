import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalUserController } from './global-user.controller';
import { GlobalUserService } from './global-user.service';
import { GlobalUserEntity } from './entities/global-user.entity';
import { BotUserMappingEntity } from './entities/bot-user-mapping.entity';
import { UserTagEntity } from './entities/user-tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GlobalUserEntity, BotUserMappingEntity, UserTagEntity])],
  controllers: [GlobalUserController],
  providers: [GlobalUserService],
  exports: [GlobalUserService],
})
export class GlobalUserModule {}
