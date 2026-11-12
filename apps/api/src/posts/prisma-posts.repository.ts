import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  NewPost,
  Post,
  PostChanges,
  PostPage,
  PostQuery,
} from './post.js';
import { PostsRepository } from './posts.repository.js';

/** Prisma error code for "an operation needed a record that wasn't found". */
const RECORD_NOT_FOUND = 'P2025';

/**
 * PostsRepository backed by PostgreSQL through Prisma. This is the only
 * posts class that knows about Prisma; its errors never leave this file.
 */
@Injectable()
export class PrismaPostsRepository extends PostsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findPage({ page, pageSize, search }: PostQuery): Promise<PostPage> {
    const where: Prisma.PostWhereInput = search
      ? { title: { contains: escapeLikePattern(search), mode: 'insensitive' } }
      : {};

    // Both queries run in one transaction, so the page and the total agree.
    const [items, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        // id breaks ties so the order is stable between pages.
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.post.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string): Promise<Post | null> {
    return this.prisma.post.findUnique({ where: { id } });
  }

  create(data: NewPost): Promise<Post> {
    return this.prisma.post.create({ data });
  }

  async updateIfVersionMatches(
    id: string,
    expectedVersion: number,
    changes: PostChanges,
  ): Promise<Post | null> {
    try {
      // A single UPDATE ... WHERE id = $1 AND version = $2, so two
      // concurrent edits can't both succeed.
      return await this.prisma.post.update({
        where: { id, version: expectedVersion },
        data: { ...changes, version: { increment: 1 } },
      });
    } catch (error) {
      if (isRecordNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    return (await this.prisma.post.count({ where: { id } })) > 0;
  }

  async delete(id: string): Promise<boolean> {
    const { count } = await this.prisma.post.deleteMany({ where: { id } });
    return count > 0;
  }
}

/**
 * Prisma's `contains` becomes ILIKE '%term%' without escaping the term, so
 * % and _ typed by a user would act as wildcards ("100%" would also match
 * "1000"). Escape them, and the escape character itself, so they match
 * literally.
 */
export function escapeLikePattern(term: string): string {
  return term.replace(/[\\%_]/g, '\\$&');
}

function isRecordNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === RECORD_NOT_FOUND
  );
}
