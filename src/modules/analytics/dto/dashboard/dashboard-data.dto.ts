import { Product } from '../../../products/entities/product.entity';
import { Category } from '../../../categories/entities/category.entity';
import { OrderItemState } from '../../../../utils/enums/order-item-state';
import { ProductVariant } from '../../../products/entities/product-variant.entity';

export class DashboardDataDto {
  totalRevenue: number;
  revenueChange: number;

  totalOrder: number;
  orderChange: number;

  newCustomer: number;
  customerChange: number;

  productSold: number;
  productSoldChange: number;

  revenueChart: DataPoint[];
  orderChart: DataPoint[];

  topSellProduct: TopSellProductData[];

  topSellCategory: TopSellCategoryData[];

  recentSale: RecentSaleData[];
}

export class DataPoint {
  xValue: string;
  yValue: number;
}

export class TopSellProductData {
  productVariant: ProductVariant; //todo: optimize later
  saleQuantity: number;
  saleValue: number;
  valueChange?: number;
}

export class TopSellCategoryData {
  category: Category; //todo: optimize later
  saleValue: number;
  valueChange: number;
}

export class RecentSaleData {
  productVariant: ProductVariant; //todo: optimize later
  quantity: number;
}
