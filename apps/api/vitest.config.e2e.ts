import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/setup/global-setup.ts'],
    setupFiles: ['./test/setup/test-env.ts'],
    // The suites share one database, so run the files one at a time.
    fileParallelism: false,
    // Starting the container can take a while on the first run.
    hookTimeout: 120_000,
  },
});
