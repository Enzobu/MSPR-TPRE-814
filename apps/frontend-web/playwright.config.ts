import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

// E2E (ADR-0005). En local : `pnpm test:e2e` démarre Vite puis lance les specs
// tests/e2e/*.spec.ts. En CI (job `e2e` de ci.yml), Vite est démarré par le
// webServer ci-dessous ; les specs auth mockent le réseau → aucun backend requis.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  // Garde-fous CI : interdit les `.only` oubliés, retente les specs flaky.
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    // En CI on démarre toujours une instance fraîche ; en local on réutilise.
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
