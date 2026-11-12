import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Configuration for the Prisma CLI (generate, migrate, seed). The running
// API doesn't read this file: it connects through PrismaService.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Run by `prisma db seed`; adds demo posts to an empty database.
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
