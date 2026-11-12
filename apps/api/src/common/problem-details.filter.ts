import { STATUS_CODES } from 'node:http';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  type ProblemDetails,
  RequestValidationException,
} from './problem-details.js';

const UNEXPECTED_ERROR = 'An unexpected error occurred. Please try again.';

/**
 * Turns every error into an RFC 9457 problem details response. Errors the
 * application raised on purpose (HttpException) keep their message;
 * anything else becomes a generic 500 so stack traces and internals never
 * reach the client. Those are logged in full on the server instead.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const status = statusOf(exception);
    const problem: ProblemDetails = {
      type: 'about:blank',
      title: STATUS_CODES[status] ?? 'Error',
      status,
      detail: detailOf(exception, status),
      instance: request.originalUrl,
    };
    // Set by the request logger; lets support find the matching log lines.
    const requestId = request.id;
    if (typeof requestId === 'string' || typeof requestId === 'number') {
      problem.requestId = String(requestId);
    }
    if (exception instanceof RequestValidationException) {
      problem.errors = exception.errors;
    }

    if (status >= 500 && !(exception instanceof HttpException)) {
      this.logger.error(exception);
    }

    response.status(status).type('application/problem+json').json(problem);
  }
}

function statusOf(exception: unknown): number {
  if (exception instanceof HttpException) {
    return exception.getStatus();
  }
  // Errors from Express middleware (e.g. body-parser: invalid JSON, payload
  // too large) carry an HTTP status of their own.
  const status = (exception as { status?: unknown } | null)?.status;
  if (typeof status === 'number' && status >= 400 && status < 600) {
    return status;
  }
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

function detailOf(exception: unknown, status: number): string {
  if (exception instanceof HttpException) {
    const body = exception.getResponse();
    if (typeof body === 'string') {
      return body;
    }
    const message = (body as { message?: unknown }).message;
    if (Array.isArray(message)) {
      return message.join('; ');
    }
    return typeof message === 'string' ? message : exception.message;
  }
  if (status < 500 && exception instanceof Error) {
    return exception.message;
  }
  return UNEXPECTED_ERROR;
}
