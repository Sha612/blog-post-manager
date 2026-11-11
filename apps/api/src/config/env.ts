import { z } from 'zod';
/**
 * Every environment variable the API reads, validated once at startup.
 * A missing or malformed value stops the process with a clear message
 * instead of failing later on the first request that needs it.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  DATABASE_URL: z
    .string()
    .regex(/^postgres(ql)?:\/\//, 'must be a PostgreSQL connection URL'),
});
export type Env = z.infer<typeof envSchema>;
