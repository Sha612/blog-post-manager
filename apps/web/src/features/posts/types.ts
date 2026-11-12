/** A post as the API returns it. Dates are ISO 8601 strings. */
export interface Post {
  id: string;
  title: string;
  content: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostPage {
  data: Post[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export type PostView = "grid" | "list";
