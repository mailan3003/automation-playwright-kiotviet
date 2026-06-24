import { ProductRequest, AddProductFormData, BranchInfo, RepeatGuarantee } from '../models/product.model';

const RETAILER_ID = 430092;
const DEFAULT_CATEGORY_ID = 662375;
const DEFAULT_TAX_ID = 8;

const DEFAULT_BRANCHES: BranchInfo[] = [
  { Id: 333, Name: 'Chi nhánh trung tâm' },
  { Id: 235847, Name: 'Cơ sở 2' },
  { Id: 1000000267, Name: 'Cơ sở 3' },
];

const DEFAULT_REPEAT_GUARANTEE: RepeatGuarantee = {
  Uuid: -1,
  TimeType: 2,
  ProductId: 0,
  RetailerId: RETAILER_ID,
  Description: 'Toàn bộ sản phẩm',
};

export class ProductDataGenerator {
  private static ts(): string {
    return Date.now().toString();
  }

  static productName(prefix = 'AUTO'): string {
    return `${prefix}_Product_${this.ts()}`;
  }

  static productCode(prefix = 'AUTO'): string {
    return `AUTO_${prefix}_${this.ts()}`;
  }

  static defaultProduct(overrides?: Partial<ProductRequest>): ProductRequest {
    return {
      Id: 0,
      ProductType: 2,
      CategoryId: DEFAULT_CATEGORY_ID,
      CategoryName: '',
      isActive: false,
      HasVariants: false,
      AllowsSale: true,
      isDeleted: false,
      Code: '',
      BasePrice: 440000,
      Cost: 123000,
      LatestPurchasePrice: 0,
      OnHand: 0,
      OnOrder: 0,
      MinQuantity: 10000,
      MaxQuantity: 999999999,
      Unit: 'cái',
      ConversionValue: 1,
      OrderTemplate: '',
      IsLotSerialControl: false,
      IsRewardPoint: true,
      IsBatchExpireControl: true,
      Barcode: '',
      TaxId: DEFAULT_TAX_ID,
      Name: this.productName(),
      RewardPoint: 44,
      Description: '',
      ListPriceBookDetail: [],
      ProductAttributes: [],
      ProductImages: [],
      RepeatGuarantee: DEFAULT_REPEAT_GUARANTEE,
      ProductFormulas: [],
      ...overrides,
    };
  }

  static defaultFormData(productOverrides?: Partial<ProductRequest>): AddProductFormData {
    return {
      listBranchsSelected: [],
      isAddFromOtherForm: false,
      listProductsString: [this.defaultProduct(productOverrides)],
      cloneProductId: 0,
      deletedImageId: '',
      productImageSuggestUrl: '',
      isRetailerMedicine: 'undefined',
      isSyncNationalPharmacy: false,
      isUpdateAllSystem: true,
      branchForProductCostss: DEFAULT_BRANCHES,
    };
  }

  static multipleProductsFormData(count: number): AddProductFormData {
    return {
      ...this.defaultFormData(),
      listProductsString: Array.from({ length: count }, (_, i) =>
        this.defaultProduct({ Name: this.productName(`MULTI_${i + 1}`) })
      ),
    };
  }
}
