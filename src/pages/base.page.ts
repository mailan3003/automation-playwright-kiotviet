import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  async navigate(path = ''): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async click(locator: Locator): Promise<void> {
    await expect(locator).toBeEnabled();
    await locator.click();
  }

  async fill(locator: Locator, value: string): Promise<void> {
    await expect(locator).toBeVisible();
    await locator.clear();
    await locator.fill(value);
  }

  async getText(locator: Locator): Promise<string> {
    await expect(locator).toBeVisible();
    return (await locator.textContent()) ?? '';
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  async waitForVisible(locator: Locator, timeout = 10_000): Promise<void> {
    await expect(locator).toBeVisible({ timeout });
  }

  async selectOption(locator: Locator, value: string): Promise<void> {
    await expect(locator).toBeVisible();
    await locator.selectOption(value);
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}
