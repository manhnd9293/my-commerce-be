import { PickType } from '@nestjs/swagger';
import { ProductColor } from '../entities/product-color.entity';

export class UpdateProductColorDto extends PickType(ProductColor, [
  'name',
  'code',
] as const) {
  id?: string | null;
}
