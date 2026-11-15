import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/browser', timeout: 120000, workers: 1, use: { browserName: 'chromium', headless: true, viewport: { width: 1440, height: 900 } }, reporter: 'list' });
