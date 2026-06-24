import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  // Locators — verify lại trên DOM thực tế trước khi dùng
  private readonly emailInput = this.page.getByPlaceholder('Email / Số điện thoại');
  private readonly passwordInput = this.page.getByPlaceholder('Mật khẩu');
  private readonly loginButton = this.page.getByRole('button', { name: /đăng nhập/i });
  private readonly errorMessage = this.page.locator('.error-message, [class*="error"]');
  private readonly forgotPasswordLink = this.page.getByRole('link', { name: /quên mật khẩu/i });

  constructor(page: Page) {
    super(page);
  }

  async navigate(): Promise<void> {
    await super.navigate('/');
    await expect(this.loginButton).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);
    await this.click(this.loginButton);
  }

  async getErrorMessage(): Promise<string> {
    await expect(this.errorMessage).toBeVisible();
    return this.getText(this.errorMessage);
  }

  async isLoginPageDisplayed(): Promise<boolean> {
    return this.isVisible(this.loginButton);
  }

  async clickForgotPassword(): Promise<void> {
    await this.click(this.forgotPasswordLink);
  }
}
