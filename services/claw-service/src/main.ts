import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { AppModule } from './app.module';

loadEnv({ path: join(__dirname, '..', '..', '..', '.env'), override: true, quiet: true });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT || 3006);
}
bootstrap();
