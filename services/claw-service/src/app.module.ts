import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClawModule } from './modules/claw/claw.module';
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
    ClawModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
