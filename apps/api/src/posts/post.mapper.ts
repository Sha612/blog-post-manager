import type { Post } from './post.js';
import type { PostResponse } from './posts.schemas.js';

/**
 * The public representation of a post. Mapping explicitly means a new
 * database column never reaches API clients by accident.
 */
export function toPostResponse(post: Post): PostResponse {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    version: post.version,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}
