import { test, expect } from '@playwright/test';
import { CustomerListPage } from '../../pages/customer-list.page';

test.describe('Module Khách hàng - Danh sách khách hàng @regression', () => {
  let customerListPage: CustomerListPage;

  // Session đăng nhập đã được nạp sẵn qua storageState (auth/admin.json, xem src/setup/auth.setup.ts)
  test.beforeEach(async ({ page }) => {
    await page.goto('/man/#/DashBoard', { waitUntil: 'domcontentloaded' });

    customerListPage = new CustomerListPage(page);
    await customerListPage.navigate();
  });

  test.describe('Tìm kiếm', () => {
    // ===== KIOTVIET_CUSTLIST_TC_001 =====
    test('Tìm kiếm đúng Mã khách hàng trả về khách hàng khớp', async () => {
      await customerListPage.search('KHDB01');

      const codes = await customerListPage.getVisibleCustomerCodes();
      expect(codes.length, 'Phải có ít nhất 1 khách hàng khớp mã KHDB01').toBeGreaterThan(0);
      expect(codes.every((c) => c === 'KHDB01'), 'Mọi dòng hiển thị phải có Mã khách hàng = KHDB01').toBeTruthy();
    });

    // ===== KIOTVIET_CUSTLIST_TC_004 =====
    test('Tìm kiếm khớp một phần (substring), không phân biệt hoa/thường', async () => {
      await customerListPage.search('uyên');

      const codes = await customerListPage.getVisibleCustomerCodes();
      expect(codes.length, 'Phải có ít nhất 1 khách hàng khớp từ khóa "uyên"').toBeGreaterThan(0);
    });

    // ===== KIOTVIET_CUSTLIST_TC_005 =====
    test('Tìm kiếm không có kết quả hiển thị empty state', async () => {
      await customerListPage.search('zzzKHONGTONTAI999');

      await expect(customerListPage.emptyState).toBeVisible();
    });
  });

  test.describe('Bộ lọc', () => {
    // ===== KIOTVIET_CUSTLIST_TC_017 =====
    test('Trạng thái mặc định khi vào trang là Đang hoạt động', async () => {
      await expect(customerListPage.statusActiveRadio).toBeChecked();
    });

    // ===== KIOTVIET_CUSTLIST_TC_013 =====
    test('Lọc theo Loại khách hàng = Cá nhân làm giảm hoặc giữ nguyên tổng số bản ghi', async () => {
      const totalBefore = await customerListPage.getTotalCountOrZero();

      await customerListPage.filterByCustomerType('Cá nhân');

      const totalAfter = await customerListPage.getTotalCountOrZero();
      expect(totalAfter, 'Lọc theo Cá nhân không được làm tăng tổng số khách hàng').toBeLessThanOrEqual(totalBefore);
    });

    // ===== KIOTVIET_CUSTLIST_TC_015 =====
    test('Lọc theo Giới tính = Nam làm giảm hoặc giữ nguyên tổng số bản ghi', async () => {
      const totalBefore = await customerListPage.getTotalCountOrZero();

      await customerListPage.filterByGender('Nam');

      const totalAfter = await customerListPage.getTotalCountOrZero();
      expect(totalAfter, 'Lọc theo Nam không được làm tăng tổng số khách hàng').toBeLessThanOrEqual(totalBefore);
    });

    // ===== KIOTVIET_CUSTLIST_TC_018 =====
    test('Lọc theo Trạng thái = Ngừng hoạt động chỉ trả về khách hàng Ngừng hoạt động', async () => {
      await customerListPage.filterByStatus('Ngừng hoạt động');

      const rowCount = await customerListPage.dataRows.count();
      if (rowCount === 0) {
        await expect(customerListPage.emptyState).toBeVisible();
      } else {
        const statuses = await customerListPage.statusCells.allTextContents();
        expect(
          statuses.every((s) => s.trim() === 'Ngừng hoạt động'),
          'Mọi dòng hiển thị phải có Trạng thái = Ngừng hoạt động'
        ).toBeTruthy();
      }
    });

    // ===== KIOTVIET_CUSTLIST_TC_037 =====
    test('Kết hợp 2 bộ lọc (AND) làm giảm hoặc giữ nguyên tổng so với lọc 1 tiêu chí', async () => {
      await customerListPage.filterByGender('Nam');
      const totalGenderOnly = await customerListPage.getTotalCountOrZero();

      await customerListPage.filterByStatus('Ngừng hoạt động');
      const totalCombined = await customerListPage.getTotalCountOrZero();

      expect(
        totalCombined,
        'Thêm điều kiện lọc thứ 2 (AND) không được làm tăng tổng số kết quả'
      ).toBeLessThanOrEqual(totalGenderOnly);
    });
  });

  test.describe('Sắp xếp', () => {
    // ===== KIOTVIET_CUSTLIST_TC_039 / TC_040 =====
    // Không giả định chiều mặc định của lần click đầu (asc hay desc tùy state trước đó) — đọc chiều
    // thực tế qua aria-sort (tín hiệu DOM đáng tin cậy hơn dữ liệu hiển thị) rồi verify dữ liệu khớp chiều đó.
    test('Click header Mã khách hàng sắp xếp đúng chiều, click lần 2 đảo chiều', async () => {
      const firstDirection = await customerListPage.sortByCode();
      const firstClickCodes = await customerListPage.getVisibleCustomerCodes();
      const isSorted = (codes: string[], dir: 'ascending' | 'descending') =>
        codes.every((c, i, arr) => i === 0 || (dir === 'ascending' ? arr[i - 1] <= c : arr[i - 1] >= c));
      expect(isSorted(firstClickCodes, firstDirection), `Danh sách phải sắp xếp ${firstDirection} theo Mã khách hàng`).toBeTruthy();

      const secondDirection = await customerListPage.sortByCode();
      expect(secondDirection, 'Click lần 2 phải đảo ngược chiều sắp xếp so với lần 1').not.toBe(firstDirection);
      const secondClickCodes = await customerListPage.getVisibleCustomerCodes();
      expect(isSorted(secondClickCodes, secondDirection), `Danh sách phải sắp xếp ${secondDirection} sau click lần 2`).toBeTruthy();
    });
  });

  test.describe('Xem chi tiết khách hàng', () => {
    // ===== KIOTVIET_CUSTLIST_TC_047 =====
    test('Click dòng khách hàng mở panel chi tiết với tab Thông tin mặc định', async () => {
      await customerListPage.openRowDetail(0);

      await expect(customerListPage.detailInfoTab).toBeVisible();
      await expect(customerListPage.detailInfoTab).toHaveAttribute('aria-selected', 'true');
    });

    // ===== KIOTVIET_CUSTLIST_TC_048 =====
    test('Chuyển sang tab Địa chỉ nhận hàng', async () => {
      await customerListPage.openRowDetail(0);
      await customerListPage.detailAddressTab.click();

      await expect(customerListPage.detailAddressTab).toHaveAttribute('aria-selected', 'true');
    });

    // ===== KIOTVIET_CUSTLIST_TC_051 =====
    test('Click lại dòng đang mở sẽ thu gọn panel chi tiết', async () => {
      await customerListPage.openRowDetail(0);
      await expect(customerListPage.detailInfoTab).toBeVisible();

      await customerListPage.openRowDetail(0);
      await expect(customerListPage.detailInfoTab).toBeHidden();
    });
  });

  test.describe('Phân trang', () => {
    // ===== KIOTVIET_CUSTLIST_TC_052 =====
    test('Đổi số dòng hiển thị sang 50 dòng cập nhật đúng số dòng trên trang', async () => {
      await customerListPage.selectPageSize('50 dòng');

      const rowCount = await customerListPage.dataRows.count();
      const total = await customerListPage.getTotalCount();
      expect(rowCount).toBe(Math.min(50, total));
    });

    // ===== KIOTVIET_CUSTLIST_TC_053 =====
    test('Đổi số dòng/trang khi đang ở trang 2 sẽ reset về trang 1', async () => {
      await customerListPage.goToNextPage();
      await customerListPage.expectOnPage('2');

      await customerListPage.selectPageSize('50 dòng');

      await customerListPage.expectOnPage('1');
    });

    // ===== KIOTVIET_CUSTLIST_TC_054 =====
    test('Điều hướng Trang sau chuyển đúng sang trang 2', async () => {
      await customerListPage.goToNextPage();

      await customerListPage.expectOnPage('2');
    });

    // ===== KIOTVIET_CUSTLIST_TC_058 =====
    test('Nhập số trang hợp lệ chuyển đến đúng trang', async () => {
      await customerListPage.goToPage(2);

      await customerListPage.expectOnPage('2');
    });

    // ===== KIOTVIET_CUSTLIST_TC_059 =====
    test('Nhập số trang vượt quá tổng số trang tự động reset về trang 1', async () => {
      await customerListPage.goToPage(9999);

      await customerListPage.expectOnPage('1');
    });
  });
});
