import { type ArgumentsHost, Logger, NotFoundException } from '@nestjs/common';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { RequestValidationException } from '../problem-details.js';
import { ProblemDetailsFilter } from '../problem-details.filter.js';

function respond(exception: unknown) {
  const response = {
    status: vi.fn().mockReturnThis(),
    type: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ originalUrl: '/api/posts/123' }),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  new ProblemDetailsFilter().catch(exception, host);

  return {
    status: response.status.mock.calls[0]?.[0] as number,
    contentType: response.type.mock.calls[0]?.[0] as string,
    body: response.json.mock.calls[0]?.[0] as Record<string, unknown>,
  };
}

describe('ProblemDetailsFilter', () => {
  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  it('keeps the message of an intentional HTTP error', () => {
    const { status, contentType, body } = respond(
      new NotFoundException('Post 123 was not found.'),
    );

    expect(status).toBe(404);
    expect(contentType).toBe('application/problem+json');
    expect(body).toEqual({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Post 123 was not found.',
      instance: '/api/posts/123',
    });
  });

  it('lists the invalid fields of a validation error', () => {
    const { status, body } = respond(
      new RequestValidationException([
        { field: 'title', message: 'Title is required' },
      ]),
    );

    expect(status).toBe(400);
    expect(body.errors).toEqual([
      { field: 'title', message: 'Title is required' },
    ]);
  });

  it('hides the details of an unexpected error', () => {
    const { status, body } = respond(
      new Error('connect ECONNREFUSED 10.0.0.12:5432'),
    );

    expect(status).toBe(500);
    expect(body.detail).toBe('An unexpected error occurred. Please try again.');
    expect(JSON.stringify(body)).not.toContain('ECONNREFUSED');
  });

  it('keeps the status of Express middleware errors', () => {
    const tooLarge = Object.assign(new Error('request entity too large'), {
      status: 413,
    });

    const { status, body } = respond(tooLarge);

    expect(status).toBe(413);
    expect(body.title).toBe('Payload Too Large');
  });
});
