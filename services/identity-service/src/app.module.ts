import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { InternalAuthGuard } from './common/guards/internal-auth.guard';
import { GlobalUserModule } from './modules/global-user/global-user.module';
import { BotUserMappingEntity } from './modules/global-user/entities/bot-user-mapping.entity';
import { GlobalUserEntity } from './modules/global-user/entities/global-user.entity';
import { UserTagEntity } from './modules/global-user/entities/user-tag.entity';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.POSTGRES_HOST || '127.0.0.1',
        port: Number(process.env.POSTGRES_PORT || 5432),
        username: process.env.POSTGRES_USER || 'rainbowpaw',
        password: process.env.POSTGRES_PASSWORD || 'rainbowpaw',
        database: process.env.POSTGRES_DB || 'rainbowpaw',
        entities: [GlobalUserEntity, BotUserMappingEntity, UserTagEntity],
        synchronize: false,
      }),
    }),
    GlobalUserModule,
    AdminModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: InternalAuthGuard }],
})
export class AppModule {}
