import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3700);
  app.enableCors({ origin: true });
  await app.listen(port);
  console.log(`Client proofing API running on port ${port}`);
}

bootstrap();
