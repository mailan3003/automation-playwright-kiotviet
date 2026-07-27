import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  // Locators — verified trên DOM thực tế (testz18.kiotviet.vn/man/#/DashBoard)
  readonly activeNavItem = this.page.locator('a.kv-nav-link.active');
  readonly tongQuanNav = this.page.getByRole('link', { name: 'Tổng quan' });
  readonly hangHoaNav = this.page.getByRole('link', { name: 'Hàng hóa' });
  readonly logoutMenu = this.page.locator('[class*="user"], .kv-dropdown-user');

  // Card "Doanh thu thuần"
  readonly revenueCardTitle = this.page.locator('#RevenueTitle');
  readonly revenueTotalValue = this.page.locator('#TotalValue7');
  readonly revenueTimeDropdownTrigger = this.page.locator('[aria-owns="revenueTime_listbox"]');
  readonly revenueTimeDropdownLabel = this.revenueTimeDropdownTrigger.locator('.k-input');
  readonly revenueTimeListbox = this.page.locator('#revenueTime_listbox');
  readonly tabByDate = this.page.locator('#date');
  readonly tabByHour = this.page.locator('#hour');
  readonly tabByWeekday = this.page.locator('#day');

  // Card "Top 10 hàng bán chạy" — Kendo chart render bằng SVG thuần (không phải table),
  // nên không có row/tr; mỗi sản phẩm là 1 cặp <text> (tên SP màu #677484 + giá trị màu #3E464F).
  // Verify trực tiếp trên DOM thật qua Playwright (reportapi/charts/product response).
  readonly topProductCard = this.page.locator('.kv-card', { has: this.page.locator('#topProductTitle') });
  readonly topProductTitle = this.page.locator('#topProductTitle');
  readonly topProductChartLabels = this.topProductCard.locator('svg text[fill="#677484"]');
  readonly topProductTypeDropdownTrigger = this.page.locator('[aria-owns="topProductType_listbox"]');
  readonly topProductTypeDropdownLabel = this.topProductTypeDropdownTrigger.locator('.k-input');
  readonly topProductTypeListbox = this.page.locator('#topProductType_listbox');

  // Card "Top 10 khách mua nhiều nhất"
  readonly topCustomersCard = this.page.locator('.kv-card', { hasText: 'Top 10 khách mua nhiều nhất' });
  readonly topCustomersEmptyState = this.topCustomersCard.getByText('Chưa có dữ liệu');

  readonly recentActivitiesTitle = this.page.locator('.kv-dashboard-list-recents-title');

  // Card "Kết quả bán hàng hôm nay" — verify DOM thực tế: khi /api/invoices/dashboard trả lỗi,
  // KHÔNG có error message/toast nào hiển thị — field "Doanh thu" chỉ render rỗng (AngularJS
  // binding không có fallback), không phải "0" và không phải trắng toàn trang.
  readonly todaySalesRevenueValue = this.page
    .locator('.kv-dashboard-statistical-item-total .kv-dashboard-statistical-item-content .ng-binding')
    .first();

  constructor(page: Page) {
    super(page);
  }

  async waitForLoad(): Promise<void> {
    // Angular hash-based routing — dùng waitForFunction thay vì waitForURL
    await this.page.waitForFunction(
      () => window.location.href.includes('DashBoard'),
      undefined,
      { timeout: 25_000 }
    );
    // Splash bootstrap của app staging đôi khi vượt 10s (cùng nguyên nhân với retry-reload ở
    // LoginPage.navigate()) — nới timeout để tránh fail giả do môi trường, không phải do UI lỗi.
    await expect(this.activeNavItem).toBeVisible({ timeout: 20_000 });
  }

  async isDisplayed(): Promise<boolean> {
    return this.page.url().includes('#/DashBoard');
  }

  async getActiveNavText(): Promise<string> {
    await expect(this.activeNavItem).toBeVisible();
    return this.getText(this.activeNavItem);
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async getRevenueTotalValue(): Promise<string> {
    await expect(this.revenueTotalValue).toBeVisible();
    return this.getText(this.revenueTotalValue);
  }

  async getRevenueTimeLabel(): Promise<string> {
    return this.getText(this.revenueTimeDropdownLabel);
  }

  /**
   * Kendo dropdown re-render chart/DOM ngay sau khi widget load xong dữ liệu (Angular digest),
   * có thể làm item trong listbox bị detach đúng lúc click → retry lại toàn bộ thao tác mở/chọn
   * thay vì chỉ retry click, vì bản thân listbox cũng có thể đã bị đóng lại.
   */
  private async selectKendoOption(
    trigger: Locator,
    listbox: Locator,
    optionText: string,
    attempts = 3
  ): Promise<void> {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        await this.click(trigger);
        await expect(listbox).toBeVisible({ timeout: 5_000 });
        await listbox.getByText(optionText, { exact: true }).click({ timeout: 5_000 });
        return;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
  }

  /** Chọn 1 option trong dropdown khoảng thời gian của widget Doanh thu thuần (VD: 'Hôm nay', 'Tháng này'). */
  async selectRevenueTimeOption(optionText: string): Promise<void> {
    await this.selectKendoOption(this.revenueTimeDropdownTrigger, this.revenueTimeListbox, optionText);
  }

  async selectTimeTypeTab(tab: 'date' | 'hour' | 'day'): Promise<void> {
    const tabLocator = tab === 'date' ? this.tabByDate : tab === 'hour' ? this.tabByHour : this.tabByWeekday;
    await this.click(tabLocator);
  }

  async isTimeTypeTabActive(tab: 'date' | 'hour' | 'day'): Promise<boolean> {
    const tabLocator = tab === 'date' ? this.tabByDate : tab === 'hour' ? this.tabByHour : this.tabByWeekday;
    const classAttr = await tabLocator.getAttribute('class');
    return (classAttr ?? '').includes('active');
  }

  /** Chọn 1 option trong dropdown loại số liệu của widget Top 10 hàng bán chạy (VD: 'Theo số lượng'). */
  async selectTopProductTypeOption(optionText: string): Promise<void> {
    await this.selectKendoOption(this.topProductTypeDropdownTrigger, this.topProductTypeListbox, optionText);
  }

  async getTopProductTypeLabel(): Promise<string> {
    return this.getText(this.topProductTypeDropdownLabel);
  }

  /** Số lượng sản phẩm đang hiển thị trên chart "Top 10 hàng bán chạy" (đếm theo số label tên SP). */
  async getTopProductCount(): Promise<number> {
    return this.topProductChartLabels.count();
  }

  /**
   * Widget cần thời gian fetch dữ liệu rồi mới quyết định hiện/ẩn empty-state div —
   * dùng expect().toBeVisible() để chờ thật sự thay vì isVisible() tức thời (tránh flaky).
   */
  async isTopCustomersEmptyStateVisible(): Promise<boolean> {
    try {
      await expect(this.topCustomersEmptyState).toBeVisible({ timeout: 10_000 });
      return true;
    } catch {
      return false;
    }
  }
}
