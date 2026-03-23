import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./src/__tests__/globalSetup.ts'],
    setupFiles: ['./src/__tests__/setup.ts'],
    // Run all test files sequentially in a single fork to share one DB connection
    // and avoid "prepared statement already exists" Prisma errors with multiple workers.
    pool: 'forks',
    // Run test files sequentially (not in parallel) to share one DB connection
    // and avoid "prepared statement already exists" Prisma errors across workers.
    fileParallelism: false,
    // Vitest sets process.env before importing config files, but env.ts uses dotenv.
    // Setting NODE_ENV here ensures dotenv loads .env.test.
    env: {
      NODE_ENV: 'test',
    },
  },
});
