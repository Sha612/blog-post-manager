import "server-only";
import { cache } from "react";
import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/client";
import { type ListParams, PAGE_SIZE } from "./list-params";
import { postIdSchema } from "./schemas";
import type { Post, PostPage } from "./types";

/** Reads used by Server Components. */
export async function getPosts({
  page,
  q,
}: Pick<ListParams, "page" | "q">): Promise<PostPage> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
  });
  if (q) params.set("q", q);
  return apiRequest<PostPage>(`/posts?${params}`);
}

/**
 * One post, or null when it doesn't exist. Wrapped in React's cache() so
 * a page and its metadata share a single API call per request.
 */
export const getPost = cache(async (id: string): Promise<Post | null> => {
  if (!postIdSchema.safeParse(id).success) {
    return null;
  }
  try {
    return await apiRequest<Post>(`/posts/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
});
