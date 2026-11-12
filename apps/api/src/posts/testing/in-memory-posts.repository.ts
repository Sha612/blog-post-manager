import { randomUUID } from 'node:crypto';
import type {
  NewPost,
  Post,
  PostChanges,
  PostPage,
  PostQuery,
} from '../post.js';
import { PostsRepository } from '../posts.repository.js';

/**
 * A real PostsRepository kept in memory, for unit tests. Using a working
 * fake instead of mocks keeps the tests about behaviour, not wiring.
 */
export class InMemoryPostsRepository extends PostsRepository {
  private readonly posts = new Map<string, Post>();
  private clock = Date.UTC(2026, 0, 1);

  findPage({ page, pageSize, search }: PostQuery): Promise<PostPage> {
    const needle = search?.toLowerCase();
    const matching = [...this.posts.values()]
      .filter((post) => !needle || post.title.toLowerCase().includes(needle))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const start = (page - 1) * pageSize;
    return Promise.resolve({
      items: matching.slice(start, start + pageSize).map(copy),
      total: matching.length,
    });
  }

  findById(id: string): Promise<Post | null> {
    const post = this.posts.get(id);
    return Promise.resolve(post ? copy(post) : null);
  }

  create(data: NewPost): Promise<Post> {
    const now = this.tick();
    const post: Post = {
      id: randomUUID(),
      ...data,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.posts.set(post.id, post);
    return Promise.resolve(copy(post));
  }

  updateIfVersionMatches(
    id: string,
    expectedVersion: number,
    changes: PostChanges,
  ): Promise<Post | null> {
    const current = this.posts.get(id);
    if (!current || current.version !== expectedVersion) {
      return Promise.resolve(null);
    }
    const updated: Post = {
      ...current,
      ...changes,
      version: current.version + 1,
      updatedAt: this.tick(),
    };
    this.posts.set(id, updated);
    return Promise.resolve(copy(updated));
  }

  exists(id: string): Promise<boolean> {
    return Promise.resolve(this.posts.has(id));
  }

  delete(id: string): Promise<boolean> {
    return Promise.resolve(this.posts.delete(id));
  }

  /** Each call returns a later timestamp, so ordering is deterministic. */
  private tick(): Date {
    this.clock += 1_000;
    return new Date(this.clock);
  }
}

function copy(post: Post): Post {
  return { ...post };
}
