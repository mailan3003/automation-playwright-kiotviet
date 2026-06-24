import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { DashboardPage } from '../../pages/dashboard.page';

const BASE_URL = 'https://testz18.kiotviet.vn';
const VALID_USER = 'admin';
const VALID_PASS = 'Kiotviet123456';

test.describe('Module Login - KiotViet Manager @smoke', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // Chỉ clear cookies — KHÔNG clear localStorage vì Angular app dùng localStorage cho init state
    await page.context().clearCookies();
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  // ===== TC01: Happy Path =====
  test('TC01 - Đăng nhập thành công với tài khoản admin hợp lệ', async ({ page }) => {
    await loginPage.login(VALID_USER, VALID_PASS);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForLoad();

    expect(await dashboardPage.isDisplayed()).toBeTruthy();
    expect(await dashboardPage.getPageTitle()).toBe('KiotViet - Tổng quan');
    const activeNav = await dashboardPage.getActiveNavText();
    expect(activeNav).toContain('Tổng quan');
  });

  // ===== TC02: Sai mật khẩu =====
  test('TC02 - Hiển thị lỗi khi nhập sai mật khẩu', async ({ page }) => {
    const wrongPass = 'WrongPassword_' + Date.now();
    await loginPage.login(VALID_USER, wrongPass);

    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Sai tên đăng nhập hoặc mật khẩu');
    expect(page.url()).toContain('#/login');
  });

  // ===== TC03: Sai username =====
  test('TC03 - Hiển thị lỗi khi nhập sai tên đăng nhập', async ({ page }) => {
    const wrongUser = 'wrong_user_' + Date.now();
    await loginPage.login(wrongUser, VALID_PASS);

    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Sai tên đăng nhập hoặc mật khẩu');
    expect(page.url()).toContain('#/login');
  });

  // ===== TC04: Để trống username =====
  test('TC04 - Hiển thị lỗi khi để trống tên đăng nhập', async ({ page }) => {
    await loginPage.login('', VALID_PASS);

    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('đầy đủ');
    expect(page.url()).toContain('#/login');
  });

  // ===== TC05: Để trống mật khẩu =====
  test('TC05 - Hiển thị lỗi khi để trống mật khẩu', async ({ page }) => {
    await loginPage.login(VALID_USER, '');

    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('đầy đủ');
    expect(page.url()).toContain('#/login');
  });

  // ===== TC06: Để trống cả hai trường =====
  test('TC06 - Hiển thị lỗi khi để trống username và mật khẩu', async ({ page }) => {
    await loginPage.login('', '');

    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('đầy đủ');
    expect(page.url()).toContain('#/login');
  });

  // ===== TC07: Chức năng Remember Me =====
  test('TC07 - Đăng nhập với Remember Me được bật', async ({ page }) => {
    await loginPage.setRememberMe(true);
    await loginPage.login(VALID_USER, VALID_PASS);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForLoad();
    expect(await dashboardPage.isDisplayed()).toBeTruthy();
  });
});

// ===== Data-driven: Kiểm tra nhiều bộ credentials không hợp lệ =====
test.describe('Module Login - Invalid Credentials @regression', () => {
  const invalidCredentials = [
    { username: 'admin',          password: 'wrongpass123',   desc: 'sai password' },
    { username: 'wrong_user',     password: VALID_PASS,       desc: 'sai username' },
    { username: 'Admin',          password: 'KIOTVIET123456', desc: 'sai case' },
    { username: ' wrong_user ',    password: VALID_PASS,       desc: 'username không tồn tại có khoảng trắng' },
  ];

  for (const cred of invalidCredentials) {
    test(`TC_INV - Login thất bại với ${cred.desc}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(cred.username, cred.password);

      const errorMsg = await loginPage.getErrorMessage();
      expect(errorMsg.length).toBeGreaterThan(0);
      expect(page.url()).toContain('#/login');
    });
  }
});
