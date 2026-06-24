import { test, expect } from '../../fixtures/base.fixture';
import { DashboardPage } from '../../pages/dashboard.page';

test.describe('Đăng nhập KiotViet @smoke', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test('Đăng nhập thành công với tài khoản hợp lệ', async ({ page, loginPage }) => {
    const email = process.env.ADMIN_EMAIL ?? '';
    const password = process.env.ADMIN_PASSWORD ?? '';

    await loginPage.login(email, password);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForLoad();
    expect(await dashboardPage.isDisplayed()).toBeTruthy();
  });

  test('Hiển thị lỗi khi nhập sai mật khẩu', async ({ loginPage }) => {
    await loginPage.login('valid@email.com', 'sai_mat_khau_123');

    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg.length).toBeGreaterThan(0);
  });

  test('Hiển thị lỗi khi để trống email và mật khẩu', async ({ loginPage }) => {
    await loginPage.login('', '');

    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg.length).toBeGreaterThan(0);
  });
});
