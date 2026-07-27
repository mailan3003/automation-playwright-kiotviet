import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  private static readonly pagesWithPopupHandler = new WeakSet<Page>();

  constructor(protected readonly page: Page) {
    BasePage.registerServicePopupHandler(page);
  }

  /**
   * App staging ngẫu nhiên chèn popup quảng cáo tính năng (ktarget, bên thứ 3, class
   * `.vodal-close`/`.vodal-mask`) đè lên toàn trang bất kỳ lúc nào sau khi vào Dashboard — chặn
   * pointer event của mọi click bên dưới. Popup có thể xuất hiện ngay giữa lúc Playwright đang chờ
   * click một locator khác, nên dùng addLocatorHandler (thay vì check 1 lần trước click) để Playwright
   * tự đóng popup ngay khi nó xuất hiện, tại bất kỳ thời điểm nào trong lúc action đang retry.
   * Đăng ký 1 lần cho mỗi `page` — addLocatorHandler báo lỗi nếu đăng ký trùng cùng locator.
   */
  private static registerServicePopupHandler(page: Page): void {
    if (BasePage.pagesWithPopupHandler.has(page)) return;
    BasePage.pagesWithPopupHandler.add(page);
    // Widget ktarget có thể hiện nhiều popup dạng vodal cùng lúc (ví dụ báo "thành công" + popup
    // quảng cáo dịch vụ) — addLocatorHandler yêu cầu locator resolve đúng 1 phần tử, nên dùng .first();
    // nếu còn popup khác sau khi đóng, Playwright sẽ tự gọi lại handler.
    page.addLocatorHandler(page.locator('.vodal-close').first(), async (locator) => {
      await locator.click();
    });
  }

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
