import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { AppModule } from './app.module';

loadEnv({ path: join(__dirname, '..', '..', '..', '.env'), override: true });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  await app.listen(process.env.PORT ?? 3012);
}
bootstrap();
