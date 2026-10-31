import { defineConfig, devices } from '@playwright/test';
const port=Number(process.env.BABELWAKE_TEST_PORT??4173);
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 240_000,
  expect: { timeout: 10_000 },
  use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure', ...devices['Desktop Chrome'], launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: `${process.env.BABELWAKE_PRODUCTION?'npm run preview':'npm run dev'} -- --host 127.0.0.1 --port ${port} --strictPort`, url: `http://127.0.0.1:${port}`, reuseExistingServer: !process.env.CI, timeout: 60_000 },
  reporter: [['list']],
});
