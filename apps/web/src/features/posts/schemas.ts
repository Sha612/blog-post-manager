import { z } from "zod";

// Same limits and messages as the API (apps/api/src/posts/posts.schemas.ts),
// so the form reports problems before the request is sent.
export const TITLE_MIN = 3;
export const TITLE_MAX = 120;
export const CONTENT_MIN = 10;
export const CONTENT_MAX = 20_000;

export const postFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(TITLE_MIN, `Title must be at least ${TITLE_MIN} characters.`)
    .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters.`),
  content: z
    .string()
    .trim()
    .min(CONTENT_MIN, `Content must be at least ${CONTENT_MIN} characters.`)
    .max(CONTENT_MAX, `Content must be at most ${CONTENT_MAX} characters.`),
});

export type PostFormValues = z.infer<typeof postFormSchema>;

export const postIdSchema = z.uuid();

export const versionSchema = z.number().int().positive();
