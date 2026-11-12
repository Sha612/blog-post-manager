import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp } from './setup/create-test-app.js';

const MISSING_ID = '6f1c1f8e-2b1a-4c3d-9e8f-0a1b2c3d4e5f';

describe('Posts API (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE posts`;
  });

  afterAll(async () => {
    await app.close();
  });

  const api = () => request(app.getHttpServer());

  async function createPost(title: string, content = 'Some post content.') {
    const response = await api()
      .post('/api/posts')
      .send({ title, content })
      .expect(201);
    return response.body as { id: string; version: number };
  }

  describe('POST /api/posts', () => {
    it('creates a post, trims input and returns its location', async () => {
      const response = await api()
        .post('/api/posts')
        .send({ title: '  Hello world  ', content: 'My very first post.' })
        .expect(201);

      expect(response.headers.location).toBe(`/api/posts/${response.body.id}`);
      expect(response.body).toEqual({
        id: expect.any(String),
        title: 'Hello world',
        content: 'My very first post.',
        version: 1,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('rejects invalid fields with problem details listing each one', async () => {
      const response = await api()
        .post('/api/posts')
        .send({ title: '   ', content: 'short' })
        .expect(400)
        .expect('Content-Type', /application\/problem\+json/);

      expect(response.body).toMatchObject({
        title: 'Bad Request',
        status: 400,
        instance: '/api/posts',
        errors: [
          { field: 'title', message: 'Title must be at least 3 characters.' },
          {
            field: 'content',
            message: 'Content must be at least 10 characters.',
          },
        ],
      });
    });

    it('rejects unknown fields', async () => {
      await api()
        .post('/api/posts')
        .send({ title: 'Hello', content: 'Valid content.', author: 'me' })
        .expect(400);
    });
  });

  describe('GET /api/posts', () => {
    it('pages through posts, newest first', async () => {
      await createPost('First post');
      await createPost('Second post');
      await createPost('Third post');

      const response = await api()
        .get('/api/posts')
        .query({ page: 1, pageSize: 2 })
        .expect(200);

      expect(
        response.body.data.map((post: { title: string }) => post.title),
      ).toEqual(['Third post', 'Second post']);
      expect(response.body.meta).toEqual({
        page: 1,
        pageSize: 2,
        total: 3,
        totalPages: 2,
      });
    });

    it('searches titles case-insensitively', async () => {
      await createPost('Learning NestJS');
      await createPost('Cooking pasta');

      const response = await api()
        .get('/api/posts')
        .query({ q: 'nestjs' })
        .expect(200);

      expect(response.body.meta.total).toBe(1);
      expect(response.body.data[0].title).toBe('Learning NestJS');
    });

    it('treats % and _ in the search term as plain characters', async () => {
      await createPost('Growth of 100% this year');
      await createPost('Growth of 1000 this year');
      await createPost('Naming user_id columns');
      await createPost('Naming userXid columns');

      const percent = await api()
        .get('/api/posts')
        .query({ q: '100%' })
        .expect(200);
      const underscore = await api()
        .get('/api/posts')
        .query({ q: 'user_id' })
        .expect(200);

      const titles = (response: request.Response) =>
        response.body.data.map((post: { title: string }) => post.title);
      expect(titles(percent)).toEqual(['Growth of 100% this year']);
      expect(titles(underscore)).toEqual(['Naming user_id columns']);
    });

    it('rejects a page size above the limit', async () => {
      await api().get('/api/posts').query({ pageSize: 500 }).expect(400);
    });
  });

  describe('GET /api/posts/:id', () => {
    it('returns the post', async () => {
      const { id } = await createPost('Readable post');

      const response = await api().get(`/api/posts/${id}`).expect(200);

      expect(response.body).toMatchObject({ id, title: 'Readable post' });
    });

    it('answers 404 for an unknown id', async () => {
      const response = await api().get(`/api/posts/${MISSING_ID}`).expect(404);

      expect(response.body.detail).toBe(`Post ${MISSING_ID} was not found.`);
    });

    it('answers 400 for an id that is not a UUID', async () => {
      await api().get('/api/posts/not-a-uuid').expect(400);
    });
  });

  describe('PATCH /api/posts/:id', () => {
    it('applies the changes and increments the version', async () => {
      const { id } = await createPost('Original title');

      const response = await api()
        .patch(`/api/posts/${id}`)
        .send({ title: 'Updated title', version: 1 })
        .expect(200);

      expect(response.body).toMatchObject({
        title: 'Updated title',
        content: 'Some post content.',
        version: 2,
      });
    });

    it('answers 409 when the post changed since it was loaded', async () => {
      const { id } = await createPost('Original title');
      await api()
        .patch(`/api/posts/${id}`)
        .send({ title: 'Saved first', version: 1 })
        .expect(200);

      const response = await api()
        .patch(`/api/posts/${id}`)
        .send({ title: 'Stale edit', version: 1 })
        .expect(409);

      expect(response.body.title).toBe('Conflict');
      const current = await api().get(`/api/posts/${id}`).expect(200);
      expect(current.body).toMatchObject({ title: 'Saved first', version: 2 });
    });

    it('answers 400 when nothing is being changed', async () => {
      const { id } = await createPost('Original title');

      await api().patch(`/api/posts/${id}`).send({ version: 1 }).expect(400);
    });

    it('answers 404 for an unknown id', async () => {
      await api()
        .patch(`/api/posts/${MISSING_ID}`)
        .send({ title: 'Anything', version: 1 })
        .expect(404);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('deletes the post', async () => {
      const { id } = await createPost('Short-lived post');

      await api().delete(`/api/posts/${id}`).expect(204);
      await api().get(`/api/posts/${id}`).expect(404);
    });

    it('answers 404 for an unknown id', async () => {
      await api().delete(`/api/posts/${MISSING_ID}`).expect(404);
    });
  });
});
