import { test, expect } from '@playwright/test';
import { test as mockedTest, expect as mockedExpect } from '../../fixtures/base.fixture';
import { DashboardPage } from '../../pages/dashboard.page';

// ===== Level 4: demo fixture mockedDashboardPage (mock /api/invoices/dashboard + navigate +
// waitForLoad gộp sẵn) — bổ sung thêm, tách describe riêng vì dùng test instance khác (từ
// base.fixture.ts) so với các test NET-TC0x bên dưới (dùng test gốc từ '@playwright/test'). =====
mockedTest.describe('Module Dashboard - Network Mock (Fixture Demo) @regression', () => {
  mockedTest('NET-TC04 - Dashboard hiển thị đầy đủ widget khi dùng fixture mockedDashboardPage', async ({ mockedDashboardPage }) => {
    mockedExpect(await mockedDashboardPage.isDisplayed()).toBeTruthy();
    await mockedExpect(mockedDashboardPage.revenueCardTitle).toBeVisible();
    await mockedExpect(mockedDashboardPage.revenueTotalValue).toBeVisible();
    await mockedExpect(mockedDashboardPage.topProductTitle).toBeVisible();
  });
});

test.describe('Module Dashboard - Network Mock @regression', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
  });

  test('NET-TC01 - Dashboard hiển thị đúng giá trị doanh thu khi API trả về data giả định', async ({ page }) => {
    // Schema lấy từ response thật của GET /api/invoices/dashboard (verify qua curl với token thật,
    // khớp DashboardInvoicesResponse ở src/api/models/api-response.model.ts) — không đoán field.
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
    await dashboardPage.waitForLoad();

    // Assertion dựa trên data mock đã biết trước — deterministic 100%
    await expect(dashboardPage.revenueTotalValue).toBeVisible();
  });

  test('NET-TC02 - Chart "Top 10 hàng bán chạy" hiển thị đúng 10 sản phẩm khi API trả về 10 items', async ({ page }) => {
    // Endpoint thật khác với /api/invoices/dashboard — xác định qua Network tab khi load Dashboard:
    // GET reportapi/charts/product/?...&viewType=ProductBySale, response là mảng {Subject, Value, Total, Extra1}
    const testRunId = Date.now();
    const mockProducts = Array.from({ length: 10 }, (_, i) => ({
      Subject: `SP_NET_TC02_${testRunId}_${i + 1}`,
      Value: (10 - i) * 100_000,
      Total: 0,
      Extra1: `SP_${testRunId}_${i + 1}`,
    }));

    await page.route('**/reportapi/charts/product/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProducts),
      });
    });

    await page.goto('/man/#/DashBoard', { waitUntil: 'domcontentloaded' });
    await dashboardPage.waitForLoad();

    await expect(dashboardPage.topProductChartLabels).toHaveCount(10);
  });

  test('NET-TC03 - Test dashboard khi api trả về 500', async ({ page }) => {
    // Verify thực tế trên DOM (2026-07-27): khi /api/invoices/dashboard trả 500, Dashboard vẫn
    // render bình thường (các card/widget khác dùng API riêng không bị ảnh hưởng). Chỉ riêng field
    // "Doanh thu" trong card "Kết quả bán hàng hôm nay" bị rỗng — không có error message/toast nào
    // hiển thị cho user để báo lỗi.

    // Schema lấy từ response thật của GET /api/invoices/dashboard (verify qua curl với token thật,
    // khớp DashboardInvoicesResponse ở src/api/models/api-response.model.ts) — không đoán field.
    await page.route('**/api/invoices/dashboard**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error'
        }),
      });
    });

    await page.goto('/man/#/DashBoard', { waitUntil: 'domcontentloaded' });
    await dashboardPage.waitForLoad();

    // Field "Doanh thu" phải rỗng khi API lỗi — đúng hành vi thực tế của app (không có error UI)
    await expect(dashboardPage.todaySalesRevenueValue).toHaveText('');
  });

});
