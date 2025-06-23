import { PickType } from '@nestjs/swagger';
import { ProductVariant } from '../entities/product-variant.entity';

export class UpdateProductVariantDto extends PickType(ProductVariant, [
  'id',
  'price',
  'quantity',
  'specs',
] as const) {}
