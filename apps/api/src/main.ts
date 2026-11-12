import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import type { Env } from './config/env.js';
import { setupSwagger } from './swagger.js';

async function bootstrap() {
  // Buffer startup logs until the pino logger is installed in configureApp.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  configureApp(app);
  setupSwagger(app);

  const config = app.get<ConfigService<Env, true>>(ConfigService);
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
