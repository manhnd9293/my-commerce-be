import { PickType } from '@nestjs/swagger';
import { ProductColor } from '../entities/product-color.entity';

export class CreateProductColorDto extends PickType(ProductColor, [
  'name',
  'code',
] as const) {}
