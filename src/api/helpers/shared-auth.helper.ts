import * as fs from 'fs';
import * as path from 'path';
import { APIRequestContext } from '@playwright/test';
import { AuthApiHelper } from './auth-api.helper';

// Cache token API dùng chung giữa các test file trong 1 lần chạy CI.
// Token được ưu tiên lấy từ localStorage của phiên đăng nhập UI (xem auth.setup.ts) thay vì
// tự gọi POST /api/account/login trực tiếp — endpoint này bị chặn khi gọi "trần" (không qua
// browser) từ IP của GitHub Actions runner, trả về nhầm lỗi "Sai tên đăng nhập hoặc mật khẩu".
const TOKEN_CACHE_FILE = path.join(process.cwd(), 'auth', 'api-token.json');
const TOKEN_CACHE_TTL_MS = 10 * 60 * 1000;

interface TokenCacheEntry {
  token: string;
  createdAt: number;
}

// Cache theo username — nhiều spec file có thể dùng các tài khoản API khác nhau
// (VD: ADMIN_EMAIL vs API_USERNAME), nên không thể gộp chung 1 token duy nhất.
type TokenCacheStore = Record<string, TokenCacheEntry>;

function readCache(): TokenCacheStore {
  if (!fs.existsSync(TOKEN_CACHE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeCache(username: string, token: string): void {
  const store = readCache();
  store[username] = { token, createdAt: Date.now() };
  fs.mkdirSync(path.dirname(TOKEN_CACHE_FILE), { recursive: true });
  fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(store));
}

// Gọi sau khi UI đã login thành công — lưu token lấy từ localStorage (key "cat") vào cache
// chung, để các test API tái sử dụng thay vì tự POST /api/account/login (bị chặn trên CI).
export function cacheApiTokenFromBrowser(username: string, token: string): void {
  writeCache(username, token);
}

export async function getSharedApiToken(
  request: APIRequestContext,
  username: string,
  password: string,
  retailer = 'testz18',
  branchId = 333
): Promise<string> {
  const store = readCache();
  const cached = store[username];
  if (cached && Date.now() - cached.createdAt < TOKEN_CACHE_TTL_MS) {
    return cached.token;
  }

  // Fallback: chỉ dùng khi chưa có token nào được cache từ browser (VD: chạy lẻ 1 spec API
  // cục bộ, không qua auth.setup.ts). Trên CI, đường này không nên bị gọi tới.
  const authHelper = new AuthApiHelper(request);
  const token = await authHelper.login(username, password, retailer, branchId);
  writeCache(username, token);

  return token;
}
