# Automation Scripts — Module Login | KiotViet Manager

**Hệ thống:** Hệ thống bán hàng KiotViet  
**URL:** https://testz18.kiotviet.vn  
**Module:** Login (Đăng nhập Quản lý)  
**Framework:** Playwright + TypeScript  
**Ngày thực hiện:** 2026-06-24  

---

## Kết Quả Thực Thi

| TC ID | Mô tả | Kết quả | Stable (2/2) |
|---|---|---|---|
| TC01 | Đăng nhập thành công với tài khoản admin hợp lệ | ✅ PASS | ✅ |
| TC02 | Hiển thị lỗi khi nhập sai mật khẩu | ✅ PASS | ✅ |
| TC03 | Hiển thị lỗi khi nhập sai tên đăng nhập | ✅ PASS | ✅ |
| TC04 | Hiển thị lỗi khi để trống tên đăng nhập | ✅ PASS | ✅ |
| TC05 | Hiển thị lỗi khi để trống mật khẩu | ✅ PASS | ✅ |
| TC06 | Hiển thị lỗi khi để trống username và mật khẩu | ✅ PASS | ✅ |
| TC07 | Đăng nhập với Remember Me được bật | ✅ PASS | ✅ |
| TC_INV | Data-driven: 4 bộ invalid credentials | ✅ PASS | ✅ |

**Tổng: 7 @smoke + 4 @regression = 11 tests — 11 PASS / 0 FAIL / 0 SKIP**

> **Lưu ý:** KiotViet tự trim whitespace ở username — `' admin '` sẽ đăng nhập thành công như `admin`. Data-driven case "khoảng trắng" dùng username không tồn tại (`' wrong_user '`) để đảm bảo test thực sự kiểm tra behavior invalid credential.

---

## Files Đã Tạo/Cập Nhật

| File | Mô tả |
|---|---|
| `src/pages/login.page.ts` | LoginPage POM — locators + methods |
| `src/pages/dashboard.page.ts` | DashboardPage POM — verify post-login |
| `src/pages/base.page.ts` | BasePage — smart waits, common methods |
| `src/tests/auth/login.spec.ts` | Test specs — 7 @smoke + 4 @regression |
| `src/fixtures/base.fixture.ts` | Custom fixtures |
| `src/utils/env.config.ts` | Config từ .env |
| `src/utils/test-data.ts` | TestDataGenerator |

---

## Bảng Locator Collection (Đã Verify)

| Page | Element | Primary Locator | Fallback |
|---|---|---|---|
| LoginPage | Username input | `#UserName` | `[name="UserName"]` |
| LoginPage | Password input | `#Password` | `[name="Password"]` |
| LoginPage | RememberMe | `#RememberMe` | `[name="RememberMe"]` |
| LoginPage | Btn Quản lý | `button[type="submit"].kv-btn-primary` | `getByRole('button', {name: 'Quản lý'})` |
| LoginPage | Btn Bán hàng | `#loginNewSaleOld` | `getByRole('button', {name: 'Bán hàng'})` |
| LoginPage | Error message | `.kv-alert.kv-alert-light-danger` | `[ng-show*="error"]` |
| DashboardPage | Active nav | `a.kv-nav-link.active` | — |
| DashboardPage | URL pattern | `#/DashBoard` | — |

---

## Cách Chạy

```bash
# Chạy @smoke tests
npx playwright test src/tests/auth/login.spec.ts --grep "@smoke" --headed

# Chạy @regression tests
npx playwright test src/tests/auth/login.spec.ts --grep "@regression" --headed

# Chạy toàn bộ
npx playwright test src/tests/auth/login.spec.ts --headed
```

---

## Known Issues & Limitations

| # | Issue | Lý do |
|---|---|---|
| 1 | `waitUntil: 'networkidle'` không dùng được | KiotViet app có background API requests liên tục |
| 2 | Phải wait `#LoadingPanel` hidden | AngularJS init async — cần đợi loading spinner biến mất |
| 3 | Test @smoke không chạy được khi có CAPTCHA | Nếu server bật CAPTCHA sau N failed attempts, TC02-07 sẽ fail |
| 4 | Credentials trong test file | Đang dùng biến `VALID_USER/VALID_PASS` hardcode — nên chuyển sang `.env` |

---

## Ghi Chú Kỹ Thuật

- **Session isolation:** Mỗi test clear cookies (`page.context().clearCookies()`) trước khi navigate — KHÔNG clear localStorage (Angular app lưu init state ở đây)
- **Angular routing:** URL hash-based (`#/DashBoard`). Dùng `page.waitForFunction(() => window.location.href.includes('DashBoard'))` thay vì `waitForURL` để xử lý hash navigation
- **Login URL:** `https://testz18.kiotviet.vn/man/#/login` (redirect tự động từ `/man/`)
- **Error messages:**
  - Sai credentials: `"Sai tên đăng nhập hoặc mật khẩu."`
  - Trống fields: `"Bạn hãy nhập đầy đủ thông tin các trường!"`
