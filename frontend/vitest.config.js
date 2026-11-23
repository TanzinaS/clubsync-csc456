import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      include: ['src/**'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 85,
        lines: 85,
      },
    },
  },
});
