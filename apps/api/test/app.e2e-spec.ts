import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './setup/create-test-app.js';

describe('Application (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const api = () => request(app.getHttpServer());

  it('reports healthy when the database is reachable', async () => {
    const response = await api().get('/api/health').expect(200);

    expect(response.body).toEqual({ status: 'ok', database: 'up' });
  });

  it('sends security headers and hides the framework', async () => {
    const response = await api().get('/api/health').expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('echoes a well-formed request id and puts it in error bodies', async () => {
    const response = await api()
      .get('/api/posts/not-a-uuid')
      .set('x-request-id', 'trace-123')
      .expect(400);

    expect(response.headers['x-request-id']).toBe('trace-123');
    expect(response.body.requestId).toBe('trace-123');
  });

  it('replaces a malformed request id with a generated one', async () => {
    const response = await api()
      .get('/api/health')
      .set('x-request-id', 'not valid! <script>')
      .expect(200);

    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('answers unknown routes with problem details', async () => {
    const response = await api()
      .get('/api/does-not-exist')
      .expect(404)
      .expect('Content-Type', /application\/problem\+json/);

    expect(response.body).toMatchObject({
      title: 'Not Found',
      status: 404,
      instance: '/api/does-not-exist',
    });
  });

  it('rejects malformed JSON with 400', async () => {
    await api()
      .post('/api/posts')
      .set('Content-Type', 'application/json')
      .send('{"title":')
      .expect(400);
  });

  it('rejects bodies larger than 100 KB with 413', async () => {
    await api()
      .post('/api/posts')
      .send({ title: 'Too big', content: 'x'.repeat(150_000) })
      .expect(413);
  });
});
