// Vitest configuration for testing the Britescript Vite plugin

import { defineConfig } from 'vitest/config.js';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'examples']
  }
});