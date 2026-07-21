import { APIResponse } from '@playwright/test';
import { BaseApiHelper } from './base-api.helper';

export class DashboardApiHelper extends BaseApiHelper {
  private readonly endpoint = '/api/invoices/dashboard';

  async getInvoicesDashboard(filter?: string, overrideHeaders?: Record<string, string>): Promise<APIResponse> {
    const headers = { ...this.defaultHeaders, ...overrideHeaders };
    const query = filter ? `?$filter=${encodeURIComponent(filter)}` : '';
    return this.request.get(`${this.apiBaseUrl}${this.endpoint}${query}`, { headers });
  }

  async getInvoicesDashboardRaw(rawQuery: string, overrideHeaders?: Record<string, string>): Promise<APIResponse> {
    const headers = { ...this.defaultHeaders, ...overrideHeaders };
    return this.request.get(`${this.apiBaseUrl}${this.endpoint}?${rawQuery}`, { headers });
  }

  /** Sinh filter OData cho khoảng ngày [fromDate, toDate) theo BranchId — mặc định Status eq 1 (đã thanh toán) hoặc 3. */
  static buildDateRangeFilter(branchId: number, fromDate: string, toDate: string): string {
    return `((BranchId eq ${branchId}) and (Status eq 1 or Status eq 3) and (PurchaseDate ge datetime'${fromDate}' and PurchaseDate lt datetime'${toDate}'))`;
  }
}
