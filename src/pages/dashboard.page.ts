import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  // Locators — verified trên DOM thực tế (testz18.kiotviet.vn/man/#/DashBoard)
  readonly activeNavItem = this.page.locator('a.kv-nav-link.active');
  readonly tongQuanNav = this.page.getByRole('link', { name: 'Tổng quan' });
  readonly hangHoaNav = this.page.getByRole('link', { name: 'Hàng hóa' });
  readonly logoutMenu = this.page.locator('[class*="user"], .kv-dropdown-user');

  constructor(page: Page) {
    super(page);
  }

  async waitForLoad(): Promise<void> {
    // Angular hash-based routing — dùng waitForFunction thay vì waitForURL
    await this.page.waitForFunction(
      () => window.location.href.includes('DashBoard'),
      { timeout: 25_000 }
    );
    await expect(this.activeNavItem).toBeVisible({ timeout: 10_000 });
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
}
