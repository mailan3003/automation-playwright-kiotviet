import * as fs from 'fs';
import * as path from 'path';
import { APIRequestContext } from '@playwright/test';
import { AuthApiHelper } from './auth-api.helper';

// Cache token đăng nhập API dùng chung giữa các test file trong 1 lần chạy CI.
// Tránh gọi login API nhiều lần liên tiếp cho cùng 1 tài khoản trong thời gian ngắn
// — hệ thống KiotViet giới hạn tần suất đăng nhập theo tài khoản và sẽ từ chối
// các lần đăng nhập vượt ngưỡng bằng thông báo "Sai tên đăng nhập hoặc mật khẩu".
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

  const authHelper = new AuthApiHelper(request);
  const token = await authHelper.login(username, password, retailer, branchId);

  store[username] = { token, createdAt: Date.now() };
  fs.mkdirSync(path.dirname(TOKEN_CACHE_FILE), { recursive: true });
  fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(store));

  return token;
}
