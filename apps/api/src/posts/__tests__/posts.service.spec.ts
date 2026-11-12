import { Logger } from '@nestjs/common';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  PostNotFoundException,
  PostVersionConflictException,
} from '../post.errors.js';
import { PostsService } from '../posts.service.js';
import { InMemoryPostsRepository } from '../testing/in-memory-posts.repository.js';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

describe('PostsService', () => {
  let repository: InMemoryPostsRepository;
  let service: PostsService;

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  beforeEach(() => {
    repository = new InMemoryPostsRepository();
    service = new PostsService(repository);
  });

  async function seed(count: number) {
    for (let i = 1; i <= count; i++) {
      await service.create({
        title: `Post number ${i}`,
        content: `Content of post number ${i}.`,
      });
    }
  }

  describe('list', () => {
    it('returns the requested page, newest first, with pagination metadata', async () => {
      await seed(12);

      const result = await service.list({ page: 2, pageSize: 5 });

      expect(result.items.map((post) => post.title)).toEqual([
        'Post number 7',
        'Post number 6',
        'Post number 5',
        'Post number 4',
        'Post number 3',
      ]);
      expect(result).toMatchObject({
        page: 2,
        pageSize: 5,
        total: 12,
        totalPages: 3,
      });
    });

    it('reports one page when there are no posts', async () => {
      const result = await service.list({ page: 1, pageSize: 10 });

      expect(result.items).toEqual([]);
      expect(result.totalPages).toBe(1);
    });

    it('filters by title, ignoring case and surrounding spaces', async () => {
      await service.create({
        title: 'Learning NestJS',
        content: 'Modules and providers.',
      });
      await service.create({
        title: 'Cooking pasta',
        content: 'Salt the water well.',
      });

      const result = await service.list({
        page: 1,
        pageSize: 10,
        search: '  nestjs ',
      });

      expect(result.items.map((post) => post.title)).toEqual([
        'Learning NestJS',
      ]);
      expect(result.total).toBe(1);
    });
  });

  describe('get', () => {
    it('returns an existing post', async () => {
      const created = await service.create({
        title: 'Hello',
        content: 'First post content.',
      });

      await expect(service.get(created.id)).resolves.toEqual(created);
    });

    it('throws PostNotFoundException for an unknown id', async () => {
      await expect(service.get(MISSING_ID)).rejects.toBeInstanceOf(
        PostNotFoundException,
      );
    });
  });

  describe('create', () => {
    it('stores the post at version 1', async () => {
      const created = await service.create({
        title: 'Hello',
        content: 'First post content.',
      });

      expect(created).toMatchObject({
        title: 'Hello',
        content: 'First post content.',
        version: 1,
      });
      await expect(repository.exists(created.id)).resolves.toBe(true);
    });
  });

  describe('update', () => {
    it('applies the changes and increments the version', async () => {
      const created = await service.create({
        title: 'Hello',
        content: 'First post content.',
      });

      const updated = await service.update(created.id, 1, {
        title: 'Hello again',
      });

      expect(updated).toMatchObject({
        title: 'Hello again',
        content: 'First post content.',
        version: 2,
      });
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        created.updatedAt.getTime(),
      );
    });

    it('rejects an edit based on an outdated version', async () => {
      const created = await service.create({
        title: 'Hello',
        content: 'First post content.',
      });
      await service.update(created.id, 1, { title: 'Edited in another tab' });

      await expect(
        service.update(created.id, 1, { title: 'Stale edit' }),
      ).rejects.toBeInstanceOf(PostVersionConflictException);
      await expect(service.get(created.id)).resolves.toMatchObject({
        title: 'Edited in another tab',
        version: 2,
      });
    });

    it('throws PostNotFoundException when the post does not exist', async () => {
      await expect(
        service.update(MISSING_ID, 1, { title: 'Anything' }),
      ).rejects.toBeInstanceOf(PostNotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the post', async () => {
      const created = await service.create({
        title: 'Hello',
        content: 'First post content.',
      });

      await service.remove(created.id);

      await expect(repository.exists(created.id)).resolves.toBe(false);
    });

    it('throws PostNotFoundException when the post does not exist', async () => {
      await expect(service.remove(MISSING_ID)).rejects.toBeInstanceOf(
        PostNotFoundException,
      );
    });
  });
});
