import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';

type Fixtures = {
  loginPage: LoginPage;
  authenticatedPage: Page;
  mockedDashboardPage: DashboardPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(
      process.env.ADMIN_EMAIL ?? '',
      process.env.ADMIN_PASSWORD ?? ''
    );
    await use(page);
  },

  // Mock sẵn /api/invoices/dashboard (schema thật verify ở NET-TC01) + navigate + waitForLoad —
  // dùng cho các test không cần data thật, tránh lặp lại 3 bước này ở từng test.
  mockedDashboardPage: async ({ page }, use) => {
    await page.route('**/api/invoices/dashboard**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Total1Value: 999000000,
          Total2Value: 999000000,
          Total3Value: 99000000,
          Total: 42,
          PageSize: 0,
          Timestamp: new Date().toISOString(),
        }),
      });
    });

    await page.goto('/man/#/DashBoard', { waitUntil: 'domcontentloaded' });

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForLoad();

    await use(dashboardPage);
  },
});

export { expect } from '@playwright/test';
