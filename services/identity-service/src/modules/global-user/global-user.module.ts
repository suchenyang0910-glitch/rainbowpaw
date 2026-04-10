import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotUserMappingEntity } from './entities/bot-user-mapping.entity';
import { GlobalUserEntity } from './entities/global-user.entity';
import { UserTagEntity } from './entities/user-tag.entity';
import { UserProfileEntity } from './entities/user-profile.entity';
import { GlobalUserController } from './global-user.controller';
import { GlobalUserService } from './global-user.service';

@Module({
  imports: [TypeOrmModule.forFeature([GlobalUserEntity, BotUserMappingEntity, UserTagEntity, UserProfileEntity])],
  controllers: [GlobalUserController],
  providers: [GlobalUserService],
  exports: [GlobalUserService],
})
export class GlobalUserModule {}
