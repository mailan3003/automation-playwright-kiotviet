import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

type Fixtures = {
  loginPage: LoginPage;
  authenticatedPage: Page;
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
});

export { expect } from '@playwright/test';
