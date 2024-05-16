import { CreateProductSizeDto } from './create-product-size.dto';
import { CreateProductColorDto } from './create-product-color.dto';
import { PickType } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';

export class CreateProductDto extends PickType(Product, [
  'name',
  'description',
  'categoryId',
] as const) {
  productSizes: CreateProductSizeDto[];

  productColors: CreateProductColorDto[];
}
