/** A blog post as the rest of the API sees it, independent of Prisma. */
export interface Post {
  id: string;
  title: string;
  content: string;
  /** Increases by one on every update; used for optimistic concurrency. */
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewPost {
  title: string;
  content: string;
}

/** The fields a client may change on an existing post. */
export type PostChanges = Partial<NewPost>;

export interface PostQuery {
  page: number;
  pageSize: number;
  /** Case-insensitive match on the title. */
  search?: string;
}

export interface PostPage {
  items: Post[];
  total: number;
}
