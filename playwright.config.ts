import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: process.env.CI ? 1 : 2,
  timeout: process.env.CI ? 90000 : 60000,
  use: { baseURL: 'http://127.0.0.1:3000', channel: process.env.CI ? undefined : 'chrome', launchOptions: process.env.CI ? { args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'] } : undefined, headless: true },
  webServer: { command: 'npm start', url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI },
  reporter: 'list',
});
