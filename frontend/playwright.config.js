import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    timeout: 7_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev:demo -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
