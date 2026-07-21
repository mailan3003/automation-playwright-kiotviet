import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../pages/dashboard.page';
import { LoginPage } from '../../pages/login.page';

test.describe('Module Dashboard - Tổng quan @smoke', () => {
  let dashboardPage: DashboardPage;

  // Session đăng nhập đã được nạp sẵn qua storageState (auth/admin.json, xem src/setup/auth.setup.ts)
  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await page.goto('/man/#/DashBoard', { waitUntil: 'domcontentloaded' });
    await dashboardPage.waitForLoad();
  });

  // ===== UI-TC01: Happy Path — Dashboard hiển thị đầy đủ widget =====
  test('UI-TC01 - Dashboard hiển thị đầy đủ các widget sau khi đăng nhập', async () => {
    expect(await dashboardPage.isDisplayed()).toBeTruthy();
    const activeNav = await dashboardPage.getActiveNavText();
    expect(activeNav).toContain('Tổng quan');

    await expect(dashboardPage.revenueCardTitle).toBeVisible();
    await expect(dashboardPage.revenueTotalValue).toBeVisible();
    await expect(dashboardPage.topProductTitle).toBeVisible();
    await expect(dashboardPage.recentActivitiesTitle).toBeVisible();
  });

  // ===== UI-TC02: Đổi khoảng thời gian widget Doanh thu thuần =====
  test('UI-TC02 - Đổi khoảng thời gian Doanh thu thuần từ Tháng này sang Hôm nay → label và giá trị cập nhật', async () => {
    const labelBefore = await dashboardPage.getRevenueTimeLabel();
    expect(labelBefore).toBe('Tháng này');

    await dashboardPage.selectRevenueTimeOption('Hôm nay');

    const labelAfter = await dashboardPage.getRevenueTimeLabel();
    expect(labelAfter).toBe('Hôm nay');
    await expect(dashboardPage.revenueTotalValue).toBeVisible();
  });

  // ===== UI-TC03: Chuyển tab "Theo giờ" =====
  test('UI-TC03 - Chuyển tab Theo giờ trên widget Doanh thu thuần → tab active đổi đúng', async () => {
    expect(await dashboardPage.isTimeTypeTabActive('date')).toBeTruthy();

    await dashboardPage.selectTimeTypeTab('hour');

    expect(await dashboardPage.isTimeTypeTabActive('hour')).toBeTruthy();
    expect(await dashboardPage.isTimeTypeTabActive('date')).toBeFalsy();
  });

  // ===== UI-TC04: Chuyển tab "Theo thứ" =====
  test('UI-TC04 - Chuyển tab Theo thứ trên widget Doanh thu thuần → tab active đổi đúng', async () => {
    await dashboardPage.selectTimeTypeTab('day');

    expect(await dashboardPage.isTimeTypeTabActive('day')).toBeTruthy();
    expect(await dashboardPage.isTimeTypeTabActive('date')).toBeFalsy();
  });

  // ===== UI-TC05: Đổi bộ lọc Top 10 hàng bán chạy =====
  test('UI-TC05 - Đổi bộ lọc Top 10 hàng bán chạy từ Theo doanh thu thuần sang Theo số lượng', async () => {
    const labelBefore = await dashboardPage.getTopProductTypeLabel();
    expect(labelBefore).toBe('Theo doanh thu thuần');

    await dashboardPage.selectTopProductTypeOption('Theo số lượng');

    const labelAfter = await dashboardPage.getTopProductTypeLabel();
    expect(labelAfter).toBe('Theo số lượng');
  });

  // ===== UI-TC06: Empty state "Top 10 khách mua nhiều nhất" =====
  test('UI-TC06 - Top 10 khách mua nhiều nhất hiển thị đúng empty state khi chưa có dữ liệu', async () => {
    // Tài khoản test hiện chưa phát sinh dữ liệu khách mua nhiều nhất trong kỳ mặc định
    expect(await dashboardPage.isTopCustomersEmptyStateVisible()).toBeTruthy();
  });
});

// ===== UI-TC07: Truy cập Dashboard khi chưa đăng nhập =====
test.describe('Module Dashboard - Truy cập không có session @regression', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('UI-TC07 - Truy cập trực tiếp URL Dashboard khi chưa đăng nhập → redirect về trang login', async ({ page }) => {
    await page.goto('/man/#/DashBoard', { waitUntil: 'domcontentloaded' });

    const loginPage = new LoginPage(page);
    await expect(loginPage.usernameInput).toBeVisible({ timeout: 20_000 });
    expect(page.url()).toContain('#/login');
  });
});
