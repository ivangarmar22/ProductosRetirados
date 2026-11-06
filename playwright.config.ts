import { defineConfig, devices } from '@playwright/test';

const canal = process.env.CI ? undefined : 'msedge';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  outputDir: 'test-results',
  use: { baseURL: 'http://localhost:4599', channel: canal },
  webServer: { command: 'node tests/e2e/servidor.mjs', url: 'http://localhost:4599/', reuseExistingServer: true, timeout: 30000 },
  projects: [
    { name: 'movil', use: { ...devices['Pixel 7'], channel: canal } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'escritorio', use: { viewport: { width: 1280, height: 900 } } },
  ],
});
