import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';

export const AUTH_FILE = path.join(process.cwd(), 'auth', 'admin.json');

const ADMIN_USER = process.env.ADMIN_EMAIL ?? 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? 'Kiotviet123456';

async function isExistingSessionValid(browser: import('@playwright/test').Browser): Promise<boolean> {
  if (!fs.existsSync(AUTH_FILE)) return false;

  const context = await browser.newContext({ storageState: AUTH_FILE });
  const page = await context.newPage();
  try {
    await page.goto('/man/#/DashBoard', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const loginFormVisible = await page.locator('#UserName').isVisible().catch(() => false);
    if (loginFormVisible) return false;

    const dashboardPage = new DashboardPage(page);
    await expect(dashboardPage.activeNavItem).toBeVisible({ timeout: 15_000 });
    return !page.url().includes('/login');
  } catch {
    return false;
  } finally {
    await context.close();
  }
}

setup('tạo/refresh session đăng nhập admin', async ({ page, context, browser }) => {
  if (await isExistingSessionValid(browser)) {
    return;
  }

  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(ADMIN_USER, ADMIN_PASS);

  const dashboardPage = new DashboardPage(page);
  await dashboardPage.waitForLoad();

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await context.storageState({ path: AUTH_FILE });
});
