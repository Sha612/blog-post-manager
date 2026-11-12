import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { ProblemDetailsFilter } from './common/problem-details.filter.js';
import { createValidationPipe } from './common/validation.js';

/** Largest accepted JSON body: above the 20,000-character content limit. */
const JSON_BODY_LIMIT = '100kb';

/**
 * Application-wide HTTP setup, shared by main.ts and the end-to-end tests
 * so the tests exercise exactly what runs in production.
 */
export function configureApp(app: NestExpressApplication): void {
  app.useLogger(app.get(Logger));
  // Security headers, and no X-Powered-By header revealing the framework.
  app.use(helmet());
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new ProblemDetailsFilter());
}
