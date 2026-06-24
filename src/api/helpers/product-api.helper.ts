import { APIResponse } from '@playwright/test';
import { BaseApiHelper } from './base-api.helper';
import { AddProductFormData } from '../models/product.model';

export class ProductApiHelper extends BaseApiHelper {
  private readonly endpoint = '/api/products/addmany?apiversion=5';

  async addProducts(
    formData: AddProductFormData,
    overrideHeaders?: Record<string, string>
  ): Promise<APIResponse> {
    const headers = { ...this.defaultHeaders, ...overrideHeaders };
    return this.request.post(`${this.apiBaseUrl}${this.endpoint}`, {
      headers,
      multipart: this.buildMultipart(formData),
    });
  }

  async addProductsWithCustomHeaders(
    formData: AddProductFormData,
    customHeaders: Record<string, string>
  ): Promise<APIResponse> {
    return this.request.post(`${this.apiBaseUrl}${this.endpoint}`, {
      headers: customHeaders,
      multipart: this.buildMultipart(formData),
    });
  }

  async addProductsRaw(rawFormData: Record<string, string>): Promise<APIResponse> {
    return this.request.post(`${this.apiBaseUrl}${this.endpoint}`, {
      headers: this.defaultHeaders,
      multipart: rawFormData,
    });
  }

  private buildMultipart(formData: AddProductFormData): Record<string, string> {
    return {
      ListBranchsSelected: JSON.stringify(formData.listBranchsSelected ?? []),
      isAddFromOtherForm: String(formData.isAddFromOtherForm ?? false),
      ListProductsString: JSON.stringify(formData.listProductsString),
      CloneProductId: String(formData.cloneProductId ?? 0),
      DeletedImageId: formData.deletedImageId ?? '',
      ProductImageSuggestUrl: formData.productImageSuggestUrl ?? '',
      IsRetailerMedicine: String(formData.isRetailerMedicine ?? 'undefined'),
      IsSyncNationalPharmacy: String(formData.isSyncNationalPharmacy ?? false),
      IsUpdateAllSystem: String(formData.isUpdateAllSystem ?? true),
      BranchForProductCostss: JSON.stringify(formData.branchForProductCostss ?? []),
    };
  }
}
