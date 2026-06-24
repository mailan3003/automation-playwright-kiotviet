export interface RepeatGuarantee {
  Uuid: number;
  TimeType: number;
  ProductId: number;
  RetailerId: number;
  Description: string;
}

export interface PriceBookDetail {
  Id: number;
  PriceBookId: number;
  PriceBookName: string;
  ProductId: number;
  IsAuto: boolean;
  ListDependencies: unknown[];
  ParentId: number;
  Value?: number;
  ValueRatio?: number;
  Price: number;
}

export interface ProductRequest {
  Id: number;
  ProductType: number;
  CategoryId: number;
  CategoryName: string;
  isActive: boolean;
  HasVariants: boolean;
  AllowsSale: boolean;
  isDeleted: boolean;
  Code: string;
  BasePrice: number;
  Cost: number;
  LatestPurchasePrice: number;
  OnHand: number;
  OnOrder: number;
  MinQuantity: number;
  MaxQuantity: number;
  Unit: string;
  ConversionValue: number;
  OrderTemplate: string;
  IsLotSerialControl: boolean;
  IsRewardPoint: boolean;
  IsBatchExpireControl: boolean;
  Barcode: string;
  TaxId: number;
  Name: string;
  RewardPoint: number;
  Description: string;
  ListPriceBookDetail: PriceBookDetail[];
  ProductAttributes: unknown[];
  ProductImages: unknown[];
  RepeatGuarantee: RepeatGuarantee;
  ProductFormulas: unknown[];
}

export interface BranchInfo {
  Id: number;
  Name: string;
}

export interface AddProductFormData {
  listBranchsSelected?: unknown[];
  isAddFromOtherForm?: boolean;
  listProductsString: Partial<ProductRequest>[];
  cloneProductId?: number;
  deletedImageId?: string;
  productImageSuggestUrl?: string;
  isRetailerMedicine?: boolean | string;
  isSyncNationalPharmacy?: boolean;
  isUpdateAllSystem?: boolean;
  branchForProductCostss?: BranchInfo[];
}
