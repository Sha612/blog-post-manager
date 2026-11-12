import { z } from 'zod';

/** Validation limits. The web app's form schema mirrors these values. */
export const TITLE_MIN = 3;
export const TITLE_MAX = 120;
export const CONTENT_MIN = 10;
export const CONTENT_MAX = 20_000;
export const PAGE_SIZE_MAX = 50;

const title = z
  .string({
    error: (issue) =>
      issue.input === undefined ? 'Title is required.' : 'Title must be text.',
  })
  .trim()
  .min(TITLE_MIN, `Title must be at least ${TITLE_MIN} characters.`)
  .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters.`);

const content = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? 'Content is required.'
        : 'Content must be text.',
  })
  .trim()
  .min(CONTENT_MIN, `Content must be at least ${CONTENT_MIN} characters.`)
  .max(CONTENT_MAX, `Content must be at most ${CONTENT_MAX} characters.`);

export const postIdSchema = z.uuid({ error: 'The post id must be a UUID.' });

/** strictObject rejects unknown fields instead of silently dropping them. */
export const createPostSchema = z.strictObject({ title, content });

export const updatePostSchema = z
  .strictObject({
    title: title.optional(),
    content: content.optional(),
    version: z
      .number({ error: 'Version must be a whole number.' })
      .int('Version must be a whole number.')
      .positive('Version must be positive.'),
  })
  .refine((body) => body.title !== undefined || body.content !== undefined, {
    error: 'Provide a title or content to update.',
  });

export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX).default(10),
  q: z.string().trim().max(100).optional(),
});

export const postResponseSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  content: z.string(),
  version: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const postListResponseSchema = z.object({
  data: z.array(postResponseSchema),
  meta: z.object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type CreatePostBody = z.infer<typeof createPostSchema>;
export type UpdatePostBody = z.infer<typeof updatePostSchema>;
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
export type PostResponse = z.infer<typeof postResponseSchema>;
export type PostListResponse = z.infer<typeof postListResponseSchema>;
