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
