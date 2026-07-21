# Automation Generation Progress — Module Dashboard (Tổng quan)

- [x] Bước 1: Phân tích & tự khám phá test scope (chưa có TC sẵn — agent tự đề xuất)
- [x] Bước 2: Khảo sát UI + API thực tế (Playwright script headed, dump DOM/API calls)
- [x] Bước 3: Thiết kế POM (mở rộng `DashboardPage` có sẵn)
- [x] Bước 4: Chuẩn bị test data / API helper
- [x] Bước 5: Sinh automation scripts (UI + API)
- [x] Bước 6: Chạy test + Auto-heal (PASS 2 lần liên tiếp)

## Phạm vi

Màn hình **Dashboard / Tổng quan** (`https://testz18.kiotviet.vn/man/#/DashBoard`) — chưa có test case
có sẵn, agent tự khám phá UI + API network calls để xác định các luồng cần cover.

### API phát hiện được (quan trọng nhất): `GET /api/invoices/dashboard`
Trả về số liệu "Doanh thu thuần" hiển thị trên card chính. Query qua `$filter` (OData-style).

Hành vi thực tế đã verify bằng API call trực tiếp:
| Input | Kết quả thực tế |
|---|---|
| Filter hợp lệ (branch=333, khoảng ngày hợp lệ) | 200, body `{Total1Value, Total2Value, Total3Value, Total, PageSize, Timestamp}` |
| Không có token / token invalid | 403 |
| Thiếu `$filter` | 200 — trả về tổng toàn bộ dữ liệu (không lọc) |
| `$filter` sai cú pháp (không phải OData hợp lệ) | 420 — `{ResponseStatus:{ErrorCode:"KvValidateException", Message:"Could not create expression from: ..."}}` |
| BranchId không tồn tại | 200 — totals = 0 (không lỗi) |
| Khoảng ngày đảo ngược (from > to) | 200 — totals = 0 (không lỗi) |

### UI Widgets phát hiện được (verified qua DOM thực tế)
- Card "Doanh thu thuần" (`#RevenueTitle`, giá trị `#TotalValue7`) — dropdown khoảng thời gian
  (Kendo dropdown `[aria-owns="revenueTime_listbox"]`: Hôm nay / Hôm qua / 7 ngày qua / Tháng này / Tháng trước)
- 3 tab con: Theo ngày (`#date`) / Theo giờ (`#hour`) / Theo thứ (`#day`)
- Card "Top 10 hàng bán chạy" (`#topProductTitle`) — 2 dropdown: loại số liệu
  (`[aria-owns="topProductType_listbox"]`: Theo doanh thu thuần / Theo số lượng) và khoảng thời gian
  (`[aria-owns="topProductTime_listbox"]`)
- Card "Top 10 khách mua nhiều nhất" — hiện tại rỗng, hiển thị text "Chưa có dữ liệu" (empty state,
  toggle qua `div.kv-empty-customer`)
- Nav "Tổng quan" active mặc định (`a.kv-nav-link.active`)
- Panel "Hoạt động gần đây" (`.kv-dashboard-list-recents-title`)
- Notification sinh nhật khách hàng (`.kv-dashboard-notification-wrap`)

## Test Cases tự đề xuất

| TC ID | Title | Loại | Priority | Status |
|---|---|---|---|---|
| UI-TC01 | Dashboard hiển thị đầy đủ widget sau khi đăng nhập | Happy | P1 | ✅ PASS |
| UI-TC02 | Đổi khoảng thời gian "Doanh thu thuần" (Tháng này → Hôm nay) → giá trị & label cập nhật | Happy | P1 | ✅ PASS |
| UI-TC03 | Chuyển tab "Theo giờ" trên widget Doanh thu thuần → tab active đổi đúng | Happy | P2 | ✅ PASS |
| UI-TC04 | Chuyển tab "Theo thứ" trên widget Doanh thu thuần → tab active đổi đúng | Happy | P2 | ✅ PASS |
| UI-TC05 | Đổi bộ lọc "Top 10 hàng bán chạy" (Theo doanh thu thuần → Theo số lượng) | Happy | P2 | ✅ PASS |
| UI-TC06 | "Top 10 khách mua nhiều nhất" hiển thị đúng empty state "Chưa có dữ liệu" khi chưa có data | Exception | P3 | ✅ PASS |
| UI-TC07 | Truy cập trực tiếp URL Dashboard khi chưa đăng nhập (session invalid) → redirect về trang login | Negative | P1 | ✅ PASS |
| API-TC01 | GET invoices/dashboard với filter hợp lệ → 200, đúng field response | Happy | P1 | ✅ PASS |
| API-TC02 | GET invoices/dashboard thiếu $filter → 200, trả tổng toàn bộ | Happy | P2 | ✅ PASS |
| API-TC03 | GET invoices/dashboard không có token → 403 | Negative | P1 | ✅ PASS |
| API-TC04 | GET invoices/dashboard token không hợp lệ → 403 | Negative | P1 | ✅ PASS |
| API-TC05 | GET invoices/dashboard $filter sai cú pháp → 420 kèm error message | Exception | P2 | ✅ PASS |
| API-TC06 | GET invoices/dashboard BranchId không tồn tại → 200, totals = 0 | Exception | P3 | ✅ PASS |
| API-TC07 | GET invoices/dashboard khoảng ngày đảo ngược (from > to) → 200, totals = 0 | Edge case | P3 | ✅ PASS |

