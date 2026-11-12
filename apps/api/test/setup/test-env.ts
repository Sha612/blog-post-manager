import { inject } from 'vitest';

// Runs before each test file is imported. Configuration is read when
// AppModule is imported, so the test values must be in place first.
// Variables already in process.env take precedence over the .env file.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = inject('databaseUrl');
process.env.LOG_LEVEL = 'silent';
process.env.RATE_LIMIT_PER_MINUTE = '10000';
