import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Tests unit/UI : vitest + jsdom + @testing-library (ADR-0005).
// Les specs Playwright (tests/e2e/*.spec.ts) sont exclues — voir playwright.config.ts.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: true,
  },
});
