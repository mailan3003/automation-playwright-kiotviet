import * as dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  baseUrl: requireEnv('BASE_URL', 'https://id.kiotviet.vn'),
  appEnv: process.env.APP_ENV ?? 'staging',
  credentials: {
    adminEmail: process.env.ADMIN_EMAIL ?? '',
    adminPassword: process.env.ADMIN_PASSWORD ?? '',
  },
  headless: process.env.HEADLESS === 'true',
} as const;

export type AppConfig = typeof config;
