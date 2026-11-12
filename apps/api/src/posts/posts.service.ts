import { Injectable, Logger } from '@nestjs/common';
import type { NewPost, Post, PostChanges, PostQuery } from './post.js';
import {
  PostNotFoundException,
  PostVersionConflictException,
} from './post.errors.js';
import { PostsRepository } from './posts.repository.js';

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Business rules for posts. Knows nothing about HTTP or Prisma. */
@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(private readonly posts: PostsRepository) {}

  async list(query: PostQuery): Promise<Paginated<Post>> {
    const search = query.search?.trim() || undefined;
    const { items, total } = await this.posts.findPage({ ...query, search });

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async get(id: string): Promise<Post> {
    const post = await this.posts.findById(id);
    if (!post) {
      throw new PostNotFoundException(id);
    }
    return post;
  }

  async create(data: NewPost): Promise<Post> {
    const post = await this.posts.create(data);
    this.logger.log({ postId: post.id }, 'post.created');
    return post;
  }

  /**
   * Optimistic concurrency: the client sends the version it edited. If the
   * stored version moved on, someone else saved first and the client must
   * reload instead of silently overwriting their change.
   */
  async update(
    id: string,
    expectedVersion: number,
    changes: PostChanges,
  ): Promise<Post> {
    const updated = await this.posts.updateIfVersionMatches(
      id,
      expectedVersion,
      changes,
    );
    if (updated) {
      this.logger.log({ postId: id, version: updated.version }, 'post.updated');
      return updated;
    }

    if (!(await this.posts.exists(id))) {
      throw new PostNotFoundException(id);
    }
    this.logger.warn({ postId: id, expectedVersion }, 'post.version_conflict');
    throw new PostVersionConflictException(id, expectedVersion);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.posts.delete(id);
    if (!deleted) {
      throw new PostNotFoundException(id);
    }
    this.logger.log({ postId: id }, 'post.deleted');
  }
}
