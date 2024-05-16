import { PickType } from '@nestjs/swagger';
import { ProductSize } from '../entities/product-size.entity';

export class CreateProductSizeDto extends PickType(ProductSize, [
  'name',
] as const) {}
