import { test, expect } from '@playwright/test';
import { CustomerPage } from '../../pages/customer.page';
import { TestDataGenerator } from '../../utils/test-data';

test.describe('Module Khách hàng - Tạo mới khách hàng @smoke', () => {
  let customerPage: CustomerPage;

  // Session đăng nhập đã được nạp sẵn qua storageState (auth/admin.json, xem src/setup/auth.setup.ts)
  test.beforeEach(async ({ page }) => {
    await page.goto('/man/#/DashBoard', { waitUntil: 'domcontentloaded' });

    customerPage = new CustomerPage(page);
    await customerPage.navigate();
    await customerPage.openCreateForm();
  });

  // ===== TC01: Happy Path — đầy đủ Tên + SĐT =====
  test('TC01 - Tạo khách hàng thành công với đầy đủ Tên và Số điện thoại', async () => {
    const name = TestDataGenerator.fullName('AUTO_Customer_TC01');
    const phone = TestDataGenerator.phone();

    await customerPage.fillBasicInfo(name, phone);
    await customerPage.save();

    await customerPage.expectCustomerInList(name);
  });

  // ===== TC02: Chỉ nhập Tên, không nhập SĐT =====
  test('TC02 - Tạo khách hàng thành công chỉ với Tên khách hàng (không nhập SĐT)', async () => {
    const name = TestDataGenerator.fullName('AUTO_Customer_TC02');

    await customerPage.fillBasicInfo(name);
    await customerPage.save();

    await customerPage.expectCustomerInList(name);
  });

  // ===== TC03: Bỏ trống Tên khách hàng =====
  test('TC03 - Hiển thị lỗi khi bỏ trống Tên khách hàng', async () => {
    await customerPage.save();

    const errorMsg = await customerPage.getToastMessage();
    expect(errorMsg.toLowerCase()).toContain('chưa nhập');
    expect(await customerPage.isModalOpen()).toBeTruthy();
  });

  // ===== TC04: Số điện thoại đã tồn tại =====
  test('TC04 - Hiển thị lỗi khi nhập Số điện thoại đã tồn tại trong hệ thống', async () => {
    const existingPhone = TestDataGenerator.phone();
    const firstName = TestDataGenerator.fullName('AUTO_Customer_TC04_first');

    await customerPage.fillBasicInfo(firstName, existingPhone);
    await customerPage.save();
    await customerPage.expectCustomerInList(firstName);

    await customerPage.openCreateForm();
    const secondName = TestDataGenerator.fullName('AUTO_Customer_TC04_second');
    await customerPage.fillBasicInfo(secondName, existingPhone);
    await customerPage.save();

    const errorMsg = await customerPage.getToastMessage();
    expect(errorMsg).toContain('đã tồn tại');
    expect(await customerPage.isModalOpen()).toBeTruthy();
  });
});
