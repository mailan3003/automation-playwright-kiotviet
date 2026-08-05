import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  private static readonly bannerStyleInjected = new WeakMap<Page, Promise<void>>();

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
   * 3. Banner thông báo đổi tên miền (`#kma-warning-banner`, widget Vue, `ng-show="isKiotvietOnline()<=0"`)
   *    — hiển thị LIÊN TỤC (không phải popup tạm thời) khi app coi phiên là "offline", che phủ toàn bộ
   *    layout và intercept pointer event ở bất kỳ toạ độ nào. Không có nút đóng. AngularJS's ng-show
   *    tự set lại inline style `display` mỗi vòng $digest nên ẩn 1 lần qua addLocatorHandler bị ghi đè
   *    lại gần như ngay lập tức (flaky). Phải chèn CSS `!important` qua addInitScript — thắng cả inline
   *    style, chạy lại ở MỌI lần navigate nên không bị mất khi Angular điều hướng route.
   * Đăng ký 1 lần cho mỗi `page` — addLocatorHandler báo lỗi nếu đăng ký trùng cùng locator.
   */
  private static registerBlockingPopupHandlers(page: Page): void {
    if (BasePage.bannerStyleInjected.has(page)) return;

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

    const injectBannerKillStyle = (): void => {
      const style = document.createElement('style');
      style.textContent =
        '#kma-warning-banner { display: none !important; pointer-events: none !important; }';
      (document.head ?? document.documentElement).appendChild(style);
    };
    // addInitScript chỉ chạy ở các lần navigate/reload TIẾP THEO, không hồi tố cho document đã load —
    // nên cần evaluate ngay 1 lần cho trang hiện tại. Lưu lại Promise (thay vì fire-and-forget) để
    // click()/fill() có thể await trước khi thao tác — tránh race lúc trang vừa load xong.
    void page.addInitScript(injectBannerKillStyle);
    BasePage.bannerStyleInjected.set(page, page.evaluate(injectBannerKillStyle).catch(() => undefined));
  }

  private async ensureBannerHidden(): Promise<void> {
    await BasePage.bannerStyleInjected.get(this.page);
  }

  async navigate(path = ''): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async click(locator: Locator): Promise<void> {
    await this.ensureBannerHidden();
    await expect(locator).toBeEnabled();
    await locator.click();
  }

  async fill(locator: Locator, value: string): Promise<void> {
    await this.ensureBannerHidden();
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
