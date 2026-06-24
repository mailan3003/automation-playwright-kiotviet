import { APIRequestContext } from '@playwright/test';
import { LoginResponse } from '../models/auth.model';

const API_BASE_URL = process.env.API_BASE_URL ?? 'https://api-man1.kiotviet.vn';
const FINGERPRINT_KEY = '72ed47fdd2046b752cbc1d47b5910442_Chrome_Desktop_API_Test';

export class AuthApiHelper {
  constructor(private readonly request: APIRequestContext) {}

  async login(
    username: string,
    password: string,
    retailer = 'testz18',
    branchId = 333
  ): Promise<string> {
    const response = await this.request.post(
      `${API_BASE_URL}/api/account/login?quan-ly=true`,
      {
        headers: {
          'content-type': 'application/json;charset=utf-8',
          retailer: retailer,
          isusekvclient: '1',
          latestbranchid: String(branchId),
          'x-language': 'vi-VN',
        },
        data: {
          model: {
            RememberMe: true,
            ShowCaptcha: false,
            UserName: username,
            Password: password,
            Language: 'vi-VN',
            LatestBranchId: branchId,
          },
          IsManageSide: true,
          FingerPrintKey: FINGERPRINT_KEY,
        },
      }
    );

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Login failed [${response.status()}]: ${body}`);
    }

    const body: LoginResponse = await response.json();
    const token = body.Token ?? body.token ?? body.AccessToken;

    if (!token) {
      throw new Error(`Token not found in login response: ${JSON.stringify(body)}`);
    }

    return token;
  }
}
