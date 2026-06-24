import { APIRequestContext } from '@playwright/test';

export class BaseApiHelper {
  protected readonly apiBaseUrl: string;
  protected readonly defaultHeaders: Record<string, string>;

  constructor(
    protected readonly request: APIRequestContext,
    token: string,
    branchId: string = '333',
    retailer: string = 'testz18',
    groupId: string = '18'
  ) {
    this.apiBaseUrl = process.env.API_BASE_URL ?? 'https://api-man1.kiotviet.vn';
    this.defaultHeaders = {
      authorization: token ? `Bearer ${token}` : '',
      branchid: branchId,
      retailer: retailer,
      'x-retailer-code': retailer,
      'x-group-id': groupId,
      'x-language': 'vi-VN',
      'x-timezone': 'Asia/Bangkok',
      isusekvclient: '1',
    };
  }

  getHeaders(): Record<string, string> {
    return { ...this.defaultHeaders };
  }
}
