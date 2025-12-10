import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as nodeCrypto from 'crypto';

async function bootstrap() {
  if (!(global as any).crypto) {
    (global as any).crypto = nodeCrypto;
  }

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3700);
  app.enableCors({ origin: true });
  await app.listen(port);
  console.log(`Client proofing API running on port ${port}`);
}

bootstrap();
