import { test, expect, request as playwrightRequest, APIRequestContext } from '@playwright/test';
import { getSharedApiToken } from '../../../api/helpers/shared-auth.helper';
import { DashboardApiHelper } from '../../../api/helpers/dashboard-api.helper';
import { DashboardInvoicesResponse, DashboardApiErrorResponse } from '../../../api/models/api-response.model';

const API_BRANCH_ID = process.env.API_BRANCH_ID ?? '333';
const API_RETAILER = process.env.API_RETAILER ?? 'testz18';
const API_GROUP_ID = process.env.API_GROUP_ID ?? '18';
const LOGIN_USER = process.env.API_USERNAME ?? 'admin';
const LOGIN_PASS = process.env.API_PASSWORD ?? 'Kiotviet123456';

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 19);
}

test.describe('API Dashboard - Doanh thu thuần [GET /api/invoices/dashboard] @api', () => {
  let dashboardApi: DashboardApiHelper;
  let authToken: string;
  let apiContext: APIRequestContext;

  test.beforeAll(async () => {
    apiContext = await playwrightRequest.newContext();
    authToken = await getSharedApiToken(apiContext, LOGIN_USER, LOGIN_PASS, API_RETAILER, Number(API_BRANCH_ID));
    dashboardApi = new DashboardApiHelper(apiContext, authToken, API_BRANCH_ID, API_RETAILER, API_GROUP_ID);
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================
  test.describe('Happy Path', () => {

    test('TC_HP_01 - Filter hợp lệ theo BranchId + khoảng ngày hôm nay → 200, đúng cấu trúc response', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const filter = DashboardApiHelper.buildDateRangeFilter(Number(API_BRANCH_ID), isoDate(now), isoDate(tomorrow));

      const response = await dashboardApi.getInvoicesDashboard(filter);
      const body: DashboardInvoicesResponse = await response.json();

      expect(response.status()).toBe(200);
      expect(body).toHaveProperty('Total1Value');
      expect(body).toHaveProperty('Total2Value');
      expect(body).toHaveProperty('Total3Value');
      expect(body).toHaveProperty('Total');
      expect(typeof body.Total).toBe('number');
      expect(body.Timestamp).toBeTruthy();
    });

    test('TC_HP_02 - Thiếu $filter → 200, trả tổng toàn bộ dữ liệu (không lọc)', async () => {
      const response = await dashboardApi.getInvoicesDashboard();
      const body: DashboardInvoicesResponse = await response.json();

      expect(response.status()).toBe(200);
      expect(body.Total).toBeGreaterThanOrEqual(0);
    });

  });

  // ===========================================================================
  // AUTHENTICATION
  // ===========================================================================
  test.describe('Authentication', () => {

    test('TC_AUTH_01 - Không có token → 403', async ({ request }) => {
      const noTokenApi = new DashboardApiHelper(request, '', API_BRANCH_ID, API_RETAILER, API_GROUP_ID);

      const response = await noTokenApi.getInvoicesDashboard();

      expect(response.status()).toBe(403);
    });

    test('TC_AUTH_02 - Token không hợp lệ (malformed) → 403', async ({ request }) => {
      const badTokenApi = new DashboardApiHelper(request, 'invalid.token.value', API_BRANCH_ID, API_RETAILER, API_GROUP_ID);

      const response = await badTokenApi.getInvoicesDashboard();

      expect(response.status()).toBe(403);
    });

  });

  // ===========================================================================
  // EXCEPTION / EDGE CASES
  // ===========================================================================
  test.describe('Exception & Edge Cases', () => {

    test('TC_EXC_01 - $filter sai cú pháp OData → 420 kèm error message rõ ràng', async () => {
      const response = await dashboardApi.getInvoicesDashboardRaw('$filter=NOT_A_VALID_FILTER');
      const body: DashboardApiErrorResponse = await response.json();

      expect(response.status()).toBe(420);
      expect(body.ResponseStatus.ErrorCode).toBe('KvValidateException');
      expect(body.ResponseStatus.Message).toContain('NOT_A_VALID_FILTER');
    });

    test('TC_EDGE_01 - BranchId không tồn tại trong hệ thống → 200, totals = 0 (không lỗi)', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const filter = DashboardApiHelper.buildDateRangeFilter(999999999, isoDate(now), isoDate(tomorrow));

      const response = await dashboardApi.getInvoicesDashboard(filter);
      const body: DashboardInvoicesResponse = await response.json();

      expect(response.status()).toBe(200);
      expect(body.Total).toBe(0);
      expect(body.Total1Value).toBe(0);
    });

    test('TC_EDGE_02 - Khoảng ngày đảo ngược (from > to) → 200, totals = 0 (không lỗi)', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const filter = DashboardApiHelper.buildDateRangeFilter(Number(API_BRANCH_ID), isoDate(now), isoDate(yesterday));

      const response = await dashboardApi.getInvoicesDashboard(filter);
      const body: DashboardInvoicesResponse = await response.json();

      expect(response.status()).toBe(200);
      expect(body.Total).toBe(0);
    });

  });

});
