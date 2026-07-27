import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  private static readonly pagesWithPopupHandler = new WeakSet<Page>();

  constructor(protected readonly page: Page) {
    BasePage.registerBlockingPopupHandlers(page);
  }

  /**
   * App staging chèn 2 loại popup ngẫu nhiên, không liên quan đến logic test, nhưng chặn pointer
   * event của mọi click bên dưới — chúng có thể xuất hiện ngay giữa lúc Playwright đang chờ click
   * một locator khác, nên dùng addLocatorHandler (thay vì check 1 lần trước click) để Playwright tự
   * đóng ngay khi chúng xuất hiện, tại bất kỳ thời điểm nào trong lúc action đang retry:
   * 1. Popup quảng cáo tính năng (ktarget, bên thứ 3, `.vodal-close`/`.vodal-mask`).
   * 2. Thông báo thật của app (Kendo `.k-window-alert`) báo lệch múi giờ giữa chi nhánh và thiết bị —
   *    chỉ xuất hiện khi timezone máy chạy browser khác múi giờ cấu hình cho chi nhánh (ví dụ CI chạy
   *    UTC). Không phải bug, chỉ là khác biệt môi trường, nên tự đóng bằng nút "Đã hiểu".
   * Đăng ký 1 lần cho mỗi `page` — addLocatorHandler báo lỗi nếu đăng ký trùng cùng locator.
   */
  private static registerBlockingPopupHandlers(page: Page): void {
    if (BasePage.pagesWithPopupHandler.has(page)) return;
    BasePage.pagesWithPopupHandler.add(page);

    // Widget ktarget có thể hiện nhiều popup dạng vodal cùng lúc (ví dụ báo "thành công" + popup
    // quảng cáo dịch vụ) — addLocatorHandler yêu cầu locator resolve đúng 1 phần tử, nên dùng .first();
    // nếu còn popup khác sau khi đóng, Playwright sẽ tự gọi lại handler.
    page.addLocatorHandler(page.locator('.vodal-close').first(), async (locator) => {
      await locator.click();
    });

    page.addLocatorHandler(
      page.locator('.k-window-alert').getByRole('button', { name: 'Đã hiểu' }),
      async (locator) => {
        await locator.click();
      }
    );
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
