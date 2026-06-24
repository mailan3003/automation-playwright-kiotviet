import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  // Locators — verified trên DOM thực tế (testz18.kiotviet.vn/man/#/login)
  readonly usernameInput = this.page.locator('#UserName');
  readonly passwordInput = this.page.locator('#Password');
  readonly rememberMeCheckbox = this.page.locator('#RememberMe');
  readonly managerLoginButton = this.page.locator('button[type="submit"].kv-btn-primary');
  readonly salesLoginButton = this.page.locator('#loginNewSaleOld');
  readonly errorMessage = this.page.locator('.kv-alert.kv-alert-light-danger');

  constructor(page: Page) {
    super(page);
  }

  async navigate(): Promise<void> {
    await this.page.goto('/man/#/login', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    // Chờ Angular AngularJS loading panel ẩn đi (spinner #LoadingPanel)
    await this.page.waitForSelector('#LoadingPanel', { state: 'hidden', timeout: 45_000 });
    await expect(this.usernameInput).toBeVisible({ timeout: 20_000 });
  }

  async login(username: string, password: string): Promise<void> {
    await this.fill(this.usernameInput, username);
    await this.fill(this.passwordInput, password);
    await this.click(this.managerLoginButton);
  }

  async loginAsSales(username: string, password: string): Promise<void> {
    await this.fill(this.usernameInput, username);
    await this.fill(this.passwordInput, password);
    await this.click(this.salesLoginButton);
  }

  async getErrorMessage(): Promise<string> {
    await expect(this.errorMessage).toBeVisible({ timeout: 8_000 });
    return this.getText(this.errorMessage);
  }

  async isErrorVisible(): Promise<boolean> {
    return this.isVisible(this.errorMessage);
  }

  async isLoginPageDisplayed(): Promise<boolean> {
    return this.isVisible(this.managerLoginButton);
  }

  async setRememberMe(checked: boolean): Promise<void> {
    const isChecked = await this.rememberMeCheckbox.isChecked();
    if (isChecked !== checked) {
      await this.rememberMeCheckbox.click();
    }
  }
}
