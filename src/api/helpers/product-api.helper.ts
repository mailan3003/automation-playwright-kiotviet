import { APIResponse } from '@playwright/test';
import { BaseApiHelper } from './base-api.helper';
import { AddProductFormData } from '../models/product.model';
import { AddProductApiResponse } from '../models/api-response.model';

export class ProductApiHelper extends BaseApiHelper {
  private readonly addEndpoint = '/api/products/addmany?apiversion=5';
  private readonly deleteEndpoint = '/api/products/deleteproductlist?apiversion=5';

  readonly createdIds: number[] = [];

  async addProducts(
    formData: AddProductFormData,
    overrideHeaders?: Record<string, string>
  ): Promise<APIResponse> {
    const headers = { ...this.defaultHeaders, ...overrideHeaders };
    const response = await this.request.post(`${this.apiBaseUrl}${this.addEndpoint}`, {
      headers,
      multipart: this.buildMultipart(formData),
    });
    await this.trackCreatedIds(response);
    return response;
  }

  async addProductsWithCustomHeaders(
    formData: AddProductFormData,
    customHeaders: Record<string, string>
  ): Promise<APIResponse> {
    const response = await this.request.post(`${this.apiBaseUrl}${this.addEndpoint}`, {
      headers: customHeaders,
      multipart: this.buildMultipart(formData),
    });
    await this.trackCreatedIds(response);
    return response;
  }

  async addProductsRaw(rawFormData: Record<string, string>): Promise<APIResponse> {
    const response = await this.request.post(`${this.apiBaseUrl}${this.addEndpoint}`, {
      headers: this.defaultHeaders,
      multipart: rawFormData,
    });
    await this.trackCreatedIds(response);
    return response;
  }

  async deleteProducts(ids: number[]): Promise<APIResponse> {
    return this.request.post(`${this.apiBaseUrl}${this.deleteEndpoint}`, {
      headers: { ...this.defaultHeaders, 'content-type': 'application/json;charset=utf-8' },
      data: { Ids: ids },
    });
  }

  private async trackCreatedIds(response: APIResponse): Promise<void> {
    if (!response.ok()) return;
    try {
      const body = await response.json() as AddProductApiResponse;
      body.Data?.forEach(p => { if (p.Id) this.createdIds.push(p.Id); });
    } catch {
      // response không phải JSON hoặc không có Data — bỏ qua
    }
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
