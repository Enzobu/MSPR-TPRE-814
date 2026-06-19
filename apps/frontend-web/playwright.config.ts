import { defineConfig, devices } from '@playwright/test';

// E2E (ADR-0005). Non exécuté en CI pour l'instant (pas de step dédié) :
// `pnpm test:e2e` en local démarre Vite puis lance les specs tests/e2e/*.spec.ts.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
