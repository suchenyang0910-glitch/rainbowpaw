import { defineConfig, devices } from '@playwright/test';

function normalizeBaseUrl(input: string): string {
  const trimmed = String(input ?? '').trim()
  const withoutTicks = trimmed.replace(/^`+|`+$/g, '')
  const withoutQuotes = withoutTicks.replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '')
  return withoutQuotes.trim()
}

const E2E_PORT = Number(process.env.E2E_PORT || 5173)
const DEFAULT_BASE_URL = `http://127.0.0.1:${E2E_PORT}`
const BASE_URL = normalizeBaseUrl(process.env.E2E_BASE_URL || DEFAULT_BASE_URL)

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    navigationTimeout: 60000,
    actionTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // We can add Firefox/Webkit later if needed
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${E2E_PORT} --strictPort`,
    url: BASE_URL,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || '/api',
      VITE_MOCK_INIT_DATA: process.env.VITE_MOCK_INIT_DATA || 'e2e',
      VITE_DEV_TELEGRAM_ID: process.env.VITE_DEV_TELEGRAM_ID || '123456',
    },
  },
});
