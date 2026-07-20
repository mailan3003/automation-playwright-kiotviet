import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { cacheApiTokenFromBrowser } from '../api/helpers/shared-auth.helper';

export const AUTH_FILE = path.join(process.cwd(), 'auth', 'admin.json');

const ADMIN_USER = process.env.ADMIN_EMAIL ?? 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? 'Kiotviet123456';

// Angular app lưu JWT hiện hành ở localStorage key "cat" sau khi login UI thành công —
// giá trị này giống hệt token mà endpoint POST /api/account/login trả về, nên có thể tái sử dụng
// trực tiếp cho các API test thay vì tự gọi login API riêng (bị chặn khi gọi "trần" từ IP CI runner).
async function readTokenFromLocalStorage(page: import('@playwright/test').Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem('cat'));
}

async function isExistingSessionValid(browser: import('@playwright/test').Browser): Promise<string | null> {
  if (!fs.existsSync(AUTH_FILE)) return null;

  const context = await browser.newContext({ storageState: AUTH_FILE });
  const page = await context.newPage();
  try {
    await page.goto('/man/#/DashBoard', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const loginFormVisible = await page.locator('#UserName').isVisible().catch(() => false);
    if (loginFormVisible) return null;

    const dashboardPage = new DashboardPage(page);
    await expect(dashboardPage.activeNavItem).toBeVisible({ timeout: 15_000 });
    if (page.url().includes('/login')) return null;

    return readTokenFromLocalStorage(page);
  } catch {
    return null;
  } finally {
    await context.close();
  }
}

setup('tạo/refresh session đăng nhập admin', async ({ page, context, browser }) => {
  const existingToken = await isExistingSessionValid(browser);
  if (existingToken) {
    cacheApiTokenFromBrowser(ADMIN_USER, existingToken);
    return;
  }

  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(ADMIN_USER, ADMIN_PASS);

  const dashboardPage = new DashboardPage(page);
  try {
    await dashboardPage.waitForLoad();
  } catch (err) {
    const currentUrl = page.url();
    const errorVisible = await loginPage.isErrorVisible().catch(() => false);
    const errorText = errorVisible ? await loginPage.getErrorMessage().catch(() => '') : '';
    throw new Error(
      `Không redirect sang Dashboard sau khi login.\n` +
      `URL hiện tại: ${currentUrl}\n` +
      `Lỗi hiển thị trên form login: ${errorVisible ? errorText : '(không có)'}\n` +
      `ADMIN_EMAIL đang dùng: "${ADMIN_USER}"`
    );
  }

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await context.storageState({ path: AUTH_FILE });

  const token = await readTokenFromLocalStorage(page);
  if (token) {
    cacheApiTokenFromBrowser(ADMIN_USER, token);
  }
});
