import type { INestApplication } from '@nestjs/common';
import { ProblemDetailsFilter } from './common/problem-details.filter.js';

/**
 * Application-wide HTTP setup, shared by main.ts and the end-to-end tests
 * so the tests exercise exactly what runs in production.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.useGlobalFilters(new ProblemDetailsFilter());
}
