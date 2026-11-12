import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Serves interactive API docs at /api/docs and the OpenAPI document at
 * /api/docs/json. Request and response schemas come from the same Zod
 * schemas that validate requests, so the docs can't drift from the code.
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Blog Post Manager API')
    .setDescription(
      'Create, read, update and delete blog posts. Errors are returned as ' +
        'RFC 9457 problem details (application/problem+json).',
    )
    .setVersion('1.0.0')
    .build();

  SwaggerModule.setup(
    'api/docs',
    app,
    () => SwaggerModule.createDocument(app, config),
    { jsonDocumentUrl: 'api/docs/json' },
  );
}
