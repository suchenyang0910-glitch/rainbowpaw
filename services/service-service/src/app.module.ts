import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesModule } from './modules/services/services.module';
import { MemorialModule } from './modules/memorial/memorial.module';
import { CemeteryModule } from './modules/cemetery/cemetery.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/rainbowpaw',
      autoLoadEntities: true,
      synchronize: false,
    }),
    ServicesModule,
    MemorialModule,
    CemeteryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