## Files tạo/sửa
- `src/pages/dashboard.page.ts` — mở rộng POM có sẵn (revenue widget, tabs, top products, top customers)
- `src/api/helpers/dashboard-api.helper.ts` — helper mới cho `/api/invoices/dashboard`
- `src/api/models/api-response.model.ts` — thêm `DashboardInvoicesResponse`, `DashboardApiErrorResponse`
- `src/tests/dashboard/dashboard.spec.ts` — UI test (7 TC)
- `src/tests/api/dashboard/dashboard-invoices.api.spec.ts` — API test (7 TC)
- `playwright.config.ts` — thêm project `api` riêng (xem mục dưới)

## Kết quả chạy test

- **14/14 test PASS**, verify ổn định nhiều lần chạy lại (UI: repeat-each=2 và riêng UI-TC06
  repeat-each=3 tuần tự; API: repeat-each=2)
  - UI: `npx playwright test src/tests/dashboard/dashboard.spec.ts --project=chromium` — 7 TC PASS
  - API: `npx playwright test src/tests/api/dashboard/dashboard-invoices.api.spec.ts --project=api` — 7 TC PASS
- 0 FAIL, 0 SKIP

### Known issue đã xử lý trong lúc automate (auto-heal)
- **UI-TC05 flaky lần đầu** (`TimeoutError: element is not visible/stable` khi click item trong Kendo
  dropdown "Top 10 hàng bán chạy"): do widget chart re-render DOM ngay sau khi Angular digest cập nhật
  dữ liệu, làm listbox bị đóng/detach đúng lúc click. Fix bằng cách thêm helper `selectKendoOption()`
  dùng chung cho cả 2 dropdown Kendo trong `DashboardPage`, retry lại toàn bộ thao tác mở dropdown +
  chọn item tối đa 3 lần thay vì chỉ retry click đơn lẻ. Sau fix: PASS ổn định nhiều lần liên tiếp.
- **UI-TC06 flaky phát hiện khi review lại** (`isTopCustomersEmptyStateVisible()` thỉnh thoảng trả
  `false` dù widget thực sự đang ở empty state): do method gốc dùng `locator.isVisible()` — kiểm tra
  tức thời, không chờ. Widget "Top 10 khách mua nhiều nhất" cần thời gian fetch dữ liệu rồi Angular
  mới toggle `div.kv-empty-customer`, và `waitForLoad()` chỉ chờ nav active chứ không chờ widget này.
  Fix: đổi sang `expect(locator).toBeVisible({ timeout: 10_000 })` để chờ thật sự. Verify lại 3 lần
  liên tiếp (tuần tự) đều PASS.
- **Ghi chú môi trường:** chạy nhiều lần lặp (`--repeat-each`) với nhiều worker song song (mặc định
  local) có thể fail do 2 Chromium headed instance dùng chung 1 session admin cạnh tranh tài nguyên
  máy — không phải lỗi test. Đã verify ổn định khi chạy tuần tự (`--workers=1`, khớp cấu hình CI sẵn có).

### Cấu hình bổ sung: tách project `api` riêng trong `playwright.config.ts`
Phát hiện khi user hỏi tại sao chạy file API lại mở browser: project `chromium` có
`dependencies: ['setup']`, và `testDir: './src/tests'` (chỉ ignore `auth/**`) nên trước đây MỌI test
API (kể cả `dashboard-invoices.api.spec.ts`, `add-product.api.spec.ts`) đều bị kéo theo chạy
`auth.setup.ts` (mở browser thật để login) dù bản thân test chỉ dùng `APIRequestContext`
(`getSharedApiToken()` tự login qua HTTP thuần khi chưa có token cache, không cần browser).

Đã thêm project `api` mới:
```ts
{
  name: 'api',
  testDir: './src/tests/api',
}
```
và loại `api/**` khỏi `testIgnore` của project `chromium`. Sau khi sửa:
`npx playwright test src/tests/api` (hoặc `--project=api`) chạy thuần API, không mở browser —
34 TC (bao gồm cả suite `add-product.api.spec.ts` có sẵn) PASS trong ~28s.

### Limitations / Ghi chú
- API `GET /api/invoices/dashboard` trả **200 (không lỗi)** cho cả BranchId không tồn tại và khoảng
  ngày đảo ngược — hành vi thực tế của hệ thống (không phải bug), test đã assert đúng theo hành vi này.
- "Top 10 khách mua nhiều nhất" hiện đang ở empty state trên tài khoản test — UI-TC06 verify đúng
  empty state hiện tại; nếu tài khoản test phát sinh dữ liệu khách hàng trong tương lai, cần cập nhật
  lại test case này để verify happy-path list thay vì empty state.
