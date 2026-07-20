import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { getSharedApiToken } from '../api/helpers/shared-auth.helper';

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

setup('tạo/refresh session đăng nhập admin', async ({ page, context, browser, request }) => {
  if (await isExistingSessionValid(browser)) {
    // Vẫn cần cache token API cho các test API khác dùng — nhưng chỉ gọi SAU khi đã có
    // browser traffic thật (session hiện tại hợp lệ), tránh bị chặn do request "trần"
    // đầu tiên từ 1 IP CI runner hoàn toàn mới.
    await getSharedApiToken(request, ADMIN_USER, ADMIN_PASS);
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

  // Login UI (qua browser thật) đã chạy xong ở trên — gọi API login sau cùng để "kế thừa"
  // trạng thái IP đã được browser traffic làm nóng, tránh bị chặn do request trần đầu tiên.
  await getSharedApiToken(request, ADMIN_USER, ADMIN_PASS);
});
