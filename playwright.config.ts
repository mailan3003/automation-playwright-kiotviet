import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './src/tests',
  outputDir: './test-results',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://testz18.kiotviet.vn',
    viewport: { width: 1920, height: 1080 },
    headless: process.env.CI ? true : false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      // Timeout riêng cao hơn mặc định (60s) — app staging đôi khi kẹt ở splash AngularJS lúc
      // load lần đầu, và mạng cục bộ đôi khi đứt/đổi interface giữa chừng (ERR_NETWORK_CHANGED),
      // nên LoginPage.navigate() có retry 3 lần — cần đủ ngân sách cho worst-case cả 3 lần.
      name: 'setup',
      testDir: './src/setup',
      testMatch: /.*\.setup\.ts/,
      timeout: 300_000,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Test cho chính chức năng đăng nhập — không dùng storageState vì cần kiểm tra form login thực tế
      name: 'auth',
      testDir: './src/tests/auth',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Test API thuần — chỉ dùng APIRequestContext (fixture `request`), không cần browser/storageState.
      // Token lấy qua getSharedApiToken() (cache từ setup nếu có, hoặc tự login qua HTTP nếu chưa có) —
      // vì vậy KHÔNG khai báo dependencies: ['setup'] để tránh mở browser không cần thiết.
      name: 'api',
      testDir: './src/tests/api',
    },
    {
      // Các test nghiệp vụ khác — tái sử dụng session đã đăng nhập sẵn (auth/admin.json)
      name: 'chromium',
      testDir: './src/tests',
      testIgnore: ['auth/**', 'api/**'],
      use: { ...devices['Desktop Chrome'], storageState: 'auth/admin.json' },
      dependencies: ['setup'],
    },
  ],
});
