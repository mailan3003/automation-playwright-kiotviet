import { APIResponse } from '@playwright/test';
import { BaseApiHelper } from './base-api.helper';

export class CustomerApiHelper extends BaseApiHelper {
  private readonly deleteEndpoint = '/api/customers/deleteCustomerList';

  async deleteCustomers(ids: number[]): Promise<APIResponse> {
    return this.request.post(`${this.apiBaseUrl}${this.deleteEndpoint}`, {
      headers: { ...this.defaultHeaders, 'content-type': 'application/json;charset=utf-8' },
      data: { Ids: ids },
    });
  }
}
