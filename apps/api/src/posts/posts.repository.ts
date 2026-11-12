import type {
  NewPost,
  Post,
  PostChanges,
  PostPage,
  PostQuery,
} from './post.js';

/**
 * Persistence contract for posts. PostsService depends on this abstraction
 * rather than on Prisma.
 * 
 * It's an abstract class, not an interface, because TypeScript erases
 * interfaces at runtime and Nest needs a real token to inject.
 */
export abstract class PostsRepository {
  /** Newest posts first. */
  abstract findPage(query: PostQuery): Promise<PostPage>;

  abstract findById(id: string): Promise<Post | null>;

  abstract create(data: NewPost): Promise<Post>;

  /**
   * Applies the changes and increments the version, but only if the stored
   * version still equals `expectedVersion`. Returns null when no post
   * matched the id and version.
   */
  abstract updateIfVersionMatches(
    id: string,
    expectedVersion: number,
    changes: PostChanges,
  ): Promise<Post | null>;

  abstract exists(id: string): Promise<boolean>;

  abstract delete(id: string): Promise<boolean>;
}
