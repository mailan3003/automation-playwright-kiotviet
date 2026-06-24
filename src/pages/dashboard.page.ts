import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  // REPLACE: Cập nhật locators sau khi inspect DOM thực tế
  private readonly userAvatar = this.page.locator('[data-testid="user-avatar"], .user-avatar');
  private readonly userMenu = this.page.locator('[data-testid="user-menu"], .user-menu');
  private readonly logoutButton = this.page.getByRole('button', { name: /đăng xuất/i });
  private readonly pageHeading = this.page.locator('h1, .page-title');

  constructor(page: Page) {
    super(page);
  }

  async isDisplayed(): Promise<boolean> {
    return this.isVisible(this.userAvatar);
  }

  async waitForLoad(): Promise<void> {
    await expect(this.userAvatar).toBeVisible({ timeout: 15_000 });
  }

  async logout(): Promise<void> {
    await this.click(this.userAvatar);
    await expect(this.userMenu).toBeVisible();
    await this.click(this.logoutButton);
  }

  async getPageHeading(): Promise<string> {
    return this.getText(this.pageHeading);
  }
}
