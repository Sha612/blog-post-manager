import { z } from "zod";
import type { PostView } from "./types";

export const PAGE_SIZE = 9;

const listParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  q: z.string().trim().max(100).catch(""),
  view: z.enum(["grid", "list"]).catch("grid"),
});

export interface ListParams {
  page: number;
  q: string;
  view: PostView;
}

/**
 * Reads the list page's URL parameters. Anything missing or invalid falls
 * back to its default instead of failing, because users edit URLs.
 */
export function parseListParams(
  searchParams: Record<string, string | string[] | undefined>,
): ListParams {
  return listParamsSchema.parse(searchParams);
}

/** Builds a link to the list page, leaving out default values. */
export function listHref({
  page = 1,
  q = "",
  view = "grid",
}: Partial<ListParams>): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  if (view !== "grid") params.set("view", view);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
