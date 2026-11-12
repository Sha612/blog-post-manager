import { randomUUID } from 'node:crypto';
import type { ConfigService } from '@nestjs/config';
import type { Params } from 'nestjs-pino';
import type { Env } from './env.js';

/** Accept a caller's request id only if it is short and harmless to log. */
const REQUEST_ID_PATTERN = /^[\w-]{1,64}$/;

/**
 * Structured JSON logs with one line per request. Every line written while
 * handling a request carries its request id, which is also returned in the
 * x-request-id header and in error responses.
 */
export function loggerConfig(config: ConfigService<Env, true>): Params {
  const pretty = config.get('NODE_ENV', { infer: true }) === 'development';

  return {
    pinoHttp: {
      level: config.get('LOG_LEVEL', { infer: true }),
      // Human-readable output in development, JSON everywhere else.
      transport: pretty
        ? { target: 'pino-pretty', options: { singleLine: true } }
        : undefined,
      genReqId: (request, response) => {
        const incoming = request.headers['x-request-id'];
        const id =
          typeof incoming === 'string' && REQUEST_ID_PATTERN.test(incoming)
            ? incoming
            : randomUUID();
        response.setHeader('x-request-id', id);
        return id;
      },
      customLogLevel: (_request, response, error) => {
        if (error || response.statusCode >= 500) return 'error';
        if (response.statusCode >= 400) return 'warn';
        return 'info';
      },
      // Health checks run every few seconds; logging them is noise.
      autoLogging: { ignore: (request) => request.url === '/api/health' },
      // Keep request lines short: no headers, bodies or other personal data.
      serializers: {
        req: (request: { id: unknown; method: string; url: string }) => ({
          id: request.id,
          method: request.method,
          url: request.url,
        }),
        res: (response: { statusCode: number }) => ({
          statusCode: response.statusCode,
        }),
      },
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    },
  };
}
