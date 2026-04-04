import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { InternalAuthGuard } from './common/guards/internal-auth.guard';
import { OrderEntity } from './modules/orders/entities/order.entity';
import { OrdersModule } from './modules/orders/orders.module';

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
        entities: [OrderEntity],
        synchronize: false,
      }),
    }),
    OrdersModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: InternalAuthGuard }],
})
export class AppModule {}

