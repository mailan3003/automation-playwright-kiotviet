import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { CreateCustomerApiResponse } from '../api/models/api-response.model';

export class CustomerPage extends BasePage {
  // Locators — verified trên DOM thực tế (testz18.kiotviet.vn/man/#/Customers)
  readonly pageHeading = this.page.getByRole('heading', { name: 'Khách hàng', exact: true });
  readonly customersNavTab = this.page.locator('a.kv-nav-link', { hasText: 'Khách hàng' });
  readonly customersDropdownLink = this.page.locator('a.kv-dropdown-link[href="#/Customers/"]');
  readonly addCustomerButton = this.page.locator('a.kv-btn.kv-btn-outline-primary', { hasText: 'Khách hàng' });

  readonly modal = this.page.locator('.k-window-customer');
  readonly nameInput = this.modal.locator('[ng-model="customer.Name"]');
  readonly phoneInput = this.modal.locator('[ng-model="customer.ContactNumber"]');
  readonly saveButton = this.modal.locator('a.kv-btn-primary', { hasText: 'Lưu' });
  // Nút đóng modal (Kendo window) — có nhiều instance ẩn trong DOM cho các modal khác,
  // dùng :visible để luôn trỏ đúng modal đang hiển thị.
  readonly closeModalButton = this.page.locator('.k-window-action.k-link:visible');

  readonly toastMessage = this.page.locator('.toast-message').first();

  constructor(page: Page) {
    super(page);
  }

  async navigate(): Promise<void> {
    // Điều hướng qua menu thật (hover mở dropdown, sau đó click link con "Khách hàng")
    // thay vì page.goto trực tiếp với hash — goto trực tiếp bị AngularJS router reset về route mặc định ngay sau khi login.
    try {
      await this.customersNavTab.hover({ timeout: 15_000 });
    } catch {
      // Angular đôi khi chưa kịp render nav bar ngay sau khi trang vừa load — reload để phục hồi
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.customersNavTab.hover({ timeout: 20_000 });
    }
    await this.click(this.customersDropdownLink);
    await expect(this.pageHeading).toBeVisible({ timeout: 20_000 });
  }

  async openCreateForm(): Promise<void> {
    await this.click(this.addCustomerButton);
    await expect(this.modal).toBeVisible({ timeout: 10_000 });
  }

  async fillBasicInfo(name: string, phone = ''): Promise<void> {
    await this.fill(this.nameInput, name);
    if (phone) {
      await this.fill(this.phoneInput, phone);
    }
  }

  async save(): Promise<void> {
    await this.click(this.saveButton);
  }

  /** Lưu khách hàng và trả về Id vừa tạo (dùng để cleanup qua API sau khi test xong). */
  async saveAndGetCreatedId(): Promise<number> {
    const responsePromise = this.page.waitForResponse(
      res => res.url().endsWith('/api/customers') && res.request().method() === 'POST'
    );
    await this.click(this.saveButton);
    const response = await responsePromise;
    const body: CreateCustomerApiResponse = await response.json();
    return body.Id;
  }

  async getToastMessage(): Promise<string> {
    await expect(this.toastMessage).toBeVisible({ timeout: 8_000 });
    return this.getText(this.toastMessage);
  }

  async isModalOpen(): Promise<boolean> {
    return this.isVisible(this.modal);
  }

  /** Đóng modal nếu đang mở — dùng để dọn state giữa các test, tránh che khuất nav bar. */
  async closeModalIfOpen(): Promise<void> {
    if (await this.isModalOpen()) {
      await this.closeModalButton.click();
      await expect(this.modal).toBeHidden({ timeout: 10_000 });
    }
  }

  async expectCustomerInList(name: string): Promise<void> {
    const row = this.page.locator('tr.k-master-row', { hasText: name }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
  }
}
