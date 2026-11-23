


import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'e2e/**'],
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
