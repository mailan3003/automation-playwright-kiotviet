import { test, expect, request as playwrightRequest, APIRequestContext } from '@playwright/test';
import { CustomerPage } from '../../pages/customer.page';
import { TestDataGenerator } from '../../utils/test-data';
import { AuthApiHelper } from '../../api/helpers/auth-api.helper';
import { CustomerApiHelper } from '../../api/helpers/customer-api.helper';

const LOGIN_USER = process.env.ADMIN_EMAIL ?? 'admin';
const LOGIN_PASS = process.env.ADMIN_PASSWORD ?? 'Kiotviet123456';

test.describe('Module Khách hàng - Tạo mới khách hàng @smoke', () => {
  let customerPage: CustomerPage;
  let customerApi: CustomerApiHelper;
  let apiContext: APIRequestContext;
  const createdIds: number[] = [];

  test.beforeAll(async () => {
    apiContext = await playwrightRequest.newContext();
    const authHelper = new AuthApiHelper(apiContext);
    const token = await authHelper.login(LOGIN_USER, LOGIN_PASS);
    customerApi = new CustomerApiHelper(apiContext, token);
  });

  test.afterAll(async () => {
    if (createdIds.length > 0) {
      const response = await customerApi.deleteCustomers(createdIds);
      console.log(`[Cleanup] Xóa ${createdIds.length} khách hàng → HTTP ${response.status()}`);
    }
    await apiContext.dispose();
  });

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
    createdIds.push(await customerPage.saveAndGetCreatedId());

    await customerPage.expectCustomerInList(name);
  });

  // ===== TC02: Chỉ nhập Tên, không nhập SĐT =====
  test('TC02 - Tạo khách hàng thành công chỉ với Tên khách hàng (không nhập SĐT)', async () => {
    const name = TestDataGenerator.fullName('AUTO_Customer_TC02');

    await customerPage.fillBasicInfo(name);
    createdIds.push(await customerPage.saveAndGetCreatedId());

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
    createdIds.push(await customerPage.saveAndGetCreatedId());
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
