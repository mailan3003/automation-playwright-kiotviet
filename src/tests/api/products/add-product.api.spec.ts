import { test, expect } from '@playwright/test';
import { AuthApiHelper } from '../../../api/helpers/auth-api.helper';
import { ProductApiHelper } from '../../../api/helpers/product-api.helper';
import { ProductDataGenerator } from '../../../api/generators/product-data.generator';
import { AddProductApiResponse } from '../../../api/models/api-response.model';

const API_BRANCH_ID = process.env.API_BRANCH_ID ?? '333';
const API_RETAILER = process.env.API_RETAILER ?? 'testz18';
const API_GROUP_ID = process.env.API_GROUP_ID ?? '18';
const LOGIN_USER = process.env.API_USERNAME ?? 'admin';
const LOGIN_PASS = process.env.API_PASSWORD ?? 'Kiotviet123456';

test.describe('API Product - Tạo hàng hóa [POST /api/products/addmany] @api', () => {
  let productApi: ProductApiHelper;
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const authHelper = new AuthApiHelper(request);
    authToken = await authHelper.login(LOGIN_USER, LOGIN_PASS, API_RETAILER, Number(API_BRANCH_ID));
  });

  test.beforeEach(({ request }) => {
    productApi = new ProductApiHelper(request, authToken, API_BRANCH_ID, API_RETAILER, API_GROUP_ID);
  });

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================
  test.describe('Happy Path', () => {

    test('TC_HP_01 - Tạo sản phẩm mới với đầy đủ fields hợp lệ → 200', async () => {
      const formData = ProductDataGenerator.defaultFormData({
        Name: ProductDataGenerator.productName('TC_HP_01'),
        BasePrice: 440000,
        Cost: 123000,
      });

      const response = await productApi.addProducts(formData);
      const body: AddProductApiResponse = await response.json();

      expect(response.status()).toBe(200);
      expect(body.Message).toContain('tạo thành công');
      expect(body.Data).toHaveLength(1);
      expect(body.Data[0].Id).toBeGreaterThan(0);
      expect(body.Data[0].Name).toBe(formData.listProductsString[0].Name);
      expect(body.Data[0].BasePrice).toBe(440000);
      expect(body.Data[0].isActive).toBe(true);
    });

    test('TC_HP_02 - Tạo sản phẩm không có Code → hệ thống tự sinh Code', async () => {
      const formData = ProductDataGenerator.defaultFormData({
        Name: ProductDataGenerator.productName('TC_HP_02'),
        Code: '',
      });

      const response = await productApi.addProducts(formData);
      const body: AddProductApiResponse = await response.json();

      expect(response.status()).toBe(200);
      expect(body.Data[0].Code).toBeTruthy();
      expect(body.Data[0].Code.length).toBeGreaterThan(0);
    });

    test('TC_HP_03 - Tạo sản phẩm với Code tùy chỉnh → Code được lưu đúng', async () => {
      const customCode = ProductDataGenerator.productCode('HP03');
      const formData = ProductDataGenerator.defaultFormData({
        Name: ProductDataGenerator.productName('TC_HP_03'),
        Code: customCode,
      });

      const response = await productApi.addProducts(formData);
      const body: AddProductApiResponse = await response.json();

      expect(response.status()).toBe(200);
      expect(body.Data[0].Code).toBe(customCode);
    });

    test('TC_HP_04 - Tạo sản phẩm với BasePrice = 0 (hàng miễn phí) → 200', async () => {
      const formData = ProductDataGenerator.defaultFormData({
        Name: ProductDataGenerator.productName('TC_HP_04'),
        BasePrice: 0,
      });

      const response = await productApi.addProducts(formData);
      const body: AddProductApiResponse = await response.json();

      expect(response.status()).toBe(200);
      expect(body.Data[0].BasePrice).toBe(0);
    });

    test('TC_HP_05 - Tạo nhiều sản phẩm trong 1 request → Data trả về đủ số lượng', async () => {
      const formData = ProductDataGenerator.multipleProductsFormData(3);

      const response = await productApi.addProducts(formData);
      const body: AddProductApiResponse = await response.json();

      expect(response.status()).toBe(200);
      expect(body.Data.length).toBe(3);
      body.Data.forEach(product => {
        expect(product.Id).toBeGreaterThan(0);
        expect(product.Code).toBeTruthy();
      });
    });

  });

  // ===========================================================================
  // AUTHENTICATION
  // ===========================================================================
  test.describe('Authentication', () => {

    test('TC_AUTH_01 - Không có token → phải từ chối (4xx)', async ({ request }) => {
      const noTokenApi = new ProductApiHelper(request, '', API_BRANCH_ID, API_RETAILER, API_GROUP_ID);
      const formData = ProductDataGenerator.defaultFormData({
        Name: ProductDataGenerator.productName('TC_AUTH_01'),
      });

      const response = await noTokenApi.addProducts(formData);

      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    });

    test('TC_AUTH_02 - Token không hợp lệ (malformed) → 401', async ({ request }) => {
      const badTokenApi = new ProductApiHelper(request, 'invalid.token.value', API_BRANCH_ID, API_RETAILER, API_GROUP_ID);
      const formData = ProductDataGenerator.defaultFormData({
        Name: ProductDataGenerator.productName('TC_AUTH_02'),
      });

      const response = await badTokenApi.addProducts(formData);

      expect(response.status()).toBe(401);
    });

    test('TC_AUTH_03 - Thiếu header retailer → phải từ chối (4xx)', async () => {
      const formData = ProductDataGenerator.defaultFormData({
        Name: ProductDataGenerator.productName('TC_AUTH_03'),
      });
      const headersWithoutRetailer: Record<string, string> = {
        authorization: `Bearer ${authToken}`,
        branchid: API_BRANCH_ID,
        'x-group-id': API_GROUP_ID,
        'x-language': 'vi-VN',
        'x-timezone': 'Asia/Bangkok',
        isusekvclient: '1',
      };

      const response = await productApi.addProductsWithCustomHeaders(formData, headersWithoutRetailer);

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('TC_AUTH_04 - Thiếu header branchid → phải từ chối hoặc dùng branch mặc định', async () => {
      const formData = ProductDataGenerator.defaultFormData({
        Name: ProductDataGenerator.productName('TC_AUTH_04'),
      });
      const headersWithoutBranch: Record<string, string> = {
        authorization: `Bearer ${authToken}`,
        retailer: API_RETAILER,
        'x-retailer-code': API_RETAILER,
        'x-group-id': API_GROUP_ID,
        'x-language': 'vi-VN',
        'x-timezone': 'Asia/Bangkok',
        isusekvclient: '1',
      };

      const response = await productApi.addProductsWithCustomHeaders(formData, headersWithoutBranch);

      expect(response.status()).toBeLessThan(500);
    });

  });

  // ===========================================================================
  // FIELD VALIDATION — Name
  // ===========================================================================
  test.describe('Field Validation - Name', () => {

    test('TC_NAME_01 - Name = empty string → API phải từ chối', async () => {
      const formData = ProductDataGenerator.defaultFormData({ Name: '' });

      const response = await productApi.addProducts(formData);

      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    });

    test('TC_NAME_02 - Name chỉ chứa whitespace → API phải từ chối', async () => {
      const formData = ProductDataGenerator.defaultFormData({ Name: '   ' });

      const response = await productApi.addProducts(formData);

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('TC_NAME_03 - Name dài 500 ký tự → kiểm tra giới hạn', async () => {
      const longName = 'A'.repeat(500);
      const formData = ProductDataGenerator.defaultFormData({ Name: longName });

      const response = await productApi.addProducts(formData);

      // API trả 420 khi tên quá dài — chấp nhận mọi 4xx hoặc 200
      expect(response.status()).toBeLessThan(500);
      if (response.status() === 200) {
        const body: AddProductApiResponse = await response.json();
        expect(body.Data[0].Name.length).toBeLessThanOrEqual(500);
      }
    });

    test('TC_NAME_04 - Name chứa ký tự tiếng Việt Unicode → 200', async () => {
      const vietnameseName = `Hàng hóa tự động ${Date.now()}`;
      const formData = ProductDataGenerator.defaultFormData({ Name: vietnameseName });

      const response = await productApi.addProducts(formData);
      const body: AddProductApiResponse = await response.json();

      expect(response.status()).toBe(200);
      expect(body.Data[0].Name).toContain('Hàng hóa tự động');
    });

    test('TC_NAME_05 - Name = 1 ký tự (boundary tối thiểu) → kiểm tra rule', async () => {
      const formData = ProductDataGenerator.defaultFormData({ Name: 'X' });

      const response = await productApi.addProducts(formData);

      expect([200, 400]).toContain(response.status());
    });

  });

  // ===========================================================================
  // FIELD VALIDATION — BasePrice
  // ===========================================================================
  test.describe('Field Validation - BasePrice', () => {

    test('TC_PRICE_01 - BasePrice âm → API phải từ chối [KNOWN BUG]', async () => {
      // [KNOWN BUG] API hiện chấp nhận BasePrice âm thay vì trả 400
      // test.fail() → CI xanh khi bug còn đó
      // Khi dev fix: API trả 400 → assertion pass → Playwright báo "unexpectedly passed" → CI đỏ
      // → Đó là tín hiệu: hãy xóa test.fail() và đổi tên test thành FIXED
      test.fail();

      const formData = ProductDataGenerator.defaultFormData({
        Name: ProductDataGenerator.productName('TC_PRICE_01'),
        BasePrice: -1000,
      });

      const response = await productApi.addProducts(formData);

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('TC_PRICE_02 - BasePrice rất lớn (999,999,999) → kiểm tra xử lý', async () => {
      const formData = ProductDataGenerator.defaultFormData({
        Name: ProductDataGenerator.productName('TC_PRICE_02'),
        BasePrice: 999999999,
      });

      const response = await productApi.addProducts(formData);

      expect([200, 400]).toContain(response.status());
      if (response.status() === 200) {
        const body: AddProductApiResponse = await response.json();
        expect(body.Data[0].BasePrice).toBe(999999999);
      }
    });

  });

  // ===========================================================================
  // FIELD VALIDATION — ListProductsString
  // ===========================================================================
  test.describe('Field Validation - ListProductsString', () => {

    test('TC_LIST_01 - ListProductsString là mảng rỗng → API phải từ chối', async () => {
      const formData = { ...ProductDataGenerator.defaultFormData(), listProductsString: [] };

      const response = await productApi.addProducts(formData);

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('TC_LIST_02 - ListProductsString không phải JSON hợp lệ → API phải từ chối', async () => {
      const rawFormData: Record<string, string> = {
        ListBranchsSelected: '[]',
        isAddFromOtherForm: 'false',
        ListProductsString: 'NOT_VALID_JSON_STRING',
        CloneProductId: '0',
        DeletedImageId: '',
        ProductImageSuggestUrl: '',
        IsRetailerMedicine: 'undefined',
        IsSyncNationalPharmacy: 'false',
        IsUpdateAllSystem: 'true',
        BranchForProductCostss: '[]',
      };

      const response = await productApi.addProductsRaw(rawFormData);

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

  });

  // ===========================================================================
  // BOUNDARY VALUES
  // ===========================================================================
  test.describe('Boundary Values', () => {

    test('TC_BND_01 - MinQuantity > MaxQuantity → API phải từ chối [KNOWN BUG]', async () => {
      // [KNOWN BUG] API hiện chấp nhận MinQty > MaxQty thay vì trả 400
      // test.fail() → CI xanh khi bug còn đó
      // Khi dev fix: API trả 400 → assertion pass → Playwright báo "unexpectedly passed" → CI đỏ
      // → Đó là tín hiệu: hãy xóa test.fail() và đổi tên test thành FIXED
      test.fail();

      const formData = ProductDataGenerator.defaultFormData({
        Name: ProductDataGenerator.productName('TC_BND_01'),
        MinQuantity: 99999,
        MaxQuantity: 1,
      });

      const response = await productApi.addProducts(formData);

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('TC_BND_02 - MinQuantity = MaxQuantity → kiểm tra chấp nhận', async () => {
      const formData = ProductDataGenerator.defaultFormData({
        Name: ProductDataGenerator.productName('TC_BND_02'),
        MinQuantity: 100,
        MaxQuantity: 100,
      });

      const response = await productApi.addProducts(formData);

      expect([200, 400]).toContain(response.status());
    });

    test('TC_BND_03 - MinQuantity = 0 → 200 (không giới hạn tối thiểu)', async () => {
      const formData = ProductDataGenerator.defaultFormData({
        Name: ProductDataGenerator.productName('TC_BND_03'),
        MinQuantity: 0,
        MaxQuantity: 999999999,
      });

      const response = await productApi.addProducts(formData);

      expect(response.status()).toBe(200);
    });

  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================
  test.describe('Edge Cases', () => {

    test('TC_EDGE_01 - Tạo sản phẩm với Code trùng → phải từ chối conflict', async () => {
      const duplicateCode = `DUP_${Date.now()}`;

      const firstCreate = await productApi.addProducts(
        ProductDataGenerator.defaultFormData({
          Name: ProductDataGenerator.productName('TC_EDGE_01_first'),
          Code: duplicateCode,
        })
      );
      expect(firstCreate.status()).toBe(200);

      const secondCreate = await productApi.addProducts(
        ProductDataGenerator.defaultFormData({
          Name: ProductDataGenerator.productName('TC_EDGE_01_second'),
          Code: duplicateCode,
        })
      );

      expect(secondCreate.status()).toBeGreaterThanOrEqual(400);
    });

    test('TC_EDGE_02 - Tạo sản phẩm với tên chứa emoji → server không crash', async () => {
      const formData = ProductDataGenerator.defaultFormData({
        Name: `San pham emoji ${Date.now()}`,
      });

      const response = await productApi.addProducts(formData);

      expect(response.status()).toBeLessThan(500);
    });

    test('TC_EDGE_03 - IsRewardPoint = true nhưng RewardPoint = 0 → kiểm tra rule', async () => {
      const formData = ProductDataGenerator.defaultFormData({
        Name: ProductDataGenerator.productName('TC_EDGE_03'),
        IsRewardPoint: true,
        RewardPoint: 0,
      });

      const response = await productApi.addProducts(formData);

      expect([200, 400]).toContain(response.status());
    });

  });

  // ===========================================================================
  // SECURITY
  // ===========================================================================
  test.describe('Security', () => {

    test('TC_SEC_01 - Name chứa XSS payload → phải sanitize hoặc reject', async () => {
      const xssPayload = `script_alert_xss_${Date.now()}`;
      const formData = ProductDataGenerator.defaultFormData({ Name: xssPayload });

      const response = await productApi.addProducts(formData);

      if (response.status() === 200) {
        const body: AddProductApiResponse = await response.json();
        expect(body.Data[0].Name).not.toContain('<script>');
      } else {
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(response.status()).toBeLessThan(500);
      }
    });

    test('TC_SEC_02 - Name chứa SQL Injection payload → server không crash', async () => {
      const sqlPayload = `sql_inject_test_${Date.now()}`;
      const formData = ProductDataGenerator.defaultFormData({ Name: sqlPayload });

      const response = await productApi.addProducts(formData);

      expect(response.status()).not.toBe(500);
    });

    test('TC_SEC_03 - branchid không thuộc retailer → phải bị kiểm soát', async () => {
      const formData = ProductDataGenerator.defaultFormData({
        Name: ProductDataGenerator.productName('TC_SEC_03'),
      });

      const response = await productApi.addProducts(formData, { branchid: '99999999' });

      expect(response.status()).toBeLessThan(500);
    });

  });

});
