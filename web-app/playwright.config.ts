import { defineConfig, devices } from '@playwright/test'

function normalizeBaseUrl(input: string): string {
  const trimmed = String(input ?? '').trim()
  const withoutTicks = trimmed.replace(/^`+|`+$/g, '')
  const withoutQuotes = withoutTicks.replace(/^\"+|\"+$/g, '').replace(/^'+|'+$/g, '')
  return withoutQuotes.trim()
}

const E2E_PORT = Number(process.env.E2E_PORT || 5173)
const DEFAULT_BASE_URL = `http://127.0.0.1:${E2E_PORT}`
const BASE_URL = normalizeBaseUrl(process.env.E2E_BASE_URL || DEFAULT_BASE_URL)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    navigationTimeout: 60000,
    actionTimeout: 30000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${E2E_PORT} --strictPort`,
    url: BASE_URL,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      VITE_API_BASE_URL:
        process.env.VITE_API_BASE_URL || 'http://mock.rainbowpaw.local/api',
      VITE_MOCK_INIT_DATA: process.env.VITE_MOCK_INIT_DATA || 'e2e',
      VITE_DEV_TELEGRAM_ID: process.env.VITE_DEV_TELEGRAM_ID || '123456',
    },
  },
})
