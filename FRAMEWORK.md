# Automation Framework — KiotViet

Framework Playwright + TypeScript cho dự án automation testing KiotViet.

## Prerequisites

- Node.js >= 18
- npm >= 9

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
# Điền thông tin credentials vào .env
```

## Chạy Tests

```bash
# Chạy toàn bộ test (headed)
npm test

# Chạy có hiển thị browser
npm run test:headed

# Chạy theo tag
npm run test:smoke      # @smoke tests
npm run test:regression # @regression tests

# Chạy 1 file cụ thể
npx playwright test src/tests/auth/login.spec.ts

# Chạy 1 test theo tên
npx playwright test --grep "Đăng nhập thành công"

# Debug mode (mở Playwright Inspector)
npm run test:debug

# UI mode (interactive)
npm run test:ui
```

## Reports

```bash
# Mở Playwright HTML Report
npm run report

# Xem Allure Report (cần cài allure CLI)
npm run allure:serve
```

## Project Structure

```
src/
├── pages/          # Page Object classes
│   ├── base.page.ts
│   ├── login.page.ts
│   └── dashboard.page.ts
├── fixtures/       # Custom test fixtures
│   └── base.fixture.ts
├── utils/          # Helpers & generators
│   ├── env.config.ts
│   ├── test-data.ts
│   └── helpers.ts
└── tests/          # Test specs
    └── auth/
        └── login.spec.ts
test-data/          # External JSON test data
.github/workflows/  # CI/CD pipeline
```

## Conventions

- **Page classes:** `[Name].page.ts` — chứa locators + methods
- **Test files:** `[feature].spec.ts` — chứa test logic + assertions
- **Test data:** sinh động qua `TestDataGenerator`, không hardcode
- **Waits:** dùng `expect().toBeVisible()` thay vì `waitForTimeout()`
- **Tags:** đánh `@smoke` / `@regression` trong `test.describe` để filter
- **Locators:** inspect DOM thực tế, không đoán — cập nhật locators trước khi chạy

## CI/CD

GitHub Actions pipeline chạy tự động khi push lên `main` / `develop`.  
Cấu hình secrets cần thiết trong repo settings:
- `BASE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
