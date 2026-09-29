import { defineConfig, devices } from '@playwright/test';

const PORTA = Number(process.env.PORTA_E2E ?? 3100);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'celular', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npm run start -- -p ${PORTA}`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Os testes enviam vários leads seguidos a partir do mesmo IP.
    env: { LIMITE_LEADS_MAX: '1000' },
  },
});
