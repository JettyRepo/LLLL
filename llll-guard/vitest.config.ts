import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/helpers/global-setup.ts'],
    // e2e tests spawn real git and node processes
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
