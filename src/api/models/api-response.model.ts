export interface ProductTax {
  TaxId: number;
  ProductId: number;
}

export interface ProductResponseItem {
  Id: number;
  Code: string;
  Name: string;
  CategoryId: number;
  Description: string;
  AllowsSale: boolean;
  BasePrice: number;
  Tax: number;
  RetailerId: number;
  isActive: boolean;
  CreatedDate: string;
  ProductType: number;
  HasVariants: boolean;
  Unit: string;
  ConversionValue: number;
  IsLotSerialControl: boolean;
  IsRewardPoint: boolean;
  isDeleted: boolean;
  IsBatchExpireControl: boolean;
  RewardPoint: number;
  MasterCode: string;
  ProductTaxs: ProductTax[];
}

export interface AddProductApiResponse {
  Message: string;
  Data: ProductResponseItem[];
}

export interface ApiErrorResponse {
  Message?: string;
  Error?: string;
  StatusCode?: number;
}

export interface CreateCustomerApiResponse {
  Id: number;
  Code: string;
  CreatedDate: string;
  Message: string;
  Name: string;
  ContactNumber: string;
}

export interface DashboardInvoicesResponse {
  Total1Value: number;
  Total2Value: number;
  Total3Value: number;
  Total: number;
  PageSize: number;
  Timestamp: string;
}

export interface DashboardApiErrorResponse {
  ResponseStatus: {
    ErrorCode: string;
    Message: string;
    Errors: unknown[];
  };
}
