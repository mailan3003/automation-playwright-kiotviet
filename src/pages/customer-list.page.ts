import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class CustomerListPage extends BasePage {
  // Locators — verified trên DOM thực tế (testz18.kiotviet.vn/man/#/Customers)
  readonly pageHeading = this.page.getByRole('heading', { name: 'Khách hàng', exact: true });
  private readonly customersNavTab = this.page.locator('a.kv-nav-link', { hasText: 'Khách hàng' });
  private readonly customersDropdownLink = this.page.locator('a.kv-dropdown-link[href="#/Customers/"]');

  readonly searchInput = this.page.locator('[ng-model="custFilter.filterQuickSearch"]');

  readonly cusTypeIndividualRadio = this.page.locator('#cusType_0');
  readonly cusTypeCompanyRadio = this.page.locator('#cusType_1');

  readonly genderMaleRadio = this.page.locator('#cusGender_1');
  readonly genderFemaleRadio = this.page.locator('#cusGender_0');

  readonly statusActiveRadio = this.page.locator('#StatusRadioCustomerFilter_1');
  readonly statusInactiveRadio = this.page.locator('#StatusRadioCustomerFilter_2');

  // Dòng dữ liệu (loại trừ dòng tổng cssSummaryRow) và dòng tổng
  readonly dataRows = this.page.locator('tr.k-master-row:not(.cssSummaryRow)');
  readonly summaryRow = this.page.locator('tr.k-master-row.cssSummaryRow');
  readonly emptyState = this.page.getByText('Không tìm thấy khách hàng nào phù hợp');
  readonly statusCells = this.dataRows.locator('td.cell-status');

  private readonly codeColumnHeaderCell = this.page.locator('th.k-header[data-field="Code"]');
  private readonly codeColumnHeaderLink = this.codeColumnHeaderCell.locator('a.k-link');

  // Scoped trong .kv-pagination — trang còn 1 listbox "Hiển thị" ẩn khác (kv-outside-pager) trùng text.
  readonly pageSizeDropdown = this.page
    .locator('.kv-pagination')
    .getByRole('listbox')
    .filter({ hasText: 'dòng' });
  // Trang có 1 pager ẩn/disabled khác (dùng cho chế độ xem khác) trùng class — loại trừ bằng :not(.k-state-disabled).
  readonly pageNumberInput = this.page.locator('.k-pager-wrap input.k-textbox:not(.k-state-disabled)');
  readonly nextPageLink = this.page.getByRole('link', { name: 'Trang sau' });
  readonly prevPageLink = this.page.getByRole('link', { name: 'Trang trước' });
  private readonly paginationInfo = this.page.locator('.kv-pagination').filter({ hasText: 'trong' });

  readonly detailInfoTab = this.page.getByRole('tab', { name: 'Thông tin' });
  readonly detailAddressTab = this.page.getByRole('tab', { name: 'Địa chỉ nhận hàng' });
  readonly detailDebtTab = this.page.getByRole('tab', { name: 'Nợ cần thu từ khách' });
  readonly detailPointsHistoryTab = this.page.getByRole('tab', { name: 'Lịch sử tích điểm' });

  constructor(page: Page) {
    super(page);
  }

  /** Điều hướng qua menu thật — goto trực tiếp bằng hash bị AngularJS router reset (xem customer.page.ts). */
  async navigate(): Promise<void> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) {
          await this.page.reload({ waitUntil: 'domcontentloaded' });
        }
        await this.customersNavTab.hover({ timeout: 20_000 });
        await expect(this.customersDropdownLink).toBeVisible({ timeout: 5_000 });
        await this.click(this.customersDropdownLink);
        await expect(this.pageHeading).toBeVisible({ timeout: 20_000 });
        // Kendo grid/pager progressive-enhance sau khi Angular render xong DOM ban đầu — nếu tương
        // tác (VD: click "Trang sau") trước khi widget pager gắn xong sự kiện, click coi như vô hiệu.
        // Chờ dòng tổng số bản ghi hiển thị để đảm bảo pager đã sẵn sàng trước khi trả quyền điều khiển.
        await Promise.race([
          this.dataRows.first().waitFor({ state: 'visible', timeout: 20_000 }),
          this.emptyState.waitFor({ state: 'visible', timeout: 20_000 }),
        ]);
        await this.paginationInfo.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => undefined);
        return;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
  }

  /**
   * Chờ lưới dữ liệu ổn định sau 1 hành động thay đổi kết quả (search/filter/sort) — Kendo grid
   * rebind qua API nên cần chờ network idle rồi chờ 1 trong 2 trạng thái cuối: có dòng dữ liệu hoặc
   * empty state. Tránh đọc dữ liệu/đếm dòng ngay khi DOM đang ở trạng thái trung gian (stale/0 tạm thời).
   */
  private async waitForGridSettled(): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
    // Timeout 20s (thay vì 10s) — staging đôi khi hiện liên tiếp nhiều slide popup quảng cáo bên thứ 3
    // (ktarget), addLocatorHandler cần thêm thời gian xử lý hết carousel trước khi wait này resolve.
    await Promise.race([
      this.dataRows.first().waitFor({ state: 'visible', timeout: 20_000 }),
      this.emptyState.waitFor({ state: 'visible', timeout: 20_000 }),
    ]);
  }

  async search(keyword: string): Promise<void> {
    await this.fill(this.searchInput, keyword);
    await this.searchInput.press('Enter');
    await this.waitForGridSettled();
  }

  /** Xóa từ khóa tìm kiếm bằng cách fill rỗng + Enter, tránh phụ thuộc locator chip (dễ vỡ). */
  async clearSearch(): Promise<void> {
    await this.fill(this.searchInput, '');
    await this.searchInput.press('Enter');
    await this.waitForGridSettled();
  }

  /**
   * Sort là thao tác client-side (không gọi API) nên waitForGridSettled() (dựa vào networkidle) không
   * đủ để biết DOM đã sắp xếp lại xong. Thuộc tính aria-sort trên th có thể đổi giá trị TRƯỚC khi Kendo
   * vẽ lại các dòng — nên chờ đồng thời cả 2 tín hiệu (aria-sort đổi VÀ dữ liệu đã khớp chiều đó)
   * trong cùng 1 vòng poll, tránh đọc dữ liệu ở khoảng hở thời gian giữa 2 tín hiệu.
   */
  async sortByCode(): Promise<'ascending' | 'descending'> {
    const previousSort = await this.codeColumnHeaderCell.getAttribute('aria-sort');
    await this.click(this.codeColumnHeaderLink);

    let direction!: 'ascending' | 'descending';
    await expect(async () => {
      const attr = await this.codeColumnHeaderCell.getAttribute('aria-sort');
      expect(attr).not.toBe(previousSort);
      expect(['ascending', 'descending']).toContain(attr);
      direction = attr as 'ascending' | 'descending';

      const codes = await this.dataRows.locator('td.cell-code').allTextContents();
      const isSorted = codes.every(
        (c, i, arr) => i === 0 || (direction === 'ascending' ? arr[i - 1] <= c : arr[i - 1] >= c)
      );
      expect(isSorted).toBeTruthy();
    }).toPass({ timeout: 15_000 });

    return direction;
  }

  async filterByCustomerType(type: 'Cá nhân' | 'Công ty'): Promise<void> {
    const radio = type === 'Cá nhân' ? this.cusTypeIndividualRadio : this.cusTypeCompanyRadio;
    await this.click(radio);
    await this.waitForGridSettled();
  }

  async filterByGender(gender: 'Nam' | 'Nữ'): Promise<void> {
    const radio = gender === 'Nam' ? this.genderMaleRadio : this.genderFemaleRadio;
    await this.click(radio);
    await this.waitForGridSettled();
  }

  async filterByStatus(status: 'Đang hoạt động' | 'Ngừng hoạt động'): Promise<void> {
    const radio = status === 'Đang hoạt động' ? this.statusActiveRadio : this.statusInactiveRadio;
    await this.click(radio);
    await this.waitForGridSettled();
  }

  /** Đọc toàn bộ giá trị cột Mã khách hàng đang hiển thị trên trang hiện tại. */
  async getVisibleCustomerCodes(): Promise<string[]> {
    await expect(this.dataRows.first()).toBeVisible({ timeout: 15_000 });
    const cells = this.dataRows.locator('td.cell-code');
    return cells.allTextContents();
  }

  async openRowDetail(rowIndex = 0): Promise<void> {
    await this.click(this.dataRows.nth(rowIndex));
  }

  /** Đọc tổng số khách hàng từ dòng phân trang "X - Y trong Z khách hàng". */
  async getTotalCount(): Promise<number> {
    await expect(this.paginationInfo).toBeVisible({ timeout: 15_000 });
    const text = await this.getText(this.paginationInfo);
    const match = text.match(/trong\s+([\d,]+)/);
    if (!match) throw new Error(`Không đọc được tổng số khách hàng từ: "${text}"`);
    return Number(match[1].replace(/,/g, ''));
  }

  /** Giống getTotalCount() nhưng trả về 0 khi đang ở empty state (pagination bị ẩn khi 0 kết quả). */
  async getTotalCountOrZero(): Promise<number> {
    if (await this.emptyState.isVisible()) return 0;
    return this.getTotalCount();
  }

  async selectPageSize(label: string): Promise<void> {
    await this.click(this.pageSizeDropdown);
    await this.click(this.page.getByRole('option', { name: label }));
    await this.waitForGridSettled();
  }

  async goToNextPage(): Promise<void> {
    await this.click(this.nextPageLink);
  }

  async goToPage(pageNumber: number | string): Promise<void> {
    await this.fill(this.pageNumberInput, String(pageNumber));
    await this.pageNumberInput.press('Enter');
  }

  /** Assertion có auto-retry — input số trang có thể tạm về giá trị trung gian trong lúc Kendo pager rebind. */
  async expectOnPage(pageNumber: string): Promise<void> {
    await expect(this.pageNumberInput).toHaveValue(pageNumber, { timeout: 10_000 });
  }
}
